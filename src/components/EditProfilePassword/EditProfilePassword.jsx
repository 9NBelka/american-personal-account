import { FaEye, FaEyeSlash } from 'react-icons/fa';
import scss from './EditProfilePassword.module.scss';

export default function EditProfilePassword({
  loadingPassword,
  passwordError,
  showCurrentPassword,
  setShowCurrentPassword,
  showNewPassword,
  setShowNewPassword,
  handlePasswordUpdate,
  currentPassword,
  setCurrentPassword,
  newPassword,
  setNewPassword,
}) {
  return (
    <div className={scss.mainFormPasswordBlock}>
      <div className={scss.formGroup}>
        <label htmlFor='currentPassword'>Current Password</label>
        <div className={scss.passwordWrapper}>
          <input
            type={showCurrentPassword ? 'text' : 'password'}
            id='currentPassword'
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder='Enter current password'
            disabled={loadingPassword}
          />
          <button
            className={scss.eyeIcon}
            onClick={() => setShowCurrentPassword(!showCurrentPassword)}>
            {showCurrentPassword ? (
              <FaEyeSlash className={scss.icon} />
            ) : (
              <FaEye className={scss.icon} />
            )}
          </button>
        </div>
      </div>
      <div className={scss.formGroup}>
        <label htmlFor='newPassword'>
          New Password <span>(min 6 characters)</span>
        </label>
        <div className={scss.passwordWrapper}>
          <input
            type={showNewPassword ? 'text' : 'password'}
            id='newPassword'
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder='Enter new password'
            disabled={loadingPassword}
          />
          <button className={scss.eyeIcon} onClick={() => setShowNewPassword(!showNewPassword)}>
            {showNewPassword ? (
              <FaEyeSlash className={scss.icon} />
            ) : (
              <FaEye className={scss.icon} />
            )}
          </button>
        </div>
        {passwordError && <p className={scss.error}>{passwordError}</p>}
        <button
          type='button'
          className={scss.submitButton}
          onClick={handlePasswordUpdate}
          disabled={loadingPassword}>
          {loadingPassword ? 'Saving...' : 'Update Password'}
        </button>
      </div>
    </div>
  );
}
