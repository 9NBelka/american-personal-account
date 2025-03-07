import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { auth, db } from '../../firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';

export default function SignUp() {
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
      const registrationDate = new Date().toISOString();

      await setDoc(doc(db, 'users', userCredential.user.uid), {
        name: values.name,
        email: values.email,
        role: 'guest',
        registrationDate: registrationDate,
      });

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

  if (isLoading) {
    return <div>Загрузка...</div>;
  }

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
