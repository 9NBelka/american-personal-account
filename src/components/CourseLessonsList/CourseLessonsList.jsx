import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { updateLastModule } from '../../store/slices/authSlice';
import scss from './CourseLessonsList.module.scss';
import { BsChevronDown, BsChevronRight } from 'react-icons/bs';
import clsx from 'clsx';

const CourseLessonsList = ({
  courseId,
  module,
  index,
  expandedModule,
  toggleModule,
  handleLessonClick,
  completedLessons = {}, // Значение по умолчанию
  toggleLessonCompletion,
  getCompletedCount,
  getTotalDuration,
  playlistPage = false, // Значение по умолчанию
}) => {
  const dispatch = useDispatch();

  const { completed, total } = getCompletedCount(module.id, module.links);
  const totalDuration = getTotalDuration(module.links);

  const [isModuleLocked, setIsModuleLocked] = useState(false);

  useEffect(() => {
    const checkUnlockDate = () => {
      if (!module.unlockDate) {
        if (isModuleLocked !== false) {
          setIsModuleLocked(false);
        }
        return;
      }

      const unlockDate = new Date(module.unlockDate);
      const now = new Date();
      const shouldBeLocked = now < unlockDate;

      if (isModuleLocked !== shouldBeLocked) {
        setIsModuleLocked(shouldBeLocked);
      }
    };

    checkUnlockDate();

    const interval = setInterval(checkUnlockDate, 10000);
    return () => clearInterval(interval);
  }, [module.unlockDate, isModuleLocked]);

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
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleToggle = useCallback(
    (e) => {
      e.stopPropagation();
      if (isModuleLocked) {
        return;
      }

      toggleModule(index);
    },
    [isModuleLocked, index, module.id, toggleModule],
  );

  const handleLessonClickWithUpdate = useCallback(
    (videoUrl) => {
      if (isModuleLocked) return;

      if (courseId) {
        dispatch(updateLastModule({ courseId, moduleId: module.id }));
      }
      handleLessonClick(videoUrl);
    },
    [isModuleLocked, courseId, module.id, handleLessonClick, dispatch],
  );

  const handleToggleLessonCompletion = useCallback(
    (lessonIndex) => {
      if (isModuleLocked) return;
      toggleLessonCompletion(module.id, lessonIndex);
    },
    [isModuleLocked, module.id, toggleLessonCompletion],
  );

  return (
    <div className={clsx(scss.moduleMainBlock, isModuleLocked && scss.locked)}>
      <div className={scss.moduleTitleAndIconBlock} onClick={handleToggle}>
        <div className={scss.moduleTitleAndCountBlock}>
          <h3 className={scss.moduleTitle}>
            {index + 1}. module | {module.moduleTitle}
          </h3>
          <span className={scss.moduleCompletionCount}>
            {completed}/{total} | {totalDuration}
          </span>
        </div>
        {isModuleLocked && (
          <span className={clsx(scss.lockMessage, playlistPage && scss.lockMessagePlayList)}>
            Module opens {formatUnlockDate(module.unlockDate)}
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
                      onChange={() => handleToggleLessonCompletion(lessonIndex)}
                      className={scss.checkbox}
                    />
                    <span className={scss.checkmark}></span>
                  </label>
                  {lessonIndex + 1}. {lesson.title}
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
};

export default React.memo(CourseLessonsList);
