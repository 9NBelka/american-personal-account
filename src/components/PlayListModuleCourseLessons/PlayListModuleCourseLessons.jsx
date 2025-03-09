import React, { useState } from 'react';

export default function PlayListModuleCourseLessons({
  courseId,
  modules,
  completedLessons,
  completedLessonsCount,
  totalLessons,
  totalDuration,
  toggleLessonCompletion,
  handleLessonClick,
  getCompletedCount,
  getTotalDuration,
}) {
  const [expandedModule, setExpandedModule] = useState(null);

  const toggleModule = (moduleIndex) => {
    setExpandedModule(expandedModule === moduleIndex ? null : moduleIndex);
  };

  return (
    <div className='modules-section'>
      <div className='course-header'>
        <h2 className='course-title'>
          {courseId.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
        </h2>
        <span className='lessons-count'>
          Завершено уроков: {completedLessonsCount}/{totalLessons}
        </span>
        <span className='total-duration'>Общее время: {totalDuration}</span>
      </div>
      {modules.map((module, index) => {
        const { completed, total } = getCompletedCount(module.id, module.links);
        const moduleDuration = getTotalDuration(module.links);

        return (
          <div key={module.id} className='module'>
            <h3 onClick={() => toggleModule(index)} className='module-title'>
              {module.moduleTitle}
              <span className='completion-count'>
                {' '}
                {completed}/{total} | {moduleDuration}
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
                      {lesson.videoTime && (
                        <span className='lesson-time'>{lesson.videoTime} мин</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
