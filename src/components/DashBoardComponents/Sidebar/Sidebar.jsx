// components/DashBoardComponents/Sidebar/Sidebar.jsx
import { useNavigate } from 'react-router-dom';
import { auth } from '../../../firebase';
import scss from './Sidebar.module.scss';
import clsx from 'clsx';
import { useState } from 'react';
import {
  BsArrowBarLeft,
  BsChevronDown,
  BsChevronRight,
  BsFillHouseFill,
  BsFillMortarboardFill,
  BsFillPeopleFill,
  BsPower,
  BsBellFill,
} from 'react-icons/bs';

export default function Sidebar({
  activeSection,
  isCollapsed,
  setIsCollapsed,
  handleSectionClick,
}) {
  const navigate = useNavigate();
  const [isUsersOpen, setIsUsersOpen] = useState(false);
  const [isCoursesOpen, setIsCoursesOpen] = useState(false);

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/login');
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
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
          onClick={() => handleSectionClick('mainStatistics')}>
          <div className={scss.iconAndTextMenuMainBlock}>
            <BsFillHouseFill className={scss.menuIcon} />
            <span className={scss.menuText}>Главная</span>
          </div>
        </li>
        <li
          className={clsx(
            scss.menuItem,
            (activeSection === 'userList' || activeSection === 'addUser') && scss.active,
          )}>
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
              <li
                className={clsx(
                  scss.submenuItem,
                  activeSection === 'userList' && scss.activeSubText,
                )}
                onClick={() => handleSectionClick('userList')}>
                Все пользователи
              </li>
              <li
                className={clsx(
                  scss.submenuItem,
                  activeSection === 'addUser' && scss.activeSubText,
                )}
                onClick={() => handleSectionClick('addUser')}>
                Добавить пользователя
              </li>
            </ul>
          )}
        </li>
        <li
          className={clsx(
            scss.menuItem,
            (activeSection === 'courseList' ||
              activeSection === 'addCourse' ||
              activeSection === 'editCourse') &&
              scss.active,
          )}>
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
              <li
                className={clsx(
                  scss.submenuItem,
                  activeSection === 'courseList' && scss.activeSubText,
                )}
                onClick={() => handleSectionClick('courseList')}>
                Все курсы
              </li>
              <li
                className={clsx(
                  scss.submenuItem,
                  activeSection === 'addCourse' && scss.activeSubText,
                )}
                onClick={() => handleSectionClick('addCourse')}>
                Добавить курс
              </li>
            </ul>
          )}
        </li>
        <li
          className={clsx(scss.menuItem, activeSection === 'notifications' && scss.active)}
          onClick={() => handleSectionClick('notifications')}>
          <div className={scss.iconAndTextMenuMainBlock}>
            <BsBellFill className={scss.menuIcon} />
            <span className={scss.menuText}>Уведомления</span>
          </div>
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
