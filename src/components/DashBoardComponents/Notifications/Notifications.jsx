// components/DashBoardComponents/Notifications/Notifications.jsx
import { useState } from 'react';
import { useAdmin } from '../../../context/AdminContext';
import { toast } from 'react-toastify';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import scss from './Notifications.module.scss';
import NotificationsList from './NotificationsList/NotificationsList';
import NotificationsCreate from './NotificationsCreate/NotificationsCreate';

export default function Notifications() {
  const { addNotification, notifications, deleteNotification, accessLevels } = useAdmin();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [selectedAccessLevels, setSelectedAccessLevels] = useState([]);
  const [sendToAll, setSendToAll] = useState(false);

  const toggleAccessLevel = (levelId) => {
    setSelectedAccessLevels((prev) =>
      prev.includes(levelId) ? prev.filter((id) => id !== levelId) : [...prev, levelId],
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title || !message) {
      toast.error('Пожалуйста, заполните все поля.');
      return;
    }

    if (!sendToAll && selectedAccessLevels.length === 0) {
      toast.error(
        'Пожалуйста, выберите хотя бы один уровень доступа или включите "Отправить всем".',
      );
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

      if (!sendToAll) {
        notificationData.accessLevels = selectedAccessLevels;
      }

      await addNotification(notificationData);
      toast.success('Уведомление успешно отправлено!');
      setTitle('');
      setMessage('');
      setSelectedAccessLevels([]);
      setSendToAll(false);
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

  const handleEdit = async (notificationId, updatedNotification) => {
    if (!window.confirm('Вы уверены, что хотите сохранить изменения?')) {
      return;
    }

    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, updatedNotification);
      toast.success('Уведомление успешно обновлено!');
    } catch (error) {
      toast.error('Ошибка при обновлении уведомления: ' + error.message);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Нет даты';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  const sortedNotifications = [...notifications].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  );

  return (
    <div className={scss.notifications}>
      <div className={scss.container}>
        <NotificationsCreate
          handleSubmit={handleSubmit}
          title={title}
          setTitle={setTitle}
          message={message}
          setMessage={setMessage}
          accessLevels={accessLevels}
          selectedAccessLevels={selectedAccessLevels}
          toggleAccessLevel={toggleAccessLevel}
          sendToAll={sendToAll}
          setSendToAll={setSendToAll}
        />
        <NotificationsList
          sortedNotifications={sortedNotifications}
          formatDate={formatDate}
          handleDelete={handleDelete}
          handleEdit={handleEdit}
          accessLevels={accessLevels}
        />
      </div>
    </div>
  );
}
