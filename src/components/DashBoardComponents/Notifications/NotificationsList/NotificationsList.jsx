// components/DashBoardComponents/Notifications/NotificationsList/NotificationsList.jsx
import { useState } from 'react';
import scss from './NotificationsList.module.scss';
import NotificationEdit from '../NotificationEdit/NotificationEdit';

export default function NotificationsList({
  sortedNotifications,
  formatDate,
  handleDelete,
  handleEdit,
  accessLevels,
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);

  const openEditModal = (notification) => {
    setSelectedNotification(notification);
    setIsModalOpen(true);
  };

  const closeEditModal = () => {
    setIsModalOpen(false);
    setSelectedNotification(null);
  };

  const handleSave = (updatedNotification) => {
    handleEdit(selectedNotification.id, updatedNotification);
    closeEditModal();
  };

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
                    <button className={scss.editButton} onClick={() => openEditModal(notification)}>
                      Редактировать
                    </button>
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

      {isModalOpen && selectedNotification && (
        <NotificationEdit
          notification={selectedNotification}
          accessLevels={accessLevels}
          onClose={closeEditModal}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
