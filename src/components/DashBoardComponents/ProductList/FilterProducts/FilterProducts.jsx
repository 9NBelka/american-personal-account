import scss from './FilterProducts.module.scss';
import { BsChevronDown } from 'react-icons/bs';
import clsx from 'clsx';
import { useState } from 'react';

export default function FilterProducts({
  categoryFilter,
  setCategoryFilter,
  accessFilter,
  setAccessFilter,
  availableFilter,
  setAvailableFilter,
  setCurrentPage,
  categoryCounts,
  accessCounts,
  availableCounts,
  sortOption,
  setSortOption,
  debouncedSetSearchQuery,
}) {
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isAccessOpen, setIsAccessOpen] = useState(false);
  const [isAvailableOpen, setIsAvailableOpen] = useState(false);

  const categoryOptions = [
    { value: 'all', label: `Все (${categoryCounts.all})` },
    { value: 'Course', label: `Course (${categoryCounts.Course})` },
    { value: 'Master class', label: `Master class (${categoryCounts['Master class']})` },
  ];

  const accessOptions = [
    { value: 'all', label: `Все (${accessCounts.all})` },
    { value: 'vanilla', label: `Vanilla (${accessCounts.vanilla})` },
    { value: 'standard', label: `Standard (${accessCounts.standard})` },
  ];

  const availableOptions = [
    { value: 'all', label: `Все (${availableCounts.all})` },
    { value: 'available', label: `В продаже (${availableCounts.available})` },
    { value: 'not-available', label: `Не в продаже (${availableCounts['not-available']})` },
  ];

  const sortOptions = [
    { value: 'name-asc', label: 'Название (А-Я)' },
    { value: 'name-desc', label: 'Название (Я-А)' },
    { value: 'price-asc', label: 'Цена (по возрастанию)' },
    { value: 'price-desc', label: 'Цена (по убыванию)' },
  ];

  const handleCategorySelect = (value) => {
    setCategoryFilter(value);
    setCurrentPage(1);
  };

  const handleAccessSelect = (value) => {
    setAccessFilter(value);
    setCurrentPage(1);
    setIsAccessOpen(false);
  };

  const handleAvailableSelect = (value) => {
    setAvailableFilter(value);
    setCurrentPage(1);
    setIsAvailableOpen(false);
  };

  const handleSortSelect = (value) => {
    setSortOption(value);
    setCurrentPage(1);
    setIsSortOpen(false);
  };

  return (
    <div className={scss.filterBlockMain}>
      <div className={scss.filterOnCategoryBlock}>
        {/* Фильтр по категории */}
        {categoryOptions.map((option) => (
          <button
            key={option.value}
            className={clsx(scss.filterButton, categoryFilter === option.value && scss.active)}
            onClick={() => handleCategorySelect(option.value)}>
            {option.label}
          </button>
        ))}

        {/* Фильтр по типу доступа */}
        <div className={scss.accessContainer}>
          <div className={scss.accessButton} onClick={() => setIsAccessOpen(!isAccessOpen)}>
            {accessOptions.find((option) => option.value === accessFilter)?.label || 'Тип доступа'}
            <BsChevronDown className={clsx(scss.chevron, isAccessOpen && scss.chevronOpen)} />
          </div>
          {isAccessOpen && (
            <ul className={scss.accessDropdown}>
              {accessOptions.map((option) => (
                <li
                  key={option.value}
                  className={clsx(scss.accessOption, accessFilter === option.value && scss.active)}
                  onClick={() => handleAccessSelect(option.value)}>
                  {option.label}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Фильтр по статусу доступности */}
        <div className={scss.availableContainer}>
          <div
            className={scss.availableButton}
            onClick={() => setIsAvailableOpen(!isAvailableOpen)}>
            {availableOptions.find((option) => option.value === availableFilter)?.label || 'Статус'}
            <BsChevronDown className={clsx(scss.chevron, isAvailableOpen && scss.chevronOpen)} />
          </div>
          {isAvailableOpen && (
            <ul className={scss.availableDropdown}>
              {availableOptions.map((option) => (
                <li
                  key={option.value}
                  className={clsx(
                    scss.availableOption,
                    availableFilter === option.value && scss.active,
                  )}
                  onClick={() => handleAvailableSelect(option.value)}>
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

      {/* Поиск */}
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
