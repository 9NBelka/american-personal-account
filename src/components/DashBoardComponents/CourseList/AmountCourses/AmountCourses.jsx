// components/admin/AmountCourses/AmountCourses.jsx
import clsx from 'clsx';
import scss from './AmountCourses.module.scss';
import {
  BsAirplaneFill,
  BsBriefcaseFill,
  BsFillMortarboardFill,
  BsFillPeopleFill,
} from 'react-icons/bs';

export default function AmountCourses({ categoryCounts, lastCourse }) {
  return (
    <div className={scss.amountBlocks}>
      <div className={clsx(scss.amountBlock, scss.blueGradient)}>
        <div className={scss.amountBlockText}>
          <h5 className={scss.amountTitle}>Всего</h5>
          <p className={scss.amountNumb}>{categoryCounts.all}</p>
          <p className={scss.amountProcent}>общее количество</p>
        </div>
        <div className={scss.iconBlock}>
          <BsFillPeopleFill className={scss.amountIcon} />
        </div>
      </div>
      <div className={clsx(scss.amountBlock, scss.greenGradient)}>
        <div className={scss.amountBlockText}>
          <h5 className={scss.amountTitle}>Всего курсов</h5>
          <p className={scss.amountNumb}>{categoryCounts.Course}</p>
          <p className={scss.amountProcent}>
            {categoryCounts.all > 0
              ? `${Math.round((categoryCounts.Course / categoryCounts.all) * 100)}%`
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
          <h5 className={scss.amountTitle}>Всего мастер-классов</h5>
          <p className={scss.amountNumb}>{categoryCounts['Master class']}</p>
          <p className={scss.amountProcent}>
            {categoryCounts.all > 0
              ? `${Math.round((categoryCounts['Master class'] / categoryCounts.all) * 100)}%`
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
          <h5 className={scss.amountTitle}>Последний</h5>
          {lastCourse ? (
            <>
              <p className={clsx(scss.amountNumb, scss.amountNumbBig)}>{lastCourse.title}</p>
              <p className={scss.amountProcent}>
                {lastCourse.category === 'Course' ? 'Курс' : 'Мастер-класс'}
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
