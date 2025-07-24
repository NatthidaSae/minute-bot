const Badge = ({ 
  children, 
  variant = 'default', 
  size = 'md',
  dot = false,
  className = '',
  ...props 
}) => {
  const variants = {
    default: 'bg-gray-100 text-gray-800',
    primary: 'bg-primary-100 text-primary-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-orange-100 text-orange-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
    purple: 'bg-purple-100 text-purple-800',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };

  const baseStyles = 'inline-flex items-center font-medium rounded-full';

  return (
    <span 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
          variant === 'default' ? 'bg-gray-600' :
          variant === 'primary' ? 'bg-primary-600' :
          variant === 'success' ? 'bg-green-600' :
          variant === 'warning' ? 'bg-orange-600' :
          variant === 'danger' ? 'bg-red-600' :
          variant === 'info' ? 'bg-blue-600' :
          'bg-purple-600'
        }`}></span>
      )}
      {children}
    </span>
  );
};

export default Badge;