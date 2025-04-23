import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector, shallowEqual, useDispatch } from 'react-redux';
import { toggleLessonCompletion, updateCourseData } from '../../store/slices/authSlice';
import scss from './CoursePlaylist.module.scss';
import clsx from 'clsx';
import PlayListLoadingIndicator from '../../components/PlayListLoadingIndicator/PlayListLoadingIndicator.jsx';
import PlayListVideoSection from '../../components/PlayListVideoSection/PlayListVideoSection.jsx';
import PlayListModuleBlock from '../../components/PlayListModuleBlock/PlayListModuleBlock.jsx';
import VideoSectionMenuOverview from '../../components/VideoSectionMenuOverview/VideoSectionMenuOverview.jsx';

// Функция для debounce
const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

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
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const {
    user,
    userRole,
    isLoading: authLoading,
    completedLessons,
    lastModules,
    progress,
    courses,
  } = useSelector((state) => state.auth, shallowEqual);

  const [videoUrl, setVideoUrl] = useState('');
  const [expandedModule, setExpandedModule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Overview');
  const [lockMessage, setLockMessage] = useState('');

  // Мемоизация completedLessons[courseId]
  const courseCompletedLessons = useMemo(
    () => completedLessons[courseId] || {},
    [completedLessons, courseId],
  );

  const isModuleLocked = useCallback((module) => {
    if (!module.unlockDate) return false;
    const unlockDate = new Date(module.unlockDate);
    const now = new Date();
    return now < unlockDate;
  }, []);

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

  const findFirstAvailableLesson = useCallback(
    (course, courseCompletedLessons) => {
      let firstLessonUrl = '';
      let firstModuleIndex = null;

      for (let i = 0; i < course.modules.length; i++) {
        const module = course.modules[i];
        if (isModuleLocked(module)) continue;

        if (module.links && module.links.length > 0) {
          firstLessonUrl = module.links[0].videoUrl;
          firstModuleIndex = i;
          break;
        }
      }

      if (!firstLessonUrl) {
        const firstLockedModule = course.modules.find((module) => isModuleLocked(module));
        if (firstLockedModule) {
          setLockMessage(
            `The module will open on ${formatUnlockDate(firstLockedModule.unlockDate)}`,
          );
        }
      } else {
        setLockMessage('');
      }

      return { firstLessonUrl, firstModuleIndex };
    },
    [isModuleLocked, formatUnlockDate],
  );

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

      await dispatch(updateCourseData(courseId)).unwrap();

      const { firstLessonUrl, firstModuleIndex } = findFirstAvailableLesson(
        course,
        courseCompletedLessons,
      );

      setVideoUrl(firstLessonUrl);
      setExpandedModule(firstModuleIndex);
      setLoading(false);
    };

    loadData();
  }, [
    user,
    userRole,
    authLoading,
    courseId,
    courses,
    navigate,
    findFirstAvailableLesson,
    dispatch,
  ]);

  const handleLessonClick = useCallback(
    (videoUrl, moduleIndex) => {
      const course = courses.find((c) => c.id === courseId);
      if (!course) return;

      const lessonModule = course.modules[moduleIndex];
      if (lessonModule && isModuleLocked(lessonModule)) {
        setLockMessage(`The module will open on ${formatUnlockDate(lessonModule.unlockDate)}`);
        setVideoUrl('');
        return;
      }

      setVideoUrl(videoUrl);
      setExpandedModule(moduleIndex);
      setLockMessage('');
    },
    [courseId, courses, isModuleLocked, formatUnlockDate],
  );

  const toggleModule = useCallback(
    debounce((moduleIndex) => {
      setExpandedModule((prev) => {
        const newState = prev === moduleIndex ? null : moduleIndex;

        return newState;
      });
    }, 0),
    [],
  );

  if (authLoading || loading) {
    return <PlayListLoadingIndicator />;
  }

  const course = courses.find((c) => c.id === courseId);
  if (!course || course.access === 'denied') {
    return <div>Access denied</div>;
  }

  const completedLessonsCount = Object.values(courseCompletedLessons).reduce(
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
              completedLessons={courseCompletedLessons}
              toggleLessonCompletion={(moduleId, lessonIndex) =>
                dispatch(
                  toggleLessonCompletion({
                    courseId,
                    moduleId,
                    lessonIndex,
                    totalLessons: course.totalLessons,
                  }),
                )
              }
              getCompletedCount={(moduleId, links) => {
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
