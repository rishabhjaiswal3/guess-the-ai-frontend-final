import { useState, useRef, useCallback, useEffect } from 'react';

export interface ResourceStats {
  fps: number;
  ram: string;
  bitrate: string;
}

export const useGameRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [videoBlob, setBlob] = useState<Blob | null>(null);
  const [stats, setStats] = useState<ResourceStats | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const timerRef = useRef<number | null>(null);

  // Monitor Resources (FPS, RAM)
  useEffect(() => {
    let animationFrame: number;
    
    const updateStats = () => {
      if (isRecording) {
        frameCountRef.current++;
        const now = performance.now();
        const delta = now - lastTimeRef.current;

        if (delta >= 1000) {
          const fps = Math.round((frameCountRef.current * 1000) / delta);
          const ram = (performance as any).memory 
            ? `${Math.round((performance as any).memory.usedJSHeapSize / 1048576)} MB` 
            : 'N/A';
          const bitrate = `${(import.meta.env.VITE_REC_BITRATE || 6000000) / 1000000} Mbps`;
          
          const newStats = { fps, ram, bitrate };
          setStats(newStats);
          
          // Console log as requested
          console.log('[Recorder Stats]', newStats);

          frameCountRef.current = 0;
          lastTimeRef.current = now;
        }
      }
      animationFrame = requestAnimationFrame(updateStats);
    };

    animationFrame = requestAnimationFrame(updateStats);
    return () => cancelAnimationFrame(animationFrame);
  }, [isRecording]);

  const startRecording = useCallback((canvas: HTMLCanvasElement) => {
    if (isRecording) return;

    const duration = parseInt(import.meta.env.VITE_REC_DURATION_MS) || 10000;
    const bitrate = parseInt(import.meta.env.VITE_REC_BITRATE) || 6000000;

    const stream = canvas.captureStream(60); // 60 FPS capture
    const options = {
      mimeType: 'video/webm;codecs=vp9',
      videoBitsPerSecond: bitrate
    };

    try {
      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        setBlob(blob);
        setIsRecording(false);
      };

      recorder.start();
      setIsRecording(true);
      console.log(`[Recorder] Started - Duration: ${duration}ms, Quality: ${bitrate}bps`);

      // Auto-stop
      timerRef.current = window.setTimeout(() => {
        if (recorder.state === 'recording') {
          recorder.stop();
        }
      }, duration);

    } catch (err) {
      console.error('[Recorder] Failed to start:', err);
    }
  }, [isRecording]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
      if (timerRef.current) clearTimeout(timerRef.current);
    }
  }, []);

  return {
    startRecording,
    stopRecording,
    isRecording,
    videoBlob,
    stats,
    clearRecording: () => setBlob(null)
  };
};
