import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { auth, db } from '../../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { userRole, isLoading } = useAuth(); // Используем контекст
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (userRole) {
      if (userRole === 'admin') {
        navigate('/dashboard');
      } else {
        navigate('/personal-account');
      }
    }
  }, [userRole, navigate]);

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
        // Роль уже обновится через AuthContext
        navigate(userData.role === 'admin' ? '/dashboard' : '/personal-account');
      } else {
        navigate('/personal-account');
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

  if (isLoading) {
    return <div>Загрузка...</div>;
  }

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
            <div style={{ position: 'relative' }}>
              <Field
                type={showPassword ? 'text' : 'password'}
                name='password'
                placeholder='Пароль'
                style={{ paddingRight: '30px' }}
              />
              <button
                type='button'
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  fontSize: '16px',
                }}>
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
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
