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
  const [isManualSelection, setIsManualSelection] = useState(false); // Флаг для ручного выбора урока
  const [activeTab, setActiveTab] = useState('Overview');

  // Функция для поиска следующего непросмотренного урока
  const findNextUncompletedLesson = useCallback((course, courseCompletedLessons, lastModuleId) => {
    let nextLessonUrl = '';
    let nextModuleIndex = null;
    let allCompleted = true;

    if (lastModuleId) {
      const lastModuleIndex = course.modules.findIndex((m) => m.id === lastModuleId);
      if (lastModuleIndex !== -1) {
        const module = course.modules[lastModuleIndex];
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

    if (!nextLessonUrl) {
      for (let i = course.modules.length - 1; i >= 0; i--) {
        const module = course.modules[i];
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
      const lastModule = course.modules[course.modules.length - 1];
      nextLessonUrl = lastModule.links[lastModule.links.length - 1].videoUrl;
      nextModuleIndex = course.modules.length - 1;
    }

    if (!nextLessonUrl && course.modules.length > 0) {
      nextLessonUrl = course.modules[0]?.links[0]?.videoUrl || '';
      nextModuleIndex = 0;
    }

    return { nextLessonUrl, nextModuleIndex };
  }, []);

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
      setIsManualSelection(false); // Сбрасываем флаг при загрузке нового курса
      setLoading(false);
    };

    loadData();
  }, [user, userRole, authLoading, courseId, courses, navigate]);

  // Отслеживание изменений completedLessons и lastModules для обновления videoUrl
  useEffect(() => {
    if (loading || isManualSelection) return; // Пропускаем, если данные еще загружаются или пользователь вручную выбрал урок

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

  const handleLessonClick = useCallback((videoUrl) => {
    console.log('Lesson clicked, setting videoUrl:', videoUrl);
    setVideoUrl(videoUrl);
    setIsManualSelection(true); // Устанавливаем флаг ручного выбора
  }, []);

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
            <PlayListVideoSection videoUrl={videoUrl} />
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
