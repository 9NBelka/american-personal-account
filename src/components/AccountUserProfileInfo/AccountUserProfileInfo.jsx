import React from 'react';
import scss from './AccountUserProfileInfo.module.scss';
import { BsDiscord, BsGithub, BsTelegram, BsYoutube } from 'react-icons/bs';
import clsx from 'clsx';

export default function AccountUserProfileInfo({ userName, userRole, registrationDate, error }) {
  // Функция для вычисления количества дней между двумя датами
  const calculateDaysSinceRegistration = (regDate) => {
    if (!regDate) return 0; // Или другое значение по умолчанию
    const registration = new Date(regDate);
    if (isNaN(registration.getTime())) return 0; // Проверка на валидность даты

    const today = new Date();
    registration.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    const timeDifference = today - registration;
    const daysDifference = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
    return daysDifference;
  };

  const daysSinceRegistration = calculateDaysSinceRegistration(registrationDate);

  return (
    <div className={scss.userProfileMain}>
      <h1>Dashboard</h1>
      <div className={scss.userProfileBlock}>
        <div>
          <p className={scss.welcomeText}>
            Welcome, <span>{userName}</span>! Your training is here
          </p>
          {/* <p className={scss.welcomeText}>Your role: {userRole}</p> */}
          {/* <p className={scss.welcomeText}>
            Дата регистрации: {new Date(registrationDate).toLocaleString()}
          </p> */}
          <p className={clsx(scss.welcomeText, scss.anotherColor)}>
            With us for <span>{daysSinceRegistration}</span> days!
          </p>
          {/* {error && <p style={{ color: 'red' }}>Ошибка: {error}</p>} */}
        </div>
        <div className={scss.userProfileSocialBlock}>
          <a href=''>
            <BsYoutube className={scss.icon} />
          </a>
          <a href=''>
            <BsTelegram className={scss.icon} />
          </a>
          <a href=''>
            <BsDiscord className={scss.icon} />
          </a>
          <a href=''>
            <BsGithub className={scss.icon} />
          </a>
        </div>
      </div>
    </div>
  );
}
