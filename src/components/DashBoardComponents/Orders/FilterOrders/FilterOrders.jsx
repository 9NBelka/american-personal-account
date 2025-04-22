import scss from './FilterOrders.module.scss';
import { BsChevronDown } from 'react-icons/bs';
import clsx from 'clsx';
import { useState } from 'react';

export default function FilterOrders({
  paymentStatusFilter,
  setPaymentStatusFilter,
  sortOption,
  setSortOption,
  debouncedSetSearchQuery,
  setCurrentPage,
  paymentStatusCounts,
}) {
  const [isPaymentStatusOpen, setIsPaymentStatusOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);

  const paymentStatusOptions = [
    { value: 'all', label: `Все (${paymentStatusCounts.all})` },
    { value: 'Processing', label: `В процессе (${paymentStatusCounts.Processing})` },
    { value: 'Cancelled', label: `Отмененные (${paymentStatusCounts.Cancelled})` },
    { value: 'Paid', label: `Успешные (${paymentStatusCounts.Paid})` },
  ];

  const sortOptions = [
    { value: 'price-asc', label: 'Цена (От низкой к высокой)' },
    { value: 'price-desc', label: 'Price (От высокой к низкой)' },
    { value: 'date-asc', label: 'Date Created (Сначала старые)' },
    { value: 'date-desc', label: 'Date Created (Сначала новые)' },
  ];

  const handlePaymentStatusSelect = (value) => {
    setPaymentStatusFilter(value);
    setCurrentPage(1);
    setIsPaymentStatusOpen(false);
  };

  const handleSortSelect = (value) => {
    setSortOption(value);
    setCurrentPage(1);
    setIsSortOpen(false);
  };

  return (
    <div className={scss.filterBlockMain}>
      <div className={scss.filterOnCategoryBlock}>
        {/* Filter by Payment Status */}
        <div className={scss.paymentStatusContainer}>
          <div
            className={scss.paymentStatusButton}
            onClick={() => setIsPaymentStatusOpen(!isPaymentStatusOpen)}>
            {paymentStatusOptions.find((option) => option.value === paymentStatusFilter)?.label ||
              'Payment Status'}
            <BsChevronDown
              className={clsx(scss.chevron, isPaymentStatusOpen && scss.chevronOpen)}
            />
          </div>
          {isPaymentStatusOpen && (
            <ul className={scss.paymentStatusDropdown}>
              {paymentStatusOptions.map((option) => (
                <li
                  key={option.value}
                  className={clsx(
                    scss.paymentStatusOption,
                    paymentStatusFilter === option.value && scss.active,
                  )}
                  onClick={() => handlePaymentStatusSelect(option.value)}>
                  {option.label}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Sorting */}
        <div className={scss.sortContainer}>
          <div className={scss.sortButton} onClick={() => setIsSortOpen(!isSortOpen)}>
            {sortOptions.find((option) => option.value === sortOption)?.label || 'Sort By'}
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

      {/* Search */}
      <div className={scss.searchContainer}>
        <input
          type='text'
          placeholder='Search by Customer Name or Email...'
          onChange={(e) => debouncedSetSearchQuery(e.target.value)}
          className={scss.searchInput}
        />
      </div>
    </div>
  );
}
