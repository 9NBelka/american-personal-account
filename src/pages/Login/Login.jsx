import * as Yup from 'yup';
import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  login,
  resetPassword,
  signInWithGoogle,
  linkGoogleAccount,
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
  const { userRole, isLoading, error, user } = useSelector((state) => state.auth);
  const [showResetModal, setShowResetModal] = useState(false);
  const [generalError, setGeneralError] = useState(null);
  const [showLinkPrompt, setShowLinkPrompt] = useState(false);
  const [pendingEmail, setPendingEmail] = useState(null);
  const [pendingCredential, setPendingCredential] = useState(null);

  useEffect(() => {
    if (userRole) {
      navigate(userRole === 'admin' ? '/dashboard' : '/account');
    }
  }, [userRole, navigate]);

  useEffect(() => {
    if (error) {
      if (
        error.code === 'auth/user-not-found' ||
        error.code === 'auth/wrong-password' ||
        error.code === 'auth/invalid-credential'
      ) {
        setGeneralError('*Неверный email или пароль');
      } else if (error.code === 'auth/popup-closed-by-user') {
        setGeneralError('*Вход через Google был отменён');
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        setGeneralError(
          `*Этот email (${error.email}) уже используется с провайдером: ${error.methods.join(
            ', ',
          )}. Войдите через email/пароль, чтобы привязать Google-аккаунт.`,
        );
        setPendingEmail(error.email);
        setPendingCredential(error.credential); // Сохраняем credential
        setShowLinkPrompt(true);
      } else {
        setGeneralError(`*Ошибка: ${error.message || 'Неизвестная ошибка'}`);
      }
    } else {
      setGeneralError(null);
      setShowLinkPrompt(false);
      setPendingEmail(null);
      setPendingCredential(null);
    }
  }, [error]);

  const initialValues = {
    email: '',
    password: '',
    agreeToPrivacy: false,
  };

  const validationSchema = Yup.object({
    email: Yup.string().email('*Неверный формат email').required('*Обязательное поле'),
    password: Yup.string().required('*Обязательное поле'),
    agreeToPrivacy: Yup.boolean().oneOf(
      [true],
      '*Необходимо согласиться с политикой конфиденциальности',
    ),
  });

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      await dispatch(login({ email: values.email, password: values.password })).unwrap();
      setGeneralError(null);
      // Если пользователь вошёл через email/пароль и есть отложенный запрос на привязку Google
      if (showLinkPrompt && pendingEmail === values.email && pendingCredential) {
        await dispatch(linkGoogleAccount({ credential: pendingCredential })).unwrap();
        setShowLinkPrompt(false);
        setPendingEmail(null);
        setPendingCredential(null);
      }
    } catch (error) {
      // Ошибка обрабатывается в useEffect
    }
    setSubmitting(false);
  };

  const handleGoogleSignIn = async (email) => {
    try {
      await dispatch(signInWithGoogle(email)).unwrap();
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
      throw new Error('Не удалось сбросить пароль. Попробуйте снова.');
    }
  };

  if (isLoading) {
    return <AccountLoadingIndicator />;
  }

  const fields = [
    { name: 'email', type: 'email', placeholder: 'Email' },
    { name: 'password', type: 'password', placeholder: 'Пароль' },
  ];

  return (
    <div className={scss.backgroundLogin}>
      <div className={scss.container}>
        <div className={scss.mainBlock}>
          <div className={scss.imageAndLinkBlock}>
            <img src='/img/LogInImage.jpg' alt='loginImage' />
            <Link to=''>
              Назад на сайт <BsBoxArrowInRight className={scss.icon} />
            </Link>
          </div>
          <div className={scss.formBlock}>
            <LSAuthForm
              initialValues={initialValues}
              validationSchema={validationSchema}
              onSubmit={handleSubmit}
              onGoogleSignIn={handleGoogleSignIn}
              title='Вход в ваш аккаунт'
              fields={fields}
              submitText='Войти'
              linkText='Нет аккаунта?'
              linkToText='Зарегистрироваться'
              linkTo='/signUp'
              isSubmitting={isLoading}
              otherPointsText='Войти'
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
