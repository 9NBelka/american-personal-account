import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux'; // Добавляем useDispatch
import { updateCourseData, setLastCourseId } from '../../store/slices/authSlice'; // Импортируем действия
import scss from './AccountCourseCard.module.scss';
import clsx from 'clsx';

export default function AccountCourseCard({ course, progress, index, onClick }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleCourseSelectAndNavigation = () => {
    // Вызываем updateCourseData для синхронизации данных курса
    dispatch(updateCourseData(course.id))
      .unwrap()
      .then(() => {
        // Обновляем lastCourseId через setLastCourseId
        dispatch(setLastCourseId(course.id));
        // Вызываем onClick для уведомления родительского компонента (если передан)
        if (onClick) {
          onClick(course.id);
        }
        // Переходим на страницу плейлиста курса
        navigate(`/playlist/${course.id}`);
      })
      .catch((error) => {
        console.error('Ошибка при обновлении данных курса:', error);
      });
  };

  const handleCourseSelect = () => {
    // Вызываем updateCourseData для синхронизации данных курса
    dispatch(updateCourseData(course.id))
      .unwrap()
      .then(() => {
        // Обновляем lastCourseId через setLastCourseId
        dispatch(setLastCourseId(course.id));
        // Вызываем onClick для уведомления родительского компонента (если передан)
        if (onClick) {
          onClick(course.id);
        }
      })
      .catch((error) => {
        console.error('Ошибка при обновлении данных курса:', error);
      });
  };

  return (
    <div
      className={clsx(
        scss.courseCard,
        course.available ? scss.available : scss.notAvailable,
        index % 3 === 1 && scss.borderOrange,
        index % 3 === 2 && scss.borderGreen,
        index % 3 === 0 && scss.borderBlue,
      )}>
      <p className={scss.categoryText}>{course.category}</p>
      <div className={scss.courseNameBlock}>
        <h4 className={scss.courseName} onClick={handleCourseSelect}>
          {course.title}
        </h4>
      </div>
      <div className={scss.completedCourseBlock}>
        {progress === 100 ? (
          <Link
            to={`/certificate/${course.id}`} // Предполагается, что courseId доступен в компоненте
            className={clsx(
              scss.completedCourse,
              index % 3 === 1 && progress === 100 && scss.completedCourseOrange,
              index % 3 === 2 && progress === 100 && scss.completedCourseGreen,
              index % 3 === 0 && progress === 100 && scss.completedCourseBlue,
            )}>
            Download the certificate
          </Link>
        ) : (
          <p className={clsx(scss.completedCourse, progress < 100 && scss.noCompletedCourse)}>
            Download the certificate
          </p>
        )}
      </div>
      <div className={scss.watchButtonBlock}>
        {course.available ? (
          <button
            onClick={handleCourseSelectAndNavigation}
            className={clsx(
              scss.watchButton,
              index % 3 === 1 && scss.borderOrange,
              index % 3 === 2 && scss.borderGreen,
              index % 3 === 0 && scss.borderBlue,
              index % 3 === 1 && progress === 100 && scss.watchButtonOrange,
              index % 3 === 2 && progress === 100 && scss.watchButtonGreen,
              index % 3 === 0 && progress === 100 && scss.watchButtonBlue,
            )}>
            {progress === 100 ? `Completed` : `In progress`}
          </button>
        ) : (
          <Link to={`/${course.id}`} className={scss.watchButton}>
            Not available
          </Link>
        )}
      </div>
    </div>
  );
}
