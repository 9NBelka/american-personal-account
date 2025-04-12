import React, { useEffect, useMemo } from 'react';
import scss from './PlayListModuleBlock.module.scss';
import PlayListModuleHeader from '../PlayListModuleHeader/PlayListModuleHeader';
import CourseLessonsList from '../CourseLessonsList/CourseLessonsList';

export default function PlayListModuleBlock({
  courseTitle,
  courseId,
  modules,
  completedLessonsCount,
  totalLessons,
  expandedModule,
  toggleModule,
  handleLessonClick,
  completedLessons,
  toggleLessonCompletion,
  getCompletedCount,
  getTotalDuration,
  totalDuration,
}) {
  const sortedModules = useMemo(() => {
    return [...(modules || [])].sort((a, b) => a.id.localeCompare(b.id));
  }, [modules]);

  const playlistPage = true;

  useEffect(() => {
    console.log('Modules changed:', modules);
  }, [modules]);

  return (
    <div className={scss.moduleBlock}>
      <PlayListModuleHeader
        courseTitle={courseTitle}
        completedLessonsCount={completedLessonsCount}
        totalLessons={totalLessons}
        totalDuration={totalDuration}
      />
      {sortedModules.map((module, index) => (
        <CourseLessonsList
          key={module.id}
          courseId={courseId}
          module={module}
          index={index}
          expandedModule={expandedModule}
          toggleModule={toggleModule}
          handleLessonClick={(videoUrl) => handleLessonClick(videoUrl, index)}
          completedLessons={completedLessons}
          toggleLessonCompletion={toggleLessonCompletion}
          getCompletedCount={getCompletedCount}
          getTotalDuration={getTotalDuration}
          playlistPage={playlistPage}
        />
      ))}
    </div>
  );
}
