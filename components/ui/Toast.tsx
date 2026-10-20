'use client';

import { Toaster as SonnerToaster, toast } from 'sonner';

export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      theme="light"
      toastOptions={{
        classNames: {
          toast: 'bg-surface border border-border rounded-md shadow-lg p-4 min-w-[300px] text-text-primary',
          description: 'text-text-muted text-sm',
          actionButton: 'bg-primary text-white hover:bg-primary-hover rounded-sm px-3 py-1.5 text-sm',
          closeButton: 'text-text-muted hover:text-text-primary'
        }
      }}
    />
  );
}

export { toast };

type ToastType = 'success' | 'error' | 'info' | 'loading';

interface ToastOptions {
  description?: string;
  action?: { label: string; onClick: () => void };
  duration?: number;
}

export function showToast(type: ToastType, message: string, options?: ToastOptions) {
  const baseOptions = {
    description: options?.description,
    action: options?.action,
    duration: options?.duration ?? (type === 'error' ? 6000 : 4000)
  };

  switch (type) {
    case 'success':
      return toast.success(message, baseOptions);
    case 'error':
      return toast.error(message, baseOptions);
    case 'info':
      return toast.info(message, baseOptions);
    case 'loading':
      return toast.loading(message, baseOptions);
  }
}

export function dismissToast(id?: string | number) {
  if (id) toast.dismiss(id);
  else toast.dismiss();
}