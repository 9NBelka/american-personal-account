import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from './firebase';
import Login from './pages/Login/Login';
import PersonalAccount from './pages/PersonalAccount/PersonalAccount';
import { Route, Routes, Navigate, useNavigate, useLocation } from 'react-router-dom';
import SignUp from './pages/SignUp/SignUp';
import CoursePlaylist from './pages/CoursePlaylist/CoursePlaylist';
import DashBoard from './pages/DashBoard/DashBoard';
import EditProfile from './pages/EditProfile/EditProfile';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute/PrivateRoute';
import { ToastContainer } from 'react-toastify';
import HeaderPersonalAccount from './components/HeaderPersonalAccount/HeaderPersonalAccount';

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

  const noHeaderRoutes = ['/login', '/signUp'];
  const shouldRenderHeader = !noHeaderRoutes.includes(location.pathname);

  return (
    <AuthProvider>
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
    </AuthProvider>
  );
}
