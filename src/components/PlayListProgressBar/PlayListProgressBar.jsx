// components/PlayListProgressBar.jsx
import React from 'react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import scss from './PlayListProgressBar.module.scss';

export default function PlayListProgressBar({ progress }) {
  // Нормализуем прогресс (от 0 до 100) и округляем до целого числа
  const normalizedProgress = Math.round(Math.min(100, Math.max(0, progress)));

  const renderCustomText = (value) => {
    return <tspan className={scss.customText}>{value}%</tspan>;
  };

  return (
    <div className={scss.progressContainer}>
      <div className={scss.progressBar}>
        <CircularProgressbar
          value={normalizedProgress}
          text={renderCustomText(normalizedProgress)}
          circleRatio={1}
          strokeWidth={1.3}
          background={true}
          styles={buildStyles({
            rotation: 0,
            strokeLinecap: 'round',
            pathTransitionDuration: 0.5,
            pathColor: `#0084ff`,
            textColor: '#ffffff',
            trailColor: '#ffffff',
            backgroundColor: 'rgba(0, 132, 255, 0.2)',
            textSize: `${1.1 * (window.innerWidth / 100)}px`,
          })}
        />
      </div>
    </div>
  );
}
