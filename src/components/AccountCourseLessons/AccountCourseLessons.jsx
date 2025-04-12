import React, { useState } from 'react';
import scss from './AccountCourseLessons.module.scss';
import PlayListProgressBar from '../PlayListProgressBar/PlayListProgressBar';
import CourseLessonsList from '../CourseLessonsList/CourseLessonsList';
import { BsFillStopwatchFill, BsGithub, BsPeopleFill } from 'react-icons/bs';
import { Link } from 'react-router-dom';

export default function AccountCourseLessons({
  courseId,
  modules,
  completedLessons, // Получаем полный объект completedLessons
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
  userCount,
}) {
  const [expandedModule, setExpandedModule] = useState(null);

  const toggleModule = (moduleIndex) => {
    setExpandedModule(expandedModule === moduleIndex ? null : moduleIndex);
  };

  const sortedModules = [...modules].sort((a, b) => a.id.localeCompare(b.id));

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
          <div className={scss.iconAndTimeBlocks}>
            <div className={scss.iconAndTimeBlock}>
              <BsFillStopwatchFill className={scss.iconClock} />
              <p className={scss.courseHeaderTime}>{totalDuration}</p>
            </div>
            <div className={scss.iconAndTimeBlock}>
              <BsPeopleFill className={scss.iconClock} />
              <p className={scss.courseHeaderTime}> {userCount}</p>
            </div>
          </div>
        </div>
        <div className={scss.courseNameAndProgressBar}>
          <h2 className={scss.courseName}>{courseTitle}</h2>
          <PlayListProgressBar courseId={courseId} progress={progress[courseId] || 0} />
        </div>
        <div className={scss.expandToStandartAndGitHubLinkBlock}>
          {(() => {
            const currentCourse = courses.find(
              (course) => course.id === courseId && course.available,
            );
            return currentCourse.access === 'vanilla' ? (
              <Link to='' target='_blank' className={scss.expandToStandart}>
                Expand to Standart
              </Link>
            ) : null;
          })()}
          {(() => {
            const currentCourse = courses.find(
              (course) => course.id === courseId && course.available,
            );
            return currentCourse.gitHubRepLink ? (
              <a href={currentCourse.gitHubRepLink} target='_blank' className={scss.gitHubLink}>
                Download course materials <BsGithub className={scss.gitHubLinkIcon} />
              </a>
            ) : null;
          })()}
        </div>
      </div>
      {sortedModules.map((module, index) => (
        <CourseLessonsList
          key={module.id}
          courseId={courseId}
          module={module}
          index={index}
          expandedModule={expandedModule}
          toggleModule={toggleModule}
          handleLessonClick={handleLessonClick}
          completedLessons={completedLessons[courseId] || {}} // Передаём только данные для текущего курса
          toggleLessonCompletion={toggleLessonCompletion}
          getCompletedCount={getCompletedCount}
          getTotalDuration={getTotalDuration}
          playlistPage={false}
        />
      ))}
    </div>
  );
}
