import * as Yup from 'yup';
import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { login, resetPassword } from '../../store/slices/authSlice';
import scss from './Login.module.scss';
import LSAuthForm from '../../components/LSAuthForm/LSAuthForm';
import { BsBoxArrowInRight } from 'react-icons/bs';
import LSPrivacyCheckbox from '../../components/LSPrivacyCheckbox/LSPrivacyCheckbox';
import AccountLoadingIndicator from '../../components/AccountLoadingIndicator/AccountLoadingIndicator';
import LSResetPasswordModal from '../../components/LSResetPasswordModal/LSResetPasswordModal';

export default function Login() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { userRole, isLoading } = useSelector((state) => state.auth);
  const [showResetModal, setShowResetModal] = useState(false);
  const [generalError, setGeneralError] = useState(null);

  useEffect(() => {
    if (userRole) {
      navigate(['admin', 'moderator'].includes(userRole) ? '/dashboard' : '/account');
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

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      await dispatch(login({ email: values.email, password: values.password })).unwrap();
      setGeneralError(null);
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

  const handleForgotPassword = () => {
    setShowResetModal(true);
  };

  const handleResetPassword = async (email) => {
    try {
      const result = await dispatch(resetPassword(email)).unwrap();
      return result;
    } catch (error) {
      console.error('Password reset failed:', error);
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
              title='Login to your account'
              fields={fields}
              submitText='Login'
              linkText="Don't have an account?"
              linkToText='Sign In'
              linkTo='/signUp'
              isSubmitting={isLoading}
              otherPointsText='Log in'
              onForgotPassword={handleForgotPassword}
              generalError={generalError}>
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
