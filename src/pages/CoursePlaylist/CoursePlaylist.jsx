import React, { useState, useEffect } from 'react';
import { db } from '../../firebase.js';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useParams } from 'react-router-dom';
import './CoursePlaylist.css';
import { useAuth } from '../../context/AuthContext';

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

  useEffect(() => {
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

        // Проверяем, куплен ли курс
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const purchasedCourses = userDoc.data().purchasedCourses || [];
          if (!purchasedCourses.includes(courseId)) {
            alert('У вас нет доступа к этому курсу. Приобретите его.');
            setLoading(false);
            return;
          }
          setHasAccess(true);
        }

        // Обновляем данные курса только если courseId изменился
        if (courseId) {
          await updateCourseData(courseId);
        }

        const courseDoc = await getDoc(doc(db, 'courses', courseId));
        if (courseDoc.exists()) {
          const courseData = courseDoc.data();
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

          const nextLesson = findNextLesson(modulesArray, completedLessons);
          if (nextLesson) {
            setVideoUrl(nextLesson.videoUrl);
            setExpandedModule(
              modulesArray.findIndex((module) => module.id === nextLesson.moduleId),
            );
          } else if (modulesArray.length > 0 && modulesArray[0].links.length > 0) {
            setVideoUrl(modulesArray[0].links[0].videoUrl);
            setExpandedModule(0);
          }
        } else {
          setModules([]);
          setVideoUrl('');
        }
      } catch (error) {
        console.error('Ошибка при загрузке данных курса:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, userRole, authLoading, courseId]); // Убрали updateCourseData из зависимостей

  const findNextLesson = (modules, completedLessons) => {
    for (let i = 0; i < modules.length; i++) {
      const module = modules[i];
      const completed = completedLessons[module.id] || [];
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
      const currentModuleLessons = completedLessons[moduleId] || [];
      const newLessons = currentModuleLessons.includes(lessonIndex)
        ? currentModuleLessons.filter((index) => index !== lessonIndex)
        : [...currentModuleLessons, lessonIndex];

      const updatedCompletedLessons = {
        ...completedLessons,
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
        [`courses.${courseId}.completedLessons`]: updatedCompletedLessons,
        [`courses.${courseId}.progress`]: Math.round(newProgress),
      });

      setCompletedLessons(updatedCompletedLessons);
      setProgress(Math.round(newProgress));
    } catch (error) {
      console.error('Ошибка при обновлении прогресса:', error);
    }
  };

  const getCompletedCount = (moduleId, links) => {
    const completed = completedLessons[moduleId] || [];
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
      return `${hours} ч ${minutes} мин`;
    }
    return `${totalMinutes} мин`;
  };

  if (authLoading || loading) {
    return <div className='loading'>Загрузка...</div>;
  }

  if (!hasAccess) {
    return <div>Доступ закрыт</div>;
  }

  return (
    <div className='playlist-container'>
      <div className='progress-bar'>
        <p>
          Общий прогресс ({courseId}): {progress}%
        </p>
        <div className='progress'>
          <div className='progress-fill' style={{ width: `${progress}%` }} />
        </div>
      </div>
      <div className='video-section'>
        {videoUrl ? (
          <iframe
            src={videoUrl}
            title='Course Video'
            width='100%'
            height='500px'
            frameBorder='0'
            allowFullScreen
          />
        ) : (
          <p>Выберите урок для просмотра</p>
        )}
      </div>
      <div className='modules-section'>
        {modules.map((module, index) => {
          const { completed, total } = getCompletedCount(module.id, module.links);
          const totalDuration = getTotalDuration(module.links);

          return (
            <div key={module.id} className='module'>
              <h3 onClick={() => toggleModule(index)} className='module-title'>
                {module.moduleTitle}
                <span className='completion-count'>
                  {' '}
                  {completed}/{total} | {totalDuration}
                </span>
                {expandedModule === index ? ' ▼' : ' ►'}
              </h3>
              {expandedModule === index && (
                <ul className='lessons-list'>
                  {module.links.map((lesson, lessonIndex) => {
                    const isCompleted = (completedLessons[module.id] || []).includes(lessonIndex);
                    return (
                      <li
                        key={lessonIndex}
                        onClick={() => handleLessonClick(lesson.videoUrl)}
                        className={`lesson ${isCompleted ? 'completed' : ''}`}>
                        <input
                          type='checkbox'
                          checked={isCompleted}
                          onChange={() => toggleLessonCompletion(module.id, lessonIndex)}
                        />
                        {lesson.title}
                        {lesson.videoTime && (
                          <span className='lesson-time'>{lesson.videoTime} мин</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
