import React from 'react';
import scss from './PlayListModuleHeader.module.scss';

export default function PlayListModuleHeader({
  courseTitle,
  completedLessonsCount,
  totalLessons,
  totalDuration,
}) {
  return (
    <div className={scss.courseHeader}>
      <h2 className={scss.courseTitle}>Course materials</h2>
      <span className={scss.lessonsCount}>
        {completedLessonsCount}/{totalLessons} Done
      </span>
      {/* <span className='total-duration'>Общее время: {totalDuration}</span> */}
    </div>
  );
}
