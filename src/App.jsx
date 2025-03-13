import Login from './pages/Login/Login';
import PersonalAccount from './pages/PersonalAccount/PersonalAccount';
import { Route, Routes, Navigate } from 'react-router-dom';
import SignUp from './pages/SignUp/SignUp';
import CoursePlaylist from './pages/CoursePlaylist/CoursePlaylist';
import DashBoard from './pages/DashBoard/DashBoard';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute/PrivateRoute';
import { ToastContainer } from 'react-toastify';

export default function App() {
  return (
    <AuthProvider>
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
        <Route path='/' element={<Navigate to='/login' />} />
      </Routes>
      <ToastContainer />
    </AuthProvider>
  );
}
