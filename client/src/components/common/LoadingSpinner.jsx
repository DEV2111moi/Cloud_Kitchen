const LoadingSpinner = ({ size = 'md', text = '' }) => {
  const sizes = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <div
        className={`${sizes[size]} border-surface-200 border-t-primary-500 rounded-full animate-spin`}
      />
      {text && <p className="text-sm text-surface-700/60">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;
