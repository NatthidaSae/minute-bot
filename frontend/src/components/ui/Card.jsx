const Card = ({ 
  children, 
  className = '', 
  hover = false,
  padding = 'normal',
  ...props 
}) => {
  const paddings = {
    none: '',
    sm: 'p-4',
    normal: 'p-6',
    lg: 'p-8',
  };

  const baseStyles = 'bg-white rounded-xl shadow-soft border border-gray-100 overflow-hidden';
  const hoverStyles = hover ? 'hover:shadow-lg transition-shadow duration-200' : '';

  return (
    <div 
      className={`${baseStyles} ${hoverStyles} ${paddings[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = '', ...props }) => (
  <div className={`pb-4 border-b border-gray-100 ${className}`} {...props}>
    {children}
  </div>
);

export const CardBody = ({ children, className = '', ...props }) => (
  <div className={`pt-4 ${className}`} {...props}>
    {children}
  </div>
);

export const CardFooter = ({ children, className = '', ...props }) => (
  <div className={`pt-4 mt-4 border-t border-gray-100 ${className}`} {...props}>
    {children}
  </div>
);

export default Card;