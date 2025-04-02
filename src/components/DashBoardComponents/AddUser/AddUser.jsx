import scss from './AddUser.module.scss';
import { useEffect, useState } from 'react';
import { useAdmin } from '../../../context/AdminContext';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import UserInfoForm from '../EditUser/UserInfoForm/UserInfoForm';
import AddCourseForm from '../EditUser/AddCourseForm/AddCourseForm';
import FormActions from '../EditUser/FormActions/FormActions';

export default function AddUser({ onBack }) {
  const { addUser, users, courses, fetchAllCourses, accessLevels } = useAdmin();
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedPackage, setSelectedPackage] = useState('');

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
  });

  // Начальные значения формы
  const initialValues = {
    name: '',
    email: '',
    role: '',
    registrationDate: new Date().toISOString(),
    purchasedCourses: {},
  };

  // Обработчик отправки формы
  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    const existingUser = users.find((u) => u.email === values.email);
    if (existingUser) {
      toast.error('Пользователь с таким email уже существует.');
      setSubmitting(false);
      return;
    }

    if (!window.confirm('Вы уверены, что хотите зарегистрировать пользователя?')) {
      setSubmitting(false);
      return;
    }

    try {
      await addUser(values);
      toast.success(
        'Пользователь успешно зарегистрирован! Ссылка для установки пароля отправлена на email.',
      );
      resetForm();
      if (typeof onBack === 'function') {
        onBack();
      } else {
        console.warn('onBack is not a function');
      }
    } catch (error) {
      toast.error('Ошибка при регистрации: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Функция для получения названия курса по ID
  const getCourseTitle = (courseId) => {
    const course = courses.find((c) => c.id === courseId);
    return course ? course.title : courseId;
  };

  return (
    <div className={scss.addUser}>
      <h2>Регистрация пользователя</h2>
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}>
        {({ values, setFieldValue, isSubmitting, initialValues }) => (
          <Form className={scss.form}>
            <UserInfoForm values={values} initialValues={initialValues} />
            <AddCourseForm
              courses={courses}
              values={values}
              setFieldValue={setFieldValue}
              selectedCourse={selectedCourse}
              setSelectedCourse={setSelectedCourse}
              selectedPackage={selectedPackage}
              setSelectedPackage={setSelectedPackage}
              getCourseTitle={getCourseTitle}
              accessLevels={accessLevels} // Передаем accessLevels
            />
            <FormActions
              isSubmitting={isSubmitting}
              onBack={onBack}
              submitButtonText={isSubmitting ? 'Регистрация...' : 'Зарегистрировать'}
              submitButtonClass={scss.submitButton}
              backButtonClass={scss.backButton}
            />
          </Form>
        )}
      </Formik>
    </div>
  );
}
