import React, { useState, useEffect, useRef } from 'react'; // Добавляем useRef
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import scss from './EditProfile.module.scss';
import EditProfilePassword from '../../components/EditProfilePassword/EditProfilePassword';
import EditProfileName from '../../components/EditProfileName/EditProfileName';
import EditProfileAvatar from '../../components/EditProfileAvatar/EditProfileAvatar';

export default function EditProfile() {
  const { user, userName, updateUserName, updateUserPassword, avatarUrl, updateUserAvatar } =
    useAuth();
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
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarError, setAvatarError] = useState(null);
  const fileInputRef = useRef(null); // Создаем реф для инпута

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

  const cropImageToSquare = (file) =>
    new Promise((resolve) => {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (e) => {
        img.src = e.target.result;
      };

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const size = Math.min(img.width, img.height);
        canvas.width = size;
        canvas.height = size;

        const offsetX = (img.width - size) / 2;
        const offsetY = (img.height - size) / 2;

        ctx.drawImage(img, offsetX, offsetY, size, size, 0, 0, size, size);

        canvas.toBlob((blob) => {
          resolve(new File([blob], file.name, { type: file.type }));
        }, file.type);
      };

      reader.readAsDataURL(file);
    });

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setAvatarError('Image size should not exceed 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        setAvatarError('Please select an image file');
        return;
      }

      const croppedFile = await cropImageToSquare(file);
      setAvatarFile(croppedFile);
      setAvatarError(null);
    }
  };

  const handleAvatarUpdate = async () => {
    if (!avatarFile) return;

    setAvatarLoading(true);
    setAvatarError(null);

    try {
      await updateUserAvatar(avatarFile);
      toast.success('Avatar updated successfully!');
      setAvatarFile(null);
    } catch (error) {
      setAvatarError('Failed to update avatar. Try again.');
    } finally {
      setAvatarLoading(false);
    }
  };

  // Функция для вызова клика по скрытому инпуту
  const handleCustomButtonClick = () => {
    if (!avatarLoading) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className={scss.editProfileBackground}>
      <div className={scss.container}>
        <div className={scss.editProfile}>
          <h1>Editing your profile</h1>
          <div className={scss.form}>
            <EditProfileAvatar
              avatarUrl={avatarUrl}
              handleAvatarChange={handleAvatarChange}
              avatarLoading={avatarLoading}
              fileInputRef={fileInputRef}
              avatarFile={avatarFile}
              handleAvatarUpdate={handleAvatarUpdate}
              handleCustomButtonClick={handleCustomButtonClick}
              avatarError={avatarError}
            />

            <EditProfileName
              MAX_NAME_LENGTH={MAX_NAME_LENGTH}
              name={name}
              setName={setName}
              loadingName={loadingName}
              handleNameUpdate={handleNameUpdate}
              nameError={nameError}
            />
            <EditProfilePassword
              loadingPassword={loadingPassword}
              passwordError={passwordError}
              showCurrentPassword={showCurrentPassword}
              setShowCurrentPassword={setShowCurrentPassword}
              showNewPassword={showNewPassword}
              setShowNewPassword={setShowNewPassword}
              handlePasswordUpdate={handlePasswordUpdate}
              currentPassword={currentPassword}
              setCurrentPassword={setCurrentPassword}
              newPassword={newPassword}
              setNewPassword={setNewPassword}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
