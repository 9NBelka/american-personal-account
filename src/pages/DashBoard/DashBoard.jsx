// pages/DashBoard/DashBoard.jsx
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AccountLoadingIndicator from '../../components/AccountLoadingIndicator/AccountLoadingIndicator.jsx';
import Sidebar from '../../components/DashBoardComponents/Sidebar/Sidebar';
import scss from './DashBoard.module.scss';
import clsx from 'clsx';
import { Outlet } from 'react-router-dom';

export default function DashBoard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { userRole, isLoading } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const activeSection = location.pathname.split('/').pop() || 'mainStatistics';

  useEffect(() => {
    if (!isLoading && (!userRole || userRole !== 'admin')) {
      navigate('/account');
    }
  }, [userRole, isLoading, navigate]);

  const handleSectionClick = (section) => {
    // Устанавливаем путь в формате /dashboard/[section]
    const path = section === 'mainStatistics' ? '/dashboard' : `/dashboard/${section}`;
    navigate(path);
  };

  if (isLoading) {
    return <AccountLoadingIndicator />;
  }

  return (
    <div className={scss.personalDashboardBackground}>
      <div className={scss.dashboard}>
        <Sidebar
          activeSection={activeSection}
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          handleSectionClick={handleSectionClick}
        />
        <div className={clsx(scss.content, isCollapsed && scss.contentCollapsed)}>
          <Outlet context={{ handleSectionClick }} /> {/* Отображаем вложенный компонент */}
        </div>
      </div>
    </div>
  );
}
