import { useState, useEffect } from 'react';
import { db, auth } from '../../firebase.js';
import { collection, addDoc, query, where, getDocs, doc, getDoc } from 'firebase/firestore'; // Все импорты из firestore
import { Formik, Form, Field, ErrorMessage } from 'formik';
import { useNavigate } from 'react-router-dom';

export default function DashBoard() {
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (!userDoc.exists() || userDoc.data().role !== 'admin') {
          navigate('/personal-account');
        }
      } else {
        navigate('/login');
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  if (isLoading) {
    return <div>Загрузка...</div>;
  }

  const initialValues = {
    name: '',
    email: '',
    courseName: '',
    coursePackage: '',
    role: '',
  };

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        setErrorMessage('Пользователь не авторизован');
        setSubmitting(false);
        return;
      }

      const usersQuery = query(collection(db, 'users'), where('email', '==', values.email));
      const querySnapshot = await getDocs(usersQuery);

      if (!querySnapshot.empty) {
        setErrorMessage('Пользователь с таким email уже существует');
        setSubmitting(false);
        return;
      }

      const registrationDate = new Date().toISOString();

      const userData = {
        name: values.name,
        email: values.email,
        registrationDate: registrationDate,
        courseName: values.courseName,
        coursePackage: values.coursePackage,
        role: values.role,
      };

      await addDoc(collection(db, 'users'), userData);

      setErrorMessage('');
      resetForm();
    } catch (error) {
      setErrorMessage('Ошибка при регистрации: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const validate = (values) => {
    const errors = {};
    if (!values.name) errors.name = 'Имя обязательно';
    if (!values.email) {
      errors.email = 'Почта обязательна';
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(values.email)) {
      errors.email = 'Неверный формат почты';
    }
    if (!values.courseName) errors.courseName = 'Курс обязателен';
    if (!values.coursePackage) errors.coursePackage = 'Пакет курса обязателен';
    if (!values.role) errors.role = 'Роль обязательна';
    return errors;
  };

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/login');
  };

  return (
    <div>
      <h2>Панель управления</h2>
      <button onClick={handleLogout}>Выйти</button>
      <h2>Регистрация пользователя</h2>
      <Formik initialValues={initialValues} validate={validate} onSubmit={handleSubmit}>
        {({ isSubmitting }) => (
          <Form>
            <div>
              <label htmlFor='name'>Имя:</label>
              <br />
              <Field type='text' name='name' id='name' />
              <ErrorMessage name='name' component='div' style={{ color: 'red' }} />
            </div>
            <div>
              <label htmlFor='email'>Почта:</label>
              <br />
              <Field type='email' name='email' id='email' />
              <ErrorMessage name='email' component='div' style={{ color: 'red' }} />
            </div>
            <div>
              <label htmlFor='courseName'>Курс:</label>
              <br />
              <Field as='select' name='courseName' id='courseName'>
                <option value=''>Выберите курс</option>
                <option value='Architecture'>Architecture</option>
                <option value='TeamLead'>TeamLead</option>
                <option value='UnitTesting'>UnitTesting</option>
                <option value='UtilityAI'>UtilityAI</option>
                <option value='Adressabless'>Adressabless</option>
                <option value='ECS'>ECS</option>
              </Field>
              <ErrorMessage name='courseName' component='div' style={{ color: 'red' }} />
            </div>
            <div>
              <label htmlFor='coursePackage'>Пакет курса:</label>
              <br />
              <Field as='select' name='coursePackage' id='coursePackage'>
                <option value=''>Выберите пакет</option>
                <option value='Ванила'>Ванила</option>
                <option value='Стандарт'>Стандарт</option>
              </Field>
              <ErrorMessage name='coursePackage' component='div' style={{ color: 'red' }} />
            </div>
            <div>
              <label htmlFor='role'>Роль:</label>
              <br />
              <Field as='select' name='role' id='role'>
                <option value=''>Выберите роль</option>
                <option value='guest'>guest</option>
                <option value='student'>student</option>
                <option value='admin'>admin</option>
              </Field>
              <ErrorMessage name='role' component='div' style={{ color: 'red' }} />
            </div>
            {errorMessage && <div style={{ color: 'red' }}>{errorMessage}</div>}
            <button type='submit' disabled={isSubmitting}>
              {isSubmitting ? 'Отправка...' : 'Зарегистрировать'}
            </button>
          </Form>
        )}
      </Formik>
    </div>
  );
}
