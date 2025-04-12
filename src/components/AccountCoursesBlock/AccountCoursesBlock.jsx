import React from 'react';
import { useSelector } from 'react-redux'; // Добавляем useSelector для получения lastCourseId
import AccountCourseCard from '../AccountCourseCard/AccountCourseCard';
import scss from './AccountCoursesBlock.module.scss';

export default function AccountCoursesBlock({ courses, progress }) {
  // Получаем lastCourseId из Redux-стейта
  const lastCourseId = useSelector((state) => state.auth.lastCourseId);

  // Сортировка курсов
  const sortedCourses = [...courses].sort((a, b) => {
    const progressA = progress[a.id] || 0;
    const progressB = progress[b.id] || 0;

    // 1. Если есть lastCourseId, ставим этот курс первым
    if (lastCourseId) {
      if (a.id === lastCourseId) return -1;
      if (b.id === lastCourseId) return 1;
    }

    // 2. Курсы "в прогрессе" (available: true, progress < 100)
    if (a.available && progressA < 100 && ((b.available && progressB === 100) || !b.available)) {
      return -1;
    }
    if (b.available && progressB < 100 && ((a.available && progressA === 100) || !a.available)) {
      return 1;
    }

    // 3. Пройденные курсы (available: true, progress === 100)
    if (a.available && progressA === 100 && !b.available) {
      return -1;
    }
    if (b.available && progressB === 100 && !a.available) {
      return 1;
    }

    // 4. Недоступные курсы (available: false) — остаются в конце
    return 0;
  });

  return (
    <div className={scss.coursesBlock}>
      {sortedCourses.length > 0 ? (
        sortedCourses.map((course, index) => (
          <AccountCourseCard
            key={course.id}
            course={course}
            progress={progress[course.id] || 0}
            index={index + 1}
          />
        ))
      ) : (
        <p>Courses are not available yet.</p>
      )}
    </div>
  );
}
