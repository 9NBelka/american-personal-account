import scss from './TextListUsers.module.scss';

export default function TextListUsers({
  paginatedUsers,
  handleEdit,
  handleDelete,
  accessLevels,
  userRole,
}) {
  // Функция для форматирования даты в формат DD.MM.YYYY
  const formatDate = (dateString) => {
    if (!dateString) return 'Нет даты';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  // Функция для получения списка курсов с уровнями доступа
  const getCoursesWithAccess = (purchasedCourses) => {
    if (!purchasedCourses || Object.keys(purchasedCourses).length === 0) {
      return 'Нет курсов';
    }

    return Object.entries(purchasedCourses)
      .map(([courseId, courseData]) => {
        const accessLevel = accessLevels.find((level) => level.id === courseData.access);
        const accessName = accessLevel ? accessLevel.name : courseData.access;
        return `${courseId} (${accessName})`;
      })
      .join(', ');
  };

  return (
    <tbody className={scss.listUsers}>
      {paginatedUsers.map((user, index) => {
        const firstName = user.name ? user.name.split(' ')[0] : 'Не указано';

        return (
          <tr key={user.id} className={scss.user}>
            <td>{index + 1}</td>
            <td>
              <div className={scss.avatarPreview}>
                {user.avatarUrl ? (
                  <img
                    className={scss.avatar}
                    src={user.avatarUrl}
                    alt='userImage'
                    onError={(e) => (e.target.src = '/img/defaultAvatar.webp')}
                  />
                ) : (
                  <img className={scss.avatar} src='/img/defaultAvatar.webp' alt='userImage' />
                )}
              </div>
            </td>
            <td>{firstName}</td>
            <td>{user.email}</td>
            <td>{user.role}</td>
            <td>{user.purchasedCourses ? Object.keys(user.purchasedCourses).length : 0}</td>
            <td>{getCoursesWithAccess(user.purchasedCourses)}</td> {/* Новый столбец */}
            <td>{formatDate(user.registrationDate)}</td>
            <td className={scss.actions}>
              <button className={scss.editButton} onClick={() => handleEdit(user.id)}>
                Редактировать
              </button>
              {userRole == 'admin' && (
                <button className={scss.deleteButton} onClick={() => handleDelete(user.id)}>
                  Удалить
                </button>
              )}
            </td>
          </tr>
        );
      })}
    </tbody>
  );
}
