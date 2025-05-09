import { Route, Routes, Navigate, useNavigate, useLocation, matchPath } from 'react-router-dom';
import { Provider, useDispatch } from 'react-redux';
import { store } from './store';
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
import AuthDataSync from './components/AuthDataSync';
import AdminDataSync from './components/AdminDataSync';
import { useEffect } from 'react';
import { initializeAuth, logout } from './store/slices/authSlice';
import Orders from './components/DashBoardComponents/Orders/Orders';
import CurrencySelector from './components/DashBoardComponents/CurrencySelector/CurrencySelector';
import StorageForImages from './components/DashBoardComponents/StorageForImages/StorageForImages';
import AccountCertificateForm from './components/AccountCertificateForm/AccountCertificateForm';
import FormsOnPages from './components/DashBoardComponents/FormsOnPages/FormsOnPages';

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(initializeAuth());
  }, [dispatch]);

  const handleLogout = async () => {
    try {
      await dispatch(logout()).unwrap();
      navigate('/login');
    } catch (error) {
      console.error('Error exiting:', error);
    }
  };

  const headerRoutes = ['/account', '/playlist/:courseId', '/edit', '/certificate/:courseId'];

  const shouldRenderHeader = headerRoutes.some((route) =>
    matchPath({ path: route, exact: true }, location.pathname),
  );

  return (
    <>
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
        <Route path='/certificate/:courseId' element={<AccountCertificateForm />} />
        <Route
          path='/dashboard'
          element={
            <PrivateRoute allowedRoles={['admin', 'moderator']}>
              <DashBoard />
            </PrivateRoute>
          }>
          <Route index element={<MainStatistics />} />
          <Route path='mainStatistics' element={<MainStatistics />} />

          <Route path='images' element={<StorageForImages />} />
          <Route path='formsOnPages' element={<FormsOnPages />} />
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
          <Route path='currencySelector' element={<CurrencySelector />} />
          <Route path='orders' element={<Orders />} />
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
    </>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}
