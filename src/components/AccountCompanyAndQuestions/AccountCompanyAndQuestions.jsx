import AccountAnyQuestions from '../AccountAnyQuestions/AccountAnyQuestions';
import AccountInfoForCompany from '../AccountInfoForCompany/AccountInfoForCompany';
import scss from './AccountCompanyAndQuestions.module.scss';

export default function AccountCompanyAndQuestions() {
  return (
    <div className={scss.accountCompanyAndQuestionsBlock}>
      <AccountInfoForCompany />
      <AccountAnyQuestions />
    </div>
  );
}
