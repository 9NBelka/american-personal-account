import { Field, ErrorMessage } from 'formik';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { useState } from 'react';
import scss from './LSPasswordField.module.scss';

export default function LSPasswordField({ name, placeholder }) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className={scss.inputFieldAndError}>
      <div className={scss.lsInputField}>
        <Field type={showPassword ? 'text' : 'password'} name={name} placeholder={placeholder} />
        <button type='button' onClick={() => setShowPassword(!showPassword)}>
          {showPassword ? <FaEyeSlash className={scss.icon} /> : <FaEye className={scss.icon} />}
        </button>
      </div>
      <ErrorMessage name={name} component='p' />
    </div>
  );
}
