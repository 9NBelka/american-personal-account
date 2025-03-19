import scss from './EditProfileAvatar.module.scss';

export default function EditProfileAvatar({
  avatarUrl,
  handleAvatarChange,
  avatarLoading,
  fileInputRef,
  handleCustomButtonClick,
  avatarFile,
  handleAvatarUpdate,
  avatarError,
}) {
  return (
    <div className={scss.formGroup}>
      <div className={scss.avatarPreview}>
        <img
          src={avatarUrl || '/img/defaultAvatar.webp'}
          alt='Avatar preview'
          className={scss.avatar}
        />
      </div>
      <label htmlFor='avatar'>(Image size should not exceed 5MB)</label>
      <input
        type='file'
        id='avatar'
        accept='image/*'
        onChange={handleAvatarChange}
        disabled={avatarLoading}
        className={scss.fileInput}
        ref={fileInputRef}
        style={{ display: 'none' }} // Скрываем стандартный инпут
      />
      {/* Кастомная кнопка */}
      <button
        type='button'
        className={scss.customFileButton}
        onClick={handleCustomButtonClick}
        disabled={avatarLoading}>
        Set new photo
      </button>
      {avatarFile && (
        <button
          type='button'
          className={scss.submitButton}
          onClick={handleAvatarUpdate}
          disabled={avatarLoading}>
          {avatarLoading ? 'Uploading...' : 'Update Avatar'}
        </button>
      )}
      {avatarError && <p className={scss.error}>{avatarError}</p>}
    </div>
  );
}
