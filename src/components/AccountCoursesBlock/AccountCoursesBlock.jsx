import React from 'react';
import AccountCourseCard from '../AccountCourseCard/AccountCourseCard';
import scss from './AccountCoursesBlock.module.scss';

export default function AccountCoursesBlock({ courses, progress }) {
  // console.log(courseCategory);
  return (
    <div className={scss.coursesBlock}>
      {courses.length > 0 ? (
        courses.map((course, index) => (
          <AccountCourseCard
            key={course.id}
            course={course}
            progress={progress[course.id] || 0}
            index={index + 1}
          />
        ))
      ) : (
        <p>Courses are not available yet.</p>
      )}
    </div>
  );
}
