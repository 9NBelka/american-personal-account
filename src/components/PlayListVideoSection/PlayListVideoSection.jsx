import React, { useState } from 'react';
import scss from './PlayListVideoSection.module.scss';
import PlayListLoadingIndicator from '../PlayListLoadingIndicator/PlayListLoadingIndicator';

export default function PlayListVideoSection({ videoUrl }) {
  // Добавляем параметр autoplay к URL
  const src = `https://iframe.dacast.com/vod/${videoUrl}?autoplay=1&muted=1`;
  const [isLoading, setIsLoading] = useState(true); // Состояние загрузки

  // Функция, которая срабатывает, когда iframe загрузился
  const handleLoad = () => {
    setIsLoading(false);
  };

  return (
    <div className={scss.videoSection}>
      {isLoading && videoUrl && <PlayListLoadingIndicator />}
      {videoUrl ? (
        <iframe
          src={src}
          title='Course Video'
          allowFullScreen
          allow='autoplay' // Разрешаем автоплей
          onLoad={handleLoad} // Событие загрузки iframe
          style={{ display: isLoading ? 'none' : 'block' }} // Исправлено с 'flex' на 'block'
        />
      ) : (
        <p>Select a lesson to view</p>
      )}
    </div>
  );
}
