// LSAuthForm.js
import { Formik, Form } from 'formik';
import { Link } from 'react-router-dom';
import LSInputField from '../LSInputField/LSInputField';
import LSFormError from '../LSFormError/LSFormError';
import LSPasswordField from '../LSPasswordField/LSPasswordField';
import scss from './LSAuthForm.module.scss';
import clsx from 'clsx';
import { BsGithub, BsGoogle } from 'react-icons/bs';

export default function LSAuthForm({
  initialValues,
  validationSchema,
  onSubmit,
  title,
  fields,
  submitText,
  linkText,
  linkToText,
  linkTo,
  isSubmitting,
  halfInput,
  otherPointsText,
  onForgotPassword, // Новый пропс
  children,
}) {
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
            {/* Добавляем ссылку "Забыл пароль?" */}
            {onForgotPassword && (
              <div className={scss.forgotPassword}>
                <Link
                  to='#'
                  onClick={(e) => {
                    e.preventDefault();
                    onForgotPassword();
                  }}>
                  Forgot password?
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
              <span>Or {otherPointsText} with</span>
            </div>
            <div className={scss.socialButtonsBlock}>
              <button type='button' className={scss.socialButton}>
                <BsGoogle className={scss.iconSocial} /> Google
              </button>
              <button type='button' className={scss.socialButton}>
                <BsGithub className={scss.iconSocial} /> GitHub
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
}
