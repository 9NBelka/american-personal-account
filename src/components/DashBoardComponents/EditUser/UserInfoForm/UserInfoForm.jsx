// components/admin/UserInfoForm.jsx
import { useSelector } from 'react-redux';
import scss from '../EditUser.module.scss';
import { Field, ErrorMessage } from 'formik';

export default function UserInfoForm({ values, initialValues, showRegistrationDate = true }) {
  const { userRole } = useSelector((state) => state.auth);
  return (
    <>
      {/* Имя */}
      <div className={scss.formGroup}>
        <label htmlFor='name'>Имя:</label>
        <Field
          type='text'
          id='name'
          name='name'
          className={`${scss.input} ${values.name !== initialValues.name ? scss.changed : ''}`}
        />
        <ErrorMessage name='name' component='div' className={scss.error} />
      </div>

      {/* Email */}
      <div className={scss.formGroup}>
        <label htmlFor='email'>Email:</label>
        <Field
          type='email'
          id='email'
          name='email'
          className={`${scss.input} ${values.email !== initialValues.email ? scss.changed : ''}`}
        />
        <ErrorMessage name='email' component='div' className={scss.error} />
      </div>

      {/* Роль */}
      <div className={scss.formGroup}>
        <label htmlFor='role'>Роль:</label>
        <Field
          as='select'
          id='role'
          name='role'
          className={`${scss.input} ${values.role !== initialValues.role ? scss.changed : ''}`}>
          <option value=''>Выберите роль</option>
          {userRole == 'admin' && <option value='admin'>Администратор</option>}
          <option value='guest'>Гость</option>
          <option value='student'>Студент</option>
          {userRole == 'admin' && <option value='student'>Модератор</option>}
        </Field>
        <ErrorMessage name='role' component='div' className={scss.error} />
      </div>

      {/* Дата регистрации (опционально) */}
      {showRegistrationDate && (
        <div className={scss.formGroup}>
          <label htmlFor='registrationDate'>Дата регистрации:</label>
          <Field
            type='text'
            id='registrationDate'
            name='registrationDate'
            className={scss.input}
            disabled
          />
        </div>
      )}
    </>
  );
}
