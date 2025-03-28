import scss from './UserList.module.scss';
import { useState, useMemo } from 'react';
import { useAdmin } from '../../../context/AdminContext';
import { debounce } from 'lodash';
import { toast } from 'react-toastify';
import EditUser from '../EditUser/EditUser';
import AmountUsers from './AmountUsers/AmountUsers';
import FilterUsers from './FilterUsers/FilterUsers';
import PaginationOnUsers from './PaginationOnUsers/PaginationOnUsers';
import TitleListUsers from './TitleListUsers/TitleListUsers';
import TextListUsers from './TextListUsers/TextListUsers';

export default function UserList() {
  const { users } = useAdmin(); // Убрали fetchAllUsers, так как используем onSnapshot
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [sortOption, setSortOption] = useState('name-asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(2);
  const [editingUserId, setEditingUserId] = useState(null);

  // Debounce для поиска
  const debouncedSetSearchQuery = useMemo(
    () =>
      debounce((value) => {
        setSearchQuery(value);
        setCurrentPage(1);
      }, 300),
    [],
  );

  // Подсчет количества пользователей по ролям
  const roleCounts = {
    all: users.length,
    admin: users.filter((user) => user.role === 'admin').length,
    guest: users.filter((user) => user.role === 'guest').length,
    student: users.filter((user) => user.role === 'student').length,
  };

  // Находим последнего зарегистрированного пользователя
  const lastUser = users
    .slice()
    .sort((a, b) => new Date(b.registrationDate) - new Date(a.registrationDate))[0];

  // Фильтрация и сортировка пользователей
  const filteredUsers = users
    .filter((user) => {
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      const matchesSearch =
        searchQuery === '' ||
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesRole && matchesSearch;
    })
    .sort((a, b) => {
      if (sortOption === 'name-asc') {
        return a.name.localeCompare(b.name);
      } else if (sortOption === 'name-desc') {
        return b.name.localeCompare(a.name);
      } else if (sortOption === 'courses-asc') {
        const aCourses = a.purchasedCourses ? Object.keys(a.purchasedCourses).length : 0;
        const bCourses = b.purchasedCourses ? Object.keys(b.purchasedCourses).length : 0;
        return aCourses - bCourses;
      } else if (sortOption === 'courses-desc') {
        const aCourses = a.purchasedCourses ? Object.keys(a.purchasedCourses).length : 0;
        const bCourses = b.purchasedCourses ? Object.keys(b.purchasedCourses).length : 0;
        return bCourses - aCourses;
      }
      return 0;
    });

  // Пагинация
  const totalUsers = filteredUsers.length;
  const totalPages = Math.ceil(totalUsers / usersPerPage);
  const startIndex = (currentPage - 1) * usersPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + usersPerPage);

  // Обработчик редактирования
  const handleEdit = (userId) => {
    setEditingUserId(userId);
  };

  // Обработчик удаления
  const handleDelete = (userId) => {
    if (window.confirm('Вы уверены, что хотите удалить этого пользователя?')) {
      deleteUser(userId)
        .then(() => toast.success('Пользователь удален!'))
        .catch((error) => toast.error('Ошибка при удалении: ' + error.message));
    }
  };

  // Обработчик возврата к списку
  const handleBack = () => {
    setEditingUserId(null);
  };

  // Обработчик смены страницы
  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Если редактируем пользователя, показываем EditUser
  if (editingUserId) {
    return <EditUser userId={editingUserId} onBack={handleBack} />;
  }

  // Показываем индикатор загрузки, если пользователи еще не загрузились
  if (users.length === 0) {
    return <div>Загрузка пользователей...</div>;
  }

  // Иначе показываем список пользователей
  return (
    <>
      <AmountUsers roleCounts={roleCounts} lastUser={lastUser} />
      <div className={scss.listMainBlock}>
        <h2 className={scss.listTitle}>Список пользователей</h2>
        {/* Фильтры и сортировка и Поиск */}
        <FilterUsers
          roleFilter={roleFilter}
          setRoleFilter={setRoleFilter}
          setCurrentPage={setCurrentPage}
          roleCounts={roleCounts}
          sortOption={sortOption}
          setSortOption={setSortOption}
          debouncedSetSearchQuery={debouncedSetSearchQuery}
        />
        <div className={scss.tableWrapper}>
          <table className={scss.table}>
            <TitleListUsers />
            {paginatedUsers.length > 0 ? (
              <TextListUsers
                paginatedUsers={paginatedUsers}
                handleEdit={handleEdit}
                handleDelete={handleDelete}
              />
            ) : (
              <p>Пользователи не найдены.</p>
            )}
          </table>
        </div>
        {/* Пагинация */}
        {totalPages > 1 && (
          <PaginationOnUsers
            totalPages={totalPages}
            currentPage={currentPage}
            handlePageChange={handlePageChange}
          />
        )}
      </div>
    </>
  );
}
