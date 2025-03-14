import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import scss from './EditProfile.module.scss';
import { BsEye, BsEyeSlash } from 'react-icons/bs';

export default function EditProfile() {
  const { user, userName, updateUserName, updateUserPassword } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loadingName, setLoadingName] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [nameError, setNameError] = useState(null);
  const [passwordError, setPasswordError] = useState(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const MAX_NAME_LENGTH = 15;

  useEffect(() => {
    if (userName) {
      setName(userName);
    }
  }, [userName]);

  const handleNameUpdate = async () => {
    setLoadingName(true);
    setNameError(null);

    try {
      if (name.length > MAX_NAME_LENGTH) {
        setNameError(`Name cannot exceed ${MAX_NAME_LENGTH} characters.`);
        return;
      }
      if (name && name !== userName) {
        await updateUserName(name);
        toast.success('Name updated successfully!');
      } else {
        setNameError('Please enter a new name to update.');
      }
    } catch (error) {
      console.error('Error updating name:', error);
      setNameError('Failed to update name. Try again.');
    } finally {
      setLoadingName(false);
    }
  };

  const handlePasswordUpdate = async () => {
    setLoadingPassword(true);
    setPasswordError(null);

    try {
      if (currentPassword && newPassword) {
        await updateUserPassword(currentPassword, newPassword);
        toast.success('Password updated successfully!');
        setCurrentPassword('');
        setNewPassword('');
      } else if (newPassword && !currentPassword) {
        setPasswordError('Please enter your current password to change it.');
      } else {
        setPasswordError('Please fill in both password fields.');
      }
    } catch (error) {
      console.error('Error updating password:', error);
      if (error.code === 'auth/wrong-password') {
        setPasswordError('Current password is incorrect.');
      } else {
        setPasswordError('Failed to update password. Try again.');
      }
    } finally {
      setLoadingPassword(false);
    }
  };

  return (
    <div className={scss.editProfileBackground}>
      <div className={scss.container}>
        <div className={scss.editProfile}>
          <h2>Edit Profile</h2>
          <div className={scss.form}>
            <div className={scss.formGroup}>
              <label htmlFor='name'>Name (max {MAX_NAME_LENGTH} characters)</label>
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
                <span
                  className={scss.eyeIcon}
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}>
                  {showCurrentPassword ? <BsEyeSlash /> : <BsEye />}
                </span>
              </div>
            </div>
            <div className={scss.formGroup}>
              <label htmlFor='newPassword'>New Password (min 6 characters)</label>
              <div className={scss.passwordWrapper}>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  id='newPassword'
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder='Enter new password'
                  disabled={loadingPassword}
                />
                <span className={scss.eyeIcon} onClick={() => setShowNewPassword(!showNewPassword)}>
                  {showNewPassword ? <BsEyeSlash /> : <BsEye />}
                </span>
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
        </div>
      </div>
    </div>
  );
}
