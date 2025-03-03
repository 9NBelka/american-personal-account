import { useEffect, useState } from 'react';
import { auth, db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Link, useNavigate } from 'react-router-dom';

export default function PersonalAccount() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('');
  const [registrationDate, setRegistrationDate] = useState('');
  const [isLoading, setIsLoading] = useState(true); // Состояние загрузки

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        // Пользователь авторизован
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserName(data.name || '');
          setUserRole(data.role || '');
          setRegistrationDate(data.registrationDate || '');

          // Проверка роли и перенаправление
          if (data.role === 'Админ') {
            navigate('/admin');
          }
        } else {
          console.log('Документ пользователя не найден в Firestore');
        }
        setIsLoading(false);
      } else {
        // Пользователь не авторизован
        navigate('/login');
        setIsLoading(false);
      }
    });

    // Очистка подписки при размонтировании
    return () => unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/login');
  };

  if (isLoading) {
    return <div>Загрузка...</div>; // Пока статус не определён, показываем загрузку
  }

  return (
    <div>
      <h2>Профиль</h2>
      <p>Добро пожаловать, {userName}!</p>
      <p>Роль: {userRole}</p>
      <p>Дата регистрации: {new Date(registrationDate).toLocaleString()}</p>
      <Link to='/playlist'>Просмотр уроков</Link>
      <button onClick={handleLogout}>Выйти</button>
    </div>
  );
}
