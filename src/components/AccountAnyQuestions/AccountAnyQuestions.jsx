import scss from './AccountAnyQuestions.module.scss';

export default function AccountAnyQuestions() {
  return (
    <div className={scss.accountAnyQuestionsBlock}>
      <div className={scss.accountAnyQuestionsBlockImage}>
        <img src='/img/AnyQuestionsGirl.png' />
        <img className={scss.imageDragon} src='/img/AnyQuestionsDragon.png' />
      </div>
      <div className={scss.titleAndButtonBlock}>
        <h4>Any questions?</h4>
        <div className={scss.buttonAskBlock}>
          <a href='' className={scss.buttonAsk}>
            Ask
          </a>
        </div>
      </div>
    </div>
  );
}
