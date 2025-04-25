import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toggleLessonCompletion, setLastCourseId } from '../../store/slices/authSlice';
import AccountCoursesBlock from '../../components/AccountCoursesBlock/AccountCoursesBlock';
import AccountUserProfileInfo from '../../components/AccountUserProfileInfo/AccountUserProfileInfo';
import AccountLoadingIndicator from '../../components/AccountLoadingIndicator/AccountLoadingIndicator';
import AccountCourseLessons from '../../components/AccountCourseLessons/AccountCourseLessons';
import AccountTimer from '../../components/AccountTimer/AccountTimer';
import scss from './PersonalAccount.module.scss';
import AccountCompanyAndQuestions from '../../components/AccountCompanyAndQuestions/AccountCompanyAndQuestions';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase'; // Импортируй db из твоей firebase-конфигурации
import clsx from 'clsx';

export default function PersonalAccount() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const {
    user,
    userRole,
    userName,
    registrationDate,
    isLoading: authLoading,
    completedLessons,
    progress,
    courses,
    timers,
    lastCourseId,
  } = useSelector((state) => state.auth);

  const [activeCourse, setActiveCourse] = useState(null);

  useEffect(() => {
    if (!courses.length) {
      setActiveCourse(null);
      return;
    }

    const defaultCourseId = lastCourseId || courses.find((course) => course.available)?.id;
    if (!defaultCourseId) {
      console.log('No default course found');
      setActiveCourse(null);
      return;
    }

    const initialActiveCourse = courses.find(
      (course) => course.id === defaultCourseId && course.available,
    );

    if (!initialActiveCourse) {
      setActiveCourse(null);
      return;
    }

    const hasModules = initialActiveCourse.modules && initialActiveCourse.modules.length > 0;
    const isAccessible = initialActiveCourse.access !== 'denied' && hasModules;

    if (!isAccessible) {
      setActiveCourse(null);
      return;
    }

    const modulesArray = initialActiveCourse.modules || [];
    const totalLessons = modulesArray.reduce((sum, module) => sum + (module.links?.length || 0), 0);
    const courseCompletedLessons = completedLessons[defaultCourseId] || {};
    const completedLessonsCount = Object.values(courseCompletedLessons).reduce(
      (sum, indices) => sum + (Array.isArray(indices) ? indices.length : 0),
      0,
    );

    const allLessons = modulesArray.flatMap((module) => module.links || []);
    const totalMinutes = allLessons.reduce((sum, lesson) => {
      const time = parseInt(lesson.videoTime, 10) || 0;
      return sum + (isNaN(time) ? 0 : time);
    }, 0);
    const totalDuration =
      totalMinutes >= 60
        ? `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`
        : `${totalMinutes}m`;

    const updatedCourse = {
      id: initialActiveCourse.id,
      title:
        initialActiveCourse.title ||
        initialActiveCourse.id.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      category: initialActiveCourse.category || 'Uncategorized',
      gitHubRepLink: initialActiveCourse.gitHubRepLink,
      description: initialActiveCourse.description || ' ',
      available: isAccessible,
      access: initialActiveCourse.access,
      modules: modulesArray,
      totalLessons,
      completedLessonsCount,
      totalDuration,
      userCount: initialActiveCourse.userCount,
    };

    setActiveCourse(updatedCourse);

    // Подписка на изменения userCount в реальном времени
    const courseRef = doc(db, 'courses', defaultCourseId);
    const unsubscribe = onSnapshot(courseRef, (doc) => {
      if (doc.exists()) {
        const newUserCount = doc.data().userCount || 0;
        setActiveCourse((prev) => (prev ? { ...prev, userCount: newUserCount } : prev));
      }
    });

    if (!lastCourseId && defaultCourseId) {
      console.log('Setting lastCourseId to:', defaultCourseId);
      dispatch(setLastCourseId(defaultCourseId));
    }

    // Отписываемся при размонтировании компонента
    return () => unsubscribe();
  }, [lastCourseId, courses, completedLessons, dispatch]);

  const handleCourseSelect = (courseId) => {
    dispatch(setLastCourseId(courseId));
  };

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
            <div className={clsx(scss.courseTimer, scss.courseTimerTablet)}>
              {activeCourse && (
                <AccountTimer
                  key={activeCourse.id}
                  courseId={activeCourse.id}
                  modules={activeCourse.modules}
                />
              )}
            </div>
            {activeCourse && (
              <div key={activeCourse.id} className={scss.courseLessonsContainer}>
                <AccountCourseLessons
                  courseId={activeCourse.id}
                  courses={courses}
                  progress={progress}
                  courseTitle={activeCourse.title}
                  modules={activeCourse.modules}
                  userCount={activeCourse.userCount}
                  completedLessons={completedLessons}
                  completedLessonsCount={activeCourse.completedLessonsCount}
                  totalLessons={activeCourse.totalLessons}
                  totalDuration={activeCourse.totalDuration}
                  toggleLessonCompletion={(moduleId, lessonIndex) =>
                    dispatch(
                      toggleLessonCompletion({
                        courseId: activeCourse.id,
                        moduleId,
                        lessonIndex,
                        totalLessons: activeCourse.totalLessons,
                      }),
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
              <div className={scss.courseTimer}>
                {activeCourse && (
                  <AccountTimer
                    key={activeCourse.id}
                    courseId={activeCourse.id}
                    modules={activeCourse.modules}
                  />
                )}
              </div>
              <AccountCompanyAndQuestions
                activeTimer={
                  activeCourse && timers.find((timer) => timer.courseId === activeCourse.id)
                }
              />
              <div className={scss.courseAccessBlock}>
                <h3 className={scss.courseAccessTitle}>Available courses:</h3>
                <p className={scss.courseAccessDescrtiption}>
                  Here you can see purchased and future courses
                </p>
                <AccountCoursesBlock
                  courses={courses}
                  progress={progress}
                  onCourseSelect={handleCourseSelect}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
