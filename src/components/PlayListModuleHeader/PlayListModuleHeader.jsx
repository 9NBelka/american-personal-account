import React from 'react';

export default function PlayListModuleHeader({
  courseTitle,
  completedLessonsCount,
  totalLessons,
  totalDuration,
}) {
  return (
    <div className='course-header'>
      <h2 className='course-title'>{courseTitle}</h2>
      <span className='lessons-count'>
        Завершено уроков: {completedLessonsCount}/{totalLessons}
      </span>
      <span className='total-duration'>Общее время: {totalDuration}</span>
    </div>
  );
}
