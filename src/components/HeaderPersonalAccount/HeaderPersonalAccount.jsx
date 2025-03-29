// components/HeaderPersonalAccount/HeaderPersonalAccount.jsx
import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate, useLocation } from 'react-router-dom';
import scss from './HeaderPersonalAccount.module.scss';
import { useAuth } from '../../context/AuthContext';
import { useAdmin } from '../../context/AdminContext';
import { BsBellFill, BsBoxArrowInRight, BsFillGearFill } from 'react-icons/bs';
import AccountLoadingIndicator from '../AccountLoadingIndicator/AccountLoadingIndicator';
import NotificationDrop from './NotificationDrop/NotificationDrop';

export default function HeaderPersonalAccount({ handleLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    lastCourseId,
    progress,
    user,
    isLoading,
    userName,
    avatarUrl,
    readNotifications,
    notifications,
  } = useAuth();
  // const { notifications } = useAdmin();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notificationRef = useRef(null); // Ссылка на выпадающий блок
  const bellIconRef = useRef(null); // Ссылка на иконку колокольчика

  const handleCourseSelect = () => {
    if (lastCourseId) {
      navigate(`/playlist/${lastCourseId}`);
    } else {
      const availableCourses = Object.keys(progress);
      if (availableCourses.length > 0) {
        const firstAvailableCourse = availableCourses[0];
        navigate(`/playlist/${firstAvailableCourse}`);
      } else {
        toast.error("You don't have any courses yet!");
        navigate('/account');
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Нет даты';
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now - date;
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `Today, ${hours}:${minutes}`;
    } else if (diffInDays === 1) {
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `Yesterday, ${hours}:${minutes}`;
    } else {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}.${month}.${year}`;
    }
  };

  // Фильтруем уведомления, показываем только непрочитанные
  const unreadNotifications = notifications.filter(
    (notification) => !readNotifications.includes(notification.id),
  );

  // Сортируем непрочитанные уведомления по дате (самые новые сверху)
  const sortedNotifications = [...unreadNotifications].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  );

  // Закрытие выпадающего списка при клике вне области
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target) &&
        bellIconRef.current &&
        !bellIconRef.current.contains(event.target)
      ) {
        setIsNotificationsOpen(false);
      }
    };

    // Добавляем слушатель событий
    document.addEventListener('mousedown', handleClickOutside);

    // Удаляем слушатель при размонтировании компонента
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (isLoading) return <AccountLoadingIndicator />;

  return (
    <header className={scss.header}>
      <div className={scss.container}>
        <nav className={scss.navigationBlock}>
          <div className={scss.logoBlock}>
            <img src='/img/knowledgeSyndicateLogo.png' alt='Logo' />
          </div>
          <ul>
            <li
              className={location.pathname === '/account' ? scss.active : ''}
              onClick={() => navigate('/account')}>
              Dashboard
            </li>
            <li
              className={location.pathname.startsWith('/playlist') ? scss.active : ''}
              onClick={handleCourseSelect}>
              Lessons
            </li>
            <li
              className={location.pathname.startsWith('/edit') ? scss.active : ''}
              onClick={() => navigate('/edit')}>
              Edit profile
            </li>
          </ul>
          <div className={scss.profileAndIcons}>
            <div className={scss.avatarNameContainer} onClick={() => navigate('/edit')}>
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt='User avatar'
                  className={scss.avatar}
                  onError={(e) => (e.target.src = '/img/defaultAvatar.webp')}
                />
              ) : (
                <img src='/img/defaultAvatar.webp' alt='Default avatar' className={scss.avatar} />
              )}
              <p className={scss.studentName}>{userName}</p>
            </div>
            <div className={scss.profileIcons}>
              <div className={scss.notificationWrapper}>
                <BsBellFill
                  ref={bellIconRef}
                  className={scss.profileIcon}
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                />
                {unreadNotifications.length > 0 && (
                  <span className={scss.notificationBadge}>{unreadNotifications.length}</span>
                )}
                {isNotificationsOpen && (
                  <div ref={notificationRef}>
                    <NotificationDrop
                      sortedNotifications={sortedNotifications}
                      formatDate={formatDate}
                    />
                  </div>
                )}
              </div>
              <BsFillGearFill className={scss.profileIcon} />
              <BsBoxArrowInRight className={scss.profileIcon} onClick={handleLogout} />
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
}
