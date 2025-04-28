import * as Yup from 'yup';
import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  login,
  resetPassword,
  loginWithGoogle,
  loginWithGithub,
  linkAccount,
} from '../../store/slices/authSlice';
import scss from './Login.module.scss';
import LSAuthForm from '../../components/LSAuthForm/LSAuthForm';
import { BsBoxArrowInRight } from 'react-icons/bs';
import LSPrivacyCheckbox from '../../components/LSPrivacyCheckbox/LSPrivacyCheckbox';
import AccountLoadingIndicator from '../../components/AccountLoadingIndicator/AccountLoadingIndicator';
import LSResetPasswordModal from '../../components/LSResetPasswordModal/LSResetPasswordModal';

export default function Login() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { userRole, isLoading, error } = useSelector((state) => state.auth);
  const [showResetModal, setShowResetModal] = useState(false);
  const [generalError, setGeneralError] = useState(null);
  const [linkAccountData, setLinkAccountData] = useState(null); // Для хранения данных для связывания

  useEffect(() => {
    if (userRole) {
      navigate(userRole === 'admin' ? '/dashboard' : '/account');
    }
  }, [userRole, navigate]);

  useEffect(() => {
    if (error && error.code === 'auth/account-exists-with-different-credential') {
      setLinkAccountData({ email: error.email, credential: error.credential });
      setGeneralError(
        'This email is already used with another provider. Please log in with your existing account to link them.',
      );
    } else if (error) {
      setGeneralError(error);
    }
  }, [error]);

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

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      if (linkAccountData) {
        // Если нужно связать аккаунт
        await dispatch(login({ email: values.email, password: values.password })).unwrap();
        await dispatch(linkAccount(linkAccountData)).unwrap();
        setLinkAccountData(null);
        setGeneralError(null);
      } else {
        await dispatch(login({ email: values.email, password: values.password })).unwrap();
        setGeneralError(null);
      }
    } catch (error) {
      if (
        error.code === 'auth/user-not-found' ||
        error.code === 'auth/wrong-password' ||
        error.code === 'auth/invalid-credential'
      ) {
        setGeneralError('*Incorrect email or password');
      } else {
        setGeneralError('*Login error: ' + error.message);
      }
    }
    setSubmitting(false);
  };

  const handleGoogleLogin = async () => {
    try {
      await dispatch(loginWithGoogle()).unwrap();
      setGeneralError(null);
    } catch (error) {
      // Ошибка обрабатывается в useEffect
    }
  };

  const handleGithubLogin = async () => {
    try {
      await dispatch(loginWithGithub()).unwrap();
      setGeneralError(null);
    } catch (error) {
      // Ошибка обрабатывается в useEffect
    }
  };

  const handleForgotPassword = () => {
    setShowResetModal(true);
  };

  const handleResetPassword = async (email) => {
    try {
      const result = await dispatch(resetPassword(email)).unwrap();
      return result;
    } catch (error) {
      throw new Error('Failed to reset password. Please try again.');
    }
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
              title={linkAccountData ? 'Link Your Account' : 'Login to your account'}
              fields={fields}
              submitText={linkAccountData ? 'Link Account' : 'Login'}
              linkText='Don`t have an account?'
              linkToText='Sign In'
              linkTo='/signUp'
              isSubmitting={isLoading}
              onForgotPassword={handleForgotPassword}
              generalError={generalError}
              handleGoogleLogin={handleGoogleLogin} // Передаем обработчик
              handleGithubLogin={handleGithubLogin} // Передаем обработчик
            >
              <LSPrivacyCheckbox />
            </LSAuthForm>
            <LSResetPasswordModal
              isOpen={showResetModal}
              onClose={() => setShowResetModal(false)}
              resetPassword={handleResetPassword}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
