import 'dotenv/config';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import { WebSocketServer, type WebSocket } from 'ws';
import {
  GoogleGenAI,
  Modality,
  ThinkingLevel,
  type LiveServerMessage,
} from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('لم يتم العثور على مفتاح GEMINI_API_KEY في إعدادات الخادم.');
  }
  return new GoogleGenAI({
    apiKey,
    apiVersion: 'v1beta',
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  // Generate Arabic educational voice audio (WAV) for recognizing a card image
  app.post('/api/tts', async (req, res) => {
    try {
      const { itemName, categoryTitle, imageBase64, imageMimeType } = req.body as {
        itemName?: string;
        categoryTitle?: string;
        imageBase64?: string;
        imageMimeType?: string;
      };

      if (!itemName || typeof itemName !== 'string' || !itemName.trim()) {
        res.status(400).json({ error: 'اسم العنصر مطلوب لتوليد الصوت.' });
        return;
      }

      const ai = getAiClient();
      const cleanName = itemName.trim();

      // Step 1: Craft a short, joyful, kid-friendly Arabic recognition sentence
      let spokenText = `هذا ${cleanName}!`;
      try {
        const textParts: Array<
          | { text: string }
          | { inlineData: { mimeType: string; data: string } }
        > = [];

        if (imageBase64 && imageMimeType) {
          textParts.push({
            inlineData: {
              mimeType: imageMimeType,
              data: imageBase64,
            },
          });
        }

        textParts.push({
          text: `اكتب جملة عربية قصيرة جداً وممتعة (٨ إلى ١٢ كلمة فقط) لطفل عمره ٤ سنوات ليتعرف على "${cleanName}"${
            categoryTitle ? ` ضمن "${categoryTitle}"` : ''
          }. ابدأ باسم "${cleanName}" بشكل واضح وبسيط ومشجع دون أي رموز أو تشكيل معقد.`,
        });

        const textResp = await ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: { parts: textParts },
          config: {
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            systemInstruction:
              'أنت معلم أطفال ودود. اكتب جملة واحدة قصيرة وواضحة بالعربية الفصحى السهلة لتعريف الطفل بالصورة.',
          },
        });

        const candidate = textResp.text?.trim();
        if (candidate && candidate.length > 2 && candidate.length < 180) {
          spokenText = candidate.replace(/[*#"`]/g, '');
        }
      } catch {
        // If description generation fails, still synthesize the clear item name
        spokenText = `هذا ${cleanName}! انظر جيداً إلى ${cleanName}.`;
      }

      // Step 2: Synthesize natural WAV audio using gemini-3.8-flash-lite-tts
      const ttsResp = await ai.models.generateContent({
        model: 'gemini-3.8-flash-lite-tts',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: spokenText,
                speechMetadata: {
                  style: 'Warm, cheerful, clear Arabic children educator voice',
                },
              },
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });

      const base64Audio =
        ttsResp.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

      if (!base64Audio) {
        res.status(502).json({
          error: 'تعذر توليد الملف الصوتي من خدمة النطق الذكي.',
        });
        return;
      }

      res.json({
        audioBase64: base64Audio,
        mimeType: 'audio/wav',
        spokenText,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'حدث خطأ أثناء توليد الصوت.';
      const status =
        message.includes('API_KEY') || message.includes('PERMISSION_DENIED')
          ? 403
          : 500;
      res.status(status).json({ error: message });
    }
  });

  const server = http.createServer(app);

  // Real-time Arabic voice conversation via Gemini Live API (gemini-3.8-live)
  const wss = new WebSocketServer({ server, path: '/api/live' });

  wss.on('connection', async (clientWs: WebSocket) => {
    let session: Awaited<ReturnType<GoogleGenAI['live']['connect']>> | null = null;

    try {
      const ai = getAiClient();
      session = await ai.live.connect({
        model: 'gemini-3.8-live',
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Zephyr' },
            },
          },
          systemInstruction:
            'أنت المعلم الذكي في تطبيق ذاكرة ذكية للأطفال من ٣ إلى ٩ سنوات. تحدث بالعربية الواضحة البسيطة وبأسلوب دافئ ومشجع وممتع للأطفال. أجب بجمل قصيرة ومفهومة، وساعد الطفل على التعرف على الحيوانات والفواكه والمواصلات والأشكال.',
        },
        callbacks: {
          onmessage: (message: LiveServerMessage) => {
            if (clientWs.readyState !== clientWs.OPEN) return;
            const content = message.serverContent;

            if (content?.inputTranscription?.text) {
              clientWs.send(
                JSON.stringify({ inputTranscript: content.inputTranscription.text })
              );
            }
            if (content?.outputTranscription?.text) {
              clientWs.send(
                JSON.stringify({ outputTranscript: content.outputTranscription.text })
              );
            }
            for (const part of content?.modelTurn?.parts ?? []) {
              if (part.inlineData?.data) {
                clientWs.send(JSON.stringify({ audio: part.inlineData.data }));
              }
            }
            if (content?.interrupted) {
              clientWs.send(JSON.stringify({ interrupted: true }));
            }
            if (content?.turnComplete) {
              clientWs.send(JSON.stringify({ turnComplete: true }));
            }
          },
          onerror: (err) => {
            if (clientWs.readyState === clientWs.OPEN) {
              clientWs.send(
                JSON.stringify({
                  error: err?.message || 'حدث خطأ في الاتصال الصوتي المباشر.',
                })
              );
            }
          },
        },
      });

      if (clientWs.readyState === clientWs.OPEN) {
        clientWs.send(JSON.stringify({ ready: true }));
      } else {
        session.close();
        session = null;
        return;
      }
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'تعذر بدء جلسة المحادثة الصوتية.';
      if (clientWs.readyState === clientWs.OPEN) {
        clientWs.send(JSON.stringify({ error: msg }));
      }
      return;
    }

    clientWs.on('message', (raw) => {
      if (!session) return;
      try {
        const parsed = JSON.parse(raw.toString()) as {
          audio?: string;
          text?: string;
        };
        if (parsed.audio) {
          session.sendRealtimeInput({
            audio: {
              data: parsed.audio,
              mimeType: 'audio/pcm;rate=16000',
            },
          });
        } else if (parsed.text) {
          session.sendRealtimeInput({ text: parsed.text });
        }
      } catch {
        // Ignore malformed payloads
      }
    });

    clientWs.on('close', () => {
      try {
        session?.close();
      } catch {
        // Ignore close errors
      }
      session = null;
    });
  });

  // Serve Vite in dev mode or static dist in production
  const isProd = process.env.NODE_ENV === 'production';
  const distPath = path.resolve(__dirname, 'dist');

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Smart Memory server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
