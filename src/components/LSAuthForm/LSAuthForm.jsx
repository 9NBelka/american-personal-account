import { Formik, Form } from 'formik';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { signInWithGoogle } from '../../store/slices/authSlice';
import LSInputField from '../LSInputField/LSInputField';
import LSFormError from '../LSFormError/LSFormError';
import LSPasswordField from '../LSPasswordField/LSPasswordField';
import scss from './LSAuthForm.module.scss';
import clsx from 'clsx';
import { BsGoogle, BsGithub } from 'react-icons/bs';
import { useState } from 'react';
import * as Yup from 'yup';

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
  onForgotPassword,
  children,
  generalError,
}) {
  const dispatch = useDispatch();
  const { isLoading } = useSelector((state) => state.auth);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkError, setLinkError] = useState(null);
  const [linkEmail, setLinkEmail] = useState('');

  const linkValidationSchema = Yup.object({
    email: Yup.string().email('*Invalid email format').required('*Required field'),
    password: Yup.string().required('*Required field'),
  });

  const handleGoogleSignIn = async () => {
    try {
      console.log('Initiating Google sign-in');
      await dispatch(signInWithGoogle()).unwrap();
      setLinkError(null);
      setShowLinkModal(false);
    } catch (error) {
      console.error('Google sign-in error:', error);
      setLinkError(error || 'Google sign-in failed');
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
              {linkError && <div className={scss.errorText}>{linkError}</div>}
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
              <button
                type='button'
                className={scss.socialButton}
                onClick={handleGoogleSignIn}
                disabled={isLoading}>
                <BsGoogle className={scss.iconSocial} /> Google
              </button>
              <button type='button' className={scss.socialButton} disabled>
                <BsGithub className={scss.iconSocial} /> GitHub
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
}
