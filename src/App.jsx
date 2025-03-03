import Login from './pages/Login/Login';
import PersonalAccount from './pages/PersonalAccount/PersonalAccount';
import { Route, Routes } from 'react-router-dom';
import SignUp from './pages/SignUp/SignUp';
import ArchitecturePlayList from './pages/ArchitecturePlayList/ArchitecturePlayList';

export default function App() {
  return (
    <>
      <Routes>
        <Route path='/personal-account' element={<PersonalAccount />} />
        <Route path='/playlist' element={<ArchitecturePlayList />} />
        <Route path='/login' element={<Login />} />
        <Route path='/signUp' element={<SignUp />} />
      </Routes>
    </>
  );
}
