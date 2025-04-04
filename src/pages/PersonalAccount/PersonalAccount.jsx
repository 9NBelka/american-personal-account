// pages/PersonalAccount/PersonalAccount.jsx
import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AccountCoursesBlock from '../../components/AccountCoursesBlock/AccountCoursesBlock';
import AccountUserProfileInfo from '../../components/AccountUserProfileInfo/AccountUserProfileInfo';
import AccountLoadingIndicator from '../../components/AccountLoadingIndicator/AccountLoadingIndicator';
import AccountCourseLessons from '../../components/AccountCourseLessons/AccountCourseLessons';
import AccountTimer from '../../components/AccountTimer/AccountTimer'; // Импортируем новый компонент
import scss from './PersonalAccount.module.scss';
import AccountInfoForCompany from '../../components/AccountInfoForCompany/AccountInfoForCompany';
import AccountCompanyAndQuestions from '../../components/AccountCompanyAndQuestions/AccountCompanyAndQuestions';

export default function PersonalAccount() {
  const navigate = useNavigate();
  const {
    user,
    userRole,
    userName,
    registrationDate,
    isLoading: authLoading,
    completedLessons,
    progress,
    courses,
    toggleLessonCompletion,
    lastCourseId,
    fetchCourseUserCount,
    timers, // Добавляем timers из контекста
  } = useAuth();

  const [userCount, setUserCount] = useState(0);
  useEffect(() => {
    if (lastCourseId) {
      fetchCourseUserCount(lastCourseId).then(setUserCount);
    }
  }, [lastCourseId, fetchCourseUserCount]);

  if (authLoading) {
    return <AccountLoadingIndicator />;
  }

  if (!user) {
    toast.error('Please log in.');
    navigate('/login');
    return null;
  }

  const handleLessonClick = (courseId, videoUrl) => {
    console.log(`Selected video for course ${courseId}: ${videoUrl}`);
  };

  const activeCourse = courses.find((course) => course.id === lastCourseId && course.available);

  // Проверяем, есть ли таймер для уровня доступа активного курса
  const activeTimer = activeCourse
    ? timers.find((timer) => timer.courseId === activeCourse.id)
    : null;

  return (
    <div className={scss.personalAccountBackground}>
      <div className={scss.container}>
        <div className='personal-account'>
          <AccountUserProfileInfo
            userName={userName}
            userRole={userRole}
            registrationDate={registrationDate}
          />
          <div className={scss.mainHalfToHalfBlock}>
            {activeCourse && (
              <div key={activeCourse.id} className={scss.courseLessonsContainer}>
                {/* Добавляем таймер перед списком уроков */}
                {activeTimer && (
                  <AccountTimer courseId={activeCourse.id} modules={activeCourse.modules} />
                )}
                <AccountCourseLessons
                  courseId={activeCourse.id}
                  courses={courses}
                  progress={progress}
                  courseTitle={activeCourse.title}
                  modules={activeCourse.modules}
                  userCount={userCount}
                  completedLessons={completedLessons[activeCourse.id] || {}}
                  completedLessonsCount={activeCourse.completedLessonsCount}
                  totalLessons={activeCourse.totalLessons}
                  totalDuration={activeCourse.totalDuration}
                  toggleLessonCompletion={(moduleId, lessonIndex) =>
                    toggleLessonCompletion(
                      activeCourse.id,
                      moduleId,
                      lessonIndex,
                      activeCourse.totalLessons,
                    )
                  }
                  handleLessonClick={(videoUrl) => handleLessonClick(activeCourse.id, videoUrl)}
                  getCompletedCount={(moduleId, links) => {
                    const courseCompletedLessons = completedLessons[activeCourse.id] || {};
                    const completed = courseCompletedLessons[moduleId] || [];
                    return {
                      completed: completed.length,
                      total: links.length,
                    };
                  }}
                  getTotalDuration={(links) => {
                    const totalMinutes = links.reduce((sum, lesson) => {
                      const time = parseInt(lesson.videoTime, 10) || 0;
                      return sum + (isNaN(time) ? 0 : time);
                    }, 0);
                    return totalMinutes >= 60
                      ? `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`
                      : `${totalMinutes}m`;
                  }}
                />
              </div>
            )}
            <div className={scss.courseRightContainer}>
              <AccountCompanyAndQuestions />
              <div className={scss.courseAccessBlock}>
                <h3 className={scss.courseAccessTitle}>Available courses:</h3>
                <p className={scss.courseAccessDescrtiption}>
                  Here you can see purchased and future courses
                </p>
                <AccountCoursesBlock courses={courses} progress={progress} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
