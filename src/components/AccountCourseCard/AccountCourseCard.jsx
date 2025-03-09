import React from 'react';
import { Link } from 'react-router-dom';

export default function AccountCourseCard({ course }) {
  return (
    <div
      key={course.id}
      className={`course-card ${course.available ? 'available' : 'not-available'}`}>
      <h4>{course.title}</h4>
      {course.available && <p>Access: {course.access}</p>}
      {course.available ? (
        <Link to={`/playlist/${course.id}`} className='watch-button'>
          Watch
        </Link>
      ) : (
        <button className='not-available-button' disabled>
          Not available
        </button>
      )}
      <br />
      <br />
      {course.available && (
        <div>
          <button>Download the certificate</button>
          <p className='lessons-count'>
            Завершено уроков: {course.completedLessonsCount}/{course.totalLessons}
          </p>
        </div>
      )}
    </div>
  );
}
