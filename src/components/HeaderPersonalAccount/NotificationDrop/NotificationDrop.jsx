// components/HeaderPersonalAccount/NotificationDrop/NotificationDrop.jsx
import { BsBellFill } from 'react-icons/bs';
import { useAuth } from '../../../context/AuthContext';
import scss from './NotificationDrop.module.scss';

export default function NotificationDrop({ sortedNotifications, formatDate }) {
  const { markNotificationAsRead, accessLevels } = useAuth();

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId);
    } catch (error) {
      console.error('Ошибка при отметке уведомления как прочитанного:', error);
    }
  };

  const handleClearAll = async () => {
    try {
      for (const notification of sortedNotifications) {
        await markNotificationAsRead(notification.id);
      }
    } catch (error) {
      console.error('Ошибка при очистке всех уведомлений:', error);
    }
  };

  const getAccessLevelName = (levelId) => {
    const accessLevel = accessLevels.find((level) => level.id === levelId);
    return accessLevel ? accessLevel.name : levelId;
  };

  return (
    <div className={scss.notificationsDropdown}>
      <h3 className={scss.notificationsTitle}>Notifications</h3>
      {sortedNotifications.length > 0 ? (
        <>
          <ul className={scss.notificationsList}>
            {sortedNotifications.map((notification) => (
              <li key={notification.id}>
                <div className={scss.notificationIconBlock}>
                  <BsBellFill className={scss.notificationsIcon} />
                </div>
                <div className={scss.notificationContent}>
                  <p className={scss.notificationTitle}>{notification.title}</p>
                  <p className={scss.notificationMessage}>{notification.message}</p>
                  {notification.accessLevels && notification.accessLevels.length > 0 ? (
                    <div className={scss.accessTags}>
                      {notification.accessLevels.map((level) => (
                        <span
                          key={level}
                          className={scss.accessTag}
                          data-level={level.toLowerCase()}>
                          {getAccessLevelName(level)}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className={scss.accessTags}>
                      <span className={scss.accessTag} data-level='all'>
                        All
                      </span>
                    </div>
                  )}
                  <p className={scss.notificationDate}>{formatDate(notification.createdAt)}</p>
                  <button
                    className={scss.markAsReadButton}
                    onClick={() => handleMarkAsRead(notification.id)}>
                    Hide
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <button className={scss.clearAllButton} onClick={handleClearAll}>
            Clear all
          </button>
        </>
      ) : (
        <p className={scss.noNotifications}>No notifications</p>
      )}
    </div>
  );
}
