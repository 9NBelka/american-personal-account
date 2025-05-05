import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addCourse, addAccessLevel, setError } from '../../../store/slices/adminSlice';
import scss from './AddCourse.module.scss';
import { BsPlus, BsTrash, BsChevronDown } from 'react-icons/bs';
import clsx from 'clsx';
import { toast } from 'react-toastify';
import { storage } from '../../../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function AddCourse() {
  const dispatch = useDispatch();
  const { accessLevels } = useSelector((state) => state.admin);

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

  // Состояние для файла сертификата и предпросмотра
  const [certificateFile, setCertificateFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Состояние для управления модулями и уроками
  const [moduleList, setModuleList] = useState([]);

  // Состояние для выпадающих списков
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isAccessOpen, setIsAccessOpen] = useState(false);
  const [newAccessName, setNewAccessName] = useState('');
  const [showNewAccessInput, setShowNewAccessInput] = useState(false);

  const categoryOptions = [
    { value: 'Course', label: 'Course' },
    { value: 'Master class', label: 'Master class' },
  ];

  const uniqueAccessLevels = Array.from(
    new Map(accessLevels.map((level) => [level.id, level])).values(),
  );

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
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  // Очистка временного URL для предпросмотра
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

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
      dispatch(setError('Ошибка при добавлении уровня доступа: ' + err.message));
      toast.error('Ошибка при добавлении уровня доступа: ' + err.message);
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
      setUploading(true);

      // Загружаем файл сертификата, если он выбран
      let certificateImageUrl = courseData.certificateImage;
      if (certificateFile) {
        const storageRef = ref(storage, `certificates/${courseData.id}_${Date.now()}.jpg`);
        await uploadBytes(storageRef, certificateFile);
        certificateImageUrl = await getDownloadURL(storageRef);
      }

      // Формируем объект модулей
      const modulesObject = moduleList.reduce((acc, module) => {
        acc[module.id] = {
          title: module.title || `Module ${module.order}`,
          unlockDate: module.unlockDate
            ? new Date(module.unlockDate).toISOString()
            : new Date().toISOString(),
          lessons: module.lessons,
          order: module.order,
        };
        return acc;
      }, {});

      const formattedCourseData = {
        ...courseData,
        createdAt: new Date().toISOString(),
        modules: modulesObject,
        certificateImage: certificateImageUrl,
      };

      await dispatch(addCourse(formattedCourseData)).unwrap();
      toast.success('Курс успешно добавлен!');
      setCourseData({
        id: '',
        title: '',
        description: '',
        category: 'Course',
        gitHubRepLink: '',
        access: '',
        modules: {},
        certificateImage: '',
        speakers: [], // Сбрасываем спикеров
      });
      setModuleList([]);
      setCertificateFile(null);
      setPreviewUrl(null);
    } catch (err) {
      dispatch(setError('Ошибка при добавлении курса: ' + err.message));
      toast.error('Ошибка при добавлении курса: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={scss.addCourse}>
      <h2 className={scss.title}>Добавить новый курс</h2>
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
        <div className={scss.field}>
          <label htmlFor='certificateImage'>Изображение сертификата</label>
          <input
            type='file'
            id='certificateImage'
            accept='image/jpeg,image/png'
            onChange={handleCertificateFileChange}
            className={scss.fileInput}
          />
          {previewUrl && (
            <div className={scss.certificatePreview}>
              <img src={previewUrl} alt='Certificate Preview' />
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
          {moduleList.map((module) => (
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
          {uploading ? 'Добавление...' : 'Добавить курс'}
        </button>
      </form>
    </div>
  );
}
