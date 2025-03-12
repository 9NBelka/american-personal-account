import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import scss from './AccountCourseCard.module.scss';
import clsx from 'clsx';
import { useAuth } from '../../context/AuthContext';

export default function AccountCourseCard({ course, progress, index }) {
  const navigate = useNavigate();
  const { updateCourseData } = useAuth();

  // console.log(`Course: ${course.id}, Progress: ${progress}`);

  const handleCourseSelect = () => {
    updateCourseData(course.id);
    navigate(`/playlist/${course.id}`);
  };

  return (
    <div
      key={course.id}
      className={clsx(
        scss.courseCard,
        course.available ? scss.available : scss.notAvailable,
        index % 3 === 1 && scss.borderOrange, // 1, 4, 7...
        index % 3 === 2 && scss.borderGreen, // 2, 5, 8...
        index % 3 === 0 && scss.borderBlue, // 3, 6, 9...
      )}>
      <p className={scss.categoryText}>{course.category}</p>
      <div className={scss.courseNameBlock}>
        <h4 className={scss.courseName}>{course.title}</h4>
      </div>
      <div className={scss.completedCourseBlock}>
        {progress === 100 ? (
          <Link
            to={''}
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
            onClick={handleCourseSelect}
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
