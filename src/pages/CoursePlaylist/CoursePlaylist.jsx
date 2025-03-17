import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import scss from './CoursePlaylist.module.scss';
import clsx from 'clsx'; // Импорт clsx
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
    progress,
    courses,
    toggleLessonCompletion,
    updateCourseData,
  } = useAuth();
  const navigate = useNavigate();
  const [videoUrl, setVideoUrl] = useState('');
  const [expandedModule, setExpandedModule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Overview');

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
      let nextLessonUrl = '';
      let nextModuleIndex = null;
      let allCompleted = true;

      for (let i = 0; i < course.modules.length; i++) {
        const module = course.modules[i];
        const moduleCompletedLessons = courseCompletedLessons[module.id] || [];

        for (let j = 0; j < module.links.length; j++) {
          if (!moduleCompletedLessons.includes(j)) {
            nextLessonUrl = module.links[j].videoUrl;
            nextModuleIndex = i;
            allCompleted = false;
            break;
          }
        }
        if (nextLessonUrl) break;
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

      setVideoUrl(nextLessonUrl);
      setExpandedModule(nextModuleIndex);
      setLoading(false);
    };

    loadData();
  }, [user, userRole, authLoading, courseId, courses, navigate]);

  const handleLessonClick = (videoUrl) => {
    setVideoUrl(videoUrl);
  };

  const toggleModule = (moduleIndex) => {
    setExpandedModule(expandedModule === moduleIndex ? null : moduleIndex);
  };

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
            {/* Меню для переключения */}
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
              {/* Компонент в зависимости от выбранного пункта */}
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
