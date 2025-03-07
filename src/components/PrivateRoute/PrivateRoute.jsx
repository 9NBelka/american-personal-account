import { Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { auth, db } from '../../firebase.js';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

/*
Что это даёт?

Маршруты /personal-account и /playlist доступны только для ролей guest и student.
Маршрут /dashboard доступен только для admin.
Если пользователь не авторизован, его перенаправит на /login.
*/

export default function PrivateRoute({ children, allowedRoles }) {
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUserRole(userDoc.data().role);
        } else {
          setUserRole('guest');
        }
      } else {
        setUserRole(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

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
