// components/DashBoardComponents/Notifications/NotificationsCreate.jsx
import scss from './NotificationsCreate.module.scss';

export default function NotificationsCreate({
  handleSubmit,
  title,
  setTitle,
  message,
  setMessage,
  accessLevels,
  selectedAccessLevels,
  toggleAccessLevel,
  sendToAll,
  setSendToAll,
}) {
  return (
    <div className={scss.notificationsCreate}>
      <h2 className={scss.titleNotificationsCreate}>Создать уведомление</h2>
      <form onSubmit={handleSubmit} className={scss.form}>
        {/* Блок с уровнями доступа */}
        <div className={scss.accessLevelsContainer}>
          <label>Уровни доступа:</label>
          <div className={scss.sendToAllContainer}>
            <label className={scss.sendToAllLabel}>
              <input
                type='checkbox'
                checked={sendToAll}
                onChange={(e) => setSendToAll(e.target.checked)}
              />
              Отправить всем
            </label>
          </div>
          <div className={scss.accessLevels}>
            {accessLevels.length > 0 ? (
              accessLevels.map((level) => (
                <button
                  key={level.id}
                  type='button'
                  className={scss.accessLevelButton}
                  data-active={selectedAccessLevels.includes(level.id)}
                  onClick={() => toggleAccessLevel(level.id)}
                  disabled={sendToAll} // Отключаем кнопки, если выбрано "Отправить всем"
                >
                  {level.name}
                </button>
              ))
            ) : (
              <p className={scss.loadingText}>Загрузка уровней доступа...</p>
            )}
          </div>
          {accessLevels.length > 0 && !sendToAll && (
            <p className={scss.selectedCount}>
              Выбрано: {selectedAccessLevels.length}{' '}
              {selectedAccessLevels.length === 1 ? 'уровень' : 'уровня'} доступа
            </p>
          )}
        </div>
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
