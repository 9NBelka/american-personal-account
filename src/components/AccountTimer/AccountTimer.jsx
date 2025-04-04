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
        if (isNaN(unlockDate.getTime())) {
          console.warn(`Некорректная дата unlockDate в модуле ${module.id}: ${module.unlockDate}`);
          return false;
        }
        return unlockDate > now;
      })
      .sort((a, b) => new Date(a.unlockDate) - new Date(b.unlockDate));

    return futureModules.length > 0 ? futureModules[0] : null;
  }, [modules]);

  // Инициализация и обновление таймера
  useEffect(() => {
    let interval;

    const updateTimer = () => {
      const now = new Date();
      let nextModule = currentModule;

      // Если текущий модуль не установлен или время истекло, ищем следующий
      if (!nextModule) {
        nextModule = findNextModule();
        setCurrentModule(nextModule);
      } else {
        const unlockDate = new Date(nextModule.unlockDate);
        if (isNaN(unlockDate.getTime())) {
          console.warn(
            `Некорректная дата unlockDate в текущем модуле ${nextModule.id}: ${nextModule.unlockDate}`,
          );
          nextModule = findNextModule();
          setCurrentModule(nextModule);
        } else if (unlockDate <= now) {
          nextModule = findNextModule();
          setCurrentModule(nextModule);
        }
      }

      // Если модуль не найден, сбрасываем время
      if (!nextModule) {
        setTimeLeft(null);
        return;
      }

      // Рассчитываем оставшееся время
      const unlockDate = new Date(nextModule.unlockDate);
      const difference = unlockDate - now;

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    // Первоначальный расчёт
    updateTimer();

    // Устанавливаем интервал для обновления каждую секунду
    interval = setInterval(updateTimer, 1000);

    // Очищаем интервал при размонтировании или изменении modules
    return () => clearInterval(interval);
  }, [modules, currentModule, findNextModule]);

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
