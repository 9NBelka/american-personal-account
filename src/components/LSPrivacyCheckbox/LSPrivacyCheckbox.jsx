import { Field, ErrorMessage } from 'formik';
import scss from './LSPrivacyCheckbox.module.scss';
import { Link } from 'react-router-dom';

export default function LSPrivacyCheckbox() {
  return (
    <div className={scss.checkboxContainer}>
      <label>
        <Field type='checkbox' name='agreeToPrivacy' className={scss.checkbox} as='input' />
        <span className={scss.checkmark}></span>
        <p className={scss.text}>
          I agree to the{' '}
          <Link to='/privacy-policy' className={scss.link}>
            Privacy Policy
          </Link>
        </p>
      </label>
      <ErrorMessage name='agreeToPrivacy' component='p' className={scss.error} />
    </div>
  );
}
