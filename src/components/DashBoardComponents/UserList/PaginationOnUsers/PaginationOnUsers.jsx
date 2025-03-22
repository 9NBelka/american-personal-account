import clsx from 'clsx';
import scss from './PaginationOnUsers.module.scss';

export default function PaginationOnUsers({ totalPages, currentPage, handlePageChange }) {
  return (
    <div className={scss.pagination}>
      {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
        <button
          key={page}
          className={clsx(scss.pageButton, currentPage === page && scss.active)}
          onClick={() => handlePageChange(page)}>
          {page}
        </button>
      ))}
    </div>
  );
}
