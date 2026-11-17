import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Mic, MicOff, MessageCircle, X, Volume2 } from 'lucide-react';

interface LiveVoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TranscriptEntry {
  id: string;
  role: 'child' | 'teacher';
  text: string;
}

function float32ToPcm16Base64(float32: Float32Array): string {
  const buffer = new ArrayBuffer(float32.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]));
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64Pcm24kToAudioBuffer(
  ctx: AudioContext,
  base64: string
): AudioBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const int16 = new Int16Array(bytes.buffer);
  const float32 = new Float32Array(int16.length);
  for (let i = 0; i < int16.length; i++) {
    float32[i] = int16[i] / 32768;
  }
  const audioBuffer = ctx.createBuffer(1, float32.length, 24000);
  audioBuffer.copyToChannel(float32, 0);
  return audioBuffer;
}

export const LiveVoiceModal: React.FC<LiveVoiceModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const inputCtxRef = useRef<AudioContext | null>(null);
  const outputCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const cleanup = () => {
    activeSourcesRef.current.forEach((src) => {
      try {
        src.stop();
      } catch {
        // ignore
      }
    });
    activeSourcesRef.current.clear();
    nextStartTimeRef.current = 0;

    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (inputCtxRef.current) {
      inputCtxRef.current.close().catch(() => {});
      inputCtxRef.current = null;
    }
    if (outputCtxRef.current) {
      outputCtxRef.current.close().catch(() => {});
      outputCtxRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsSpeaking(false);
    setStatus('idle');
  };

  useEffect(() => {
    if (!isOpen) {
      cleanup();
    }
    return () => {
      cleanup();
    };
  }, [isOpen]);

  const stopPlaybackQueue = () => {
    activeSourcesRef.current.forEach((src) => {
      try {
        src.stop();
      } catch {
        // ignore
      }
    });
    activeSourcesRef.current.clear();
    nextStartTimeRef.current = 0;
    setIsSpeaking(false);
  };

  const scheduleAudioChunk = (base64Pcm: string) => {
    const ctx = outputCtxRef.current;
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const audioBuffer = base64Pcm24kToAudioBuffer(ctx, base64Pcm);
    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);

    const now = ctx.currentTime;
    const startAt = Math.max(now, nextStartTimeRef.current);
    source.start(startAt);
    nextStartTimeRef.current = startAt + audioBuffer.duration;

    activeSourcesRef.current.add(source);
    setIsSpeaking(true);

    source.onended = () => {
      activeSourcesRef.current.delete(source);
      if (activeSourcesRef.current.size === 0) {
        setIsSpeaking(false);
      }
    };
  };

  const startVoiceSession = async () => {
    setErrorMsg(null);
    setStatus('connecting');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const inputCtx = new AudioContext({ sampleRate: 16000 });
      const outputCtx = new AudioContext({ sampleRate: 24000 });
      inputCtxRef.current = inputCtx;
      outputCtxRef.current = outputCtx;

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${protocol}//${window.location.host}/api/live`);
      wsRef.current = ws;

      ws.onopen = () => {
        const micSource = inputCtx.createMediaStreamSource(stream);
        const processor = inputCtx.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;

        micSource.connect(processor);
        processor.connect(inputCtx.destination);

        processor.onaudioprocess = (e) => {
          if (ws.readyState !== WebSocket.OPEN) return;
          const pcmBase64 = float32ToPcm16Base64(e.inputBuffer.getChannelData(0));
          ws.send(JSON.stringify({ audio: pcmBase64 }));
        };
      };

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data) as {
          ready?: boolean;
          audio?: string;
          inputTranscript?: string;
          outputTranscript?: string;
          interrupted?: boolean;
          error?: string;
        };

        if (msg.ready) {
          setStatus('connected');
          ws.send(
            JSON.stringify({
              text: 'رحّب بالطفل بالعربية بجملة قصيرة ومرحة واسأله ماذا يحب أن يتعلم اليوم.',
            })
          );
        }
        if (msg.audio) {
          scheduleAudioChunk(msg.audio);
        }
        if (msg.interrupted) {
          stopPlaybackQueue();
        }
        if (msg.inputTranscript) {
          const text = msg.inputTranscript.trim();
          if (text) {
            setTranscripts((prev) => [
              ...prev.slice(-12),
              { id: `c-${Date.now()}-${Math.random()}`, role: 'child', text },
            ]);
          }
        }
        if (msg.outputTranscript) {
          const text = msg.outputTranscript.trim();
          if (text) {
            setTranscripts((prev) => {
              const last = prev[prev.length - 1];
              if (last && last.role === 'teacher') {
                return [
                  ...prev.slice(0, -1),
                  { ...last, text: `${last.text} ${text}` },
                ];
              }
              return [
                ...prev.slice(-12),
                { id: `t-${Date.now()}-${Math.random()}`, role: 'teacher', text },
              ];
            });
          }
        }
        if (msg.error) {
          setErrorMsg(msg.error);
          setStatus('error');
        }
      };

      ws.onerror = () => {
        setErrorMsg('تعذر الاتصال بالمحادثة الصوتية المباشرة.');
        setStatus('error');
      };

      ws.onclose = () => {
        setStatus((curr) => (curr === 'error' ? 'error' : 'idle'));
      };
    } catch {
      cleanup();
      setErrorMsg('يرجى السماح باستخدام الميكروفون للتحدث مع المعلم الذكي.');
      setStatus('error');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 0, y: 16 }}
            transition={{ type: 'spring', stiffness: 340, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[400px] rounded-3xl bg-[#FFFDFB] p-5 border-2 border-[#E9DFD7] shadow-2xl flex flex-col max-h-[82dvh]"
          >
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#EFE5DD]">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#06D6A0]/20 text-[#0D5B45] flex items-center justify-center">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-[#2B2523]">المعلم الذكي المباشر</h2>
                  <p className="text-[11px] font-bold text-[#7A6F69]">
                    تحدث بصوتك وتعلّم الكلمات بالصوت المباشر
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-10 h-10 rounded-xl bg-[#F4ECE6] text-[#5C534E] flex items-center justify-center hover:bg-[#EAE0D8]"
                aria-label="إغلاق"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scroll py-4 space-y-2.5 min-h-[160px]">
              {transcripts.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center px-4 py-6 text-[#7A6F69]">
                  <Volume2 className="w-8 h-8 mb-2 text-[#4EA8DE] opacity-80" />
                  <p className="text-sm font-bold text-[#4A413C]">
                    اضغط على «ابدأ المحادثة» وتحدث مع المعلم الذكي!
                  </p>
                  <p className="text-xs mt-1">
                    يمكنك سؤاله عن أي حيوان أو فاكهة أو لعبة لتتعلم عنها بالصوت.
                  </p>
                </div>
              ) : (
                transcripts.map((t) => (
                  <div
                    key={t.id}
                    className={`rounded-2xl px-3.5 py-2.5 text-xs font-bold leading-relaxed ${
                      t.role === 'teacher'
                        ? 'bg-[#EBF6FC] text-[#1D5B7F] border border-[#BCE3FA]'
                        : 'bg-[#FFF7DC] text-[#7A5200] border border-[#FFD166] mr-6'
                    }`}
                  >
                    <span className="block text-[10px] opacity-75 mb-0.5">
                      {t.role === 'teacher' ? 'المعلم الذكي' : 'أنت'}
                    </span>
                    {t.text}
                  </div>
                ))
              )}
            </div>

            {errorMsg && (
              <div className="mb-3 rounded-xl bg-[#FFF0EC] border border-[#FF7A59] px-3 py-2 text-xs font-bold text-[#9E351B] text-center">
                {errorMsg}
              </div>
            )}

            <div className="pt-2 border-t border-[#EFE5DD]">
              {status === 'connected' ? (
                <button
                  type="button"
                  onClick={cleanup}
                  className="btn-tactile w-full h-12 rounded-2xl bg-[#FF7A59] text-white font-black text-sm border-b-4 border-[#D95738] flex items-center justify-center gap-2"
                >
                  <MicOff className="w-4 h-4" />
                  <span>{isSpeaking ? 'المعلم يتحدث... (اضغط للإنهاء)' : 'إنهاء المحادثة الصوتية'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startVoiceSession}
                  disabled={status === 'connecting'}
                  className="btn-tactile w-full h-12 rounded-2xl bg-[#06D6A0] text-[#113D31] font-black text-sm border-b-4 border-[#04A77D] flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <Mic className="w-4 h-4" />
                  <span>{status === 'connecting' ? 'جاري الاتصال...' : 'ابدأ المحادثة الصوتية'}</span>
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
