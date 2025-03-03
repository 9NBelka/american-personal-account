import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { auth, db } from '../../firebase'; // Добавляем db для Firestore
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore'; // Импортируем для работы с Firestore
import { useNavigate } from 'react-router-dom';

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

      // Получаем данные пользователя из Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        // Перенаправляем в зависимости от роли
        console.log(userData.role);
        if (userData.role === 'admin') {
          navigate('/dashboard');
        } else {
          navigate('/personal-account');
        }
      } else {
        // Если данных в Firestore нет (например, пользователь зарегистрировался, но данные не сохранились)
        navigate('/personal-account'); // По умолчанию перенаправляем на /account
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
            <button type='submit' disabled={isSubmitting}>
              Войти
            </button>
          </Form>
        )}
      </Formik>
    </div>
  );
}
