import clsx from 'clsx';
import scss from './AmountUsers.module.scss';
import {
  BsAirplaneFill,
  BsBriefcaseFill,
  BsCartCheckFill,
  BsFillMortarboardFill,
  BsFillPeopleFill,
} from 'react-icons/bs';

export default function AmountUsers({ roleCounts }) {
  return (
    <div className={scss.amountBlocks}>
      <div className={clsx(scss.amountBlock, scss.blueGradient)}>
        <div className={scss.amountBlockText}>
          <h5 className={scss.amountTitle}>Всего пользователей </h5>
          <p className={scss.amountNumb}>{roleCounts.all}</p>
          <br></br>
        </div>
        <div className={scss.iconBlock}>
          <BsFillPeopleFill className={scss.amountIcon} />
        </div>
      </div>
      <div className={clsx(scss.amountBlock, scss.greenGradient)}>
        <div className={scss.amountBlockText}>
          <h5 className={scss.amountTitle}>Всего студентов </h5>
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
          <h5 className={scss.amountTitle}>Всего гостей </h5>
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
          <h5 className={scss.amountTitle}>Последняя регистрация </h5>
          <p className={scss.amountNumb}>{roleCounts.all}</p>
          <br></br>
        </div>
        <div className={scss.iconBlock}>
          <BsAirplaneFill className={scss.amountIcon} />
        </div>
      </div>
    </div>
  );
}
