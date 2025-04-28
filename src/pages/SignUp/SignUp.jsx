import * as Yup from 'yup';
import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  signUp,
  loginWithGoogle,
  loginWithGithub,
  login,
  linkAccount,
} from '../../store/slices/authSlice';
import { GoogleAuthProvider, GithubAuthProvider } from 'firebase/auth';
import LSAuthForm from '../../components/LSAuthForm/LSAuthForm';
import scss from './SignUp.module.scss';
import { BsBoxArrowInRight } from 'react-icons/bs';
import LSPrivacyCheckbox from '../../components/LSPrivacyCheckbox/LSPrivacyCheckbox';
import AccountLoadingIndicator from '../../components/AccountLoadingIndicator/AccountLoadingIndicator';

export default function SignUp() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { userRole, isLoading, error } = useSelector((state) => state.auth);
  const [generalError, setGeneralError] = useState(null);
  const [linkAccountData, setLinkAccountData] = useState(null);
  const [tempCredential, setTempCredential] = useState(null); // Для временного хранения credential

  useEffect(() => {
    if (userRole) {
      navigate(userRole === 'admin' ? '/dashboard' : '/account');
    }
  }, [userRole, navigate]);

  useEffect(() => {
    if (error && error.code === 'auth/account-exists-with-different-credential') {
      setLinkAccountData({ email: error.email });
      setGeneralError(
        'This email is already registered. Please log in with your existing account to link it.',
      );
    } else if (error) {
      setGeneralError(error.message || 'Registration error');
    }
  }, [error]);

  const initialValues = linkAccountData
    ? {
        email: linkAccountData.email || '',
        password: '',
        agreeToPrivacy: false,
      }
    : {
        name: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        agreeToPrivacy: false,
      };

  const validationSchema = linkAccountData
    ? Yup.object({
        email: Yup.string().email('*Invalid email format').required('*Required field'),
        password: Yup.string().required('*Required field'),
        agreeToPrivacy: Yup.boolean().oneOf([true], '*You must agree to the Privacy Policy'),
      })
    : Yup.object({
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
      if (linkAccountData && tempCredential) {
        // Если нужно связать аккаунт
        await dispatch(login({ email: values.email, password: values.password })).unwrap();
        await dispatch(linkAccount({ email: values.email, credential: tempCredential })).unwrap();
        setLinkAccountData(null);
        setTempCredential(null);
        setGeneralError(null);
        navigate('/login');
      } else {
        // Обычная регистрация
        await dispatch(
          signUp({
            name: values.name,
            lastName: values.lastName,
            email: values.email,
            password: values.password,
          }),
        ).unwrap();
        navigate('/login');
      }
    } catch (error) {
      if (linkAccountData) {
        if (
          error.code === 'auth/user-not-found' ||
          error.code === 'auth/wrong-password' ||
          error.code === 'auth/invalid-credential'
        ) {
          setGeneralError('*Incorrect email or password');
        } else {
          setGeneralError('*Login error: ' + error.message);
        }
      } else {
        if (error.code === 'auth/email-already-in-use') {
          setFieldError('email', 'This email is already in use');
        } else {
          setFieldError('general', 'Registration error: ' + error.message);
        }
      }
    }
    setSubmitting(false);
  };

  const handleGoogleSignUp = async () => {
    try {
      await dispatch(loginWithGoogle()).unwrap();
      navigate('/login');
    } catch (error) {
      if (error.code === 'auth/account-exists-with-different-credential') {
        const credential = GoogleAuthProvider.credentialFromError(error);
        setTempCredential(credential);
      }
    }
  };

  const handleGithubSignUp = async () => {
    try {
      await dispatch(loginWithGithub()).unwrap();
      navigate('/login');
    } catch (error) {
      if (error.code === 'auth/account-exists-with-different-credential') {
        const credential = GithubAuthProvider.credentialFromError(error);
        setTempCredential(credential);
      }
    }
  };

  if (isLoading) {
    return <AccountLoadingIndicator />;
  }

  const fields = linkAccountData
    ? [
        { name: 'email', type: 'email', placeholder: 'Email' },
        { name: 'password', type: 'password', placeholder: 'Password' },
      ]
    : [
        { name: 'name', type: 'text', placeholder: 'First Name' },
        { name: 'lastName', type: 'text', placeholder: 'Last Name' },
        { name: 'email', type: 'email', placeholder: 'Email' },
        { name: 'password', type: 'password', placeholder: 'Password' },
        { name: 'confirmPassword', type: 'password', placeholder: 'Confirm password' },
      ];

  const halfInput = !linkAccountData;

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
              title={linkAccountData ? 'Link Your Account' : 'Create an account'}
              fields={fields}
              submitText={linkAccountData ? 'Link Account' : 'Create an account'}
              linkText={linkAccountData ? 'Don’t want to link?' : 'Already have an account?'}
              linkToText={linkAccountData ? 'Cancel' : 'Log in'}
              linkTo={linkAccountData ? '/signUp' : '/login'}
              isSubmitting={isLoading}
              halfInput={halfInput}
              otherPointsText={linkAccountData ? 'Link' : 'Register'}
              generalError={generalError}
              handleGoogleLogin={handleGoogleSignUp}
              handleGithubLogin={handleGithubSignUp}>
              <LSPrivacyCheckbox />
            </LSAuthForm>
          </div>
        </div>
      </div>
    </div>
  );
}
