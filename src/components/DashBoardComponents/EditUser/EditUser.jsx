// components/admin/EditUser.jsx
import scss from './EditUser.module.scss';
import { useEffect, useState } from 'react';
import { useAdmin } from '../../../context/AdminContext';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../../firebase';

export default function EditUser({ userId, onBack }) {
  const { users, updateUser, courses, fetchAllCourses } = useAdmin();
  const user = users.find((u) => u.id === userId);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatarUrl || '');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedPackage, setSelectedPackage] = useState('');

  // Очистка URL.createObjectURL при размонтировании компонента
  useEffect(() => {
    return () => {
      if (avatarPreview && avatarPreview.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  useEffect(() => {
    fetchAllCourses();
  }, [fetchAllCourses]);

  // Схема валидации с Yup
  const validationSchema = Yup.object({
    name: Yup.string().required('Имя обязательно'),
    email: Yup.string().email('Неверный формат email').required('Email обязателен'),
    role: Yup.string()
      .oneOf(['admin', 'guest', 'student'], 'Неверная роль')
      .required('Роль обязательна'),
    avatarUrl: Yup.string().url('Неверный URL аватара'),
  });

  // Начальные значения формы
  const initialValues = {
    name: user?.name || '',
    email: user?.email || '',
    role: user?.role || 'guest',
    registrationDate: user?.registrationDate || '',
    avatarUrl: user?.avatarUrl || '',
    purchasedCourses: user?.purchasedCourses || {},
  };

  // Обработчик загрузки аватара
  const handleAvatarUpload = async (file) => {
    if (!file) return null;
    const storageRef = ref(storage, `avatars/${userId}`);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  };

  // Обработчик изменения файла аватара (предварительный просмотр)
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      const previewUrl = URL.createObjectURL(file);
      setAvatarPreview(previewUrl);
    }
  };

  // Обработчик отправки формы
  const handleSubmit = async (values, { setSubmitting }) => {
    if (!window.confirm('Вы уверены, что хотите сохранить изменения?')) {
      setSubmitting(false);
      return;
    }

    try {
      let updatedAvatarUrl = values.avatarUrl;
      if (avatarFile) {
        updatedAvatarUrl = await handleAvatarUpload(avatarFile);
      }

      const updatedData = {
        ...values,
        avatarUrl: updatedAvatarUrl,
      };

      await updateUser(userId, updatedData);
      toast.success('Пользователь успешно обновлен!');
      onBack();
    } catch (error) {
      toast.error('Ошибка при обновлении: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Функция для получения названия курса по ID
  const getCourseTitle = (courseId) => {
    const course = courses.find((c) => c.id === courseId);
    return course ? course.title : courseId;
  };

  if (!user) {
    return <p>Пользователь не найден.</p>;
  }

  return (
    <div className={scss.editUser}>
      <h2>Редактировать пользователя</h2>
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}>
        {({ values, setFieldValue, isSubmitting }) => (
          <Form className={scss.form}>
            {/* Имя */}
            <div className={scss.formGroup}>
              <label htmlFor='name'>Имя:</label>
              <Field type='text' id='name' name='name' className={scss.input} />
              <ErrorMessage name='name' component='div' className={scss.error} />
            </div>

            {/* Email */}
            <div className={scss.formGroup}>
              <label htmlFor='email'>Email:</label>
              <Field type='email' id='email' name='email' className={scss.input} />
              <ErrorMessage name='email' component='div' className={scss.error} />
            </div>

            {/* Роль */}
            <div className={scss.formGroup}>
              <label htmlFor='role'>Роль:</label>
              <Field as='select' id='role' name='role' className={scss.input}>
                <option value='admin'>Администратор</option>
                <option value='guest'>Гость</option>
                <option value='student'>Студент</option>
              </Field>
              <ErrorMessage name='role' component='div' className={scss.error} />
            </div>

            {/* Дата регистрации */}
            <div className={scss.formGroup}>
              <label htmlFor='registrationDate'>Дата регистрации:</label>
              <Field
                type='text'
                id='registrationDate'
                name='registrationDate'
                className={scss.input}
                disabled
              />
            </div>

            {/* URL аватара и загрузка файла */}
            <div className={scss.formGroup}>
              <label htmlFor='avatarUrl'>URL аватара:</label>
              <Field type='text' id='avatarUrl' name='avatarUrl' className={scss.input} />
              <ErrorMessage name='avatarUrl' component='div' className={scss.error} />
              <label htmlFor='avatarFile'>Или загрузите аватар:</label>
              <input
                type='file'
                id='avatarFile'
                accept='image/*'
                onChange={handleAvatarChange}
                className={scss.fileInput}
              />
              {avatarPreview && (
                <img
                  src={avatarPreview}
                  alt='Avatar Preview'
                  className={scss.avatarPreview}
                  onError={(e) => (e.target.src = '/img/defaultAvatar.webp')}
                />
              )}
            </div>

            {/* Купленные курсы */}
            <div className={scss.formGroup}>
              <label>Купленные курсы:</label>
              <ul className={scss.courseList}>
                {Object.keys(values.purchasedCourses).map((courseId) => (
                  <li key={courseId} className={scss.courseItem}>
                    <span>
                      {getCourseTitle(courseId)} (
                      {values.purchasedCourses[courseId].access === 'vanilla'
                        ? 'Vanilla'
                        : 'Standard'}
                      )
                    </span>
                    <div className={scss.courseActions}>
                      {/* Выпадающий список для редактирования пакета */}
                      <select
                        value={values.purchasedCourses[courseId].access}
                        onChange={(e) => {
                          setFieldValue('purchasedCourses', {
                            ...values.purchasedCourses,
                            [courseId]: {
                              ...values.purchasedCourses[courseId],
                              access: e.target.value,
                            },
                          });
                        }}
                        className={scss.packageSelect}>
                        <option value='vanilla'>Vanilla</option>
                        <option value='standard'>Standard</option>
                      </select>
                      <button
                        type='button'
                        onClick={() => {
                          if (window.confirm('Вы уверены, что хотите удалить этот курс?')) {
                            const updatedCourses = { ...values.purchasedCourses };
                            delete updatedCourses[courseId];
                            setFieldValue('purchasedCourses', updatedCourses);
                          }
                        }}
                        className={scss.removeCourseButton}>
                        Удалить
                      </button>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Добавление курса с выбором пакета */}
              <div className={scss.addCourseContainer}>
                <div className={scss.addCourseField}>
                  <label htmlFor='addCourse'>Добавить курс:</label>
                  <select
                    id='addCourse'
                    value={selectedCourse}
                    onChange={(e) => setSelectedCourse(e.target.value)}
                    className={scss.input}>
                    <option value='' disabled>
                      Выберите курс
                    </option>
                    {courses
                      .filter((course) => !Object.keys(values.purchasedCourses).includes(course.id))
                      .map((course) => (
                        <option key={course.id} value={course.id}>
                          {course.title}
                        </option>
                      ))}
                  </select>
                </div>

                <div className={scss.addCourseField}>
                  <label htmlFor='addCoursePackage'>Пакет:</label>
                  <select
                    id='addCoursePackage'
                    value={selectedPackage}
                    onChange={(e) => setSelectedPackage(e.target.value)}
                    className={scss.input}>
                    <option value='' disabled>
                      Выберите пакет
                    </option>
                    <option value='vanilla'>Vanilla</option>
                    <option value='standard'>Standard</option>
                  </select>
                </div>

                <button
                  type='button'
                  className={scss.addCourseButton}
                  onClick={() => {
                    if (selectedCourse && selectedPackage) {
                      {
                        setFieldValue('purchasedCourses', {
                          ...values.purchasedCourses,
                          [selectedCourse]: {
                            completedLessons: {},
                            progress: 0,
                            access: selectedPackage,
                          },
                        });
                        setSelectedCourse('');
                        setSelectedPackage('');
                      }
                    } else {
                      toast.error('Пожалуйста, выберите курс и пакет.');
                    }
                  }}>
                  Добавить
                </button>
              </div>
            </div>

            {/* Кнопки */}
            <div className={scss.actions}>
              <button type='submit' className={scss.saveButton} disabled={isSubmitting}>
                {isSubmitting ? 'Сохранение...' : 'Сохранить'}
              </button>
              <button type='button' onClick={onBack} className={scss.backButton}>
                Назад
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
}
