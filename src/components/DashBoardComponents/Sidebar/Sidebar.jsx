// components/admin/Sidebar.jsx
import { useNavigate } from 'react-router-dom';
import { auth } from '../../../firebase';
import scss from './Sidebar.module.scss';
import clsx from 'clsx';
import { useState } from 'react';
import {
  BsArrowBarLeft,
  BsChevronDown,
  BsChevronRight,
  BsDoorOpenFill,
  BsFillHouseFill,
  BsFillMortarboardFill,
  BsFillPeopleFill,
  BsHousesFill,
  BsJournalMedical,
  BsPower,
} from 'react-icons/bs';

export default function Sidebar({ setActiveSection, activeSection, isCollapsed, setIsCollapsed }) {
  const navigate = useNavigate();
  const [isUsersOpen, setIsUsersOpen] = useState(false);
  const [isCoursesOpen, setIsCoursesOpen] = useState(false);

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/login');
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
    // Закрываем все подменю при сворачивании
    if (!isCollapsed) {
      setIsUsersOpen(false);
      setIsCoursesOpen(false);
    }
  };

  return (
    <div className={clsx(scss.sidebar, isCollapsed && scss.collapsed)}>
      <div className={scss.sidebarTitleBlock}>
        <h2 className={scss.sidebarTitle}>Панель управления</h2>
        <BsArrowBarLeft className={scss.iconTitle} onClick={toggleSidebar} />
      </div>
      <ul className={scss.menu}>
        <li
          className={clsx(scss.menuItem, activeSection === 'mainStatistics' && scss.active)}
          onClick={() => setActiveSection('mainStatistics')}>
          <div className={scss.iconAndTextMenuMainBlock}>
            <BsFillHouseFill className={scss.menuIcon} />
            <span className={scss.menuText}>Главная</span>
          </div>
        </li>
        <li className={clsx(scss.menuItem, activeSection === 'userList' && scss.active)}>
          <div
            className={clsx(scss.iconAndTextMenuMainBlock, scss.iconAndTextMenuMainBlockDrop)}
            onClick={() => {
              if (!isCollapsed) setIsUsersOpen(!isUsersOpen);
            }}>
            <div className={scss.iconAndTextMenuBlock}>
              <BsFillPeopleFill className={scss.menuIcon} />
              <span className={scss.menuText}>Пользователи</span>
            </div>
            {isUsersOpen ? (
              <BsChevronDown className={scss.iconDrop} />
            ) : (
              <BsChevronRight className={scss.iconDrop} />
            )}
          </div>
          {isUsersOpen && !isCollapsed && (
            <ul className={scss.submenu}>
              <li className={scss.submenuItem} onClick={() => setActiveSection('userList')}>
                Все пользователи
              </li>
              <li className={scss.submenuItem} onClick={() => setActiveSection('addUser')}>
                Добавить пользователя
              </li>
            </ul>
          )}
        </li>
        <li className={clsx(scss.menuItem, activeSection === 'courseList' && scss.active)}>
          <div
            className={clsx(scss.iconAndTextMenuMainBlock, scss.iconAndTextMenuMainBlockDrop)}
            onClick={() => {
              if (!isCollapsed) setIsCoursesOpen(!isCoursesOpen);
            }}>
            <div className={scss.iconAndTextMenuBlock}>
              <BsFillMortarboardFill className={scss.menuIcon} />
              <span className={scss.menuText}>Курсы</span>
            </div>
            {isCoursesOpen ? (
              <BsChevronDown className={scss.iconDrop} />
            ) : (
              <BsChevronRight className={scss.iconDrop} />
            )}
          </div>
          {isCoursesOpen && !isCollapsed && (
            <ul className={scss.submenu}>
              <li className={scss.submenuItem} onClick={() => setActiveSection('courseList')}>
                Все курсы
              </li>
              <li className={scss.submenuItem} onClick={() => setActiveSection('addCourse')}>
                Добавить курс
              </li>
            </ul>
          )}
        </li>
        <li className={scss.menuItem} onClick={handleLogout}>
          <div className={scss.iconAndTextMenuMainBlock}>
            <BsPower className={scss.menuIcon} />
            <span className={scss.menuText}>Выйти</span>
          </div>
        </li>
      </ul>
    </div>
  );
}
