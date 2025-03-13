import { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { auth, db } from '../../firebase';
import { doc, getDoc, collection, getDocs, updateDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AccountCoursesBlock from '../../components/AccountCoursesBlock/AccountCoursesBlock';
import AccountUserProfileInfo from '../../components/AccountUserProfileInfo/AccountUserProfileInfo';
import AccountLoadingIndicator from '../../components/AccountLoadingIndicator/AccountLoadingIndicator';
import AccountCourseLessons from '../../components/AccountCourseLessons/AccountCourseLessons';
import scss from './PersonalAccount.module.scss';
import HeaderPersonalAccount from '../../components/HeaderPersonalAccount/HeaderPersonalAccount';
import AccountInfoForCompany from '../../components/AccountInfoForCompany/AccountInfoForCompany';
import AccountCompanyAndQuestions from '../../components/AccountCompanyAndQuestions/AccountCompanyAndQuestions';

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
    lastCourseId,
  } = useAuth();
  const [userName, setUserName] = useState('');
  const [registrationDate, setRegistrationDate] = useState('');
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user || !user.uid) {
        if (!authLoading) {
          toast.error('Please log in.');
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
                    ? `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`
                    : `${totalMinutes}m`;

                return {
                  id: doc.id,
                  title:
                    courseData.title ||
                    doc.id.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
                  category: courseData.category || 'Uncategorized', // Add the category field here
                  gitHubRepLink: courseData.gitHubRepLink, // Add the category field here
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

            // Вызываем updateCourseData для последнего выбранного курса
            if (lastCourseId && courseList.some((course) => course.id === lastCourseId)) {
              updateCourseData(lastCourseId);
            } else if (courseList.length > 0) {
              updateCourseData(courseList[0].id);
            }
          }
        } catch (error) {
          console.error('Error loading courses:', error);
          setError(error.message);
        }
      }
    };

    fetchUserData();
  }, [user, authLoading, navigate, updateCourseData, lastCourseId]);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error exiting:', error);
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

  const activeCourse = courses.find((course) => course.id === lastCourseId && course.available);
  return (
    <div className={scss.personalAccountBackground}>
      <div className={scss.container}>
        <HeaderPersonalAccount userName={userName} handleLogout={handleLogout} />

        <div className='personal-account'>
          <AccountUserProfileInfo
            userName={userName}
            userRole={userRole}
            registrationDate={registrationDate}
            error={error}
          />

          <div className={scss.mainHalfToHalfBlock}>
            {activeCourse && (
              <div key={activeCourse.id} className={scss.courseLessonsContainer}>
                <AccountCourseLessons
                  courseId={activeCourse.id}
                  courses={courses}
                  progress={progress}
                  courseTitle={activeCourse.title}
                  modules={activeCourse.modules}
                  completedLessons={completedLessons[activeCourse.id] || {}}
                  completedLessonsCount={activeCourse.completedLessonsCount}
                  totalLessons={activeCourse.totalLessons}
                  totalDuration={activeCourse.totalDuration}
                  toggleLessonCompletion={(moduleId, lessonIndex) =>
                    toggleLessonCompletion(activeCourse.id, moduleId, lessonIndex)
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
                      ? `${Math.floor(totalMinutes / 60)} h ${totalMinutes % 60} m`
                      : `${totalMinutes} m`;
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
