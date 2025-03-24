// components/PaginationOnUsers.jsx
import clsx from 'clsx';
import scss from './PaginationOnUsers.module.scss';
import { BsChevronLeft, BsChevronRight } from 'react-icons/bs';

export default function PaginationOnUsers({ totalPages, currentPage, handlePageChange }) {
  const maxVisiblePages = 5; // Максимальное количество видимых кнопок страниц
  const halfVisible = Math.floor(maxVisiblePages / 2);

  // Определяем диапазон страниц для отображения
  let startPage = Math.max(1, currentPage - halfVisible);
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

  // Корректируем диапазон, если страниц меньше, чем maxVisiblePages
  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  const pages = Array.from({ length: endPage - startPage + 1 }, (_, index) => startPage + index);

  return (
    <div className={scss.pagination}>
      {/* Кнопка "Назад" */}
      <button
        className={clsx(scss.navButton, currentPage === 1 && scss.disabled)}
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}>
        <BsChevronLeft />
      </button>

      {/* Кнопки страниц */}
      {pages.map((page) => (
        <button
          key={page}
          className={clsx(scss.pageButton, currentPage === page && scss.active)}
          onClick={() => handlePageChange(page)}>
          {page}
        </button>
      ))}

      {/* Кнопка "Вперед" */}
      <button
        className={clsx(scss.navButton, currentPage === totalPages && scss.disabled)}
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}>
        <BsChevronRight />
      </button>
    </div>
  );
}
