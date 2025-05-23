// components/admin/AmountUsers/AmountUsers.jsx
import clsx from 'clsx';
import scss from './AmountUsers.module.scss';
import {
  BsAirplaneFill,
  BsBriefcaseFill,
  BsFillMortarboardFill,
  BsFillPeopleFill,
} from 'react-icons/bs';

export default function AmountUsers({ roleCounts, lastUser }) {
  // Функция для форматирования даты в формат DD.MM.YYYY
  const formatDate = (dateString) => {
    if (!dateString) return 'Нет даты';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  return (
    <div className={scss.amountBlocks}>
      <div className={clsx(scss.amountBlock, scss.blueGradient)}>
        <div className={scss.amountBlockText}>
          <h5 className={scss.amountTitle}>Всего пользователей</h5>
          <p className={scss.amountNumb}>{roleCounts.all}</p>
          <p className={scss.amountProcent}>общее количество</p>
        </div>
        <div className={scss.iconBlock}>
          <BsFillPeopleFill className={scss.amountIcon} />
        </div>
      </div>
      <div className={clsx(scss.amountBlock, scss.greenGradient)}>
        <div className={scss.amountBlockText}>
          <h5 className={scss.amountTitle}>Всего студентов</h5>
          <p className={scss.amountNumb}>{roleCounts.student}</p>
          <p className={scss.amountProcent}>
            {roleCounts.all > 0
              ? `${Math.round((roleCounts.student / roleCounts.all) * 100)}%`
              : '0%'}{' '}
            от общего числа
          </p>
        </div>
        <div className={scss.iconBlock}>
          <BsFillMortarboardFill className={scss.amountIcon} />
        </div>
      </div>
      <div className={clsx(scss.amountBlock, scss.orangeGradient)}>
        <div className={scss.amountBlockText}>
          <h5 className={scss.amountTitle}>Всего гостей</h5>
          <p className={scss.amountNumb}>{roleCounts.guest}</p>
          <p className={scss.amountProcent}>
            {roleCounts.all > 0
              ? `${Math.round((roleCounts.guest / roleCounts.all) * 100)}%`
              : '0%'}{' '}
            от общего числа
          </p>
        </div>
        <div className={scss.iconBlock}>
          <BsBriefcaseFill className={scss.amountIcon} />
        </div>
      </div>
      <div className={clsx(scss.amountBlock, scss.lightBlueGradient)}>
        <div className={scss.amountBlockText}>
          <h5 className={scss.amountTitle}>Последняя регистрация</h5>
          {lastUser ? (
            <>
              <p className={clsx(scss.amountNumb, scss.amountNumbBig)}>{lastUser.email}</p>
              <p className={scss.amountProcent}>
                {lastUser.role === 'admin'
                  ? 'Администратор'
                  : lastUser.role === 'student'
                  ? 'Студент'
                  : 'Гость'}{' '}
                | {formatDate(lastUser.registrationDate)}
              </p>
            </>
          ) : (
            <>
              <p className={scss.amountNumb}>Нет данных</p>
              <br />
            </>
          )}
        </div>
        <div className={scss.iconBlock}>
          <BsAirplaneFill className={scss.amountIcon} />
        </div>
      </div>
    </div>
  );
}
