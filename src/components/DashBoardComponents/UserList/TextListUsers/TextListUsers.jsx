// components/TextListUsers.jsx
import scss from './TextListUsers.module.scss';

export default function TextListUsers({ paginatedUsers, handleEdit, handleDelete }) {
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
            <td className={scss.actions}>
              <button className={scss.editButton} onClick={() => handleEdit(user.id)}>
                Редактировать
              </button>
              <button className={scss.deleteButton} onClick={() => handleDelete(user.id)}>
                Удалить
              </button>
            </td>
          </tr>
        );
      })}
    </tbody>
  );
}
