import * as Yup from 'yup';
import { Link, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import scss from './Login.module.scss';
import LSAuthForm from '../../components/LSAuthForm/LSAuthForm';
import { BsBoxArrowInRight } from 'react-icons/bs';
import LSPrivacyCheckbox from '../../components/LSPrivacyCheckbox/LSPrivacyCheckbox';
import AccountLoadingIndicator from '../../components/AccountLoadingIndicator/AccountLoadingIndicator';

export default function Login() {
  const navigate = useNavigate();
  const { userRole, isLoading, login } = useAuth();

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
      // Редирект произойдёт через useEffect после обновления userRole в AuthContext
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
            <img src='/src/assets/img/LogInImage.jpg' alt='loginImage' />
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
              linkText='Don`t have an account?'
              linkToText='Sign In'
              linkTo='/signUp'
              isSubmitting={isLoading}
              otherPointsText='Log in'>
              <LSPrivacyCheckbox />
            </LSAuthForm>
          </div>
        </div>
      </div>
    </div>
  );
}
