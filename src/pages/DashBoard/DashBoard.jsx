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
import MainStatistics from '../../components/DashBoardComponents/MainStatistics/MainStatistics.jsx';
import clsx from 'clsx';

export default function DashBoard() {
  const navigate = useNavigate();
  const { userRole, isLoading } = useAuth();
  const [activeSection, setActiveSection] = useState('mainStatistics');
  const [isCollapsed, setIsCollapsed] = useState(false);

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
      case 'mainStatistics':
        return <MainStatistics />;
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
        <Sidebar
          setActiveSection={setActiveSection}
          activeSection={activeSection}
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
        />
        <div className={clsx(scss.content, isCollapsed && scss.contentCollapsed)}>
          {renderActiveSection()}
        </div>
      </div>
    </div>
  );
}
