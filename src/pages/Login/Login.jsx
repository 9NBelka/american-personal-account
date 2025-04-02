// Login.js
import * as Yup from 'yup';
import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import scss from './Login.module.scss';
import LSAuthForm from '../../components/LSAuthForm/LSAuthForm';
import { BsBoxArrowInRight } from 'react-icons/bs';
import LSPrivacyCheckbox from '../../components/LSPrivacyCheckbox/LSPrivacyCheckbox';
import AccountLoadingIndicator from '../../components/AccountLoadingIndicator/AccountLoadingIndicator';
import LSResetPasswordModal from '../../components/LSResetPasswordModal/LSResetPasswordModal';

export default function Login() {
  const navigate = useNavigate();
  const { userRole, isLoading, login, loginWithGoogle, loginWithGithub, resetPassword } = useAuth();
  const [showResetModal, setShowResetModal] = useState(false);

  useEffect(() => {
    if (userRole) {
      navigate(userRole === 'admin' ? '/dashboard' : '/account');
    }
  }, [userRole, navigate]);

  const initialValues = {
    email: '',
    password: '',
    agreeToPrivacy: false,
  };

  const validationSchema = Yup.object({
    email: Yup.string().email('*Invalid email format').required('*Required field'),
    password: Yup.string().required('*Required field'),
    agreeToPrivacy: Yup.boolean().oneOf([true], '*You must agree to the Privacy Policy'),
  });

  const handleSubmit = async (values, { setSubmitting, setFieldError }) => {
    try {
      await login(values.email, values.password);
    } catch (error) {
      if (
        error.code === 'auth/user-not-found' ||
        error.code === 'auth/wrong-password' ||
        error.code === 'auth/invalid-credential'
      ) {
        setFieldError('general', '*Incorrect email or password');
      } else {
        setFieldError('general', '*Login error: ' + error.message);
      }
    }
    setSubmitting(false);
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (error) {
      console.error('Google login error:', error);
    }
  };

  const handleGithubLogin = async () => {
    try {
      await loginWithGithub();
    } catch (error) {
      console.error('GitHub login error:', error);
    }
  };

  const handleForgotPassword = () => {
    setShowResetModal(true);
  };

  if (isLoading) {
    return <AccountLoadingIndicator />;
  }

  const fields = [
    { name: 'email', type: 'email', placeholder: 'Email' },
    { name: 'password', type: 'password', placeholder: 'Password' },
  ];

  return (
    <div className={scss.backgroundLogin}>
      <div className={scss.container}>
        <div className={scss.mainBlock}>
          <div className={scss.imageAndLinkBlock}>
            <img src='/img/LogInImage.jpg' alt='loginImage' />
            <Link to=''>
              Back to WebSite <BsBoxArrowInRight className={scss.icon} />
            </Link>
          </div>
          <div className={scss.formBlock}>
            <LSAuthForm
              initialValues={initialValues}
              validationSchema={validationSchema}
              onSubmit={handleSubmit}
              title='Sing in to your account'
              fields={fields}
              submitText='Sing in'
              linkText='Don`t have an account?'
              linkToText='Sign Up'
              linkTo='/signUp'
              isSubmitting={isLoading}
              otherPointsText='Sign In'
              onForgotPassword={handleForgotPassword}
              onGoogleLogin={handleGoogleLogin} // Передаем обработчик для Google
              onGithubLogin={handleGithubLogin} // Передаем обработчик для GitHub
            >
              <LSPrivacyCheckbox />
            </LSAuthForm>
            <LSResetPasswordModal
              isOpen={showResetModal}
              onClose={() => setShowResetModal(false)}
              resetPassword={resetPassword}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
