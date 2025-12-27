import { useEffect, useMemo, useRef, useState } from 'react';
import BgImage from '../assets/bg.webp';
import GifBg from '../assets/Guesstheaibg.webm';
import './AppBackground.css';

type AppBackgroundProps = {
  enabled?: boolean;
};

export default function AppBackground({ enabled = true }: AppBackgroundProps) {
  const [videoVisible, setVideoVisible] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const canPlayWebm = useMemo(() => {
    if (typeof document === 'undefined') return false;
    const probe = document.createElement('video');
    return Boolean(probe.canPlayType('video/webm; codecs="vp8, vorbis"') || probe.canPlayType('video/webm'));
  }, []);

  useEffect(() => {
    if (!enabled) return;
    if (!canPlayWebm) return;

    const video = videoRef.current;
    if (!video) return;

    const onCanPlay = () => {
      setVideoVisible(true);
    };

    video.addEventListener('canplay', onCanPlay);
    void video.play().catch(() => {
      // Autoplay can still be blocked on some browsers; keep the image fallback.
    });

    return () => {
      video.removeEventListener('canplay', onCanPlay);
    };
  }, [enabled, canPlayWebm]);

  if (!enabled) return null;

  return (
    <div className="gta-bg" aria-hidden="true">
      <img
        src={BgImage}
        alt=""
        className={`gta-bg__image ${videoVisible ? 'gta-fade-out' : 'gta-fade-in'}`}
        draggable={false}
        fetchPriority="high"
      />

      {canPlayWebm && (
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={BgImage}
          className={`gta-bg__video ${videoVisible ? 'gta-fade-in' : 'gta-fade-out'}`}
        >
          <source src={GifBg} type="video/webm" />
        </video>
      )}
    </div>
  );
}

