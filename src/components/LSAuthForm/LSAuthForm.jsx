import { Formik, Form } from 'formik';
import { Link } from 'react-router-dom';
import LSInputField from '../LSInputField/LSInputField';
import LSFormError from '../LSFormError/LSFormError';
import LSPasswordField from '../LSPasswordField/LSPasswordField';
import scss from './LSAuthForm.module.scss';
import clsx from 'clsx';
import { BsGoogle } from 'react-icons/bs';
import { useState } from 'react';
import * as Yup from 'yup';

export default function LSAuthForm({
  initialValues,
  validationSchema,
  onSubmit,
  onGoogleSignIn,
  title,
  fields,
  submitText,
  linkText,
  linkToText,
  linkTo,
  isSubmitting,
  halfInput,
  otherPointsText,
  onForgotPassword,
  children,
  generalError,
}) {
  const [showGoogleEmailPrompt, setShowGoogleEmailPrompt] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');

  const googleEmailValidationSchema = Yup.object({
    googleEmail: Yup.string().email('*Неверный формат email').required('*Обязательное поле'),
  });

  const handleGoogleSignIn = async (values, { setSubmitting }) => {
    try {
      await onGoogleSignIn(values.googleEmail);
      setShowGoogleEmailPrompt(false);
      setGoogleEmail('');
    } catch (error) {
      setSubmitting(false);
    }
  };

  return (
    <div className={scss.mainLSBlock}>
      <h2 className={scss.titleLS}>{title}</h2>
      <p className={scss.answerAboutAccount}>
        {linkText} <Link to={linkTo}> {linkToText}</Link>
      </p>
      <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={onSubmit}>
        {({ errors, isSubmitting: formikSubmitting }) => (
          <Form>
            <div className={clsx(scss.nameContainer, halfInput && scss.nameContainerHalf)}>
              {generalError && <div className={scss.errorText}>{generalError}</div>}
              {fields
                .slice(0, 2)
                .map((field, index) =>
                  field.type === 'password' ? (
                    <LSPasswordField
                      key={index}
                      name={field.name}
                      placeholder={field.placeholder}
                    />
                  ) : (
                    <LSInputField
                      key={index}
                      name={field.name}
                      type={field.type}
                      placeholder={field.placeholder}
                    />
                  ),
                )}
            </div>
            {fields
              .slice(2)
              .map((field, index) =>
                field.type === 'password' ? (
                  <LSPasswordField key={index} name={field.name} placeholder={field.placeholder} />
                ) : (
                  <LSInputField
                    key={index}
                    name={field.name}
                    type={field.type}
                    placeholder={field.placeholder}
                  />
                ),
              )}
            <LSFormError error={errors.general} />
            {children}
            {onForgotPassword && (
              <div className={scss.forgotPassword}>
                <Link
                  to='#'
                  onClick={(e) => {
                    e.preventDefault();
                    onForgotPassword();
                  }}>
                  Забыли пароль?
                </Link>
              </div>
            )}
            <button
              type='submit'
              disabled={formikSubmitting || isSubmitting}
              className={scss.buttonSubmit}>
              {submitText}
            </button>
            <div className={scss.orSeparator}>
              <span>Или {otherPointsText} через</span>
            </div>
            <div className={scss.socialButtonsBlock}>
              <button
                type='button'
                onClick={() => setShowGoogleEmailPrompt(true)}
                className={scss.socialButton}
                disabled={isSubmitting}>
                <BsGoogle className={scss.iconSocial} /> Google
              </button>
            </div>
          </Form>
        )}
      </Formik>

      {showGoogleEmailPrompt && (
        <div className={scss.googleEmailPrompt}>
          <h3>Введите ваш email для входа через Google</h3>
          <Formik
            initialValues={{ googleEmail: '' }}
            validationSchema={googleEmailValidationSchema}
            onSubmit={handleGoogleSignIn}>
            {({ errors, touched, isSubmitting: googleSubmitting }) => (
              <Form>
                <LSInputField
                  name='googleEmail'
                  type='email'
                  placeholder='Email'
                  value={googleEmail}
                  onChange={(e) => setGoogleEmail(e.target.value)}
                />
                {errors.googleEmail && touched.googleEmail && (
                  <div className={scss.errorText}>{errors.googleEmail}</div>
                )}
                <button
                  type='submit'
                  disabled={googleSubmitting || isSubmitting}
                  className={scss.buttonSubmit}>
                  Продолжить с Google
                </button>
                <button
                  type='button'
                  onClick={() => setShowGoogleEmailPrompt(false)}
                  className={scss.buttonCancel}>
                  Отмена
                </button>
              </Form>
            )}
          </Formik>
        </div>
      )}
    </div>
  );
}
