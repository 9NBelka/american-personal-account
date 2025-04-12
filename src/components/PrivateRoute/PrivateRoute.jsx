import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import AccountLoadingIndicator from '../AccountLoadingIndicator/AccountLoadingIndicator';

/*
Что это даёт?
Маршруты /account и /playlist доступны только для ролей guest и student.
Маршрут /dashboard доступен только для admin.
Если пользователь не авторизован, его перенаправит на /login.
*/

export default function PrivateRoute({ children, allowedRoles }) {
  const { user, userRole, isLoading } = useSelector((state) => state.auth);

  if (isLoading) {
    return <AccountLoadingIndicator />;
  }

  if (!user || !allowedRoles.includes(userRole)) {
    return <Navigate to='/login' replace />;
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to='/account' />;
  }

  return children;
}
