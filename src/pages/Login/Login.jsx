import * as Yup from 'yup';
import { auth, db } from '../../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { Link, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import scss from './Login.module.scss';
import LSAuthForm from '../../components/LSAuthForm/LSAuthForm';
import { BsBoxArrowInRight } from 'react-icons/bs';
import LSPrivacyCheckbox from '../../components/LSPrivacyCheckbox/LSPrivacyCheckbox';

export default function Login() {
  const navigate = useNavigate();
  const { userRole, isLoading } = useAuth();

  useEffect(() => {
    if (userRole) {
      navigate(userRole === 'admin' ? '/dashboard' : '/personal-account');
    }
  }, [userRole, navigate]);

  const initialValues = {
    email: '',
    password: '',
    agreeToPrivacy: false, // Новое поле для чекбокса
  };

  const validationSchema = Yup.object({
    email: Yup.string().email('*Invalid email format').required('*Required field'),
    password: Yup.string().required('*Required field'),
    agreeToPrivacy: Yup.boolean().oneOf([true], '*You must agree to the Privacy Policy'), // Обязательное поле
  });

  const handleSubmit = async (values, { setSubmitting, setFieldError }) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        navigate(userData.role === 'admin' ? '/dashboard' : '/personal-account');
      } else {
        navigate('/personal-account');
      }
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
    return <div>Загрузка...</div>;
  }

  const fields = [
    { name: 'email', type: 'email', placeholder: 'Email' },
    { name: 'password', type: 'password', placeholder: 'Password' },
  ];

  return (
    <div className={scss.container}>
      <div className={scss.mainBlock}>
        <div className={scss.imageAndLinkBlock}>
          <img src='/src/assets/img/LogInImage.webp' alt='loginImage' />
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
            {/* Передаем LSPrivacyCheckbox как дочерний элемент */}
            <LSPrivacyCheckbox />
          </LSAuthForm>
        </div>
      </div>
    </div>
  );
}
