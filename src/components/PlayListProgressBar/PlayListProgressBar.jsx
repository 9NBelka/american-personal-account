import React from 'react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import scss from './PlayListProgressBar.module.scss';

export default function PlayListProgressBar({ progress }) {
  const normalizedProgress = Math.min(100, Math.max(0, progress));

  // Кастомная функция для рендеринга текста
  const renderCustomText = (value) => {
    return <tspan className={scss.customText}>{value}%</tspan>;
  };

  return (
    <div className={scss.progressContainer}>
      <div className={scss.progressBar}>
        <CircularProgressbar
          value={normalizedProgress}
          text={renderCustomText(normalizedProgress)} // Передаем функцию
          circleRatio={1}
          strokeWidth={1.25}
          background={true}
          styles={buildStyles({
            rotation: 0,
            strokeLinecap: 'round',
            pathTransitionDuration: 0.5,
            pathColor: `#0084ff`,
            textColor: '#ffffff',
            trailColor: '#ffffff',
            backgroundColor: 'rgba(0, 132, 255, 0.2)',
          })}
        />
      </div>
    </div>
  );
}
