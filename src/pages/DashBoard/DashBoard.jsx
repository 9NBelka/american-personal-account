// pages/DashBoard/DashBoard.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AccountLoadingIndicator from '../../components/AccountLoadingIndicator/AccountLoadingIndicator.jsx';
import Sidebar from '../../components/DashBoardComponents/Sidebar/Sidebar';
import AddUser from '../../components/DashBoardComponents/AddUser/AddUser';
import UserList from '../../components/DashBoardComponents/UserList/UserList';
import CourseList from '../../components/DashBoardComponents/CourseList/CourseList';
import scss from './DashBoard.module.scss';

export default function DashBoard() {
  const navigate = useNavigate();
  const { userRole, isLoading } = useAuth();
  const [activeSection, setActiveSection] = useState('addUser');

  useEffect(() => {
    if (!isLoading && (!userRole || userRole !== 'admin')) {
      navigate('/account');
    }
  }, [userRole, isLoading, navigate]);

  if (isLoading) {
    return <AccountLoadingIndicator />;
  }

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'addUser':
        return <AddUser />;
      case 'userList':
        return <UserList />;
      case 'courseList':
        return <CourseList />;
      default:
        return <AddUser />;
    }
  };

  return (
    <div className={scss.personalDashboardBackground}>
      <div className={scss.dashboard}>
        <Sidebar setActiveSection={setActiveSection} activeSection={activeSection} />
        <div className={scss.content}>{renderActiveSection()}</div>
      </div>
    </div>
  );
}
