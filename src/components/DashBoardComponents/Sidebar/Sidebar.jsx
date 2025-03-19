// components/admin/Sidebar.jsx
import { useNavigate } from 'react-router-dom';
import { auth } from '../../../firebase';
import styles from './Sidebar.module.scss';

export default function Sidebar({ setActiveSection, activeSection }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/login');
  };

  return (
    <div className={styles.sidebar}>
      <h2 className={styles.title}>Панель управления</h2>
      <ul className={styles.menu}>
        <li
          className={`${styles.menuItem} ${activeSection === 'addUser' ? styles.active : ''}`}
          onClick={() => setActiveSection('addUser')}>
          Добавить пользователя
        </li>
        <li
          className={`${styles.menuItem} ${activeSection === 'userList' ? styles.active : ''}`}
          onClick={() => setActiveSection('userList')}>
          Все пользователи
        </li>
        <li
          className={`${styles.menuItem} ${activeSection === 'courseList' ? styles.active : ''}`}
          onClick={() => setActiveSection('courseList')}>
          Все курсы
        </li>
        <li className={styles.menuItem} onClick={handleLogout}>
          Выйти
        </li>
      </ul>
    </div>
  );
}
