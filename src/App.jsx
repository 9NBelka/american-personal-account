import { Route, Routes, Navigate, useNavigate, useLocation, matchPath } from 'react-router-dom';
import Login from './pages/Login/Login';
import PersonalAccount from './pages/PersonalAccount/PersonalAccount';
import SignUp from './pages/SignUp/SignUp';
import CoursePlaylist from './pages/CoursePlaylist/CoursePlaylist';
import DashBoard from './pages/DashBoard/DashBoard';
import EditProfile from './pages/EditProfile/EditProfile';
import { AuthProvider } from './context/AuthContext';
import { AdminProvider } from './context/AdminContext';
import PrivateRoute from './components/PrivateRoute/PrivateRoute';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import HeaderPersonalAccount from './components/HeaderPersonalAccount/HeaderPersonalAccount';
import { auth } from './firebase';

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error exiting:', error);
    }
  };

  // Список маршрутов, где должен отображаться хеддер
  const headerRoutes = ['/account', '/playlist/:courseId', '/edit'];

  // Проверяем, соответствует ли текущий путь одному из маршрутов
  const shouldRenderHeader = headerRoutes.some((route) =>
    matchPath({ path: route, exact: true }, location.pathname),
  );

  return (
    <AuthProvider>
      <AdminProvider>
        {shouldRenderHeader && <HeaderPersonalAccount handleLogout={handleLogout} />}
        <Routes>
          <Route path='/login' element={<Login />} />
          <Route path='/signUp' element={<SignUp />} />
          <Route
            path='/account'
            element={
              <PrivateRoute allowedRoles={['guest', 'student']}>
                <PersonalAccount />
              </PrivateRoute>
            }
          />
          <Route
            path='/dashboard'
            element={
              <PrivateRoute allowedRoles={['admin']}>
                <DashBoard />
              </PrivateRoute>
            }
          />
          <Route
            path='/playlist/:courseId'
            element={
              <PrivateRoute allowedRoles={['guest', 'student']}>
                <CoursePlaylist />
              </PrivateRoute>
            }
          />
          <Route
            path='/edit'
            element={
              <PrivateRoute allowedRoles={['guest', 'student']}>
                <EditProfile />
              </PrivateRoute>
            }
          />
          <Route path='/' element={<Navigate to='/login' />} />
        </Routes>
        <ToastContainer />
      </AdminProvider>
    </AuthProvider>
  );
}
