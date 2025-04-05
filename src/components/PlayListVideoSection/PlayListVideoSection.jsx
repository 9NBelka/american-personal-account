import React, { useState } from 'react';
import scss from './PlayListVideoSection.module.scss';
import PlayListLoadingIndicator from '../PlayListLoadingIndicator/PlayListLoadingIndicator';

export default function PlayListVideoSection({ videoUrl, lockMessage }) {
  // Добавляем параметр autoplay к URL
  const src = `https://iframe.dacast.com/vod/${videoUrl}?autoplay=1&muted=1`;
  const [isLoading, setIsLoading] = useState(true);

  const handleLoad = () => {
    setIsLoading(false);
  };

  return (
    <div className={scss.videoSection}>
      {isLoading && videoUrl && <PlayListLoadingIndicator />}
      {lockMessage ? (
        <p className={scss.lockMessage}> The lesson will open on {lockMessage}</p>
      ) : videoUrl ? (
        <iframe
          src={src}
          title='Course Video'
          allowFullScreen
          allow='autoplay'
          onLoad={handleLoad}
          style={{ display: isLoading ? 'none' : 'block' }}
        />
      ) : (
        <p>Select a lesson to view</p>
      )}
    </div>
  );
}
