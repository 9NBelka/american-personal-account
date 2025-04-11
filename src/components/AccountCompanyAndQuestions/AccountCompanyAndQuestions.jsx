import clsx from 'clsx';
import AccountAnyQuestions from '../AccountAnyQuestions/AccountAnyQuestions';
import AccountInfoForCompany from '../AccountInfoForCompany/AccountInfoForCompany';
import scss from './AccountCompanyAndQuestions.module.scss';

export default function AccountCompanyAndQuestions({ activeTimer }) {
  return (
    <div
      className={clsx(
        scss.accountCompanyAndQuestionsBlock,
        activeTimer && scss.accountCompanyAndQuestionsBlockMarg,
      )}>
      <AccountInfoForCompany />
      <AccountAnyQuestions />
    </div>
  );
}
