import { useSelector } from 'react-redux';
import scss from './MainStatistics.module.scss'; // Предполагается, что у вас есть стили

export default function MainStatistics() {
  const { user, userRole, isLoading } = useSelector((state) => state.auth);

  if (isLoading) {
    return <div>Загрузка...</div>;
  }

  if (!user) {
    return <div>Пользователь не авторизован</div>;
  }

  return (
    <div className={scss.mainStatistics}>
      <div className={scss.userInfo}>
        <p>Имя: {user.displayName || 'Не указано'}</p>
        <p>Ваша почта: {user.email || 'Не указано'}</p>
        <p>Ваша роль: {userRole || 'Не определена'}</p>
      </div>
    </div>
  );
}
