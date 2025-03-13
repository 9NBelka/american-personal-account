import { Link } from 'react-router-dom';
import scss from './AccountInfoForCompany.module.scss';
import clsx from 'clsx';

export default function AccountInfoForCompany() {
  return (
    <div className={scss.accountCompanyBlock}>
      <h3 className={scss.title}>Do you have company?</h3>
      <p className={scss.desciption}>
        We have a <span>special offer</span> for you.
      </p>
      <p className={clsx(scss.desciption, scss.margTop)}>
        Fill out the form to be the first to receive great offers and promotions
      </p>
      <div className={scss.buttonBlock}>
        <Link to='' className={scss.button}>
          Fill out the form
        </Link>
      </div>
    </div>
  );
}
