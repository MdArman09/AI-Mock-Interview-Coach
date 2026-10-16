import React, { createContext, useContext } from 'react';
import hotToast from 'react-hot-toast';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  // Enhanced toast adapter so existing code using useToast works seamlessly with react-hot-toast
  const toastAdapter = {
    success: (msg, opts) => hotToast.success(msg, opts),
    error: (msg, opts) => hotToast.error(msg, opts),
    info: (msg, opts) => hotToast(msg, { icon: 'ℹ️', ...opts }),
    custom: hotToast.custom,
    dismiss: hotToast.dismiss,
    loading: hotToast.loading,
  };

  return (
    <ToastContext.Provider value={toastAdapter}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    return hotToast;
  }
  return context;
};

export { hotToast as toast };
export default ToastContext;
