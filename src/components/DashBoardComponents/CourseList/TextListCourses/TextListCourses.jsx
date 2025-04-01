// components/admin/TextListCourses/TextListCourses.jsx
import scss from './TextListCourses.module.scss';

export default function TextListCourses({ courses, handleEdit, handleDelete }) {
  // Функция для форматирования даты в формат DD.MM.YYYY
  const formatDate = (dateString) => {
    if (!dateString) return 'Нет даты';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Месяцы начинаются с 0
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  return (
    <tbody className={scss.listCourses}>
      {courses.map((course, index) => (
        <tr key={course.id} className={scss.course}>
          <td>{index + 1}</td>
          <td>
            <div className={scss.preview}>
              {course.previewUrl ? (
                <img
                  className={scss.previewImage}
                  src={course.previewUrl}
                  alt='coursePreview'
                  onError={(e) => (e.target.src = '/img/defaultCoursePreview.webp')}
                />
              ) : (
                <img
                  className={scss.previewImage}
                  src='/img/defaultCoursePreview.webp'
                  alt='coursePreview'
                />
              )}
            </div>
          </td>
          <td>{course.title}</td>
          <td>{course.category || 'Нет категории'}</td>
          <td>{course.id}</td>
          <td>{formatDate(course.createdAt)}</td>
          <td className={scss.actions}>
            <button className={scss.editButton} onClick={() => handleEdit(course.id)}>
              Редактировать
            </button>
            <button
              className={scss.deleteButton}
              onClick={() => {
                if (window.confirm('Вы уверены, что хотите удалить этот курс?')) {
                  handleDelete(course.id);
                }
              }}>
              Удалить
            </button>
          </td>
        </tr>
      ))}
    </tbody>
  );
}
