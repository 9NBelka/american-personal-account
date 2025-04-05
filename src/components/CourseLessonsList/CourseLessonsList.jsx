import React, { useEffect, useState } from 'react';
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

  const [isModuleLocked, setIsModuleLocked] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Проверяем, заблокирован ли модуль
  useEffect(() => {
    const checkUnlockDate = () => {
      if (!module.unlockDate) {
        setIsModuleLocked(false);
        return;
      }

      const unlockDate = new Date(module.unlockDate);
      const now = new Date();
      setCurrentDate(now);

      if (now < unlockDate) {
        setIsModuleLocked(true);
      } else {
        setIsModuleLocked(false);
      }
    };

    checkUnlockDate();

    // Периодически проверяем текущую дату (каждые 10 секунд)
    const interval = setInterval(checkUnlockDate, 10000);

    return () => clearInterval(interval);
  }, [module.unlockDate]);

  const formatVideoTime = (minutes) => {
    if (!minutes) return '';
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m`;
    }
    return `${minutes}m`;
  };

  const formatUnlockDate = (unlockDate) => {
    if (!unlockDate) return '';
    const date = new Date(unlockDate);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const handleToggle = (e) => {
    e.stopPropagation();
    if (isModuleLocked) return; // Не открываем модуль, если он заблокирован

    toggleModule(index);
  };

  const handleLessonClickWithUpdate = (videoUrl) => {
    if (isModuleLocked) return; // Не воспроизводим урок, если модуль заблокирован

    if (courseId) {
      updateLastModule(courseId, module.id);
    }
    handleLessonClick(videoUrl);
  };

  return (
    <div key={module.id} className={clsx(scss.moduleMainBlock, isModuleLocked && scss.locked)}>
      <div className={scss.moduleTitleAndIconBlock} onClick={handleToggle}>
        <div className={scss.moduleTitleAndCountBlock}>
          <h3 className={scss.moduleTitle}>
            {index + 1 + `. ` + `module | `}
            {module.moduleTitle}
          </h3>
          <span className={scss.moduleCompletionCount}>
            {completed}/{total} | {totalDuration}
          </span>
        </div>
        {isModuleLocked && (
          <span className={scss.lockMessage}>
            The module will open on {formatUnlockDate(module.unlockDate)}
          </span>
        )}
        {expandedModule === index ? (
          <BsChevronDown className={scss.icon} />
        ) : (
          <BsChevronRight className={scss.icon} />
        )}
      </div>
      {expandedModule === index && !isModuleLocked && (
        <ul className={scss.lessonsList}>
          {module.links.map((lesson, lessonIndex) => {
            const isCompleted = (completedLessons[module.id] || []).includes(lessonIndex);
            return (
              <li
                key={lessonIndex}
                onClick={() => handleLessonClickWithUpdate(lesson.videoUrl)}
                className={clsx(scss.lesson, isCompleted && scss.completed)}>
                <div className={scss.checkboxAndTitleLesson}>
                  <label onClick={(e) => e.stopPropagation()}>
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
