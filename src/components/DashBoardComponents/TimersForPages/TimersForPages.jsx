import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styles from './TimersForPages.module.scss';
import clsx from 'clsx';
import { FaClock } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { addTimer, fetchTimers, deleteTimer } from '../../../store/slices/timersForPagesSlice';
import { setActiveTimer, updateTimer } from '../../../store/slices/timersForPagesSlice';

export default function TimersForPages() {
  const dispatch = useDispatch();
  const { timers, status, error } = useSelector((state) => state.timers);
  const [customDates, setCustomDates] = useState({});
  const [customDescriptions, setCustomDescriptions] = useState({});
  const [newTimer, setNewTimer] = useState({
    id: '',
    name: '',
    endDate: '',
    description: '',
    isActive: false,
  });

  useEffect(() => {
    dispatch(fetchTimers());
  }, [dispatch]);

  const handleDateChange = (timerId, value) => {
    setCustomDates((prev) => ({ ...prev, [timerId]: value }));
  };

  const handleDescriptionChange = (timerId, value) => {
    setCustomDescriptions((prev) => ({ ...prev, [timerId]: value }));
  };

  const handleSaveCustomDate = (timerId) => {
    const customDate = customDates[timerId];
    if (customDate) {
      dispatch(updateTimer({ timerId, updatedData: { endDate: customDate } }));
      toast.success('Дата окончания сохранена');
    } else {
      toast.error('Введите дату окончания');
    }
  };

  const handleSaveCustomDescription = (timerId) => {
    const customDescription = customDescriptions[timerId];
    if (customDescription) {
      dispatch(updateTimer({ timerId, updatedData: { description: customDescription } }));
      toast.success('Описание сохранено');
    } else {
      toast.error('Введите описание');
    }
  };

  const handleToggleActive = (timerId) => {
    dispatch(setActiveTimer(timerId));
    toast.success(
      `Таймер ${timerId} ${
        timers.find((t) => t.id === timerId)?.isActive ? 'деактивирован' : 'активирован'
      }`,
    );
  };

  const handleDeleteTimer = (timerId) => {
    dispatch(deleteTimer(timerId));
    toast.success(`Таймер ${timerId} удален`);
  };

  const handleNewTimerChange = (e) => {
    const { name, value } = e.target;
    setNewTimer((prev) => ({
      ...prev,
      [name]: value,
      id: name === 'id' ? value : prev.id,
    }));
  };

  const handleAddTimer = (e) => {
    e.preventDefault();
    const existingTimer = timers.find((t) => t.id === newTimer.id);
    if (existingTimer) {
      toast.error('Таймер с таким ID уже существует');
      return;
    }

    if (newTimer.id && newTimer.name && newTimer.endDate) {
      dispatch(addTimer({ ...newTimer, isActive: false }));
      setNewTimer({ id: '', name: '', endDate: '', description: '', isActive: false });
      toast.success('Таймер добавлен');
    } else {
      toast.error('Заполните все поля');
    }
  };

  const getTimerStyle = (id) => {
    switch (id) {
      case 'ArchitectureA':
        return { gradient: styles.blueGradient, iconColor: '#484eac' };
      case 'ArchitectureB':
        return { gradient: styles.greenGradient, iconColor: '#5fac66' };
      case 'ArchitectureC':
        return { gradient: styles.orangeGradient, iconColor: '#ff9c14' };
      default:
        return { gradient: styles.blueGradient, iconColor: '#484eac' };
    }
  };

  if (status === 'loading') return <div className={styles.loader}>Загрузка...</div>;
  if (error) return <div className={styles.error}>Ошибка: {error}</div>;

  return (
    <div className={styles.timersSelector}>
      <h2>Управление таймерами страниц</h2>
      <div className={styles.timerTiles}>
        {timers.map((timer) => {
          const { gradient, iconColor } = getTimerStyle(timer.id);
          return (
            <div
              key={timer.id}
              className={clsx(styles.timerTile, gradient, {
                [styles.active]: timer.isActive,
              })}>
              <div className={styles.timerContent}>
                <h5 className={styles.timerTitle}>
                  {timer.id} - {timer.name}
                </h5>
                <p className={styles.timerDate}>Дата окончания: {timer.endDate}</p>
                <p className={styles.timerDescription}>
                  Описание: {timer.description || 'Нет описания'}
                </p>
                <p
                  className={clsx(styles.timerStatus, {
                    [styles.activeStatus]: timer.isActive,
                  })}>
                  {timer.isActive ? 'Активно' : 'Неактивно'}
                </p>
                <input
                  type='date'
                  value={customDates[timer.id] || ''}
                  onChange={(e) => handleDateChange(timer.id, e.target.value)}
                  className={styles.input}
                />
                <input
                  type='text'
                  value={customDescriptions[timer.id] || timer.description || ''}
                  onChange={(e) => handleDescriptionChange(timer.id, e.target.value)}
                  className={styles.input}
                  placeholder='Описание'
                />
                <div className={styles.buttonGroup}>
                  <button onClick={() => handleSaveCustomDate(timer.id)} className={styles.button}>
                    Сохранить дату
                  </button>
                  <button
                    onClick={() => handleSaveCustomDescription(timer.id)}
                    className={styles.button}>
                    Сохранить описание
                  </button>
                  <button
                    onClick={() => handleToggleActive(timer.id)}
                    className={clsx(styles.button, styles.toggleButton, {
                      [styles.activeToggle]: timer.isActive,
                    })}>
                    {timer.isActive ? 'Выключить' : 'Включить'}
                  </button>
                  <button
                    onClick={() => handleDeleteTimer(timer.id)}
                    className={clsx(styles.button, styles.deleteButton)}>
                    Удалить
                  </button>
                </div>
              </div>
              <div className={styles.iconBlock}>
                <FaClock className={styles.amountIcon} style={{ fill: iconColor }} />
              </div>
            </div>
          );
        })}
      </div>
      <div className={clsx(styles.addTimer, styles.blueGradient)}>
        <h3>Добавить таймер</h3>
        <div className={styles.form}>
          <input
            type='text'
            name='id'
            placeholder='ID (например, ArchitectureA)'
            value={newTimer.id}
            onChange={handleNewTimerChange}
            className={styles.input}
          />
          <input
            type='text'
            name='name'
            placeholder='Название таймера'
            value={newTimer.name}
            onChange={handleNewTimerChange}
            className={styles.input}
          />
          <input
            type='date'
            name='endDate'
            value={newTimer.endDate}
            onChange={handleNewTimerChange}
            className={styles.input}
          />
          <input
            type='text'
            name='description'
            placeholder='Описание'
            value={newTimer.description}
            onChange={handleNewTimerChange}
            className={styles.input}
          />
          <button onClick={handleAddTimer} className={styles.button}>
            Добавить
          </button>
        </div>
      </div>
    </div>
  );
}
