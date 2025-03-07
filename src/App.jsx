import Login from './pages/Login/Login';
import PersonalAccount from './pages/PersonalAccount/PersonalAccount';
import { Route, Routes } from 'react-router-dom';
import SignUp from './pages/SignUp/SignUp';
import ArchitecturePlayList from './pages/ArchitecturePlayList/ArchitecturePlayList';
import DashBoard from './pages/DashBoard/DashBoard';
import PrivateRoute from './components/PrivateRoute/PrivateRoute';

export default function App() {
  return (
    <Routes>
      <Route path='/login' element={<Login />} />
      <Route path='/signUp' element={<SignUp />} />
      <Route
        path='/personal-account'
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
        path='/playlist'
        element={
          <PrivateRoute allowedRoles={['guest', 'student']}>
            <ArchitecturePlayList />
          </PrivateRoute>
        }
      />
    </Routes>
  );
}
