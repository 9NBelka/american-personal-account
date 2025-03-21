import clsx from 'clsx';
import scss from './FilterUsers.module.scss';

export default function FilterUsers({
  roleFilter,
  setRoleFilter,
  setCurrentPage,
  roleCounts,
  sortOption,
  setSortOption,
  debouncedSetSearchQuery,
}) {
  return (
    <div className={scss.filterBlockMain}>
      <div className={scss.filterOnRoleBlock}>
        <button
          className={clsx(scss.filterButton, roleFilter === 'all' && scss.active)}
          onClick={() => {
            setRoleFilter('all');
            setCurrentPage(1);
          }}>
          Все ({roleCounts.all})
        </button>
        <button
          className={clsx(scss.filterButton, roleFilter === 'student' && scss.active)}
          onClick={() => {
            setRoleFilter('student');
            setCurrentPage(1);
          }}>
          Студенты ({roleCounts.student})
        </button>

        <button
          className={clsx(scss.filterButton, roleFilter === 'guest' && scss.active)}
          onClick={() => {
            setRoleFilter('guest');
            setCurrentPage(1);
          }}>
          Гости ({roleCounts.guest})
        </button>
        <button
          className={clsx(scss.filterButton, roleFilter === 'admin' && scss.active)}
          onClick={() => {
            setRoleFilter('admin');
            setCurrentPage(1);
          }}>
          Администраторы ({roleCounts.admin})
        </button>

        <div className={scss.sortContainer}>
          <select
            id='sort'
            value={sortOption}
            onChange={(e) => {
              setSortOption(e.target.value);
              setCurrentPage(1);
            }}
            className={scss.sortSelect}>
            <option value='name-asc'>Имени (А-Я)</option>
            <option value='name-desc'>Имени (Я-А)</option>
            <option value='courses-asc'>Курсам (возр.)</option>
            <option value='courses-desc'>Курсам (убыв.)</option>
          </select>
        </div>
      </div>
      <div className={scss.searchContainer}>
        <input
          type='text'
          placeholder='Поиск по имени или email...'
          onChange={(e) => debouncedSetSearchQuery(e.target.value)}
          className={scss.searchInput}
        />
      </div>
    </div>
  );
}
