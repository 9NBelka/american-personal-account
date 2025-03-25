// components/admin/TitleListCourses.jsx
import scss from './TitleListCourses.module.scss';

export default function TitleListCourses() {
  return (
    <thead className={scss.titleListCourses}>
      <tr>
        <th>№</th>
        <th>Превью</th>
        <th>Название</th>
        <th>Категория</th>
        <th>ID</th>
        <th>Дата создания</th>
        <th>Действия</th>
      </tr>
    </thead>
  );
}
