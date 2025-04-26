import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addCourse, addAccessLevel, setError } from '../../../store/slices/adminSlice';
import scss from './AddCourse.module.scss';
import { BsPlus, BsTrash, BsChevronDown } from 'react-icons/bs';
import clsx from 'clsx';
import { toast } from 'react-toastify';

export default function AddCourse() {
  const dispatch = useDispatch();

  // Получаем данные из Redux store
  const { accessLevels, error } = useSelector((state) => state.admin);

  // Состояние для данных курса
  const [courseData, setCourseData] = useState({
    id: '',
    title: '',
    description: '',
    category: 'Course',
    gitHubRepLink: '',
    access: '',
    modules: {},
  });

  // Состояние для управления модулями и уроками
  const [moduleList, setModuleList] = useState([]); // Массив модулей вместо объекта modules

  // Состояние для выпадающего списка категорий
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const categoryOptions = [
    { value: 'Course', label: 'Course' },
    { value: 'Master class', label: 'Master class' },
  ];

  // Состояние для выпадающего списка уровней доступа
  const [isAccessOpen, setIsAccessOpen] = useState(false);
  const [newAccessName, setNewAccessName] = useState('');
  const [showNewAccessInput, setShowNewAccessInput] = useState(false);

  // Удаляем дубликаты из accessLevels
  const uniqueAccessLevels = Array.from(
    new Map(accessLevels.map((level) => [level.id, level])).values(),
  );

  // Обработчик изменения полей курса
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCourseData((prev) => ({ ...prev, [name]: value }));
  };

  // Обработчик выбора категории
  const handleCategorySelect = (value) => {
    setCourseData((prev) => ({ ...prev, category: value }));
    setIsCategoryOpen(false);
  };

  // Обработчик выбора уровня доступа
  const handleAccessSelect = (accessId) => {
    setCourseData((prev) => ({ ...prev, access: accessId }));
    setIsAccessOpen(false);
  };

  // Обработчик добавления нового уровня доступа
  const handleAddAccessLevel = async () => {
    if (!newAccessName.trim()) {
      dispatch(setError('Название уровня доступа не может быть пустым'));
      toast.error('Название уровня доступа не может быть пустым');
      return;
    }

    const accessId = newAccessName.toLowerCase().replace(/\s+/g, '');
    if (accessLevels.some((level) => level.id === accessId)) {
      dispatch(setError('Уровень доступа с таким названием уже существует'));
      toast.error('Уровень доступа с таким названием уже существует');
      return;
    }

    try {
      await dispatch(
        addAccessLevel({
          id: accessId,
          name: newAccessName,
        }),
      ).unwrap();
      setCourseData((prev) => ({ ...prev, access: accessId }));
      setNewAccessName('');
      setShowNewAccessInput(false);
      toast.success('Уровень доступа успешно добавлен!');
    } catch (err) {
      dispatch(setError('Ошибка при добавлении уровня доступа: ' + err));
      toast.error('Ошибка при добавлении уровня доступа: ' + err);
    }
  };

  // Добавление нового модуля
  const addModule = () => {
    const newModuleId = `module_${Date.now()}`; // Используем формат module_${timestamp}
    setModuleList((prev) => [
      ...prev,
      {
        id: newModuleId,
        title: '',
        unlockDate: '',
        lessons: [],
        order: prev.length + 1, // Присваиваем order
      },
    ]);
  };

  // Добавление нового урока в модуль
  const addLesson = (moduleId) => {
    setModuleList((prev) =>
      prev.map((module) =>
        module.id === moduleId
          ? {
              ...module,
              lessons: [
                ...module.lessons,
                {
                  title: '',
                  videoUrl: '',
                  videoTime: 0,
                },
              ],
            }
          : module,
      ),
    );
  };

  // Обработчик изменения данных модуля
  const handleModuleChange = (moduleId, field, value) => {
    setModuleList((prev) =>
      prev.map((module) => (module.id === moduleId ? { ...module, [field]: value } : module)),
    );
  };

  // Обработчик изменения данных урока
  const handleLessonChange = (moduleId, lessonIndex, field, value) => {
    setModuleList((prev) =>
      prev.map((module) =>
        module.id === moduleId
          ? {
              ...module,
              lessons: module.lessons.map((lesson, index) =>
                index === lessonIndex
                  ? {
                      ...lesson,
                      [field]: field === 'videoTime' ? Number(value) : value,
                    }
                  : lesson,
              ),
            }
          : module,
      ),
    );
  };

  // Удаление модуля
  const removeModule = (moduleId) => {
    setModuleList((prev) => {
      const newList = prev.filter((module) => module.id !== moduleId);
      // Пересчитываем order для оставшихся модулей
      return newList.map((module, index) => ({
        ...module,
        order: index + 1,
      }));
    });
  };

  // Удаление урока
  const removeLesson = (moduleId, lessonIndex) => {
    setModuleList((prev) =>
      prev.map((module) =>
        module.id === moduleId
          ? {
              ...module,
              lessons: module.lessons.filter((_, index) => index !== lessonIndex),
            }
          : module,
      ),
    );
  };

  // Обработчик отправки формы
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!courseData.id.trim()) {
      dispatch(setError('ID курса не может быть пустым'));
      toast.error('ID курса не может быть пустым');
      return;
    }
    if (!courseData.title.trim()) {
      dispatch(setError('Название курса не может быть пустым'));
      toast.error('Название курса не может быть пустым');
      return;
    }
    if (!courseData.description.trim()) {
      dispatch(setError('Описание курса не может быть пустым'));
      toast.error('Описание курса не может быть пустым');
      return;
    }
    if (!courseData.access) {
      dispatch(setError('Пожалуйста, выберите или добавьте уровень доступа'));
      toast.error('Пожалуйста, выберите или добавьте уровень доступа');
      return;
    }

    try {
      // Преобразуем moduleList в объект modules для сохранения в Firestore
      const modulesObject = moduleList.reduce((acc, module) => {
        acc[module.id] = {
          title: module.title || `Module ${module.order}`, // Запасное название, если title не задано
          unlockDate: module.unlockDate
            ? new Date(module.unlockDate).toISOString()
            : new Date().toISOString(),
          lessons: module.lessons,
          order: module.order, // Сохраняем порядок
        };
        return acc;
      }, {});

      // Формируем данные курса для отправки в базу
      const formattedCourseData = {
        ...courseData,
        createdAt: new Date().toISOString(),
        modules: modulesObject,
      };

      await dispatch(addCourse(formattedCourseData)).unwrap();
      toast.success('Курс успешно добавлен!');
      // Сбрасываем форму
      setCourseData({
        id: '',
        title: '',
        description: '',
        category: 'Course',
        gitHubRepLink: '',
        access: '',
        modules: {},
      });
      setModuleList([]); // Сбрасываем moduleList
    } catch (err) {
      dispatch(setError('Ошибка при добавлении курса: ' + err));
      toast.error('Ошибка при добавлении курса: ' + err);
    }
  };

  return (
    <div className={scss.addCourse}>
      <h2 className={scss.title}>Добавить новый курс</h2>
      {error && <div className={scss.error}>{error}</div>}
      <form onSubmit={handleSubmit} className={scss.form}>
        {/* Основные поля курса */}
        <div className={scss.field}>
          <label htmlFor='id'>ID курса</label>
          <input
            type='text'
            id='id'
            name='id'
            value={courseData.id}
            onChange={handleInputChange}
            placeholder='Введите ID курса (название курса)...'
            required
          />
        </div>
        <div className={scss.field}>
          <label htmlFor='title'>Название курса</label>
          <input
            type='text'
            id='title'
            name='title'
            value={courseData.title}
            onChange={handleInputChange}
            placeholder='Введите название курса...'
            required
          />
        </div>
        <div className={scss.field}>
          <label htmlFor='description'>Описание</label>
          <textarea
            id='description'
            name='description'
            value={courseData.description}
            onChange={handleInputChange}
            placeholder='Введите описание курса...'
            required
          />
        </div>
        <div className={scss.field}>
          <label>Категория</label>
          <div className={scss.categoryContainer}>
            <div className={scss.categoryButton} onClick={() => setIsCategoryOpen(!isCategoryOpen)}>
              {courseData.category || 'Выберите категорию'}
              <BsChevronDown className={clsx(scss.chevron, isCategoryOpen && scss.chevronOpen)} />
            </div>
            {isCategoryOpen && (
              <ul className={scss.categoryDropdown}>
                {categoryOptions.map((option) => (
                  <li
                    key={option.value}
                    className={clsx(
                      scss.categoryOption,
                      courseData.category === option.value && scss.active,
                    )}
                    onClick={() => handleCategorySelect(option.value)}>
                    {option.label}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <div className={scss.field}>
          <label>Уровень доступа</label>
          <div className={scss.accessContainer}>
            <div className={scss.accessButton} onClick={() => setIsAccessOpen(!isAccessOpen)}>
              {courseData.access
                ? uniqueAccessLevels.find((level) => level.id === courseData.access)?.name
                : 'Выберите уровень доступа'}
              <BsChevronDown className={clsx(scss.chevron, isAccessOpen && scss.chevronOpen)} />
            </div>
            {isAccessOpen && (
              <ul className={scss.accessDropdown}>
                {uniqueAccessLevels.map((level) => (
                  <li
                    key={level.id}
                    className={clsx(
                      scss.accessOption,
                      courseData.access === level.id && scss.active,
                    )}
                    onClick={() => handleAccessSelect(level.id)}>
                    {level.name}
                  </li>
                ))}
                <li className={scss.accessOption} onClick={() => setShowNewAccessInput(true)}>
                  + Добавить новый уровень доступа
                </li>
              </ul>
            )}
            {showNewAccessInput && (
              <div className={scss.newAccessInput}>
                <input
                  type='text'
                  value={newAccessName}
                  onChange={(e) => setNewAccessName(e.target.value)}
                  placeholder='Введите название уровня доступа...'
                />
                <button
                  type='button'
                  className={scss.addAccessButton}
                  onClick={handleAddAccessLevel}>
                  Добавить
                </button>
                <button
                  type='button'
                  className={scss.cancelButton}
                  onClick={() => setShowNewAccessInput(false)}>
                  Отмена
                </button>
              </div>
            )}
          </div>
        </div>
        <div className={scss.field}>
          <label htmlFor='gitHubRepLink'>GitHub-ссылка</label>
          <input
            type='url'
            id='gitHubRepLink'
            name='gitHubRepLink'
            value={courseData.gitHubRepLink}
            onChange={handleInputChange}
            placeholder='Введите ссылку на GitHub...'
          />
        </div>

        {/* Модули и уроки */}
        <div className={scss.modulesSection}>
          <h3>Модули</h3>
          {moduleList.map((module) => (
            <div key={module.id} className={scss.module}>
              <div className={scss.moduleHeader}>
                <input
                  type='text'
                  value={module.title}
                  onChange={(e) => handleModuleChange(module.id, 'title', e.target.value)}
                  placeholder={`Модуль ${module.order}`} // Используем order для плейсхолдера
                  required
                />
                <input
                  type='datetime-local'
                  value={module.unlockDate}
                  onChange={(e) => handleModuleChange(module.id, 'unlockDate', e.target.value)}
                  placeholder='Дата разблокировки модуля...'
                />
                <button
                  type='button'
                  className={scss.deleteButton}
                  onClick={() => removeModule(module.id)}>
                  <BsTrash />
                </button>
              </div>
              <div className={scss.lessons}>
                {module.lessons.map((lesson, lessonIndex) => (
                  <div key={lessonIndex} className={scss.lesson}>
                    <input
                      type='text'
                      value={lesson.title}
                      onChange={(e) =>
                        handleLessonChange(module.id, lessonIndex, 'title', e.target.value)
                      }
                      placeholder={`Урок ${lessonIndex + 1}`}
                      required
                    />
                    <input
                      type='text'
                      value={lesson.videoUrl}
                      onChange={(e) =>
                        handleLessonChange(module.id, lessonIndex, 'videoUrl', e.target.value)
                      }
                      placeholder='Токен видео урока (например, ac1f5fa0-2dd2-68d0-ebaf-ba5967d0e07d/a909a0c3-2224-70ae-f4c9-ee26818cb414)'
                      required
                    />
                    <input
                      type='number'
                      min='0'
                      value={lesson.videoTime}
                      onChange={(e) =>
                        handleLessonChange(module.id, lessonIndex, 'videoTime', e.target.value)
                      }
                      placeholder='Длительность урока (в минутах)'
                      required
                    />
                    <button
                      type='button'
                      className={scss.deleteButton}
                      onClick={() => removeLesson(module.id, lessonIndex)}>
                      <BsTrash />
                    </button>
                  </div>
                ))}
                <button
                  type='button'
                  className={scss.addLessonButton}
                  onClick={() => addLesson(module.id)}>
                  <BsPlus /> Добавить урок
                </button>
              </div>
            </div>
          ))}
          <button type='button' className={scss.addModuleButton} onClick={addModule}>
            <BsPlus /> Добавить модуль
          </button>
        </div>

        {/* Кнопка отправки */}
        <button type='submit' className={scss.submitButton}>
          Добавить курс
        </button>
      </form>
    </div>
  );
}
