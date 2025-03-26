// App.jsx
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
import MainStatistics from './components/DashBoardComponents/MainStatistics/MainStatistics';
import UserList from './components/DashBoardComponents/UserList/UserList';
import AddUser from './components/DashBoardComponents/AddUser/AddUser';
import CourseList from './components/DashBoardComponents/CourseList/CourseList';
import AddCourse from './components/DashBoardComponents/AddCourse/AddCourse';
import Notifications from './components/DashBoardComponents/Notifications/Notifications';

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
            }>
            {/* Вложенные маршруты для DashBoard */}
            <Route index element={<MainStatistics />} />
            <Route path='mainStatistics' element={<MainStatistics />} />
            <Route path='userList' element={<UserList />} />
            <Route path='addUser' element={<AddUser />} />
            <Route path='courseList' element={<CourseList />} />
            <Route path='addCourse' element={<AddCourse />} />
            <Route path='editCourse' element={<CourseList />} />
            <Route path='notifications' element={<Notifications />} />{' '}
            <Route path='*' element={<div>Section Not Found</div>} />{' '}
          </Route>
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
