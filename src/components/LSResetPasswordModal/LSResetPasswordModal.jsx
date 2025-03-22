// LSResetPasswordModal.js
import * as Yup from 'yup';
import { Formik, Form } from 'formik';
import LSInputField from '../LSInputField/LSInputField';
import LSFormError from '../LSFormError/LSFormError';
import scss from './LSResetPasswordModal.module.scss';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function LSResetPasswordModal({ isOpen, onClose, resetPassword, isLoading }) {
  const validationSchema = Yup.object({
    resetEmail: Yup.string().email('*Invalid email format').required('*Required field'),
  });

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    onClose(); // Закрываем модалку при клике на оверлей
  };

  const handleModalClick = (e) => {
    e.stopPropagation(); // Предотвращаем закрытие при клике внутри модалки
  };

  return (
    <div className={scss.modalOverlay} onClick={handleOverlayClick}>
      <div className={scss.modal} onClick={handleModalClick}>
        <h3>Reset Password</h3>
        <Formik
          initialValues={{ resetEmail: '' }}
          validationSchema={validationSchema}
          onSubmit={async (values, { setSubmitting, setFieldError }) => {
            const result = await resetPassword(values.resetEmail);
            if (result.success) {
              toast.success('Ссылка отправлена!', {
                position: 'top-right',
                autoClose: 2000,
              }); // Показываем тост при успехе
              setTimeout(onClose, 2000); // Закрываем модалку через 2 секунды
            } else {
              setFieldError('general', result.message);
            }
            setSubmitting(false);
          }}>
          {({ isSubmitting, errors }) => (
            <Form>
              <LSInputField name='resetEmail' type='email' placeholder='Enter your email' />
              <LSFormError error={errors.general} />
              <div className={scss.modalButtons}>
                <button type='submit' disabled={isSubmitting || isLoading}>
                  Send Reset Link
                </button>
                <button type='button' onClick={onClose} disabled={isSubmitting || isLoading}>
                  Cancel
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
}
