// components/admin/AddUser.jsx
import scss from './AddUser.module.scss';
import { useEffect, useState } from 'react';
import { useAdmin } from '../../../context/AdminContext';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import UserInfoForm from '../EditUser/UserInfoForm/UserInfoForm';
import AddCourseForm from '../EditUser/AddCourseForm/AddCourseForm';
import FormActions from '../EditUser/FormActions/FormActions';
import { db } from '../../../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions'; // Для вызова функции

export default function AddUser({ onBack }) {
  const { addUser, courses, fetchAllCourses } = useAdmin();
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedPackage, setSelectedPackage] = useState('');

  useEffect(() => {
    fetchAllCourses();
  }, [fetchAllCourses]);

  // Функция для генерации случайного пароля
  const generateRandomPassword = () => {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+';
    let password = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      password += charset[randomIndex];
    }
    return password;
  };

  // Схема валидации с Yup
  const validationSchema = Yup.object({
    name: Yup.string().required('Имя обязательно'),
    email: Yup.string().email('Неверный формат email').required('Email обязателен'),
    password: Yup.string()
      .min(6, 'Пароль должен быть не менее 6 символов')
      .required('Пароль обязателен'),
    role: Yup.string()
      .oneOf(['admin', 'guest', 'student'], 'Неверная роль')
      .required('Роль обязательна'),
  });

  // Начальные значения формы
  const initialValues = {
    name: '',
    email: '',
    password: '',
    role: '',
    registrationDate: new Date().toISOString(),
    purchasedCourses: {},
  };

  // Проверка email в Firestore через прямой запрос
  const checkEmailInFirestore = async (email) => {
    const q = query(collection(db, 'users'), where('email', '==', email));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  };

  // Обработчик отправки формы
  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    // 1. Проверяем, существует ли email в Firestore
    try {
      const emailExistsInFirestore = await checkEmailInFirestore(values.email);
      if (emailExistsInFirestore) {
        toast.error('Пользователь с таким email уже существует в базе данных.');
        setSubmitting(false);
        return;
      }
    } catch (error) {
      toast.error('Ошибка при проверке email в базе данных: ' + error.message);
      setSubmitting(false);
      return;
    }

    if (!window.confirm('Вы уверены, что хотите зарегистрировать пользователя?')) {
      setSubmitting(false);
      return;
    }

    try {
      // 2. Вызываем серверную функцию для создания пользователя
      const functions = getFunctions();
      const createUser = httpsCallable(functions, 'createUser');
      const result = await createUser({
        email: values.email,
        password: values.password,
        name: values.name,
        role: values.role,
        registrationDate: values.registrationDate,
        purchasedCourses: values.purchasedCourses,
      });

      console.log('Пользователь успешно создан:', result.data); // Отладка

      // 3. Локально обновляем состояние через addUser (опционально, если Firestore уже обновлён)
      await addUser({
        ...values,
        id: result.data.uid,
      });

      toast.success(
        'Пользователь успешно зарегистрирован! Ссылка для сброса пароля отправлена на email.',
      );
      resetForm();
      if (typeof onBack === 'function') {
        onBack();
      } else {
        console.warn('onBack is not a function');
      }
    } catch (error) {
      toast.error('Ошибка при регистрации: ' + error.message);
      console.error('Ошибка при регистрации:', error);
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
            <UserInfoForm
              values={values}
              initialValues={initialValues}
              setFieldValue={setFieldValue}
              generateRandomPassword={generateRandomPassword}
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
