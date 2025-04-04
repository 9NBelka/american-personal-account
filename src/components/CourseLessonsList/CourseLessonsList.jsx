import React, { useEffect } from 'react';
import scss from './CourseLessonsList.module.scss';
import { BsChevronDown, BsChevronRight } from 'react-icons/bs';
import clsx from 'clsx';
import { useAuth } from '../../context/AuthContext';

export default function CourseLessonsList({
  courseId,
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
  const { updateLastModule } = useAuth();
  const { completed, total } = getCompletedCount(module.id, module.links);
  const totalDuration = getTotalDuration(module.links);

  const formatVideoTime = (minutes) => {
    if (!minutes) return '';
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m`;
    }
    return `${minutes}m`;
  };

  const handleToggle = (e) => {
    e.stopPropagation();
    console.log('Handle toggle called for module index:', index);
    toggleModule(index);
  };

  const handleLessonClickWithUpdate = (videoUrl) => {
    console.log('Lesson selected, videoUrl:', videoUrl);
    if (courseId) {
      updateLastModule(courseId, module.id);
    }
    handleLessonClick(videoUrl);
  };

  return (
    <div key={module.id} className={scss.moduleMainBlock}>
      <div className={scss.moduleTitleAndIconBlock} onClick={handleToggle}>
        <div className={scss.moduleTitleAndCountBlock}>
          <h3 className={scss.moduleTitle}>
            {index + 1 + `. ` + `module | `}
            {module.moduleTitle}
          </h3>
          <span className={scss.moduleCompletionCount}>
            {' '}
            {completed}/{total} | {totalDuration}
          </span>
        </div>
        {expandedModule === index ? (
          <BsChevronDown className={scss.icon} />
        ) : (
          <BsChevronRight className={scss.icon} />
        )}
      </div>
      {expandedModule === index && (
        <ul className={scss.lessonsList}>
          {module.links.map((lesson, lessonIndex) => {
            const isCompleted = (completedLessons[module.id] || []).includes(lessonIndex);
            return (
              <li
                key={lessonIndex}
                onClick={() => handleLessonClickWithUpdate(lesson.videoUrl)}
                className={clsx(scss.lesson, isCompleted && scss.completed)}>
                <div className={scss.checkboxAndTitleLesson}>
                  <label
                    onClick={(e) => e.stopPropagation()} // Предотвращаем всплытие события от чекбокса
                  >
                    <input
                      type='checkbox'
                      checked={isCompleted}
                      onChange={(e) => {
                        e.stopPropagation();
                        toggleLessonCompletion(module.id, lessonIndex);
                      }}
                      className={scss.checkbox}
                    />
                    <span className={scss.checkmark}></span>
                  </label>
                  {lessonIndex + 1 + `. `}
                  {lesson.title}
                </div>
                {lesson.videoTime && (
                  <span className={scss.lessonTime}>{formatVideoTime(lesson.videoTime)}</span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
