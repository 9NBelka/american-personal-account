import scss from './NotificationsCreate.module.scss';

export default function NotificationsCreate({
  handleSubmit,
  title,
  setTitle,
  message,
  setMessage,
}) {
  return (
    <div className={scss.notificationsCreate}>
      <h2 className={scss.titleNotificationsCreate}>Создать уведомление</h2>
      <form onSubmit={handleSubmit} className={scss.form}>
        <div className={scss.field}>
          <label htmlFor='title'>Заголовок</label>
          <input
            type='text'
            id='title'
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder='Введите заголовок уведомления...'
            required
          />
        </div>
        <div className={scss.field}>
          <label htmlFor='message'>Текст уведомления</label>
          <textarea
            id='message'
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder='Введите текст уведомления...'
            required
          />
        </div>
        <div className={scss.blockCenter}>
          <button type='submit' className={scss.submitButton}>
            Отправить уведомление
          </button>
        </div>
      </form>
    </div>
  );
}
