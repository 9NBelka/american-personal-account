// components/AccountTimer/AccountTimer.jsx
import { useState, useEffect, useCallback } from 'react';
import scss from './AccountTimer.module.scss';

export default function AccountTimer({ courseId, modules }) {
  const [timeLeft, setTimeLeft] = useState(null);
  const [currentModule, setCurrentModule] = useState(null);

  // Функция для поиска ближайшего модуля с будущей датой открытия
  const findNextModule = useCallback(() => {
    const now = new Date();
    const futureModules = modules
      .filter((module) => {
        if (!module.unlockDate) return false;
        const unlockDate = new Date(module.unlockDate);
        return unlockDate > now;
      })
      .sort((a, b) => new Date(a.unlockDate) - new Date(b.unlockDate));

    return futureModules.length > 0 ? futureModules[0] : null;
  }, [modules]);

  // Функция для расчёта оставшегося времени
  const calculateTimeLeft = useCallback(() => {
    if (!currentModule) {
      const nextModule = findNextModule();
      setCurrentModule(nextModule);
      if (!nextModule) {
        setTimeLeft(null);
        return;
      }
      return calculateTimeLeft(); // Рекурсивно вызываем для нового модуля
    }

    const now = new Date();
    const unlockDate = new Date(currentModule.unlockDate);
    const difference = unlockDate - now;

    if (difference <= 0) {
      // Если время истекло, ищем следующий модуль
      const nextModule = findNextModule();
      setCurrentModule(nextModule);
      if (!nextModule) {
        setTimeLeft(null);
        return;
      }
      return calculateTimeLeft(); // Рекурсивно вызываем для нового модуля
    }

    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);

    setTimeLeft({ days, hours, minutes, seconds });
  }, [currentModule, findNextModule]);

  // Инициализация таймера и обновление при изменении модулей
  useEffect(() => {
    // Сбрасываем текущий модуль при изменении modules
    setCurrentModule(null);
    setTimeLeft(null);

    calculateTimeLeft();

    const interval = setInterval(() => {
      calculateTimeLeft();
    }, 1000);

    return () => clearInterval(interval);
  }, [modules, calculateTimeLeft]);

  if (!currentModule || !timeLeft) {
    return null; // Если нет модулей с будущей датой открытия, скрываем таймер
  }

  return (
    <div className={scss.timerContainer}>
      <h3 className={scss.timerTitle}>До открытия урока осталось:</h3>
      <div className={scss.timer}>
        <div className={scss.timeBlock}>
          <span className={scss.timeValue}>{timeLeft.days}</span>
          <span className={scss.timeLabel}>дней</span>
        </div>
        <div className={scss.timeBlock}>
          <span className={scss.timeValue}>{timeLeft.hours}</span>
          <span className={scss.timeLabel}>часов</span>
        </div>
        <div className={scss.timeBlock}>
          <span className={scss.timeValue}>{timeLeft.minutes}</span>
          <span className={scss.timeLabel}>минут</span>
        </div>
        <div className={scss.timeBlock}>
          <span className={scss.timeValue}>{timeLeft.seconds}</span>
          <span className={scss.timeLabel}>секунд</span>
        </div>
      </div>
      <p className={scss.moduleInfo}>
        Следующий модуль: <span>{currentModule.moduleTitle}</span>
      </p>
    </div>
  );
}
