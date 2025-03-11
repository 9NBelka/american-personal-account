import CourseLessonsList from '../CourseLessonsList/CourseLessonsList';
import PlayListModuleHeader from '../PlayListModuleHeader/PlayListModuleHeader';

export default function PlayListModuleBlock({
  courseTitle,
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
  return (
    <>
      {courseTitle && (
        <PlayListModuleHeader
          courseTitle={courseTitle}
          completedLessonsCount={completedLessonsCount}
          totalLessons={totalLessons}
          totalDuration={totalDuration}
        />
      )}
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
    </>
  );
}
