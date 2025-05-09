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
  BsFillBoxFill,
  BsCoin,
  BsImage,
  BsDisplayFill,
} from 'react-icons/bs';
import { useSelector } from 'react-redux';

export default function Sidebar({
  activeSection,
  isCollapsed,
  setIsCollapsed,
  handleSectionClick,
}) {
  const navigate = useNavigate();

  const { userRole } = useSelector((state) => state.auth);
  const [isPagesOpen, setIsPagesOpen] = useState(false);
  const [isUsersOpen, setIsUsersOpen] = useState(false);
  const [isCoursesOpen, setIsCoursesOpen] = useState(false);
  const [isProductOpen, setIsProductOpen] = useState(false);

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/login');
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
    if (!isCollapsed) {
      setIsPagesOpen(false);
      setIsUsersOpen(false);
      setIsCoursesOpen(false);
      setIsProductOpen(false);
    }
  };

  return (
    <div className={clsx(scss.sidebar, isCollapsed && scss.collapsed)}>
      <div className={scss.sidebarTitleBlock}>
        <h2 className={scss.sidebarTitle}>DashBoard</h2>
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
        {userRole == 'admin' && (
          <li
            className={clsx(scss.menuItem, activeSection === 'images' && scss.active)}
            onClick={() => handleSectionClick('images')}>
            <div className={scss.iconAndTextMenuMainBlock}>
              <BsImage className={scss.menuIcon} />
              <span className={scss.menuText}>Изображения</span>
            </div>
          </li>
        )}
        {/* {userRole == 'admin' && (
          <li
            className={clsx(scss.menuItem, activeSection === 'pages' && scss.active)}
            onClick={() => handleSectionClick('pages')}>
            <div className={scss.iconAndTextMenuMainBlock}>
              <BsDisplayFill className={scss.menuIcon} />
              <span className={scss.menuText}>Страницы</span>
            </div>
          </li>
        )} */}
        {userRole == 'admin' && (
          <li
            className={clsx(
              scss.menuItem,
              (activeSection === 'pages' || activeSection === 'formsOnPages') && scss.active,
            )}>
            <div
              className={clsx(scss.iconAndTextMenuMainBlock, scss.iconAndTextMenuMainBlockDrop)}
              onClick={() => {
                if (!isCollapsed) setIsPagesOpen(!isPagesOpen);
                handleSectionClick('pages');
              }}>
              <div className={scss.iconAndTextMenuBlock}>
                <BsDisplayFill className={scss.menuIcon} />
                <span className={scss.menuText}>Страницы</span>
              </div>
              {isPagesOpen ? (
                <BsChevronDown className={scss.iconDrop} />
              ) : (
                <BsChevronRight className={scss.iconDrop} />
              )}
            </div>
            {isPagesOpen && !isCollapsed && (
              <ul className={scss.submenu}>
                <li
                  className={clsx(
                    scss.submenuItem,
                    activeSection === 'pages' && scss.activeSubText,
                  )}
                  onClick={() => handleSectionClick('pages')}>
                  Все страницы
                </li>
                <li
                  className={clsx(
                    scss.submenuItem,
                    activeSection === 'formsOnPages' && scss.activeSubText,
                  )}
                  onClick={() => handleSectionClick('formsOnPages')}>
                  Формы
                </li>
              </ul>
            )}
          </li>
        )}
        <li
          className={clsx(
            scss.menuItem,
            (activeSection === 'userList' || activeSection === 'addUser') && scss.active,
          )}>
          <div
            className={clsx(scss.iconAndTextMenuMainBlock, scss.iconAndTextMenuMainBlockDrop)}
            onClick={() => {
              if (!isCollapsed) setIsUsersOpen(!isUsersOpen);
              handleSectionClick('userList');
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
              activeSection === 'timersCourses' ||
              activeSection === 'editCourse') &&
              scss.active,
          )}>
          <div
            className={clsx(scss.iconAndTextMenuMainBlock, scss.iconAndTextMenuMainBlockDrop)}
            onClick={() => {
              if (!isCollapsed) setIsCoursesOpen(!isCoursesOpen);
              handleSectionClick('courseList');
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
              {userRole == 'admin' && (
                <li
                  className={clsx(
                    scss.submenuItem,
                    activeSection === 'addCourse' && scss.activeSubText,
                  )}
                  onClick={() => handleSectionClick('addCourse')}>
                  Добавить курс
                </li>
              )}
              {userRole == 'admin' && (
                <li
                  className={clsx(
                    scss.submenuItem,
                    activeSection === 'timersCourses' && scss.activeSubText,
                  )}
                  onClick={() => handleSectionClick('timersCourses')}>
                  Таймеры
                </li>
              )}
            </ul>
          )}
        </li>
        {userRole == 'admin' && (
          <li
            className={clsx(
              scss.menuItem,
              (activeSection === 'productList' ||
                activeSection === 'addProduct' ||
                activeSection === 'discountPresets' ||
                activeSection === 'promocodes' ||
                activeSection === 'currencySelector' ||
                activeSection === 'editProduct') &&
                scss.active,
            )}>
            <div
              className={clsx(scss.iconAndTextMenuMainBlock, scss.iconAndTextMenuMainBlockDrop)}
              onClick={() => {
                if (!isCollapsed) setIsProductOpen(!isProductOpen);
                handleSectionClick('productList');
              }}>
              <div className={scss.iconAndTextMenuBlock}>
                <BsFillBoxFill className={scss.menuIcon} />
                <span className={scss.menuText}>Товары</span>
              </div>
              {isProductOpen ? (
                <BsChevronDown className={scss.iconDrop} />
              ) : (
                <BsChevronRight className={scss.iconDrop} />
              )}
            </div>
            {isProductOpen && !isCollapsed && (
              <ul className={scss.submenu}>
                <li
                  className={clsx(
                    scss.submenuItem,
                    activeSection === 'productList' && scss.activeSubText,
                  )}
                  onClick={() => handleSectionClick('productList')}>
                  Все товары
                </li>
                <li
                  className={clsx(
                    scss.submenuItem,
                    activeSection === 'addProduct' && scss.activeSubText,
                  )}
                  onClick={() => handleSectionClick('addProduct')}>
                  Добавить товар
                </li>
                <li
                  className={clsx(
                    scss.submenuItem,
                    activeSection === 'discountPresets' && scss.activeSubText,
                  )}
                  onClick={() => handleSectionClick('discountPresets')}>
                  Скидки
                </li>
                <li
                  className={clsx(
                    scss.submenuItem,
                    activeSection === 'promocodes' && scss.activeSubText,
                  )}
                  onClick={() => handleSectionClick('promocodes')}>
                  Промокоды
                </li>
                <li
                  className={clsx(
                    scss.submenuItem,
                    activeSection === 'currencySelector' && scss.activeSubText,
                  )}
                  onClick={() => handleSectionClick('currencySelector')}>
                  Смена валюты
                </li>
              </ul>
            )}
          </li>
        )}
        <li
          className={clsx(scss.menuItem, activeSection === 'orders' && scss.active)}
          onClick={() => handleSectionClick('orders')}>
          <div className={scss.iconAndTextMenuMainBlock}>
            <BsCoin className={scss.menuIcon} />
            <span className={scss.menuText}>Заказы</span>
          </div>
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
