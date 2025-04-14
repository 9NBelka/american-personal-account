import scss from './AddUser.module.scss';
import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { addUser, fetchCourses } from '../../../store/slices/adminSlice';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import UserInfoForm from '../EditUser/UserInfoForm/UserInfoForm';
import AddCourseForm from '../EditUser/AddCourseForm/AddCourseForm';
import FormActions from '../EditUser/FormActions/FormActions';

export default function AddUser({ onBack }) {
  const dispatch = useDispatch();

  const { users, courses, accessLevels, status, error } = useSelector((state) => state.admin);

  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedPackage, setSelectedPackage] = useState('');

  useEffect(() => {
    dispatch(fetchCourses());
  }, [dispatch]);

  const validationSchema = Yup.object({
    name: Yup.string().required('Имя обязательно'),
    email: Yup.string().email('Неверный формат email').required('Email обязателен'),
    role: Yup.string()
      .oneOf(['admin', 'guest', 'student'], 'Неверная роль')
      .required('Роль обязательна'),
  });

  const initialValues = {
    name: '',
    email: '',
    role: 'student', // Значение по умолчанию
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
      const result = await dispatch(addUser(values)).unwrap();
      toast.success(
        `Пользователь ${values.name} успешно зарегистрирован! Ссылка для установки пароля: ${result.resetLink}`,
        { autoClose: false }, // Чтобы ссылка оставалась видна
      );
      resetForm();
      if (typeof onBack === 'function') {
        onBack();
      } else {
        console.warn('onBack is not a function');
      }
    } catch (error) {
      toast.error('Ошибка при регистрации: ' + error);
    } finally {
      setSubmitting(false);
    }
  };

  const getCourseTitle = (courseId) => {
    const course = courses.find((c) => c.id === courseId);
    return course ? course.title : courseId;
  };

  return (
    <div className={scss.addUser}>
      <h2>Регистрация пользователя</h2>
      {error && <div className={scss.error}>{error}</div>}
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
