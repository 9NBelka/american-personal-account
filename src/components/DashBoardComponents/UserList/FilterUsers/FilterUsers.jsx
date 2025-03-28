import clsx from 'clsx';
import scss from './FilterUsers.module.scss';
import { useState } from 'react';
import { BsChevronDown } from 'react-icons/bs';

export default function FilterUsers({
  roleFilter,
  setRoleFilter,
  courseFilter,
  setCourseFilter,
  setCurrentPage,
  roleCounts,
  courses,
  sortOption,
  setSortOption,
  debouncedSetSearchQuery,
}) {
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isCourseOpen, setIsCourseOpen] = useState(false); // Состояние для выпадающего списка курсов

  const sortOptions = [
    { value: 'name-asc', label: 'Имени (А-Я)' },
    { value: 'name-desc', label: 'Имени (Я-А)' },
    { value: 'courses-asc', label: 'Курсам (возр.)' },
    { value: 'courses-desc', label: 'Курсам (убыв.)' },
  ];

  // Опции для фильтра по курсам
  const courseOptions = [
    { value: 'all', label: 'All courses' },
    ...courses.map((course) => ({
      value: course.id,
      label: course.title || course.id, // Используем title курса, если есть, иначе id
    })),
  ];

  const handleSortSelect = (value) => {
    setSortOption(value);
    setCurrentPage(1);
    setIsSortOpen(false);
  };

  const handleCourseSelect = (value) => {
    setCourseFilter(value);
    setCurrentPage(1);
    setIsCourseOpen(false);
  };

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

        {/* Выпадающий список для фильтра по курсам */}
        <div className={scss.sortContainer}>
          <div className={scss.sortButton} onClick={() => setIsCourseOpen(!isCourseOpen)}>
            {courseOptions.find((option) => option.value === courseFilter)?.label || 'Курсы'}
            <BsChevronDown className={clsx(scss.chevron, isCourseOpen && scss.chevronOpen)} />
          </div>
          {isCourseOpen && (
            <ul className={scss.sortDropdown}>
              {courseOptions.map((option) => (
                <li
                  key={option.value}
                  className={clsx(scss.sortOption, courseFilter === option.value && scss.active)}
                  onClick={() => handleCourseSelect(option.value)}>
                  {option.label}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Сортировка */}
        <div className={scss.sortContainer}>
          <div className={scss.sortButton} onClick={() => setIsSortOpen(!isSortOpen)}>
            {sortOptions.find((option) => option.value === sortOption)?.label || 'Сортировка'}
            <BsChevronDown className={clsx(scss.chevron, isSortOpen && scss.chevronOpen)} />
          </div>
          {isSortOpen && (
            <ul className={scss.sortDropdown}>
              {sortOptions.map((option) => (
                <li
                  key={option.value}
                  className={clsx(scss.sortOption, sortOption === option.value && scss.active)}
                  onClick={() => handleSortSelect(option.value)}>
                  {option.label}
                </li>
              ))}
            </ul>
          )}
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
