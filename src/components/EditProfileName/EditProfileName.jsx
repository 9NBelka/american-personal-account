import scss from './EditProfileName.module.scss';

export default function EditProfileName({
  loadingName,
  nameError,
  handleNameUpdate,
  MAX_NAME_LENGTH,
  name,
  setName,
}) {
  return (
    <div className={scss.formGroup}>
      <label htmlFor='name'>
        Name <span>(max {MAX_NAME_LENGTH} characters)</span>
      </label>
      <input
        type='text'
        id='name'
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder='Enter your name'
        maxLength={MAX_NAME_LENGTH}
        disabled={loadingName}
      />
      {nameError && <p className={scss.error}>{nameError}</p>}
      <button
        type='button'
        className={scss.submitButton}
        onClick={handleNameUpdate}
        disabled={loadingName}>
        {loadingName ? 'Saving...' : 'Update Name'}
      </button>
    </div>
  );
}
