import { Route, Routes, Navigate, useNavigate, useLocation, matchPath } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store'; // Import the Redux store
import Login from './pages/Login/Login';
import PersonalAccount from './pages/PersonalAccount/PersonalAccount';
import SignUp from './pages/SignUp/SignUp';
import CoursePlaylist from './pages/CoursePlaylist/CoursePlaylist';
import DashBoard from './pages/DashBoard/DashBoard';
import EditProfile from './pages/EditProfile/EditProfile';
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
import ProductList from './components/DashBoardComponents/ProductList/ProductList';
import AddProduct from './components/DashBoardComponents/AddProduct/AddProduct';
import TimersCourses from './components/DashBoardComponents/TimersCourses/TimersCourses';
import DiscountPresets from './components/DashBoardComponents/DiscountPresets/DiscountPresets';
import PromoCodes from './components/DashBoardComponents/PromoCodes/PromoCodes';
import AuthDataSync from './components/AuthDataSync'; // Add sync component
import AdminDataSync from './components/AdminDataSync'; // Add sync component

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

  // Check if the current path matches one of the routes
  const shouldRenderHeader = headerRoutes.some((route) =>
    matchPath({ path: route, exact: true }, location.pathname),
  );

  return (
    <Provider store={store}>
      <AuthDataSync />
      <AdminDataSync />
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
          {/* Nested routes for DashBoard */}
          <Route index element={<MainStatistics />} />
          <Route path='mainStatistics' element={<MainStatistics />} />
          <Route path='userList' element={<UserList />} />
          <Route path='addUser' element={<AddUser />} />
          <Route path='courseList' element={<CourseList />} />
          <Route path='addCourse' element={<AddCourse />} />
          <Route path='timersCourses' element={<TimersCourses />} />
          <Route path='editCourse' element={<CourseList />} />
          <Route path='productList' element={<ProductList />} />
          <Route path='addProduct' element={<AddProduct />} />
          <Route path='discountPresets' element={<DiscountPresets />} />
          <Route path='promocodes' element={<PromoCodes />} />
          <Route path='notifications' element={<Notifications />} />
          <Route path='*' element={<div>Section Not Found</div>} />
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
    </Provider>
  );
}
