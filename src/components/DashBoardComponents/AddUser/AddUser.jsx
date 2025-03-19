// components/admin/AddUser.jsx
import { Formik, Form, Field, ErrorMessage } from 'formik';
import { useAdmin } from '../../../context/AdminContext';
import { useState } from 'react';

export default function AddUser() {
  const { addUser, error: adminError } = useAdmin();
  const [errorMessage, setErrorMessage] = useState('');

  const initialValues = {
    name: '',
    email: '',
    courseName: '',
    coursePackage: '',
    role: '',
  };

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      const registrationDate = new Date().toISOString();

      const userData = {
        name: values.name,
        email: values.email,
        registrationDate: registrationDate,
        courseName: values.courseName,
        coursePackage: values.coursePackage,
        role: values.role,
      };

      await addUser(userData);
      setErrorMessage('');
      resetForm();
    } catch (error) {
      setErrorMessage(error.message);
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

  return (
    <div>
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
            {(errorMessage || adminError) && (
              <div style={{ color: 'red' }}>{errorMessage || adminError}</div>
            )}
            <button type='submit' disabled={isSubmitting}>
              {isSubmitting ? 'Отправка...' : 'Зарегистрировать'}
            </button>
          </Form>
        )}
      </Formik>
    </div>
  );
}
