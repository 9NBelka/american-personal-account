import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux'; // Добавляем Redux хуки
import { fetchCourses, addTimer, deleteTimer, setError } from '../../../store/slices/adminSlice'; // Импортируем действия
import scss from './TimersCourses.module.scss';
import { BsChevronDown, BsTrash } from 'react-icons/bs';
import clsx from 'clsx';
import { toast } from 'react-toastify';

export default function TimersCourses() {
  const dispatch = useDispatch();

  // Получаем данные из Redux store
  const { accessLevels, courses, timers, error } = useSelector((state) => state.admin);

  // Состояние для управления добавлением нового таймера
  const [isAddingTimer, setIsAddingTimer] = useState(false);
  const [isAccessOpen, setIsAccessOpen] = useState(false);
  const [selectedAccess, setSelectedAccess] = useState(null);
  const [isCourseOpen, setIsCourseOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [isLoadingCourses, setIsLoadingCourses] = useState(false); // Состояние загрузки курсов

  // Загружаем курсы при монтировании компонента
  useEffect(() => {
    if (courses.length === 0) {
      setIsLoadingCourses(true);
      dispatch(fetchCourses()).finally(() => setIsLoadingCourses(false));
    }
  }, [courses, dispatch]);

  // Фильтруем курсы, которые связаны с выбранным уровнем доступа
  const availableCourses = courses.filter((course) => course.access === selectedAccess?.id);

  // Обработчик добавления нового таймера
  const handleAddTimer = async () => {
    if (!selectedAccess || !selectedCourse) {
      dispatch(setError('Пожалуйста, выберите уровень доступа и курс')); // Используем dispatch
      toast.error('Пожалуйста, выберите уровень доступа и курс');
      return;
    }

    // Проверяем, не существует ли уже таймер для этого уровня доступа
    const existingTimer = timers.find((timer) => timer.accessLevel === selectedAccess.id);
    if (existingTimer) {
      dispatch(setError('Таймер для этого уровня доступа уже существует')); // Используем dispatch
      toast.error('Таймер для этого уровня доступа уже существует');
      return;
    }

    try {
      await dispatch(
        addTimer({
          accessLevel: selectedAccess.id,
          courseId: selectedCourse.id,
        }),
      ).unwrap();
      toast.success('Таймер успешно добавлен!');
      setIsAddingTimer(false);
      setSelectedAccess(null);
      setSelectedCourse(null);
      setIsAccessOpen(false);
      setIsCourseOpen(false);
    } catch (err) {
      dispatch(setError('Ошибка при добавлении таймера: ' + err)); // Используем dispatch
      toast.error('Ошибка при добавлении таймера: ' + err);
    }
  };

  // Обработчик удаления таймера
  const handleDeleteTimer = async (timerId) => {
    try {
      await dispatch(deleteTimer(timerId)).unwrap();
      toast.success('Таймер успешно удалён!');
    } catch (err) {
      dispatch(setError('Ошибка при удалении таймера: ' + err)); // Используем dispatch
      toast.error('Ошибка при удалении таймера: ' + err);
    }
  };

  // Обработчик выбора уровня доступа
  const handleAccessSelect = (access) => {
    setSelectedAccess(access);
    setSelectedCourse(null); // Сбрасываем выбранный курс при смене уровня доступа
    setIsAccessOpen(false);
    setIsCourseOpen(false);
  };

  // Обработчик выбора курса
  const handleCourseSelect = (course) => {
    setSelectedCourse(course);
    setIsCourseOpen(false);
  };

  return (
    <div className={scss.listMainBlock}>
      <h2 className={scss.listTitle}>Таймеры</h2>
      {error && <p className={scss.error}>{error}</p>}

      {/* Кнопка "Добавить таймер" */}
      {!isAddingTimer && (
        <button className={scss.addTimerButton} onClick={() => setIsAddingTimer(true)}>
          Добавить таймер
        </button>
      )}

      {/* Форма добавления нового таймера */}
      {isAddingTimer && (
        <div className={scss.addTimerForm}>
          <div className={scss.dropdownContainer}>
            {/* Выпадающий список уровней доступа */}
            <div className={scss.accessContainer}>
              <div className={scss.accessButton} onClick={() => setIsAccessOpen(!isAccessOpen)}>
                {selectedAccess ? selectedAccess.name : 'Выберите уровень доступа'}
                <BsChevronDown className={clsx(scss.chevron, isAccessOpen && scss.chevronOpen)} />
              </div>
              {isAccessOpen && (
                <ul className={scss.accessDropdown}>
                  {accessLevels.map((level) => (
                    <li
                      key={level.id}
                      className={clsx(
                        scss.accessOption,
                        selectedAccess?.id === level.id && scss.active,
                      )}
                      onClick={() => handleAccessSelect(level)}>
                      {level.name}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Выпадающий список курсов */}
            {selectedAccess && (
              <div className={scss.courseContainer}>
                <div className={scss.courseButton} onClick={() => setIsCourseOpen(!isCourseOpen)}>
                  {selectedCourse ? selectedCourse.title : 'Выберите курс'}
                  <BsChevronDown className={clsx(scss.chevron, isCourseOpen && scss.chevronOpen)} />
                </div>
                {isCourseOpen && (
                  <ul className={scss.courseDropdown}>
                    {isLoadingCourses ? (
                      <li className={scss.courseOption}>Загрузка курсов...</li>
                    ) : availableCourses.length > 0 ? (
                      availableCourses.map((course) => (
                        <li
                          key={course.id}
                          className={clsx(
                            scss.courseOption,
                            selectedCourse?.id === course.id && scss.active,
                          )}
                          onClick={() => handleCourseSelect(course)}>
                          {course.title}
                        </li>
                      ))
                    ) : (
                      <li className={scss.courseOption}>
                        Нет доступных курсов для этого уровня доступа
                      </li>
                    )}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* Кнопки для сохранения или отмены */}
          <div className={scss.formActions}>
            <button type='button' className={scss.saveButton} onClick={handleAddTimer}>
              Сохранить
            </button>
            <button
              type='button'
              className={scss.cancelButton}
              onClick={() => {
                setIsAddingTimer(false);
                setSelectedAccess(null);
                setSelectedCourse(null);
                setIsAccessOpen(false);
                setIsCourseOpen(false);
              }}>
              Отмена
            </button>
          </div>
        </div>
      )}

      {/* Список существующих таймеров */}
      <div className={scss.timersList}>
        {timers.length > 0 ? (
          timers.map((timer) => {
            const accessLevel = accessLevels.find((level) => level.id === timer.accessLevel);
            const course = courses.find((c) => c.id === timer.courseId);
            return (
              <div key={timer.id} className={scss.timerItem}>
                <span>
                  {accessLevel ? accessLevel.name : 'Неизвестный уровень'} -{' '}
                  {course ? course.title : 'Неизвестный курс'}
                </span>
                <button className={scss.deleteButton} onClick={() => handleDeleteTimer(timer.id)}>
                  <BsTrash />
                </button>
              </div>
            );
          })
        ) : (
          <p className={scss.noTimers}>Таймеры отсутствуют</p>
        )}
      </div>
    </div>
  );
}
