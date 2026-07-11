import { HiOutlineChevronLeft, HiOutlineChevronRight } from 'react-icons/hi';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const getPages = () => {
    const pages = [];
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, currentPage + 2);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="flex items-center justify-between py-4">
      <p className="text-sm text-surface-700/60">
        Page <span className="font-semibold">{currentPage}</span> of{' '}
        <span className="font-semibold">{totalPages}</span>
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg text-surface-700 hover:bg-surface-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <HiOutlineChevronLeft size={18} />
        </button>
        {getPages().map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${
              page === currentPage
                ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/25'
                : 'text-surface-700 hover:bg-surface-100'
            }`}
          >
            {page}
          </button>
        ))}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg text-surface-700 hover:bg-surface-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <HiOutlineChevronRight size={18} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
