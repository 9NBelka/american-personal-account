import scss from './TitleListUsers.module.scss';

export default function TitleListUsers() {
  return (
    <div className={scss.titleListUsersFullWidth}>
      <div className={scss.titleListUsers}>
        <div className={scss.nameAndImage}>
          <p>№</p>
          <p>Ава</p>
          <p>Имя</p>
        </div>
        <div className={scss.titlesForEmailRoleAndPurchasedCourses}>
          <p>Почта</p>
          <p>Роль</p>
          <p>Количество курсов:</p>
        </div>
      </div>
    </div>
  );
}
