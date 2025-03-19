// components/admin/CourseList.jsx
import { useEffect } from 'react';
import { useAdmin } from '../../../context/AdminContext';

export default function CourseList() {
  const { courses, fetchAllCourses } = useAdmin();

  useEffect(() => {
    fetchAllCourses();
  }, [fetchAllCourses]);

  return (
    <div>
      <h2>Список курсов</h2>
      {courses.length > 0 ? (
        <ul>
          {courses.map((course) => (
            <li key={course.id}>
              {course.title} (ID: {course.id}) - Категория: {course.category || 'Нет категории'}
              {/* Здесь можно добавить кнопки для редактирования и удаления */}
            </li>
          ))}
        </ul>
      ) : (
        <p>Курсы не найдены.</p>
      )}
    </div>
  );
}
