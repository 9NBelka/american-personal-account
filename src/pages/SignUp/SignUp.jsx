import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { auth, db } from '../../firebase'; // Убедись, что путь правильный
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { Link, useNavigate } from 'react-router-dom';

export default function SignUp() {
  const navigate = useNavigate();

  const initialValues = {
    name: '',
    email: '',
    password: '',
  };

  const validationSchema = Yup.object({
    name: Yup.string().required('Обязательное поле'),
    email: Yup.string().email('Неверный формат email').required('Обязательное поле'),
    password: Yup.string()
      .min(6, 'Пароль должен быть минимум 6 символов')
      .required('Обязательное поле'),
  });

  const handleSubmit = async (values, { setSubmitting, setFieldError }) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        values.email,
        values.password,
      );
      // Получаем текущую дату и время
      const registrationDate = new Date().toISOString(); // Формат ISO для Firestore

      // Сохраняем данные в Firestore с добавлением role и registrationDate
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        name: values.name,
        email: values.email,
        role: 'guest', // Роль "guest" по умолчанию
        registrationDate: registrationDate, // Дата регистрации
      });

      // Опционально: обновление displayName в auth
      await updateProfile(userCredential.user, {
        displayName: values.name,
      });
      navigate('/login');
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        setFieldError('email', 'Этот email уже используется');
      } else {
        setFieldError('general', 'Ошибка регистрации: ' + error.message);
      }
    }
    setSubmitting(false);
  };

  return (
    <div>
      <h2>Регистрация</h2>
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}>
        {({ isSubmitting, errors }) => (
          <Form>
            <div>
              <Field type='text' name='name' placeholder='Имя' />
              <ErrorMessage name='name' component='div' style={{ color: 'red' }} />
            </div>
            <div>
              <Field type='email' name='email' placeholder='Email' />
              <ErrorMessage name='email' component='div' style={{ color: 'red' }} />
            </div>
            <div>
              <Field type='password' name='password' placeholder='Пароль' />
              <ErrorMessage name='password' component='div' style={{ color: 'red' }} />
            </div>
            {errors.general && <div style={{ color: 'red' }}>{errors.general}</div>}
            <p>
              Есть аккаунт? <Link to='/login'>Войти</Link>
            </p>
            <button type='submit' disabled={isSubmitting}>
              Зарегистрироваться
            </button>
            <button type='submit'>Google</button>
          </Form>
        )}
      </Formik>
    </div>
  );
}
