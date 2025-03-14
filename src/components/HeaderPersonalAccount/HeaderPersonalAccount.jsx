import React from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate, useLocation } from 'react-router-dom';
import scss from './HeaderPersonalAccount.module.scss';
import { useAuth } from '../../context/AuthContext';
import { BsBellFill, BsBoxArrowInRight, BsFillGearFill } from 'react-icons/bs';

export default function HeaderPersonalAccount({ handleLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { lastCourseId, progress, user, isLoading, userName } = useAuth();

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

  if (isLoading) return <div>Loading...</div>;

  return (
    <header className={scss.header}>
      <div className={scss.container}>
        <nav className={scss.navigationBlock}>
          <div className={scss.logoBlock}>
            <img src='/src/assets/img/knowledgeSyndicateLogo.png' alt='Logo' />
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
            <p className={scss.studentName}>{userName}</p>
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
