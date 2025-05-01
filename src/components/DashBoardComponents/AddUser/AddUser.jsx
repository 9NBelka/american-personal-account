import scss from './AddUser.module.scss';
import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { addUser, fetchCourses } from '../../../store/slices/adminSlice';
import { resetPassword } from '../../../store/slices/authSlice';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import UserInfoForm from '../EditUser/UserInfoForm/UserInfoForm';
import AddCourseForm from '../EditUser/AddCourseForm/AddCourseForm';
import FormActions from '../EditUser/FormActions/FormActions';
import { useNavigate } from 'react-router-dom';

export default function AddUser({ onBack }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { users, courses, accessLevels, status, error } = useSelector((state) => state.admin);
  const { user, userRole, isAuthInitialized } = useSelector((state) => state.auth);

  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedPackage, setSelectedPackage] = useState('');

  useEffect(() => {
    if (!isAuthInitialized) return;

    if (!user || !['admin', 'moderator'].includes(userRole)) {
      toast.error('Только администраторы и модераторы могут добавлять пользователей');
      navigate('/login');
      return;
    }

    dispatch(fetchCourses());
  }, [dispatch, user, userRole, isAuthInitialized, navigate]);

  const validationSchema = Yup.object({
    name: Yup.string().required('Имя обязательно'),
    email: Yup.string().email('Неверный формат email').required('Email обязателен'),
    role: Yup.string()
      .test(
        'restrict-admin-for-moderators',
        'Модераторы не могут назначать роль администратора',
        function (value) {
          return userRole === 'moderator' ? value !== 'admin' : true;
        },
      )
      .oneOf(['admin', 'guest', 'student', 'moderator'], 'Неверная роль')
      .required('Роль обязательна'),
  });

  const initialValues = {
    name: '',
    email: '',
    role: 'student',
    registrationDate: new Date().toISOString(),
    purchasedCourses: {},
  };

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    if (setSubmitting.isSubmitting) return;
    setSubmitting(true);

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
      const userData = {
        name: values.name,
        email: values.email,
        role: values.role,
        registrationDate: values.registrationDate,
        purchasedCourses: values.purchasedCourses,
      };

      await dispatch(addUser(userData)).unwrap();

      const resetResult = await dispatch(resetPassword(values.email)).unwrap();
      if (resetResult.success) {
        toast.success(
          `Пользователь ${values.name} успешно зарегистрирован! Ссылка для сброса пароля отправлена на ${values.email}.`,
          { autoClose: 5000 },
        );
      } else {
        toast.error('Пользователь создан, но не удалось отправить письмо для сброса пароля.');
      }

      resetForm();
      if (typeof onBack === 'function') {
        onBack();
      } else {
        console.warn('onBack is not a function');
      }
    } catch (error) {
      const errorMessage = typeof error === 'string' ? error : 'Неизвестная ошибка';
      toast.error(`Ошибка при регистрации: ${errorMessage}`);
    } finally {
      setSubmitting(false);
    }
  };

  const getCourseTitle = (courseId) => {
    const course = courses.find((c) => c.id === courseId);
    return course ? course.title : courseId;
  };

  if (!isAuthInitialized) {
    return <div>Инициализация авторизации...</div>;
  }

  if (!user || !['admin', 'moderator'].includes(userRole)) {
    return null;
  }

  return (
    <div className={scss.addUser}>
      <h2>Регистрация пользователя</h2>
      {error && <div className={scss.error}>{error}</div>}
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}>
        {({ values, setFieldValue, isSubmitting }) => (
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
              accessLevels={accessLevels}
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
