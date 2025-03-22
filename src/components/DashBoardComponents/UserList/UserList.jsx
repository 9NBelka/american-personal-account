// components/admin/UserList.jsx
import scss from './UserList.module.scss';
import { useEffect, useState, useMemo } from 'react';
import { useAdmin } from '../../../context/AdminContext';
import { debounce } from 'lodash';
import { toast } from 'react-toastify';
import EditUser from '../EditUser/EditUser';
import clsx from 'clsx';
import AmountUsers from './AmountUsers/AmountUsers';
import FilterUsers from './FilterUsers/FilterUsers';
import PaginationOnUsers from './PaginationOnUsers/PaginationOnUsers';
import TitleListUsers from './TitleListUsers/TitleListUsers';

export default function UserList() {
  const { users, fetchAllUsers, deleteUser } = useAdmin();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [sortOption, setSortOption] = useState('name-asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(2);
  const [editingUserId, setEditingUserId] = useState(null); // Состояние для редактирования

  useEffect(() => {
    fetchAllUsers();
  }, [fetchAllUsers]);

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

  // Иначе показываем список пользователей
  return (
    <>
      <AmountUsers roleCounts={roleCounts} />
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

        <TitleListUsers />

        {paginatedUsers.length > 0 ? (
          <ul className={scss.listUsers}>
            {paginatedUsers.map((user, index) => (
              <li key={user.id} className={scss.user}>
                <div className={scss.titlesBlockMain}>
                  <div className={scss.avatarAndName}>
                    <p>{index + 1}</p>
                    <div className={scss.avatarPreview}>
                      {user.avatarUrl ? (
                        <img
                          className={scss.avatar}
                          src={user.avatarUrl}
                          alt='userImage'
                          onError={(e) => (e.target.src = '/img/defaultAvatar.webp')}
                        />
                      ) : (
                        <img
                          className={scss.avatar}
                          src='/img/defaultAvatar.webp'
                          alt='userImage'
                        />
                      )}
                    </div>
                    <p>{user.name}</p>
                  </div>
                  <div className={scss.emailRoleAndPurchasedCourses}>
                    <p>{user.email}</p>
                    <p>{user.role}</p>
                    <p>{user.purchasedCourses ? Object.keys(user.purchasedCourses).length : 0}</p>
                  </div>
                </div>
                <div className={scss.actions}>
                  <button className={scss.editButton} onClick={() => handleEdit(user.id)}>
                    Редактировать
                  </button>
                  <button className={scss.deleteButton} onClick={() => handleDelete(user.id)}>
                    Удалить
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p>Пользователи не найдены.</p>
        )}
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
