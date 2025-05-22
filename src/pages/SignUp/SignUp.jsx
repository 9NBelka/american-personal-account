import * as Yup from 'yup';
import { Link, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { signUp } from '../../store/slices/authSlice';
import LSAuthForm from '../../components/LSAuthForm/LSAuthForm';
import scss from './SignUp.module.scss';
import { BsBoxArrowInRight } from 'react-icons/bs';
import LSPrivacyCheckbox from '../../components/LSPrivacyCheckbox/LSPrivacyCheckbox';
import AccountLoadingIndicator from '../../components/AccountLoadingIndicator/AccountLoadingIndicator';

export default function SignUp() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { userRole, isLoading, error } = useSelector((state) => state.auth);

  useEffect(() => {
    if (userRole) {
      navigate(['admin', 'moderator'].includes(userRole) ? '/dashboard' : '/account');
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
      await dispatch(
        signUp({
          name: values.name,
          lastName: values.lastName,
          email: values.email,
          password: values.password,
        }),
      ).unwrap();
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
              linkToText='Log in'
              linkTo='/login'
              isSubmitting={isLoading}
              halfInput={halfInput}
              otherPointsText='Register'
              generalError={error?.message}>
              <LSPrivacyCheckbox />
            </LSAuthForm>
          </div>
        </div>
      </div>
    </div>
  );
}
