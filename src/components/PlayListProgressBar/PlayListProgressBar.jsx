import React from 'react';

export default function PlayListProgressBar({ courseId, progress }) {
  return (
    <div className='progress-bar'>
      <p>
        Общий прогресс ({courseId}): {progress}%
      </p>
      <div className='progress'>
        <div className='progress-fill' style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}
