// components/admin/FilterCourses/FilterCourses.jsx
import scss from './FilterCourses.module.scss';
import { BsChevronDown } from 'react-icons/bs';
import clsx from 'clsx';
import { useState } from 'react';

export default function FilterCourses({
  categoryFilter,
  setCategoryFilter,
  setCurrentPage,
  categoryCounts,
  sortOption,
  setSortOption,
  debouncedSetSearchQuery,
}) {
  const [isSortOpen, setIsSortOpen] = useState(false);

  const categoryOptions = [
    { value: 'all', label: `Все (${categoryCounts.all})` },
    { value: 'Course', label: `Course (${categoryCounts.Course})` },
    { value: 'Master class', label: `Master class (${categoryCounts['Master class']})` },
  ];

  const sortOptions = [
    { value: 'title-asc', label: 'Название (А-Я)' },
    { value: 'title-desc', label: 'Название (Я-А)' },
    { value: 'category-asc', label: 'Категория (А-Я)' },
    { value: 'category-desc', label: 'Категория (Я-А)' },
  ];

  const handleCategorySelect = (value) => {
    setCategoryFilter(value);
    setCurrentPage(1);
  };

  const handleSortSelect = (value) => {
    setSortOption(value);
    setCurrentPage(1);
    setIsSortOpen(false);
  };

  return (
    <div className={scss.filterBlockMain}>
      <div className={scss.filterOnCategoryBlock}>
        {categoryOptions.map((option) => (
          <button
            key={option.value}
            className={clsx(scss.filterButton, categoryFilter === option.value && scss.active)}
            onClick={() => handleCategorySelect(option.value)}>
            {option.label}
          </button>
        ))}
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
          placeholder='Поиск по названию или ID...'
          onChange={(e) => debouncedSetSearchQuery(e.target.value)}
          className={scss.searchInput}
        />
      </div>
    </div>
  );
}
