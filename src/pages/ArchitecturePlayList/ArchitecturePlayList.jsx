import React, { useState, useEffect } from 'react';
import { db, auth } from '../../firebase.js'; // Импортируем и auth, и db
import { collection, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import './ArchitecturePlayList.css';

export default function ArchitecturePlayList() {
  const [videoUrl, setVideoUrl] = useState('');
  const [modules, setModules] = useState([]);
  const [expandedModule, setExpandedModule] = useState(null);
  const [completedLessons, setCompletedLessons] = useState({});
  const [hasAccess, setHasAccess] = useState(false); // Состояние для отслеживания доступа
  const [loading, setLoading] = useState(true); // Состояние загрузки
  const [authLoading, setAuthLoading] = useState(true); // Состояние загрузки авторизации

  // Отслеживание состояния авторизации пользователя и загрузка данных
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setAuthLoading(false); // Завершаем загрузку авторизации
      if (!user) {
        alert('Пожалуйста, войдите в систему.');
        setLoading(false);
        return;
      }

      // Проверяем роль и загружаем данные
      const checkUserRoleAndLoadData = async () => {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (!userDoc.exists() || userDoc.data().role !== 'student') {
            alert('Доступ закрыт. Приобретите курс, чтобы получить доступ.');
            setLoading(false);
            return;
          }

          // Если роль "student", загружаем данные пользователя и модулей
          setHasAccess(true);

          // Загружаем completedLessons для пользователя
          const userData = userDoc.data();
          const loadedCompletedLessons = userData.completedLessons || {};
          setCompletedLessons(loadedCompletedLessons);

          // Загружаем данные модулей
          const querySnapshot = await getDocs(collection(db, 'architecture-videos'));
          const modulesData = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            moduleTitle: doc.data().moduleTitle,
            links: doc.data().links || [],
          }));

          const sortedModules = modulesData.sort((a, b) => {
            const getModuleNumber = (title) => {
              const match = title.match(/Модуль (\d+)/);
              return match ? parseInt(match[1], 10) : 0;
            };
            return getModuleNumber(a.moduleTitle) - getModuleNumber(b.moduleTitle);
          });

          setModules(sortedModules);

          // Определяем последний отмеченный урок и устанавливаем следующий
          const nextLesson = findNextLesson(sortedModules, loadedCompletedLessons);
          if (nextLesson) {
            setVideoUrl(nextLesson.videoUrl);
            setExpandedModule(
              sortedModules.findIndex((module) => module.id === nextLesson.moduleId),
            );
          } else if (sortedModules.length > 0 && sortedModules[0].links.length > 0) {
            // Если нет отмеченных уроков, показываем первый урок первого модуля
            setVideoUrl(sortedModules[0].links[0].videoUrl);
            setExpandedModule(0);
          }
        } catch (error) {
          console.error('Ошибка при загрузке данных:', error);
        } finally {
          setLoading(false);
        }
      };

      checkUserRoleAndLoadData();
    });

    // Очистка подписки при размонтировании компонента
    return () => unsubscribe();
  }, [auth, db]);

  // Функция для поиска следующего урока
  const findNextLesson = (modules, completedLessons) => {
    for (let i = 0; i < modules.length; i++) {
      const module = modules[i];
      const completed = completedLessons[module.id] || [];
      const maxCompletedIndex = Math.max(...completed, -1); // Максимальный индекс отмеченного урока (-1, если ничего не отмечено)

      if (maxCompletedIndex < module.links.length - 1) {
        // Если есть следующий урок в текущем модуле
        return {
          videoUrl: module.links[maxCompletedIndex + 1].videoUrl,
          moduleId: module.id,
        };
      }
      // Если текущий модуль завершён, переходим к первому уроку следующего модуля
      if (i < modules.length - 1) {
        const nextModule = modules[i + 1];
        return {
          videoUrl: nextModule.links[0].videoUrl,
          moduleId: nextModule.id,
        };
      }
    }
    return null; // Если все уроки завершены
  };

  const handleLessonClick = (videoUrl) => {
    setVideoUrl(videoUrl);
  };

  const toggleModule = (moduleIndex) => {
    setExpandedModule(expandedModule === moduleIndex ? null : moduleIndex);
  };

  const toggleLessonCompletion = async (moduleId, lessonIndex) => {
    const user = auth.currentUser;
    if (!user) return;

    setCompletedLessons((prev) => {
      const currentModuleLessons = prev[moduleId] || [];
      const newLessons = currentModuleLessons.includes(lessonIndex)
        ? currentModuleLessons.filter((index) => index !== lessonIndex)
        : [...currentModuleLessons, lessonIndex];

      // Обновляем данные в Firestore
      const userRef = doc(db, 'users', user.uid);
      updateDoc(userRef, {
        completedLessons: {
          ...prev,
          [moduleId]: newLessons,
        },
      }).catch((error) => console.error('Ошибка при сохранении отметок:', error));

      return {
        ...prev,
        [moduleId]: newLessons,
      };
    });
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

  // Рендерим компонент только после полной загрузки авторизации и данных
  if (authLoading || loading) {
    return <div>Загрузка...</div>;
  }

  if (!hasAccess) {
    return <div>Доступ закрыт</div>;
  }

  return (
    <div className='playlist-container'>
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
