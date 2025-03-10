import { Field, ErrorMessage } from 'formik';
import scss from './LSInputField.module.scss';

export default function LSInputField({ name, type = 'text', placeholder }) {
  return (
    <div className={scss.lsInputField}>
      <Field type={type} name={name} placeholder={placeholder} />
      <ErrorMessage name={name} component='p' />
    </div>
  );
}
