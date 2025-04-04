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
import AccountTimer from '../../components/AccountTimer/AccountTimer';
import scss from './PersonalAccount.module.scss';
import AccountInfoForCompany from '../../components/AccountInfoForCompany/AccountInfoForCompany';
import AccountCompanyAndQuestions from '../../components/AccountCompanyAndQuestions/AccountCompanyAndQuestions';
import { doc, onSnapshot, getDoc } from 'firebase/firestore'; // Импортируем onSnapshot
import { db } from '../../firebase'; // Импортируем db

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
    timers,
  } = useAuth();

  const [userCount, setUserCount] = useState(0);
  const [activeCourse, setActiveCourse] = useState(null); // Состояние для активного курса

  // Загружаем количество пользователей для курса
  useEffect(() => {
    if (lastCourseId) {
      fetchCourseUserCount(lastCourseId).then(setUserCount);
    }
  }, [lastCourseId, fetchCourseUserCount]);

  // Инициализируем activeCourse из courses и подписываемся на изменения
  useEffect(() => {
    // Ищем начальный activeCourse из courses
    const initialActiveCourse = courses.find(
      (course) => course.id === lastCourseId && course.available,
    );
    setActiveCourse(initialActiveCourse);

    if (!lastCourseId || !initialActiveCourse) return;

    // Подписываемся на изменения в документе курса
    const courseRef = doc(db, 'courses', lastCourseId);
    const unsubscribe = onSnapshot(
      courseRef,
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const courseData = docSnapshot.data();
          const hasModules = courseData.modules && Object.keys(courseData.modules).length > 0;
          const purchasedCourses = user
            ? getDoc(doc(db, 'users', user.uid)).then((doc) => doc.data().purchasedCourses) || {}
            : {};
          const courseAccess = purchasedCourses[lastCourseId]?.access || 'denied';
          const isAccessible = courseAccess !== 'denied' && hasModules;

          const modulesData = courseData.modules || {};
          const sortedModuleKeys = Object.keys(modulesData).sort((a, b) => {
            const aNumber = parseInt(a.replace('module', ''), 10);
            const bNumber = parseInt(b.replace('module', ''), 10);
            return aNumber - bNumber;
          });
          const modulesArray = sortedModuleKeys.map((moduleId) => ({
            id: moduleId,
            moduleTitle: modulesData[moduleId].title,
            links: modulesData[moduleId].lessons || [],
            unlockDate: modulesData[moduleId].unlockDate || null,
          }));

          const totalLessons = modulesArray.reduce((sum, module) => sum + module.links.length, 0);
          const courseCompletedLessons = purchasedCourses[lastCourseId]?.completedLessons || {};
          const completedLessonsCount = Object.values(courseCompletedLessons).reduce(
            (sum, indices) => sum + (Array.isArray(indices) ? indices.length : 0),
            0,
          );

          const allLessons = modulesArray.flatMap((module) => module.links);
          const totalMinutes = allLessons.reduce((sum, lesson) => {
            const time = parseInt(lesson.videoTime, 10) || 0;
            return sum + (isNaN(time) ? 0 : time);
          }, 0);
          const totalDuration =
            totalMinutes >= 60
              ? `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`
              : `${totalMinutes}m`;

          const updatedCourse = {
            id: docSnapshot.id,
            title:
              courseData.title ||
              docSnapshot.id.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
            category: courseData.category || 'Uncategorized',
            gitHubRepLink: courseData.gitHubRepLink,
            description: courseData.description || ' ',
            available: isAccessible,
            access: courseAccess,
            modules: modulesArray,
            totalLessons,
            completedLessonsCount,
            totalDuration,
          };

          setActiveCourse(updatedCourse);
        } else {
          setActiveCourse(null);
        }
      },
      (error) => {
        console.error('Ошибка при подписке на курс:', error);
      },
    );

    return () => unsubscribe();
  }, [lastCourseId, courses, user]);

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
