import React, { useMemo } from 'react';

// Animated icon that prefers modern video formats and falls back to GIF unchanged
// Usage: <AnimatedIcon basePath="/icons/shield" alt="Secure" className="h-12 w-12" />
// Provide files like: /icons/shield.webm, /icons/shield.mp4, and keep existing /icons/shield.gif

const AnimatedIcon = ({ basePath, alt = '', className = '', loop = true, muted = true }) => {
  const webm = `${basePath}.webm`;
  const mp4 = `${basePath}.mp4`;
  const gif = `${basePath}.gif`;

  const canPlayVideo = useMemo(() => {
    if (typeof document === 'undefined') return false;
    const v = document.createElement('video');
    return !!v && (v.canPlayType('video/webm; codecs="vp9"') || v.canPlayType('video/mp4'));
  }, []);

  if (!canPlayVideo) {
    return <img src={gif} alt={alt} className={className} />;
  }

  return (
    <video className={className} autoPlay playsInline loop={loop} muted={muted} aria-label={alt} role="img">
      <source src={webm} type="video/webm" />
      <source src={mp4} type="video/mp4" />
      {/* If both video sources fail to load, the element simply won't show; consider adding a small onError swap if needed */}
    </video>
  );
};

export default AnimatedIcon;
