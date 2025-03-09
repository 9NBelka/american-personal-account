import React from 'react';

export default function AccountUserProfileInfo({ userName, userRole, registrationDate, error }) {
  return (
    <div className='user-profile'>
      <h2>Профиль</h2>
      <p>Добро пожаловать, {userName}!</p>
      <p>Роль: {userRole}</p>
      <p>Дата регистрации: {new Date(registrationDate).toLocaleString()}</p>
      {error && <p style={{ color: 'red' }}>Ошибка: {error}</p>}
    </div>
  );
}
