import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux'; // Добавляем Redux хуки
import {
  addNotification,
  deleteNotification,
  setError,
  updateNotification,
} from '../../../store/slices/adminSlice'; // Импортируем действия
import { toast } from 'react-toastify';
import scss from './Notifications.module.scss';
import NotificationsList from './NotificationsList/NotificationsList';
import NotificationsCreate from './NotificationsCreate/NotificationsCreate';

export default function Notifications() {
  const dispatch = useDispatch();

  // Получаем данные из Redux store
  const { notifications, accessLevels } = useSelector((state) => state.admin);

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

    if (!title.trim() || !message.trim()) {
      dispatch(setError('Пожалуйста, заполните все поля.')); // Используем dispatch
      toast.error('Пожалуйста, заполните все поля.');
      return;
    }

    if (!sendToAll && selectedAccessLevels.length === 0) {
      dispatch(
        setError(
          'Пожалуйста, выберите хотя бы один уровень доступа или включите "Отправить всем".',
        ),
      ); // Используем dispatch
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

      await dispatch(addNotification(notificationData)).unwrap();
      toast.success('Уведомление успешно отправлено!');
      setTitle('');
      setMessage('');
      setSelectedAccessLevels([]);
      setSendToAll(false);
    } catch (error) {
      dispatch(setError('Ошибка при отправке уведомления: ' + error)); // Используем dispatch
      toast.error('Ошибка при отправке уведомления: ' + error);
    }
  };

  const handleDelete = async (notificationId) => {
    if (!window.confirm('Вы уверены, что хотите удалить это уведомление?')) {
      return;
    }

    try {
      await dispatch(deleteNotification(notificationId)).unwrap();
      toast.success('Уведомление успешно удалено!');
    } catch (error) {
      dispatch(setError('Ошибка при удалении уведомления: ' + error)); // Используем dispatch
      toast.error('Ошибка при удалении уведомления: ' + error);
    }
  };

  const handleEdit = async (notificationId, updatedNotification) => {
    if (!window.confirm('Вы уверены, что хотите сохранить изменения?')) {
      return;
    }

    try {
      await dispatch(
        updateNotification({ notificationId, updatedData: updatedNotification }),
      ).unwrap();
      toast.success('Уведомление успешно обновлено!');
    } catch (error) {
      dispatch(setError('Ошибка при обновлении уведомления: ' + error));
      toast.error('Ошибка при обновлении уведомления: ' + error);
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
