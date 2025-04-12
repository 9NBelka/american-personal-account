import { createSelector } from 'reselect';

// Базовый селектор для получения completedLessons
const getCompletedLessons = (state) => state.auth.completedLessons;

// Мемоизированный селектор для получения completedLessons по courseId
export const getCompletedLessonsByCourseId = createSelector(
  [getCompletedLessons, (_, courseId) => courseId],
  (completedLessons, courseId) => completedLessons[courseId] || {},
);
