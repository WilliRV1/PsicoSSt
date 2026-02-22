import React from 'react';
import { Check, AlertCircle } from 'lucide-react';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: boolean;
  helpText?: string;
  required?: boolean;
  icon?: React.ReactNode;
}

const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  (
    {
      label,
      error,
      success = false,
      helpText,
      required = false,
      icon,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-[#212121] mb-2"
          >
            {label}
            {required && <span className="text-[#E53935] ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#666666]">
              {icon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            className={`
              w-full px-4 py-2.5 text-base
              border rounded-lg
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-offset-0
              ${icon ? 'pl-10' : ''}
              ${
                error
                  ? 'border-[#E53935] focus:border-[#E53935] focus:ring-[#E53935]'
                  : success
                    ? 'border-[#4CAF50] focus:border-[#4CAF50] focus:ring-[#4CAF50]'
                    : 'border-[#E8E8E8] focus:border-[#0051BA] focus:ring-[#0051BA]'
              }
              placeholder-[#999999]
              ${className}
            `}
            {...props}
          />

          {success && !error && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#4CAF50]">
              <Check className="w-5 h-5" />
            </div>
          )}

          {error && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#E53935]">
              <AlertCircle className="w-5 h-5" />
            </div>
          )}
        </div>

        {error && (
          <p className="mt-1.5 text-sm text-[#E53935] flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {error}
          </p>
        )}

        {helpText && !error && (
          <p className="mt-1.5 text-sm text-[#666666]">{helpText}</p>
        )}
      </div>
    );
  }
);

FormInput.displayName = 'FormInput';

export default FormInput;
