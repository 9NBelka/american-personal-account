// SignUp.js
import * as Yup from 'yup';
import { Link, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import LSAuthForm from '../../components/LSAuthForm/LSAuthForm';
import scss from './SignUp.module.scss';
import { BsBoxArrowInRight } from 'react-icons/bs';
import LSPrivacyCheckbox from '../../components/LSPrivacyCheckbox/LSPrivacyCheckbox';
import AccountLoadingIndicator from '../../components/AccountLoadingIndicator/AccountLoadingIndicator';

export default function SignUp() {
  const navigate = useNavigate();
  const { userRole, isLoading, signUp, loginWithGoogle, loginWithGithub } = useAuth();

  useEffect(() => {
    if (userRole) {
      navigate(userRole === 'admin' ? '/dashboard' : '/account');
    }
  }, [userRole, navigate]);

  const initialValues = {
    name: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToPrivacy: false,
  };

  const validationSchema = Yup.object({
    name: Yup.string()
      .min(2, '*The name must contain at least 2 letters')
      .matches(/^[a-zA-Zа-яА-ЯёЁ\s]+$/, '*The name must contain only letters.')
      .required('*Required field'),
    lastName: Yup.string()
      .min(2, '*Last name must contain at least 2 letters')
      .matches(/^[a-zA-Zа-яА-ЯёЁ\s]+$/, '*The last name must contain only letters')
      .notRequired(),
    email: Yup.string().email('*Invalid email format').required('*Required field'),
    password: Yup.string()
      .min(6, '*Password must be at least 6 characters long')
      .required('*Required field'),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref('password'), null], '*Passwords must match')
      .required('*Required field'),
    agreeToPrivacy: Yup.boolean().oneOf([true], '*You must agree to the Privacy Policy'),
  });

  const handleSubmit = async (values, { setSubmitting, setFieldError }) => {
    try {
      await signUp(values.name, values.lastName, values.email, values.password);
      navigate('/login');
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        setFieldError('email', 'This email is already in use');
      } else {
        setFieldError('general', 'Registration error: ' + error.message);
      }
    }
    setSubmitting(false);
  };

  const handleGoogleSignUp = async () => {
    try {
      await loginWithGoogle();
      navigate('/account');
    } catch (error) {
      console.error('Google sign-up error:', error);
    }
  };

  const handleGithubSignUp = async () => {
    try {
      await loginWithGithub();
      navigate('/account');
    } catch (error) {
      console.error('GitHub sign-up error:', error);
    }
  };

  if (isLoading) {
    return <AccountLoadingIndicator />;
  }

  const fields = [
    { name: 'name', type: 'text', placeholder: 'First Name' },
    { name: 'lastName', type: 'text', placeholder: 'Last Name' },
    { name: 'email', type: 'email', placeholder: 'Email' },
    { name: 'password', type: 'password', placeholder: 'Password' },
    { name: 'confirmPassword', type: 'password', placeholder: 'Confirm password' },
  ];

  const halfInput = true;

  return (
    <div className={scss.backgroundSignUp}>
      <div className={scss.container}>
        <div className={scss.mainBlock}>
          <div className={scss.imageAndLinkBlock}>
            <img src='/img/SignUpImage.jpg' alt='loginImage' />
            <Link to=''>
              Back to WebSite <BsBoxArrowInRight className={scss.icon} />
            </Link>
          </div>
          <div className={scss.formBlock}>
            <LSAuthForm
              initialValues={initialValues}
              validationSchema={validationSchema}
              onSubmit={handleSubmit}
              title='Create an account'
              fields={fields}
              submitText='Create an account'
              linkText='Already have an account?'
              linkToText='Sing in'
              linkTo='/login'
              isSubmitting={isLoading}
              halfInput={halfInput}
              otherPointsText='Register'
              onGoogleLogin={handleGoogleSignUp} // Передаем обработчик для Google
              onGithubLogin={handleGithubSignUp} // Передаем обработчик для GitHub
            >
              <LSPrivacyCheckbox />
            </LSAuthForm>
          </div>
        </div>
      </div>
    </div>
  );
}
