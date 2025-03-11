import { useEffect, useRef, useState } from 'react';
import { auth, db } from '../../firebase';
import { doc, getDoc, collection, getDocs, updateDoc, onSnapshot } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AccountCoursesBlock from '../../components/AccountCoursesBlock/AccountCoursesBlock';
import AccountUserProfileInfo from '../../components/AccountUserProfileInfo/AccountUserProfileInfo';
import AccountLoadingIndicator from '../../components/AccountLoadingIndicator/AccountLoadingIndicator';
import AccountCourseLessons from '../../components/AccountCourseLessons/AccountCourseLessons';

export default function PersonalAccount() {
  const navigate = useNavigate();
  const {
    user,
    userRole,
    isLoading: authLoading,
    completedLessons,
    setCompletedLessons,
    setProgress,
    progress,
    updateCourseData,
  } = useAuth();
  const [userName, setUserName] = useState('');
  const [registrationDate, setRegistrationDate] = useState('');
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState(null);
  const subscriptionsRef = useRef({});

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user || !user.uid) {
        if (!authLoading) {
          navigate('/login');
        }
        return;
      }

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserName(data.name || '');
        setRegistrationDate(data.registrationDate || '');
        const purchasedCourses = data.purchasedCourses || {};

        try {
          const courseDocs = await getDocs(collection(db, 'courses'));
          if (courseDocs.empty) {
            setCourses([]);
          } else {
            const courseList = await Promise.all(
              courseDocs.docs.map(async (doc) => {
                const courseData = doc.data();
                const hasModules = courseData.modules && Object.keys(courseData.modules).length > 0;
                const courseAccess = purchasedCourses[doc.id]?.access || 'denied';
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
                }));

                const totalLessons = modulesArray.reduce(
                  (sum, module) => sum + module.links.length,
                  0,
                );
                const courseCompletedLessons = purchasedCourses[doc.id]?.completedLessons || {};
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
                    ? `${Math.floor(totalMinutes / 60)} ч ${totalMinutes % 60} мин`
                    : `${totalMinutes} мин`;

                return {
                  id: doc.id,
                  title:
                    courseData.title ||
                    doc.id.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
                  available: isAccessible,
                  access: courseAccess,
                  modules: modulesArray,
                  totalLessons,
                  completedLessonsCount,
                  totalDuration,
                };
              }),
            );
            setCourses(courseList);
            courseList.forEach((course) => {
              if (!subscriptionsRef.current[course.id]) {
                const userDocRef = doc(db, 'users', user.uid);
                subscriptionsRef.current[course.id] = onSnapshot(
                  userDocRef,
                  (docSnap) => {
                    if (docSnap.exists()) {
                      const purchasedCourses = docSnap.data().purchasedCourses || {};
                      const courseData = purchasedCourses[course.id] || {
                        completedLessons: {},
                        progress: 0,
                      };
                      setCompletedLessons((prev) => ({
                        ...prev,
                        [course.id]: courseData.completedLessons || {},
                      }));
                      setProgress((prev) => ({
                        ...prev,
                        [course.id]: courseData.progress || 0,
                      }));
                    }
                  },
                  (error) => {
                    console.error('Error in snapshot listener:', error);
                    setError(error.message);
                  },
                );
              }
            });
          }
        } catch (error) {
          console.error('Ошибка при загрузке курсов:', error);
          setError(error.message);
        }
      }
    };

    fetchUserData();

    // Очистка подписок при размонтировании
    return () => {
      Object.values(subscriptionsRef.current).forEach((unsubscribe) => unsubscribe());
      subscriptionsRef.current = {};
    };
  }, [user, authLoading, navigate, setCompletedLessons, setProgress]);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error('Ошибка при выходе:', error);
    }
  };

  const toggleLessonCompletion = async (courseId, moduleId, lessonIndex) => {
    if (!user || !user.uid) return;

    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const currentCompletedLessons = completedLessons[courseId] || {};
        const currentModuleLessons = currentCompletedLessons[moduleId] || [];
        const newLessons = currentModuleLessons.includes(lessonIndex)
          ? currentModuleLessons.filter((index) => index !== lessonIndex)
          : [...currentModuleLessons, lessonIndex];

        const updatedCompletedLessons = {
          ...currentCompletedLessons,
          [moduleId]: newLessons,
        };

        const totalLessons = courses
          .find((course) => course.id === courseId)
          ?.modules.reduce((sum, module) => sum + module.links.length, 0);
        const completedLessonsCount = Object.values(updatedCompletedLessons).reduce(
          (sum, indices) => sum + (Array.isArray(indices) ? indices.length : 0),
          0,
        );
        const newProgress = totalLessons > 0 ? (completedLessonsCount / totalLessons) * 100 : 0;

        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          [`purchasedCourses.${courseId}.completedLessons`]: updatedCompletedLessons,
          [`purchasedCourses.${courseId}.progress`]: Math.round(newProgress),
        });

        setCompletedLessons((prev) => ({
          ...prev,
          [courseId]: updatedCompletedLessons,
        }));
        setProgress((prev) => ({
          ...prev,
          [courseId]: newProgress,
        }));
      }
    } catch (error) {
      console.error('Ошибка при обновлении прогресса:', error);
    }
  };

  const handleLessonClick = (courseId, videoUrl) => {
    console.log(`Selected video for course ${courseId}: ${videoUrl}`);
  };

  if (authLoading) {
    return <AccountLoadingIndicator />;
  }

  return (
    <div className='personal-account'>
      <AccountUserProfileInfo
        userName={userName}
        userRole={userRole}
        registrationDate={registrationDate}
        error={error}
      />
      <h3>Доступные курсы:</h3>
      <AccountCoursesBlock courses={courses} />
      {courses
        .filter((course) => course.available)
        .map((course) => (
          <div key={course.id} className='course-lessons-container'>
            <h4>{course.title}</h4> {/* Отображаем title как заголовок */}
            <AccountCourseLessons
              courseId={course.id}
              courses={courses}
              progress={progress} // Передаем прогресс для курса
              courseTitle={course.title} // Передаем title курса
              modules={course.modules}
              completedLessons={completedLessons[course.id] || {}}
              completedLessonsCount={course.completedLessonsCount}
              totalLessons={course.totalLessons}
              totalDuration={course.totalDuration}
              toggleLessonCompletion={(moduleId, lessonIndex) =>
                toggleLessonCompletion(course.id, moduleId, lessonIndex)
              }
              handleLessonClick={(videoUrl) => handleLessonClick(course.id, videoUrl)}
              getCompletedCount={(moduleId, links) => {
                const courseCompletedLessons = completedLessons[course.id] || {};
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
                  ? `${Math.floor(totalMinutes / 60)} h ${totalMinutes % 60} m`
                  : `${totalMinutes} m`;
              }}
            />
          </div>
        ))}
      <br />
      <button onClick={handleLogout} className='logout-button'>
        Выйти
      </button>
    </div>
  );
}
