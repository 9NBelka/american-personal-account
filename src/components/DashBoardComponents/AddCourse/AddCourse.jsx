// components/admin/AddCourse.jsx
import { useState } from 'react';
import { useAdmin } from '../../../context/AdminContext';
import scss from './AddCourse.module.scss';
import { BsPlus, BsTrash, BsChevronDown } from 'react-icons/bs';
import clsx from 'clsx';

export default function AddCourse() {
  const { addCourse, error, setError } = useAdmin();

  // Состояние для данных курса
  const [courseData, setCourseData] = useState({
    id: '',
    title: '',
    description: '',
    category: 'Course',
    gitHubRepLink: '',
    modules: {},
  });

  // Состояние для управления модулями и уроками
  const [moduleCount, setModuleCount] = useState(0);
  const [modules, setModules] = useState({});

  // Состояние для выпадающего списка категорий
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const categoryOptions = [
    { value: 'Course', label: 'Course' },
    { value: 'Master class', label: 'Master class' },
  ];

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

  // Добавление нового модуля
  const addModule = () => {
    const newModuleId = `module${moduleCount + 1}`;
    setModules((prev) => ({
      ...prev,
      [newModuleId]: {
        title: '',
        unlockDate: '',
        lessons: [],
      },
    }));
    setModuleCount((prev) => prev + 1);
  };

  // Добавление нового урока в модуль
  const addLesson = (moduleId) => {
    setModules((prev) => ({
      ...prev,
      [moduleId]: {
        ...prev[moduleId],
        lessons: [
          ...prev[moduleId].lessons,
          {
            title: '',
            videoUrl: '',
            videoTime: 0,
          },
        ],
      },
    }));
  };

  // Обработчик изменения данных модуля
  const handleModuleChange = (moduleId, field, value) => {
    setModules((prev) => ({
      ...prev,
      [moduleId]: {
        ...prev[moduleId],
        [field]: value,
      },
    }));
  };

  // Обработчик изменения данных урока
  const handleLessonChange = (moduleId, lessonIndex, field, value) => {
    setModules((prev) => {
      const updatedLessons = [...prev[moduleId].lessons];
      updatedLessons[lessonIndex] = {
        ...updatedLessons[lessonIndex],
        [field]: field === 'videoTime' ? Number(value) : value,
      };
      return {
        ...prev,
        [moduleId]: {
          ...prev[moduleId],
          lessons: updatedLessons,
        },
      };
    });
  };

  // Удаление модуля
  const removeModule = (moduleId) => {
    setModules((prev) => {
      const newModules = { ...prev };
      delete newModules[moduleId];
      return newModules;
    });
  };

  // Удаление урока
  const removeLesson = (moduleId, lessonIndex) => {
    setModules((prev) => ({
      ...prev,
      [moduleId]: {
        ...prev[moduleId],
        lessons: prev[moduleId].lessons.filter((_, index) => index !== lessonIndex),
      },
    }));
  };

  // Обработчик отправки формы
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Формируем данные курса для отправки в базу
      const formattedCourseData = {
        ...courseData,
        createdAt: new Date().toISOString(), // Добавляем текущую дату создания
        modules: Object.keys(modules).reduce((acc, moduleId) => {
          const module = modules[moduleId];
          acc[moduleId] = {
            title: module.title,
            unlockDate: module.unlockDate || new Date().toISOString(),
            lessons: module.lessons,
          };
          return acc;
        }, {}),
      };

      await addCourse(formattedCourseData);
      alert('Курс успешно добавлен!');
      // Сбрасываем форму
      setCourseData({
        id: '',
        title: '',
        description: '',
        category: 'Course',
        gitHubRepLink: '',
        modules: {},
      });
      setModules({});
      setModuleCount(0);
    } catch (err) {
      setError('Ошибка при добавлении курса: ' + err.message);
    }
  };

  return (
    <div className={scss.addCourse}>
      <h2 className={scss.title}>Добавить новый курс</h2>
      {error && <p className={scss.error}>{error}</p>}
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
          {Object.keys(modules).map((moduleId) => (
            <div key={moduleId} className={scss.module}>
              <div className={scss.moduleHeader}>
                <input
                  type='text'
                  value={modules[moduleId].title}
                  onChange={(e) => handleModuleChange(moduleId, 'title', e.target.value)}
                  placeholder={`Название модуля ${moduleId.replace('module', '')}`}
                  required
                />
                <input
                  type='datetime-local'
                  value={modules[moduleId].unlockDate}
                  onChange={(e) => handleModuleChange(moduleId, 'unlockDate', e.target.value)}
                  placeholder='Дата разблокировки модуля...'
                />
                <button
                  type='button'
                  className={scss.deleteButton}
                  onClick={() => removeModule(moduleId)}>
                  <BsTrash />
                </button>
              </div>
              <div className={scss.lessons}>
                {modules[moduleId].lessons.map((lesson, index) => (
                  <div key={index} className={scss.lesson}>
                    <input
                      type='text'
                      value={lesson.title}
                      onChange={(e) => handleLessonChange(moduleId, index, 'title', e.target.value)}
                      placeholder={`Название урока ${index}`}
                      required
                    />
                    <input
                      type='text'
                      value={lesson.videoUrl}
                      onChange={(e) =>
                        handleLessonChange(moduleId, index, 'videoUrl', e.target.value)
                      }
                      placeholder='Токен видео урока (например, ac1f5fa0-2dd2-68d0-ebaf-ba5967d0e07d/a909a0c3-2224-70ae-f4c9-ee26818cb414)'
                      required
                    />
                    <input
                      type='number'
                      min='0'
                      value={lesson.videoTime}
                      onChange={(e) =>
                        handleLessonChange(moduleId, index, 'videoTime', e.target.value)
                      }
                      placeholder='Длительность урока (в минутах)'
                      required
                    />
                    <button
                      type='button'
                      className={scss.deleteButton}
                      onClick={() => removeLesson(moduleId, index)}>
                      <BsTrash />
                    </button>
                  </div>
                ))}
                <button
                  type='button'
                  className={scss.addLessonButton}
                  onClick={() => addLesson(moduleId)}>
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
