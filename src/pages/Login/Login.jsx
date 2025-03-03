import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { auth, db, getAuthToken } from '../../firebase'; // Добавляем db для Firestore
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore'; // Импортируем для работы с Firestore
import { Link, useNavigate } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();

  const initialValues = {
    email: '',
    password: '',
  };

  const validationSchema = Yup.object({
    email: Yup.string().email('Неверный формат email').required('Обязательное поле'),
    password: Yup.string().required('Обязательное поле'),
  });

  const handleSubmit = async (values, { setSubmitting, setFieldError }) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log('Роль пользователя:', userData.role);

        if (userData.role === 'admin') {
          try {
            const token = await user.getIdToken(true); // Убедимся, что получаем ID Token
            console.log('Получен токен для админа:', token);
            if (token) {
              window.location.href = `https://american-dashboard.vercel.app/dashboard?token=${encodeURIComponent(
                token,
              )}`;
            } else {
              throw new Error('Не удалось получить токен авторизации');
            }
          } catch (tokenError) {
            console.error('Ошибка при получении токена для админа:', tokenError);
            setFieldError('general', 'Ошибка при перенаправлении: ' + tokenError.message);
          }
        } else if (userData.role === 'student' || userData.role === 'guest') {
          try {
            const token = await user.getIdToken(true);
            console.log('Получен токен для студента/гостя:', token);
            if (token) {
              window.location.href = `https://lms-theta-nine.vercel.app/personal-account?token=${encodeURIComponent(
                token,
              )}`;
            } else {
              window.location.href = 'https://lms-theta-nine.vercel.app/personal-account';
            }
          } catch (tokenError) {
            console.error('Ошибка при перенаправлении студента/гостя:', tokenError);
            setFieldError('general', 'Ошибка при перенаправлении: ' + tokenError.message);
          }
        } else {
          setFieldError('general', 'Неизвестная роль пользователя');
        }
      } else {
        console.error('Ошибка при загрузке данных пользователя');
        setFieldError('general', 'Данные пользователя не найдены в базе данных');
        window.location.href = 'https://lms-theta-nine.vercel.app/login';
      }
    } catch (error) {
      if (
        error.code === 'auth/user-not-found' ||
        error.code === 'auth/wrong-password' ||
        error.code === 'auth/invalid-credential'
      ) {
        setFieldError('general', 'Неверный email или пароль');
      } else {
        setFieldError('general', 'Ошибка входа: ' + error.message);
      }
    }
    setSubmitting(false);
  };

  return (
    <div>
      <h2>Вход</h2>
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}>
        {({ isSubmitting, errors }) => (
          <Form>
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
              Нет аккаунта? <Link to='/signUp'>Зарегистрироваться</Link>
            </p>
            <button type='submit' disabled={isSubmitting}>
              Войти
            </button>
          </Form>
        )}
      </Formik>
    </div>
  );
}
