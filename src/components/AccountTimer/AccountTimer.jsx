import { useState, useEffect, useCallback } from 'react';
import scss from './AccountTimer.module.scss';
import { BsCalendar3WeekFill } from 'react-icons/bs';
import clsx from 'clsx';

export default function AccountTimer({ courseId, modules }) {
  const [timeLeft, setTimeLeft] = useState(null);
  const [currentModule, setCurrentModule] = useState(null);

  const findNextModule = useCallback(() => {
    const now = new Date();

    const futureModules = modules
      .filter((module) => {
        if (!module.unlockDate) {
          console.warn(`Module ${module.id} has no unlockDate`);
          return false;
        }
        const unlockDate = new Date(module.unlockDate);
        if (isNaN(unlockDate.getTime())) {
          console.warn(`Invalid unlockDate in module ${module.id}: ${module.unlockDate}`);
          return false;
        }
        const isFuture = unlockDate > now;

        return isFuture;
      })
      .sort((a, b) => new Date(a.unlockDate) - new Date(b.unlockDate));

    const nextModule = futureModules.length > 0 ? futureModules[0] : null;

    return nextModule;
  }, [modules]);

  useEffect(() => {
    let interval;

    const updateTimer = () => {
      const now = new Date();
      let nextModule = currentModule;

      if (!nextModule) {
        nextModule = findNextModule();

        setCurrentModule(nextModule);
      } else {
        const unlockDate = new Date(nextModule.unlockDate);
        if (isNaN(unlockDate.getTime())) {
          console.warn(
            `Invalid unlockDate in currentModule ${nextModule.id}: ${nextModule.unlockDate}`,
          );
          nextModule = findNextModule();
          setCurrentModule(nextModule);
        } else if (unlockDate <= now) {
          nextModule = findNextModule();
          setCurrentModule(nextModule);
        }
      }

      if (!nextModule) {
        setTimeLeft(null);
        return;
      }

      const unlockDate = new Date(nextModule.unlockDate);
      const difference = unlockDate - now;

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    updateTimer();
    interval = setInterval(updateTimer, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [courseId, modules, findNextModule]); // Зависимости включают courseId и modules

  if (!currentModule || !timeLeft) {
    return null;
  }

  // Определяем, какая часть должна быть синей
  const getBlueClass = () => {
    if (timeLeft.days > 0) return 'days';
    if (timeLeft.hours > 0) return 'hours';
    if (timeLeft.minutes > 0) return 'minutes';
    return 'seconds';
  };

  const bluePart = getBlueClass();

  const addToGoogleCalendarLink = () => {
    if (!timeLeft || !currentModule) return;

    const unlockDate = new Date(currentModule.unlockDate);
    const endDate = new Date(unlockDate.getTime() + 60 * 60 * 1000);
    const formatDate = (date) => date.toISOString().replace(/-|:|\.\d\d\d/g, '');
    const url = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      `Lesson: ${currentModule.moduleTitle}`,
    )}&dates=${formatDate(unlockDate)}/${formatDate(endDate)}&details=${encodeURIComponent(
      'Student Meet',
    )}`;

    window.open(url, '_blank');
  };

  return (
    <div className={scss.timerContainer}>
      <div className={scss.timerContainerBlock}>
        <h4 className={scss.timerTitle}>Time left until the lesson opens:</h4>
        <div className={scss.timer}>
          <div className={scss.timeBlock}>
            <span className={clsx(scss.timeValue, bluePart === 'days' && scss.timeValueBlue)}>
              {timeLeft.days}
            </span>
            <span className={clsx(scss.timeLabel, bluePart === 'days' && scss.timeValueBlue)}>
              d
            </span>
            <span className={scss.timeSimvol}>:</span>
          </div>
          <div className={scss.timeBlock}>
            <span className={clsx(scss.timeValue, bluePart === 'hours' && scss.timeValueBlue)}>
              {timeLeft.hours < 10 ? `0${timeLeft.hours}` : timeLeft.hours}
            </span>
            <span className={clsx(scss.timeLabel, bluePart === 'hours' && scss.timeValueBlue)}>
              h
            </span>
            <span className={scss.timeSimvol}>:</span>
          </div>
          <div className={scss.timeBlock}>
            <span className={clsx(scss.timeValue, bluePart === 'minutes' && scss.timeValueBlue)}>
              {timeLeft.minutes < 10 ? `0${timeLeft.minutes}` : timeLeft.minutes}
            </span>
            <span className={clsx(scss.timeLabel, bluePart === 'minutes' && scss.timeValueBlue)}>
              m
            </span>
            <span className={scss.timeSimvol}>:</span>
          </div>
          <div className={scss.timeBlock}>
            <span className={clsx(scss.timeValue, bluePart === 'seconds' && scss.timeValueBlue)}>
              {timeLeft.seconds < 10 ? `0${timeLeft.seconds}` : timeLeft.seconds}
            </span>
            <span className={clsx(scss.timeLabel, bluePart === 'seconds' && scss.timeValueBlue)}>
              s
            </span>
          </div>
        </div>
        <p className={scss.moduleInfo}>
          Next module: <span>{currentModule.moduleTitle}</span>
        </p>
      </div>
      <div className={scss.moduleInfoAboutMeetAndCalendar}>
        <div className={scss.moduleInfoAboutMeet}>
          <h3 className={scss.moduleInfoAboutMeetTitle}>STUDENT MEET</h3>
          <p className={scss.moduleInfoAboutMeetDescription}>
            Where?{' '}
            <a href='#' target='_blank'>
              Here!
            </a>
          </p>
        </div>
        <BsCalendar3WeekFill
          className={scss.moduleInfoAboutMeetCalendar}
          onClick={addToGoogleCalendarLink}
        />
      </div>
    </div>
  );
}
