import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../firebase.js';
import { doc, getDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { useParams } from 'react-router-dom';
import './CoursePlaylist.css';
import { useAuth } from '../../context/AuthContext';
import PlayListLoadingIndicator from '../../components/PlayListLoadingIndicator/PlayListLoadingIndicator.jsx';
import PlayListProgressBar from '../../components/PlayListProgressBar/PlayListProgressBar.jsx';
import PlayListVideoSection from '../../components/PlayListVideoSection/PlayListVideoSection.jsx';
import PlayListModuleBlock from '../../components/PlayListModuleBlock/PlayListModuleBlock.jsx';

export default function CoursePlaylist() {
  const { courseId } = useParams();
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
  const [videoUrl, setVideoUrl] = useState('');
  const [modules, setModules] = useState([]);
  const [expandedModule, setExpandedModule] = useState(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [courseTitle, setCourseTitle] = useState('');
  const [totalLessons, setTotalLessons] = useState(0);
  const [completedLessonsCount, setCompletedLessonsCount] = useState(0);
  const [totalDuration, setTotalDuration] = useState('0 мин');
  const subscriptionsRef = useRef();

  useEffect(() => {
    let unsubscribe;

    const loadData = async () => {
      if (!user || !user.uid) {
        if (!authLoading) {
          alert('Пожалуйста, войдите в систему.');
          setLoading(false);
        }
        return;
      }

      try {
        if (userRole !== 'student') {
          alert('Доступ закрыт. Приобретите курс, чтобы получить доступ.');
          setLoading(false);
          return;
        }

        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const purchasedCourses = userDoc.data().purchasedCourses || {};
          const courseAccess = purchasedCourses[courseId]?.access || 'denied';
          if (courseAccess === 'denied') {
            alert('У вас нет доступа к этому курсу. Приобретите его.');
            setLoading(false);
            return;
          }
          setHasAccess(true);
        }

        updateCourseData(courseId);

        const courseDoc = await getDoc(doc(db, 'courses', courseId));
        if (courseDoc.exists()) {
          const courseData = courseDoc.data();
          setCourseTitle(
            courseData.title ||
              courseId.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
          );
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
          setModules(modulesArray);

          const total = modulesArray.reduce((sum, module) => sum + module.links.length, 0);
          setTotalLessons(total);

          const courseCompletedLessons = completedLessons[courseId] || {};
          const completedCount = Object.values(courseCompletedLessons).reduce(
            (sum, indices) => sum + (Array.isArray(indices) ? indices.length : 0),
            0,
          );
          setCompletedLessonsCount(completedCount);

          const allLessons = modulesArray.flatMap((module) => module.links);
          const totalMinutes = allLessons.reduce((sum, lesson) => {
            const time = parseInt(lesson.videoTime, 10) || 0;
            return sum + (isNaN(time) ? 0 : time);
          }, 0);
          if (totalMinutes >= 60) {
            const hours = Math.floor(totalMinutes / 60);
            const minutes = totalMinutes % 60;
            setTotalDuration(`${hours}h ${minutes}m`);
          } else {
            setTotalDuration(`${totalMinutes}m`);
          }

          const nextLesson = findNextLesson(modulesArray, courseCompletedLessons);
          if (nextLesson) {
            setVideoUrl(nextLesson.videoUrl);
            setExpandedModule(
              modulesArray.findIndex((module) => module.id === nextLesson.moduleId),
            );
          } else if (modulesArray.length > 0 && modulesArray[0].links.length > 0) {
            setVideoUrl(modulesArray[0].links[0].videoUrl);
            setExpandedModule(0);
          }

          // Настраиваем подписку на обновления
          const userDocRef = doc(db, 'users', user.uid);
          unsubscribe = onSnapshot(
            userDocRef,
            (docSnap) => {
              if (docSnap.exists()) {
                const purchasedCourses = docSnap.data().purchasedCourses || {};
                const courseData = purchasedCourses[courseId] || {
                  completedLessons: {},
                  progress: 0,
                };
                setCompletedLessons((prev) => ({
                  ...prev,
                  [courseId]: courseData.completedLessons || {},
                }));
                setProgress((prev) => ({
                  ...prev,
                  [courseId]: courseData.progress || 0,
                }));
              }
            },
            (error) => {
              console.error('Error in snapshot listener:', error);
            },
          );
          subscriptionsRef.current = unsubscribe;
        } else {
          setModules([]);
          setVideoUrl('');
          setCourseTitle('');
          setTotalLessons(0);
          setCompletedLessonsCount(0);
          setTotalDuration('0 m');
        }
      } catch (error) {
        console.error('Ошибка при загрузке данных курса:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Очистка подписки при размонтировании
    return () => {
      if (subscriptionsRef.current) {
        subscriptionsRef.current();
        subscriptionsRef.current = null;
      }
    };
  }, [user, userRole, authLoading, courseId, updateCourseData, setCompletedLessons, setProgress]);

  const findNextLesson = (modules, courseCompletedLessons) => {
    for (let i = 0; i < modules.length; i++) {
      const module = modules[i];
      const completed = courseCompletedLessons[module.id] || [];
      const maxCompletedIndex = Math.max(...completed, -1);

      if (maxCompletedIndex < module.links.length - 1) {
        return {
          videoUrl: module.links[maxCompletedIndex + 1].videoUrl,
          moduleId: module.id,
        };
      }
      if (i < modules.length - 1) {
        const nextModule = modules[i + 1];
        return {
          videoUrl: nextModule.links[0].videoUrl,
          moduleId: nextModule.id,
        };
      }
    }
    return null;
  };

  const handleLessonClick = (videoUrl) => {
    setVideoUrl(videoUrl);
  };

  const toggleModule = (moduleIndex) => {
    setExpandedModule(expandedModule === moduleIndex ? null : moduleIndex);
  };

  const toggleLessonCompletion = async (moduleId, lessonIndex) => {
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

        const totalLessons = modules.reduce((sum, module) => sum + module.links.length, 0);
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
        setCompletedLessonsCount(completedLessonsCount);
      }
    } catch (error) {
      console.error('Ошибка при обновлении прогресса:', error);
    }
  };

  const getCompletedCount = (moduleId, links) => {
    const courseCompletedLessons = completedLessons[courseId] || {};
    const completed = courseCompletedLessons[moduleId] || [];
    return {
      completed: completed.length,
      total: links.length,
    };
  };

  const getTotalDuration = (links) => {
    const totalMinutes = links.reduce((sum, lesson) => {
      const time = parseInt(lesson.videoTime, 10) || 0;
      return sum + (isNaN(time) ? 0 : time);
    }, 0);

    if (totalMinutes >= 60) {
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      return `${hours} h ${minutes} m`;
    }
    return `${totalMinutes} m`;
  };

  if (authLoading || loading) {
    return <PlayListLoadingIndicator />;
  }

  if (!hasAccess) {
    return <div>Доступ закрыт</div>;
  }

  return (
    <div className='playlist-container'>
      <PlayListVideoSection videoUrl={videoUrl} />
      <div className='modules-section'>
        <PlayListModuleBlock
          courseTitle={courseTitle}
          modules={modules}
          completedLessonsCount={completedLessonsCount}
          totalLessons={totalLessons}
          expandedModule={expandedModule}
          toggleModule={toggleModule}
          handleLessonClick={handleLessonClick}
          completedLessons={completedLessons[courseId] || {}}
          toggleLessonCompletion={toggleLessonCompletion}
          getCompletedCount={getCompletedCount}
          getTotalDuration={getTotalDuration}
          totalDuration={totalDuration}
        />
      </div>
    </div>
  );
}
