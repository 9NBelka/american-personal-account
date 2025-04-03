// components/DashBoardComponents/Notifications/EditNotificationModal/EditNotificationModal.jsx
import { useState, useEffect, useRef } from 'react';
import scss from './NotificationEdit.module.scss';

export default function NotificationEdit({ notification, accessLevels, onClose, onSave }) {
  const [title, setTitle] = useState(notification.title || '');
  const [message, setMessage] = useState(notification.message || '');
  const [selectedAccessLevels, setSelectedAccessLevels] = useState(notification.accessLevels || []);
  const [sendToAll, setSendToAll] = useState(
    !notification.accessLevels || notification.accessLevels.length === 0,
  );
  const modalRef = useRef(null); // Ссылка на модальное окно

  useEffect(() => {
    // При открытии модального окна обновляем состояние
    setTitle(notification.title || '');
    setMessage(notification.message || '');
    setSelectedAccessLevels(notification.accessLevels || []);
    setSendToAll(!notification.accessLevels || notification.accessLevels.length === 0);
  }, [notification]);

  // Обработчик кликов вне модального окна
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose(); // Закрываем модальное окно
      }
    };

    // Добавляем слушатель событий
    document.addEventListener('mousedown', handleClickOutside);

    // Удаляем слушатель при размонтировании компонента
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const toggleAccessLevel = (levelId) => {
    setSelectedAccessLevels((prev) =>
      prev.includes(levelId) ? prev.filter((id) => id !== levelId) : [...prev, levelId],
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!title || !message) {
      alert('Пожалуйста, заполните все поля.');
      return;
    }

    if (!sendToAll && selectedAccessLevels.length === 0) {
      alert('Пожалуйста, выберите хотя бы один уровень доступа или включите "Отправить всем".');
      return;
    }

    const updatedNotification = {
      title,
      message,
    };

    if (!sendToAll) {
      updatedNotification.accessLevels = selectedAccessLevels;
    }

    onSave(updatedNotification);
  };

  return (
    <div className={scss.modalOverlay}>
      <div className={scss.modal} ref={modalRef}>
        <h2 className={scss.modalTitle}>Редактировать уведомление</h2>
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
                    disabled={sendToAll}>
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
          <div className={scss.buttonGroup}>
            <button type='submit' className={scss.saveButton}>
              Сохранить
            </button>
            <button type='button' className={scss.cancelButton} onClick={onClose}>
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
