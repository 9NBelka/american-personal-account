import React, { useState } from 'react';
import scss from './AccountCourseLessons.module.scss';
import PlayListProgressBar from '../PlayListProgressBar/PlayListProgressBar';
import CourseLessonsList from '../CourseLessonsList/CourseLessonsList';
import { BsFillStopwatchFill } from 'react-icons/bs';

export default function AccountCourseLessons({
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
  courses,
  progress,
  courseTitle,
}) {
  const [expandedModule, setExpandedModule] = useState(null);

  const toggleModule = (moduleIndex) => {
    setExpandedModule(expandedModule === moduleIndex ? null : moduleIndex);
  };

  return (
    <div className={scss.courseSection}>
      <div className={scss.courseHeader}>
        <div className={scss.courseHeaderPackageTimeNubmStud}>
          <div>
            {(() => {
              const currentCourse = courses.find(
                (course) => course.id === courseId && course.available,
              );
              return currentCourse ? (
                <p key={currentCourse.id} className={scss.courseHeaderPackage}>
                  Course package: <span>{currentCourse.access}</span>
                </p>
              ) : null;
            })()}
          </div>
          <div className={scss.iconAndTimeBlock}>
            <BsFillStopwatchFill className={scss.iconClock} />
            <p className={scss.courseHeaderTime}>{totalDuration}</p>
          </div>
        </div>

        <div className={scss.courseNameAndProgressBar}>
          <h2 className={scss.courseName}>{courseTitle}</h2>
          <PlayListProgressBar courseId={courseId} progress={progress[courseId] || 0} />
        </div>
        {/* <span className='lessons-count'>
          Завершено уроков: {completedLessonsCount}/{totalLessons}
        </span> */}
      </div>
      {modules.map((module, index) => (
        <CourseLessonsList
          key={module.id}
          module={module}
          index={index}
          expandedModule={expandedModule}
          toggleModule={toggleModule}
          handleLessonClick={handleLessonClick}
          completedLessons={completedLessons}
          toggleLessonCompletion={toggleLessonCompletion}
          getCompletedCount={getCompletedCount}
          getTotalDuration={getTotalDuration}
        />
      ))}
    </div>
  );
}
