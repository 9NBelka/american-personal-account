// components/admin/FormActions.jsx
import scss from '../EditUser.module.scss';

export default function FormActions({
  isSubmitting,
  onBack,
  submitButtonText = isSubmitting ? 'Сохранение...' : 'Сохранить',
  submitButtonClass = scss.saveButton,
  backButtonClass = scss.backButton,
}) {
  return (
    <div className={scss.actions}>
      <button type='submit' className={submitButtonClass} disabled={isSubmitting}>
        {submitButtonText}
      </button>
      <button type='button' onClick={onBack} className={backButtonClass}>
        Назад
      </button>
    </div>
  );
}
