import { Item } from '../types';

// Zero-latency Web Audio API synthesizer + IndexedDB Blob playback + Gemini TTS + Arabic Web Speech fallback

let audioCtx: AudioContext | null = null;
let currentAudioEl: HTMLAudioElement | null = null;
let currentObjectUrl: string | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (Ctx) {
      audioCtx = new Ctx();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function stopAllAudio(): void {
  if (currentAudioEl) {
    currentAudioEl.pause();
    currentAudioEl.currentTime = 0;
    currentAudioEl = null;
  }
  if (currentObjectUrl) {
    URL.revokeObjectURL(currentObjectUrl);
    currentObjectUrl = null;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

export function playTapChime(muted = false): void {
  if (muted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(523.25, now); // C5
  osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.09); // E5

  gain.gain.setValueAtTime(0.001, now);
  gain.gain.linearRampToValueAtTime(0.14, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.2);
}

export function playShuffleTick(muted = false): void {
  if (muted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(320, now);
  osc.frequency.exponentialRampToValueAtTime(440, now + 0.08);

  gain.gain.setValueAtTime(0.001, now);
  gain.gain.linearRampToValueAtTime(0.08, now + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.11);
}

export function playWinMelody(muted = false): void {
  if (muted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
  const now = ctx.currentTime;

  notes.forEach((freq, idx) => {
    const start = now + idx * 0.09;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, start);

    gain.gain.setValueAtTime(0.001, start);
    gain.gain.linearRampToValueAtTime(0.18, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.26);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + 0.28);
  });
}

export function playGentleRetryTone(muted = false): void {
  if (muted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(392, now); // G4
  osc.frequency.exponentialRampToValueAtTime(329.63, now + 0.16); // E4

  gain.gain.setValueAtTime(0.001, now);
  gain.gain.linearRampToValueAtTime(0.12, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.24);
}

export function speakArabicText(text: string, muted = false): void {
  if (muted || typeof window === 'undefined' || !('speechSynthesis' in window))
    return;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ar-SA';
    utterance.rate = 0.94;
    utterance.pitch = 1.08;

    const voices = window.speechSynthesis.getVoices();
    const arabicVoice =
      voices.find((v) => v.lang.toLowerCase().startsWith('ar-sa')) ||
      voices.find((v) => v.lang.toLowerCase().startsWith('ar'));
    if (arabicVoice) {
      utterance.voice = arabicVoice;
    }
    window.speechSynthesis.speak(utterance);
  } catch {
    // Gracefully ignore if browser blocks speech
  }
}

export function playBlobOrUrl(
  source: Blob | string,
  muted = false
): Promise<void> {
  if (muted) return Promise.resolve();
  stopAllAudio();

  return new Promise((resolve) => {
    try {
      let srcUrl: string;
      if (source instanceof Blob) {
        currentObjectUrl = URL.createObjectURL(source);
        srcUrl = currentObjectUrl;
      } else {
        srcUrl = source;
      }

      const audio = new Audio(srcUrl);
      currentAudioEl = audio;
      audio.onended = () => {
        if (currentObjectUrl) {
          URL.revokeObjectURL(currentObjectUrl);
          currentObjectUrl = null;
        }
        currentAudioEl = null;
        resolve();
      };
      audio.onerror = () => {
        currentAudioEl = null;
        resolve();
      };
      audio.play().catch(() => resolve());
    } catch {
      resolve();
    }
  });
}

function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteChars = atob(base64);
  const byteNumbers = new Array<number>(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) {
    byteNumbers[i] = byteChars.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

async function resolveImageToBase64(
  imageUrl: string | Blob
): Promise<{ data: string; mimeType: string } | null> {
  try {
    let blob: Blob;
    if (imageUrl instanceof Blob) {
      blob = imageUrl;
    } else if (imageUrl.startsWith('data:image/svg')) {
      // Skip SVG for vision input; item name is sufficient
      return null;
    } else {
      const resp = await fetch(imageUrl);
      if (!resp.ok) return null;
      blob = await resp.blob();
    }

    if (blob.type.includes('svg') || blob.size > 2_500_000) {
      return null;
    }

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });

    const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) return null;
    return { mimeType: match[1], data: match[2] };
  } catch {
    return null;
  }
}

export async function generateItemRecognitionAudio(
  item: Pick<Item, 'name' | 'imageUrl'>,
  categoryTitle?: string
): Promise<{ blob: Blob; spokenText: string }> {
  const imageData = item.imageUrl ? await resolveImageToBase64(item.imageUrl) : null;

  const response = await fetch('/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      itemName: item.name,
      categoryTitle,
      imageBase64: imageData?.data,
      imageMimeType: imageData?.mimeType,
    }),
  });

  const payload = (await response.json()) as {
    audioBase64?: string;
    mimeType?: string;
    spokenText?: string;
    error?: string;
  };

  if (!response.ok || !payload.audioBase64) {
    throw new Error(payload.error || 'تعذر توليد الصوت التعريفي للصورة.');
  }

  const blob = base64ToBlob(
    payload.audioBase64,
    payload.mimeType || 'audio/wav'
  );
  return {
    blob,
    spokenText: payload.spokenText || `هذا ${item.name}!`,
  };
}

export async function playItemVoice(
  itemName: string,
  customAudio?: Blob | string | null,
  muted = false
): Promise<void> {
  if (muted) return;
  stopAllAudio();
  if (customAudio) {
    playTapChime(false);
    await playBlobOrUrl(customAudio, false);
    return;
  }
  playTapChime(false);
  speakArabicText(itemName, false);
}

export async function playEncouragement(
  fallbackSpeech: string,
  kind: 'win' | 'retry' | 'prompt',
  customAudio?: Blob | string | null,
  muted = false
): Promise<void> {
  if (muted) return;
  stopAllAudio();

  if (kind === 'win') {
    playWinMelody(false);
  } else if (kind === 'retry') {
    playGentleRetryTone(false);
  } else {
    playTapChime(false);
  }

  if (customAudio) {
    await playBlobOrUrl(customAudio, false);
  } else {
    speakArabicText(fallbackSpeech, false);
  }
}
