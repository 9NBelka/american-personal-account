import React from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate, useLocation } from 'react-router-dom';
import scss from './HeaderPersonalAccount.module.scss';
import { useAuth } from '../../context/AuthContext';
import { BsBellFill, BsBoxArrowInRight, BsFillGearFill } from 'react-icons/bs';
import AccountLoadingIndicator from '../AccountLoadingIndicator/AccountLoadingIndicator';

export default function HeaderPersonalAccount({ handleLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { lastCourseId, progress, user, isLoading, userName, avatarUrl } = useAuth();

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
                  onError={(e) => (e.target.src = '/img/defaultAvatar.webp')} // Запасной вариант
                />
              ) : (
                <img src='/img/defaultAvatar.webp' alt='Default avatar' className={scss.avatar} />
              )}
              <p className={scss.studentName}>{userName}</p>
            </div>
            <div className={scss.profileIcons}>
              <BsBellFill className={scss.profileIcon} />
              <BsFillGearFill className={scss.profileIcon} />
              <BsBoxArrowInRight className={scss.profileIcon} onClick={handleLogout} />
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
}
