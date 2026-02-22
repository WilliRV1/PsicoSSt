import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import Button from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closeButton?: boolean;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

const Modal = React.forwardRef<HTMLDivElement, ModalProps>(
  (
    {
      isOpen,
      onClose,
      title,
      children,
      footer,
      size = 'md',
      closeButton = true,
      onConfirm,
      confirmText = 'Guardar',
      cancelText = 'Cancelar',
    },
    ref
  ) => {
    useEffect(() => {
      if (isOpen) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = 'unset';
      }

      return () => {
        document.body.style.overflow = 'unset';
      };
    }, [isOpen]);

    useEffect(() => {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && isOpen) {
          onClose();
        }
      };

      window.addEventListener('keydown', handleEscape);
      return () => window.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Overlay */}
        <div
          className="absolute inset-0 bg-black/40 transition-opacity duration-200"
          onClick={onClose}
        />

        {/* Modal */}
        <div
          ref={ref}
          className={`
            relative bg-white rounded-lg shadow-lg
            w-full mx-4 ${sizeClasses[size]}
            transform transition-all duration-200
            max-h-[90vh] overflow-y-auto
          `}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          {(title || closeButton) && (
            <div className="flex items-center justify-between border-b border-[#E8E8E8] px-6 py-4">
              {title && <h2 className="text-xl font-semibold text-[#212121]">{title}</h2>}
              {closeButton && (
                <button
                  onClick={onClose}
                  className="ml-auto text-[#666666] hover:text-[#212121] transition-colors"
                  aria-label="Cerrar modal"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          )}

          {/* Content */}
          <div className="px-6 py-4">{children}</div>

          {/* Footer */}
          <div className="border-t border-[#E8E8E8] px-6 py-4 bg-[#FAFAFA] flex items-center justify-end gap-3">
            {footer ? (
              footer
            ) : (
              <>
                <Button variant="ghost" onClick={onClose}>
                  {cancelText}
                </Button>
                {onConfirm && (
                  <Button variant="primary" onClick={onConfirm}>
                    {confirmText}
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  }
);

Modal.displayName = 'Modal';

export default Modal;
