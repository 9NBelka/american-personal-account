// components/DashBoardComponents/Notifications/Notifications.jsx
import { useState } from 'react';
import { useAdmin } from '../../../context/AdminContext';
import { toast } from 'react-toastify';
import scss from './Notifications.module.scss';
import NotificationsList from './NotificationsList/NotificationsList';
import NotificationsCreate from './NotificationsCreate/NotificationsCreate';

export default function Notifications() {
  const { addNotification, notifications, deleteNotification } = useAdmin();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title || !message) {
      toast.error('Пожалуйста, заполните все поля.');
      return;
    }

    if (!window.confirm('Вы уверены, что хотите отправить уведомление?')) {
      return;
    }

    try {
      const notificationData = {
        title,
        message,
        createdAt: new Date().toISOString(),
      };
      await addNotification(notificationData);
      toast.success('Уведомление успешно отправлено!');
      setTitle('');
      setMessage('');
      // Больше не нужно вызывать fetchAllNotifications, так как onSnapshot обновляет список автоматически
    } catch (error) {
      toast.error('Ошибка при отправке уведомления: ' + error.message);
    }
  };

  const handleDelete = async (notificationId) => {
    if (!window.confirm('Вы уверены, что хотите удалить это уведомление?')) {
      return;
    }

    try {
      await deleteNotification(notificationId);
      toast.success('Уведомление успешно удалено!');
    } catch (error) {
      toast.error('Ошибка при удалении уведомления: ' + error.message);
    }
  };

  // Функция для форматирования даты в формат DD.MM.YYYY
  const formatDate = (dateString) => {
    if (!dateString) return 'Нет даты';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  // Сортируем уведомления по дате (самые новые сверху)
  const sortedNotifications = [...notifications].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  );

  return (
    <div className={scss.notifications}>
      <div className={scss.container}>
        {/* Левая часть: форма для добавления уведомлений */}
        <NotificationsCreate
          handleSubmit={handleSubmit}
          title={title}
          setTitle={setTitle}
          message={message}
          setMessage={setMessage}
        />
        <NotificationsList
          sortedNotifications={sortedNotifications}
          formatDate={formatDate}
          handleDelete={handleDelete}
        />
      </div>
    </div>
  );
}
