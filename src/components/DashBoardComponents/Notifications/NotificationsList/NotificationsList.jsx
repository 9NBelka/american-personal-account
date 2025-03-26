import scss from './NotificationsList.module.scss';

export default function NotificationsList({ sortedNotifications, formatDate, handleDelete }) {
  return (
    <div className={scss.notificationsList}>
      <h2 className={scss.titleNotificationsList}>Список уведомлений</h2>
      {sortedNotifications.length > 0 ? (
        <div className={scss.tableWrapper}>
          <table className={scss.table}>
            <thead>
              <tr>
                <th>№</th>
                <th>Заголовок</th>
                <th>Текст</th>
                <th>Дата</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {sortedNotifications.map((notification, index) => (
                <tr key={notification.id}>
                  <td>{index + 1}</td>
                  <td>{notification.title}</td>
                  <td>{notification.message}</td>
                  <td>{formatDate(notification.createdAt)}</td>
                  <td>
                    <button
                      className={scss.deleteButton}
                      onClick={() => handleDelete(notification.id)}>
                      Удалить
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>Уведомления не найдены.</p>
      )}
    </div>
  );
}
