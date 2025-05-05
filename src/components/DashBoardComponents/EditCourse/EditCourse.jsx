import { useState, useEffect } from 'react';
import scss from './EditCourse.module.scss';
import { BsPlus, BsTrash, BsChevronDown } from 'react-icons/bs';
import clsx from 'clsx';
import { toast } from 'react-toastify';
import { useDispatch, useSelector } from 'react-redux';
import { updateCourse, addAccessLevel, setError } from '../../../store/slices/adminSlice';
import { db, storage } from '../../../firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

export default function EditCourse({ courseId, onBack }) {
  const dispatch = useDispatch();
  const { courses, accessLevels } = useSelector((state) => state.admin);
  const courseToEdit = courses.find((course) => course.id === courseId);

  // Состояние для данных курса
  const [courseData, setCourseData] = useState({
    id: '',
    title: '',
    description: '',
    category: 'Course',
    gitHubRepLink: '',
    access: '',
    modules: {},
    certificateImage: '',
    speakers: [], // Новое поле для спикеров
  });

  // Состояние для файла сертификата
  const [certificateFile, setCertificateFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Состояние для управления модулями и уроками
  const [moduleList, setModuleList] = useState([]);
  const [deletedItems, setDeletedItems] = useState({
    modules: [],
    lessons: [],
  });

  // Состояние для выпадающих списков
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isAccessOpen, setIsAccessOpen] = useState(false);
  const [newAccessName, setNewAccessName] = useState('');
  const [showNewAccessInput, setShowNewAccessInput] = useState(false);

  const categoryOptions = [
    { value: 'Course', label: 'Course' },
    { value: 'Master class', label: 'Master class' },
  ];

  // Функция для очистки прогресса пользователей
  const cleanUserProgress = async (courseId, deletedModules, deletedLessons) => {
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const batchUpdates = [];

      usersSnapshot.forEach((userDoc) => {
        const userData = userDoc.data();
        const purchasedCourses = userData.purchasedCourses || {};
        const courseProgress = purchasedCourses[courseId];

        if (courseProgress && courseProgress.completedLessons) {
          const updatedCompletedLessons = { ...courseProgress.completedLessons };

          deletedModules.forEach((moduleId) => {
            delete updatedCompletedLessons[moduleId];
          });

          deletedLessons.forEach(({ moduleId, lessonIndex }) => {
            if (updatedCompletedLessons[moduleId]) {
              updatedCompletedLessons[moduleId] = updatedCompletedLessons[moduleId].filter(
                (index) => index !== lessonIndex,
              );
              if (updatedCompletedLessons[moduleId].length === 0) {
                delete updatedCompletedLessons[moduleId];
              }
            }
          });

          const updatedPurchasedCourses = {
            ...purchasedCourses,
            [courseId]: {
              ...courseProgress,
              completedLessons: updatedCompletedLessons,
              progress: calculateProgress(updatedCompletedLessons, courseId),
            },
          };

          const userRef = doc(db, 'users', userDoc.id);
          batchUpdates.push(updateDoc(userRef, { purchasedCourses: updatedPurchasedCourses }));
        }
      });

      await Promise.all(batchUpdates);
      console.log('User progress cleaned successfully');
    } catch (error) {
      console.error('Error cleaning user progress:', error);
      dispatch(setError('Ошибка при очистке прогресса пользователей: ' + error.message));
    }
  };

  // Функция для пересчета прогресса
  const calculateProgress = (completedLessons, courseId) => {
    const course = courses.find((c) => c.id === courseId);
    if (!course || !course.modules) return 0;

    const totalLessons = Object.values(course.modules).reduce(
      (sum, module) => sum + (module.lessons?.length || 0),
      0,
    );
    const completedCount = Object.values(completedLessons).reduce(
      (sum, indices) => sum + (Array.isArray(indices) ? indices.length : 0),
      0,
    );

    return totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
  };

  // Инициализация данных курса
  useEffect(() => {
    if (!courseToEdit) {
      dispatch(setError('Курс не найден'));
      onBack();
      return;
    }

    const formattedModules = Object.entries(courseToEdit.modules || {})
      .map(([moduleId, module]) => ({
        id: moduleId,
        title: module.title || '',
        unlockDate: module.unlockDate ? new Date(module.unlockDate).toISOString().slice(0, 16) : '',
        lessons: module.lessons || [],
        order: module.order || 0,
      }))
      .sort((a, b) => a.order - b.order)
      .map((module, index) => ({
        ...module,
        order: index + 1,
      }));

    setCourseData({
      id: courseToEdit.id,
      title: courseToEdit.title || '',
      description: courseToEdit.description || '',
      category: courseToEdit.category || 'Course',
      gitHubRepLink: courseToEdit.gitHubRepLink || '',
      access: courseToEdit.access || '',
      modules: courseToEdit.modules || {},
      certificateImage: courseToEdit.certificateImage || '',
      speakers: courseToEdit.speakers || [], // Инициализация спикеров
    });

    setModuleList(formattedModules);
  }, [courseToEdit, dispatch, onBack]);

  // Обработчик изменения полей курса
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCourseData((prev) => ({ ...prev, [name]: value }));
  };

  // Обработчик выбора файла сертификата
  const handleCertificateFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!['image/jpeg', 'image/png'].includes(file.type)) {
        toast.error('Пожалуйста, выберите изображение в формате JPG или PNG');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Размер файла не должен превышать 5 МБ');
        return;
      }
      setCertificateFile(file);
    }
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
      return;
    }

    const accessId = newAccessName.toLowerCase().replace(/\s+/g, '');
    if (accessLevels.some((level) => level.id === accessId)) {
      dispatch(setError('Уровень доступа с таким названием уже существует'));
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
    } catch (err) {
      dispatch(setError('Ошибка при добавлении уровня доступа: ' + err.message));
    }
  };

  // Добавление/удаление модулей и уроков
  const addModule = () => {
    const newModuleId = `module_${Date.now()}`;
    setModuleList((prev) => [
      ...prev,
      {
        id: newModuleId,
        title: '',
        unlockDate: '',
        lessons: [],
        order: prev.length + 1,
      },
    ]);
  };

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

  const handleModuleChange = (moduleId, field, value) => {
    setModuleList((prev) =>
      prev.map((module) => (module.id === moduleId ? { ...module, [field]: value } : module)),
    );
  };

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

  const removeModule = (moduleId) => {
    setModuleList((prev) => {
      const newList = prev.filter((module) => module.id !== moduleId);
      return newList.map((module, index) => ({
        ...module,
        order: index + 1,
      }));
    });
    setDeletedItems((prev) => ({
      ...prev,
      modules: [...prev.modules, moduleId],
      lessons: prev.lessons.filter((lesson) => lesson.moduleId !== moduleId),
    }));
  };

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
    setDeletedItems((prev) => ({
      ...prev,
      lessons: [...prev.lessons, { moduleId, lessonIndex }],
    }));
  };

  // Управление спикерами
  const addSpeaker = () => {
    setCourseData((prev) => ({
      ...prev,
      speakers: [...prev.speakers, ''],
    }));
  };

  const handleSpeakerChange = (index, value) => {
    setCourseData((prev) => {
      const updatedSpeakers = [...prev.speakers];
      updatedSpeakers[index] = value;
      return { ...prev, speakers: updatedSpeakers };
    });
  };

  const removeSpeaker = (index) => {
    setCourseData((prev) => ({
      ...prev,
      speakers: prev.speakers.filter((_, i) => i !== index),
    }));
  };

  // Обработчик отправки формы
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!courseData.access) {
      dispatch(setError('Пожалуйста, выберите или добавьте уровень доступа'));
      toast.error('Пожалуйста, выберите или добавьте уровень доступа');
      return;
    }

    try {
      setUploading(true);

      // Загружаем файл сертификата, если он выбран
      let certificateImageUrl = courseData.certificateImage;
      if (certificateFile) {
        // Удаляем старое изображение, если оно существует
        if (courseData.certificateImage) {
          try {
            const oldRef = ref(storage, courseData.certificateImage);
            await deleteObject(oldRef);
          } catch (err) {
            console.warn('Failed to delete old certificate:', err);
          }
        }

        const storageRef = ref(storage, `certificates/${courseId}_${Date.now()}.jpg`);
        await uploadBytes(storageRef, certificateFile);
        certificateImageUrl = await getDownloadURL(storageRef);
      }

      // Формируем объект модулей
      const modulesObject = moduleList.reduce((acc, module) => {
        acc[module.id] = {
          title: module.title,
          unlockDate: module.unlockDate
            ? new Date(module.unlockDate).toISOString()
            : new Date().toISOString(),
          lessons: module.lessons,
          order: module.order,
        };
        return acc;
      }, {});

      const updatedCourseData = {
        ...courseData,
        modules: modulesObject,
        certificateImage: certificateImageUrl,
      };

      // Сохраняем изменения курса
      await dispatch(
        updateCourse({ courseId: courseData.id, updatedData: updatedCourseData }),
      ).unwrap();

      // Очищаем прогресс пользователей
      if (deletedItems.modules.length > 0 || deletedItems.lessons.length > 0) {
        await cleanUserProgress(courseId, deletedItems.modules, deletedItems.lessons);
      }

      setDeletedItems({ modules: [], lessons: [] });
      setCertificateFile(null);
      toast.success('Курс успешно обновлен!');
      onBack();
    } catch (err) {
      dispatch(setError('Ошибка при обновлении курса: ' + err.message));
      toast.error('Ошибка при обновлении: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    setCourseData((prev) => ({
      ...prev,
      modules: moduleList.reduce((acc, module) => {
        acc[module.id] = {
          title: module.title,
          unlockDate: module.unlockDate ? new Date(module.unlockDate).toISOString() : '',
          lessons: module.lessons,
          order: module.order,
        };
        return acc;
      }, {}),
    }));
  }, [moduleList]);

  if (!courseToEdit) {
    return <div>Загрузка...</div>;
  }

  return (
    <div className={scss.editCourse}>
      <div className={scss.header}>
        <h2 className={scss.title}>Редактировать курс</h2>
        <button className={scss.backButton} onClick={onBack}>
          Назад
        </button>
      </div>
      <form onSubmit={handleSubmit} className={scss.form}>
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
            disabled
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
                ? accessLevels.find((level) => level.id === courseData.access)?.name
                : 'Выберите уровень доступа'}
              <BsChevronDown className={clsx(scss.chevron, isAccessOpen && scss.chevronOpen)} />
            </div>
            {isAccessOpen && (
              <ul className={scss.accessDropdown}>
                {accessLevels.map((level) => (
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
        <div className={scss.field}>
          <label htmlFor='certificateImage'>Изображение сертификата</label>
          <input
            type='file'
            id='certificateImage'
            accept='image/jpeg,image/png'
            onChange={handleCertificateFileChange}
            className={scss.fileInput}
          />
          {courseData.certificateImage && (
            <div className={scss.certificatePreview}>
              <img src={courseData.certificateImage} alt='Certificate Preview' />
            </div>
          )}
          {certificateFile && <p>Выбрано: {certificateFile.name}</p>}
        </div>

        {/* Спикеры */}
        <div className={scss.speakersSection}>
          <h3>Спикеры</h3>
          {courseData.speakers.map((speaker, index) => (
            <div key={index} className={scss.speaker}>
              <input
                type='text'
                value={speaker}
                onChange={(e) => handleSpeakerChange(index, e.target.value)}
                placeholder={`Спикер ${index + 1}`}
                required
              />
              <button
                type='button'
                className={scss.deleteButton}
                onClick={() => removeSpeaker(index)}>
                <BsTrash />
              </button>
            </div>
          ))}
          <button type='button' className={scss.addSpeakerButton} onClick={addSpeaker}>
            <BsPlus /> Добавить спикера
          </button>
        </div>

        {/* Модули и уроки */}
        <div className={scss.modulesSection}>
          <h3>Модули</h3>
          {moduleList.map((module, moduleIndex) => (
            <div key={module.id} className={scss.module}>
              <div className={scss.moduleHeader}>
                <input
                  type='text'
                  value={module.title}
                  onChange={(e) => handleModuleChange(module.id, 'title', e.target.value)}
                  placeholder={`Модуль ${module.order}`}
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
                      placeholder='Токен видео урока...'
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

        <button type='submit' className={scss.submitButton} disabled={uploading}>
          {uploading ? 'Сохранение...' : 'Сохранить изменения'}
        </button>
      </form>
    </div>
  );
}
