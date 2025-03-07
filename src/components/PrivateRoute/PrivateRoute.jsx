import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/*
Что это даёт?
Маршруты /personal-account и /playlist доступны только для ролей guest и student.
Маршрут /dashboard доступен только для admin.
Если пользователь не авторизован, его перенаправит на /login.
*/

export default function PrivateRoute({ children, allowedRoles }) {
  const { userRole, isLoading } = useAuth();

  if (isLoading) {
    return <div>Загрузка...</div>;
  }

  if (!userRole) {
    return <Navigate to='/login' />;
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to='/personal-account' />;
  }

  return children;
}
