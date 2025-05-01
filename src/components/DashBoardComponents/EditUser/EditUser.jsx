import scss from './EditUser.module.scss';
import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updateUser, fetchUsers } from '../../../store/slices/adminSlice';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import UserInfoForm from './UserInfoForm/UserInfoForm';
import PurchasedCourses from './PurchasedCourses/PurchasedCourses';
import AddCourseForm from './AddCourseForm/AddCourseForm';
import FormActions from './FormActions/FormActions';

export default function EditUser({ userId, onBack }) {
  const dispatch = useDispatch();

  // Получаем данные из Redux store
  const { users, courses, accessLevels } = useSelector((state) => state.admin);

  const user = users.find((u) => u.id === userId);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedPackage, setSelectedPackage] = useState('');

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  // Схема валидации с Yup
  const validationSchema = Yup.object({
    name: Yup.string().required('Имя обязательно'),
    email: Yup.string().email('Неверный формат email').required('Email обязателен'),
    role: Yup.string()
      .oneOf(['admin', 'guest', 'student', 'moderator'], 'Неверная роль')
      .required('Роль обязательна'),
  });

  // Начальные значения формы
  const initialValues = {
    name: user?.name || '',
    email: user?.email || '',
    role: user?.role || 'guest',
    registrationDate: user?.registrationDate || '',
    purchasedCourses: user?.purchasedCourses || {},
  };

  // Обработчик отправки формы
  const handleSubmit = async (values, { setSubmitting }) => {
    if (user?.role === 'admin') {
      toast.error('Редактирование данных администратора запрещено.');
      setSubmitting(false);
      return;
    }

    if (JSON.stringify(values) === JSON.stringify(initialValues)) {
      toast.info('Изменений не внесено.');
      setSubmitting(false);
      return;
    }

    if (!window.confirm('Вы уверены, что хотите сохранить изменения?')) {
      setSubmitting(false);
      return;
    }

    try {
      await dispatch(updateUser({ userId, updatedData: values })).unwrap();
      toast.success('Пользователь успешно обновлен!');
      onBack();
    } catch (error) {
      toast.error('Ошибка при обновлении: ' + error);
    } finally {
      setSubmitting(false);
    }
  };

  // Функция для получения названия курса по ID
  const getCourseTitle = (courseId) => {
    const course = courses.find((c) => c.id === courseId);
    return course ? course.title : courseId;
  };

  // Функция для получения названия уровня доступа по ID
  const getAccessLevelName = (accessId) => {
    const accessLevel = accessLevels.find((level) => level.id === accessId);
    return accessLevel ? accessLevel.name : accessId || 'Не указан';
  };

  if (!user) {
    return <p>Пользователь не найден.</p>;
  }

  return (
    <div className={scss.editUser}>
      <h2>Редактировать пользователя</h2>
      {user?.role === 'admin' && (
        <p className={scss.warning}>Редактирование администратора запрещено.</p>
      )}
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}>
        {({ values, setFieldValue, isSubmitting, initialValues }) => (
          <Form className={scss.form}>
            <UserInfoForm values={values} initialValues={initialValues} />
            <PurchasedCourses
              values={values}
              setFieldValue={setFieldValue}
              getCourseTitle={getCourseTitle}
              getAccessLevelName={getAccessLevelName}
              accessLevels={accessLevels}
              courses={courses}
            />
            <AddCourseForm
              courses={courses}
              values={values}
              setFieldValue={setFieldValue}
              selectedCourse={selectedCourse}
              setSelectedCourse={setSelectedCourse}
              selectedPackage={selectedPackage}
              setSelectedPackage={setSelectedPackage}
              getCourseTitle={getCourseTitle}
              accessLevels={accessLevels}
            />
            <FormActions isSubmitting={isSubmitting} onBack={onBack} />
          </Form>
        )}
      </Formik>
    </div>
  );
}
