import { HiOutlineX } from 'react-icons/hi';

const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className={`relative bg-white rounded-2xl shadow-2xl w-full ${sizeClasses[size]} max-h-[85vh] overflow-hidden animate-fade-in`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200">
          <h3 className="text-lg font-bold text-surface-900">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-surface-700/50 hover:text-surface-900 hover:bg-surface-100 transition-colors"
          >
            <HiOutlineX size={20} />
          </button>
        </div>
        {/* Body */}
        <div className="overflow-y-auto max-h-[calc(85vh-65px)] px-6 py-4">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
