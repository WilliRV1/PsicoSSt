import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  header?: React.ReactNode;
  footer?: React.ReactNode;
  variant?: 'default' | 'elevated';
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ header, footer, variant = 'default', children, className = '', ...props }, ref) => {
    const shadowStyles = {
      default: 'border border-[#E8E8E8]',
      elevated: 'shadow-md border border-[#E8E8E8]',
    };

    return (
      <div
        ref={ref}
        className={`
          bg-white rounded-lg
          ${shadowStyles[variant]}
          overflow-hidden transition-all duration-200
          ${className}
        `}
        {...props}
      >
        {header && (
          <div className="border-b border-[#E8E8E8] px-6 py-4">
            <div className="flex items-center justify-between">
              {typeof header === 'string' ? (
                <h3 className="text-lg font-semibold text-[#212121]">{header}</h3>
              ) : (
                header
              )}
            </div>
          </div>
        )}

        <div className="px-6 py-4">{children}</div>

        {footer && (
          <div className="border-t border-[#E8E8E8] px-6 py-4 bg-[#FAFAFA]">
            {footer}
          </div>
        )}
      </div>
    );
  }
);

Card.displayName = 'Card';

export default Card;
