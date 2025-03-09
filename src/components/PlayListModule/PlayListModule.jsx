import React from 'react';

export default function PlayListModule({
  module,
  index,
  expandedModule,
  toggleModule,
  handleLessonClick,
  completedLessons,
  toggleLessonCompletion,
  getCompletedCount,
  getTotalDuration,
}) {
  const { completed, total } = getCompletedCount(module.id, module.links);
  const totalDuration = getTotalDuration(module.links);

  return (
    <div key={module.id} className='module'>
      <h3 onClick={() => toggleModule(index)} className='module-title'>
        {module.moduleTitle}
        <span className='completion-count'>
          {' '}
          {completed}/{total} | {totalDuration}
        </span>
        {expandedModule === index ? ' ▼' : ' ►'}
      </h3>
      {expandedModule === index && (
        <ul className='lessons-list'>
          {module.links.map((lesson, lessonIndex) => {
            const isCompleted = (completedLessons[module.id] || []).includes(lessonIndex);
            return (
              <li
                key={lessonIndex}
                onClick={() => handleLessonClick(lesson.videoUrl)}
                className={`lesson ${isCompleted ? 'completed' : ''}`}>
                <input
                  type='checkbox'
                  checked={isCompleted}
                  onChange={() => toggleLessonCompletion(module.id, lessonIndex)}
                />
                {lesson.title}
                {lesson.videoTime && <span className='lesson-time'>{lesson.videoTime} мин</span>}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
