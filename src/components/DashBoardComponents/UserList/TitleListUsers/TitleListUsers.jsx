// components/TitleListUsers.jsx
import scss from './TitleListUsers.module.scss';

export default function TitleListUsers() {
  return (
    <thead className={scss.titleListUsers}>
      <tr>
        <th>№</th>
        <th>Ава</th>
        <th>Имя</th>
        <th>Почта</th>
        <th>Роль</th>
        <th>Курсы</th>
        <th>Действия</th>
      </tr>
    </thead>
  );
}
