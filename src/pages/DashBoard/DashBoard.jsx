import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import AccountLoadingIndicator from '../../components/AccountLoadingIndicator/AccountLoadingIndicator.jsx';
import Sidebar from '../../components/DashBoardComponents/Sidebar/Sidebar';
import scss from './DashBoard.module.scss';
import clsx from 'clsx';
import { Outlet } from 'react-router-dom';

export default function DashBoard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { userRole, isLoading } = useSelector((state) => state.auth);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const activeSection = location.pathname.split('/').pop() || 'mainStatistics';

  useEffect(() => {
    if (!isLoading && (!userRole || !['admin', 'moderator'].includes(userRole))) {
      navigate('/account');
    }
  }, [userRole, isLoading, navigate]);

  const handleSectionClick = (section) => {
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
          <Outlet context={{ handleSectionClick }} />
        </div>
      </div>
    </div>
  );
}
