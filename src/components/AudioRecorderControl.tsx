import React, { useEffect, useRef, useState } from 'react';
import { Mic, Square, Play, Trash2, Upload } from 'lucide-react';
import { playBlobOrUrl, stopAllAudio } from '../utils/audio';

interface AudioRecorderControlProps {
  label: string;
  value?: Blob | string | null;
  onChange: (audio: Blob | string | null) => void;
  fallbackHint?: string;
}

export const AudioRecorderControl: React.FC<AudioRecorderControlProps> = ({
  label,
  value,
  onChange,
  fallbackHint = 'التلقائي: النطق العربي الذكي',
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [micError, setMicError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const startRecording = async () => {
    setMicError(null);
    stopAllAudio();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setMicError('المتصفح لا يدعم التسجيل المباشر من الميكروفون.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
          ? 'audio/mp4'
          : '';

      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) {
          chunksRef.current.push(ev.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || 'audio/webm',
        });
        if (blob.size > 0) {
          onChange(blob);
        }
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      };

      recorder.start();
      setIsRecording(true);
      setSeconds(0);
      timerRef.current = window.setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    } catch {
      setMicError('تعذر الوصول للميكروفون. تأكد من منح الإذن في المتصفح.');
    }
  };

  const stopRecording = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMicError(null);
    onChange(file);
    e.target.value = '';
  };

  const handlePlay = async () => {
    if (!value) return;
    setIsPlaying(true);
    await playBlobOrUrl(value, false);
    setIsPlaying(false);
  };

  return (
    <div className="rounded-2xl bg-[#FDF8F5] border border-[#E6DCD3] p-3 space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-extrabold text-[#2B2523]">{label}</span>
        <span className="text-[11px] font-bold text-[#7A6F69]">
          {value ? 'صوت مخصص محفوظ' : fallbackHint}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {!isRecording ? (
          <button
            type="button"
            onClick={startRecording}
            className="btn-tactile h-9 px-3 rounded-xl bg-[#FF7A59] text-white text-xs font-extrabold border-b-[3px] border-[#D95738] flex items-center gap-1.5"
          >
            <Mic className="w-3.5 h-3.5" />
            <span>سجل بصوتك الآن</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={stopRecording}
            className="btn-tactile h-9 px-3 rounded-xl bg-[#2B2523] text-white text-xs font-extrabold border-b-[3px] border-black flex items-center gap-1.5"
          >
            <Square className="w-3.5 h-3.5 fill-[#FF7A59] text-[#FF7A59]" />
            <span className="tabular-nums">إيقاف التسجيل ({seconds} ث)</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="btn-tactile h-9 px-3 rounded-xl bg-white border border-[#DED2C8] border-b-[3px] text-[#4A413C] text-xs font-extrabold flex items-center gap-1.5 hover:bg-[#FFF9F5]"
        >
          <Upload className="w-3.5 h-3.5 text-[#4EA8DE]" />
          <span>رفع ملف صوتي</span>
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/mp4,audio/x-m4a,audio/*"
          onChange={handleFileUpload}
          className="hidden"
        />

        {value && (
          <>
            <button
              type="button"
              onClick={handlePlay}
              disabled={isPlaying}
              className="btn-tactile h-9 px-3 rounded-xl bg-[#06D6A0] text-[#113D31] text-xs font-extrabold border-b-[3px] border-[#04A77D] flex items-center gap-1"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isPlaying ? 'جاري التشغيل...' : 'استماع'}</span>
            </button>
            <button
              type="button"
              onClick={() => onChange(null)}
              className="h-9 w-9 rounded-xl bg-white border border-[#E6DCD3] text-[#D95738] flex items-center justify-center hover:bg-[#FFF0EC]"
              aria-label="حذف الصوت"
              title="حذف الصوت المخصص"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>

      {micError && <p className="text-[11px] font-bold text-[#D95738]">{micError}</p>}
    </div>
  );
};
