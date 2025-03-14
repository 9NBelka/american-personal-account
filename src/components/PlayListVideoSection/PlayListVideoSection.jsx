import React from 'react';
import scss from './PlayListVideoSection.module.scss';

export default function PlayListVideoSection({ videoUrl }) {
  const src = `https://iframe.dacast.com/vod/${videoUrl}`;
  return (
    <div className={scss.videoSection}>
      {videoUrl ? (
        <iframe src={src} title='Course Video' allowFullScreen />
      ) : (
        <p>Select a lesson to view</p>
      )}
    </div>
  );
}
