import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import scss from './CoursePlaylist.module.scss';
import clsx from 'clsx';
import PlayListLoadingIndicator from '../../components/PlayListLoadingIndicator/PlayListLoadingIndicator.jsx';
import PlayListVideoSection from '../../components/PlayListVideoSection/PlayListVideoSection.jsx';
import PlayListModuleBlock from '../../components/PlayListModuleBlock/PlayListModuleBlock.jsx';
import VideoSectionMenuOverview from '../../components/VideoSectionMenuOverview/VideoSectionMenuOverview.jsx';

const FAQ = () => (
  <div>
    <h2>FAQ</h2>
    <p>1. Q: How long is the course? A: 48h 30min.</p>
    <p>2. Q: Do I need prior experience? A: Basic C# knowledge is required.</p>
  </div>
);

const Reviews = () => (
  <div>
    <h2>Reviews</h2>
    <p>Review 1: Great course for beginners!</p>
    <p>Review 2: Very informative.</p>
  </div>
);

export default function CoursePlaylist() {
  const { courseId } = useParams();
  const {
    user,
    userRole,
    isLoading: authLoading,
    completedLessons,
    lastModules,
    progress,
    courses,
    toggleLessonCompletion,
    updateCourseData,
  } = useAuth();
  const navigate = useNavigate();
  const [videoUrl, setVideoUrl] = useState('');
  const [expandedModule, setExpandedModule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isManualSelection, setIsManualSelection] = useState(false);
  const [activeTab, setActiveTab] = useState('Overview');
  const [lockMessage, setLockMessage] = useState(''); // Сообщение о блокировке

  // Функция для проверки, заблокирован ли модуль
  const isModuleLocked = useCallback((module) => {
    if (!module.unlockDate) return false;
    const unlockDate = new Date(module.unlockDate);
    const now = new Date();
    return now < unlockDate;
  }, []);

  // Форматирование даты для сообщения
  const formatUnlockDate = useCallback((unlockDate) => {
    if (!unlockDate) return '';
    const date = new Date(unlockDate);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  // Функция для поиска следующего непросмотренного урока с учетом блокировки
  const findNextUncompletedLesson = useCallback(
    (course, courseCompletedLessons, lastModuleId) => {
      let nextLessonUrl = '';
      let nextModuleIndex = null;
      let allCompleted = true;

      if (lastModuleId) {
        const lastModuleIndex = course.modules.findIndex((m) => m.id === lastModuleId);
        if (lastModuleIndex !== -1) {
          const module = course.modules[lastModuleIndex];
          if (!isModuleLocked(module)) {
            // Проверяем, не заблокирован ли модуль
            const moduleCompletedLessons = courseCompletedLessons[module.id] || [];

            for (let j = 0; j < module.links.length; j++) {
              if (!moduleCompletedLessons.includes(j)) {
                nextLessonUrl = module.links[j].videoUrl;
                nextModuleIndex = lastModuleIndex;
                allCompleted = false;
                break;
              }
            }

            if (!nextLessonUrl) {
              for (let i = lastModuleIndex + 1; i < course.modules.length; i++) {
                const nextModule = course.modules[i];
                if (isModuleLocked(nextModule)) continue; // Пропускаем заблокированные модули
                const nextModuleCompletedLessons = courseCompletedLessons[nextModule.id] || [];

                for (let j = 0; j < nextModule.links.length; j++) {
                  if (!nextModuleCompletedLessons.includes(j)) {
                    nextLessonUrl = nextModule.links[j].videoUrl;
                    nextModuleIndex = i;
                    allCompleted = false;
                    break;
                  }
                }
                if (nextLessonUrl) break;
              }
            }
          }
        }
      }

      if (!nextLessonUrl) {
        for (let i = course.modules.length - 1; i >= 0; i--) {
          const module = course.modules[i];
          if (isModuleLocked(module)) continue; // Пропускаем заблокированные модули
          const moduleCompletedLessons = courseCompletedLessons[module.id] || [];

          for (let j = module.links.length - 1; j >= 0; j--) {
            if (!moduleCompletedLessons.includes(j)) {
              nextLessonUrl = module.links[j].videoUrl;
              nextModuleIndex = i;
              allCompleted = false;
              break;
            }
          }
          if (nextLessonUrl) break;
        }
      }

      if (allCompleted && course.modules.length > 0) {
        for (let i = course.modules.length - 1; i >= 0; i--) {
          const module = course.modules[i];
          if (isModuleLocked(module)) continue; // Пропускаем заблокированные модули
          nextLessonUrl = module.links[module.links.length - 1].videoUrl;
          nextModuleIndex = i;
          break;
        }
      }

      if (!nextLessonUrl && course.modules.length > 0) {
        for (let i = 0; i < course.modules.length; i++) {
          const module = course.modules[i];
          if (isModuleLocked(module)) continue; // Пропускаем заблокированные модули
          nextLessonUrl = module.links[0]?.videoUrl || '';
          nextModuleIndex = i;
          break;
        }
      }

      // Если урок не найден из-за блокировки, устанавливаем сообщение
      if (!nextLessonUrl) {
        const firstLockedModule = course.modules.find((module) => isModuleLocked(module));
        if (firstLockedModule) {
          setLockMessage(`${formatUnlockDate(firstLockedModule.unlockDate)}`);
        }
      } else {
        setLockMessage('');
      }

      return { nextLessonUrl, nextModuleIndex };
    },
    [isModuleLocked, formatUnlockDate],
  );

  // Начальная загрузка данных
  useEffect(() => {
    const loadData = async () => {
      if (!user) {
        if (!authLoading) {
          toast.error('Please log in.');
          navigate('/login');
        }
        return;
      }

      if (userRole !== 'student') {
        toast.error("You don't have any courses yet!");
        navigate('/account');
        return;
      }

      const course = courses.find((c) => c.id === courseId);
      if (!course || course.access === 'denied') {
        toast.error('You don`t have access to this course. Purchase it.');
        navigate('/account');
        return;
      }

      await updateCourseData(courseId);

      const courseCompletedLessons = completedLessons[courseId] || {};
      const lastModuleId = lastModules[courseId] || null;

      const { nextLessonUrl, nextModuleIndex } = findNextUncompletedLesson(
        course,
        courseCompletedLessons,
        lastModuleId,
      );

      setVideoUrl(nextLessonUrl);
      setExpandedModule((prev) => (prev === null ? nextModuleIndex : prev));
      setIsManualSelection(false);
      setLoading(false);
    };

    loadData();
  }, [user, userRole, authLoading, courseId, courses, navigate, findNextUncompletedLesson]);

  // Отслеживание изменений completedLessons и lastModules для обновления videoUrl
  useEffect(() => {
    if (loading || isManualSelection) return;

    const course = courses.find((c) => c.id === courseId);
    if (!course) return;

    const courseCompletedLessons = completedLessons[courseId] || {};
    const lastModuleId = lastModules[courseId] || null;

    const { nextLessonUrl, nextModuleIndex } = findNextUncompletedLesson(
      course,
      courseCompletedLessons,
      lastModuleId,
    );

    setVideoUrl(nextLessonUrl);
    setExpandedModule((prev) => (prev === null ? nextModuleIndex : prev));
  }, [
    completedLessons,
    lastModules,
    courseId,
    courses,
    loading,
    isManualSelection,
    findNextUncompletedLesson,
  ]);

  const handleLessonClick = useCallback(
    (videoUrl) => {
      const course = courses.find((c) => c.id === courseId);
      if (!course) return;

      // Находим модуль, содержащий урок
      let lessonModule = null;
      for (const module of course.modules) {
        if (module.links.some((lesson) => lesson.videoUrl === videoUrl)) {
          lessonModule = module;
          break;
        }
      }

      if (lessonModule && isModuleLocked(lessonModule)) {
        setLockMessage(`${formatUnlockDate(lessonModule.unlockDate)}`);
        setVideoUrl(''); // Сбрасываем videoUrl, чтобы видео не воспроизводилось
        return;
      }

      console.log('Lesson clicked, setting videoUrl:', videoUrl);
      setVideoUrl(videoUrl);
      setLockMessage(''); // Сбрасываем сообщение о блокировке
      setIsManualSelection(true);
    },
    [courseId, courses, isModuleLocked, formatUnlockDate],
  );

  const toggleModule = useCallback(
    (moduleIndex) => {
      console.log('Toggling module:', moduleIndex, 'Current expandedModule:', expandedModule);
      setExpandedModule((prev) => {
        const newValue = prev === moduleIndex ? null : moduleIndex;
        console.log('New expandedModule:', newValue);
        return newValue;
      });
    },
    [expandedModule],
  );

  if (authLoading || loading) {
    return <PlayListLoadingIndicator />;
  }

  const course = courses.find((c) => c.id === courseId);
  if (!course || course.access === 'denied') {
    return <div>Access denied</div>;
  }

  const completedLessonsCount = Object.values(completedLessons[courseId] || {}).reduce(
    (sum, indices) => sum + (Array.isArray(indices) ? indices.length : 0),
    0,
  );

  return (
    <div className={scss.personalAccountBackground}>
      <div className={scss.container}>
        <div className={scss.playlistContainer}>
          <div className={scss.videoSection}>
            <PlayListVideoSection videoUrl={videoUrl} lockMessage={lockMessage} />
            <div className={scss.videoSectionMenu}>
              <button
                className={clsx(scss.tabButton, activeTab === 'Overview' && scss.active)}
                onClick={() => setActiveTab('Overview')}>
                Overview
              </button>
              <button
                className={clsx(scss.tabButton, activeTab === 'FAQ' && scss.active)}
                onClick={() => setActiveTab('FAQ')}>
                FAQ
              </button>
              <button
                className={clsx(scss.tabButton, activeTab === 'Reviews' && scss.active)}
                onClick={() => setActiveTab('Reviews')}>
                Reviews
              </button>
            </div>
            <div className={scss.videoSectionMenuResults}>
              {activeTab === 'Overview' && (
                <VideoSectionMenuOverview
                  courseTitle={course.title}
                  totalLessons={course.totalLessons}
                  description={course.description}
                  courseGitHubRepLink={course.gitHubRepLink}
                  totalDuration={course.totalDuration}
                />
              )}
              {activeTab === 'FAQ' && <FAQ />}
              {activeTab === 'Reviews' && <Reviews />}
            </div>
          </div>
          <div className={scss.modulesSection}>
            <PlayListModuleBlock
              courseTitle={course.title}
              courseId={courseId}
              modules={course.modules}
              completedLessonsCount={completedLessonsCount}
              totalLessons={course.totalLessons}
              expandedModule={expandedModule}
              toggleModule={toggleModule}
              handleLessonClick={handleLessonClick}
              completedLessons={completedLessons[courseId] || {}}
              toggleLessonCompletion={(moduleId, lessonIndex) =>
                toggleLessonCompletion(courseId, moduleId, lessonIndex, course.totalLessons)
              }
              getCompletedCount={(moduleId, links) => {
                const courseCompletedLessons = completedLessons[courseId] || {};
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
              totalDuration={course.totalDuration}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
