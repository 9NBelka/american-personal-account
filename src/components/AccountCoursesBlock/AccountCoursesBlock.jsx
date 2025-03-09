import React from 'react';
import AccountCourseCard from '../AccountCourseCard/AccountCourseCard';

export default function AccountCoursesBlock({ courses }) {
  return (
    <div className='courses-grid'>
      {courses.length > 0 ? (
        courses.map((course) => <AccountCourseCard key={course.id} course={course} />)
      ) : (
        <p>Курсы пока недоступны.</p>
      )}
    </div>
  );
}
