import { useToastStore } from '@/store/toastStore';

const eyebrowByTone = {
  success: 'Checkpoint Saved',
  error: 'Route Blocked',
} as const;

export const ToastViewport = () => {
  const toast = useToastStore((state) => state.toast);
  const dismissToast = useToastStore((state) => state.dismissToast);

  if (!toast) {
    return null;
  }

  return (
    <div className="app-toastViewport" aria-live="polite" aria-atomic="true">
      <section
        className={`app-toast app-toast--${toast.tone}`}
        role={toast.tone === 'error' ? 'alert' : 'status'}
      >
        <div className="app-toast__copy">
          <p className="app-toast__eyebrow">{eyebrowByTone[toast.tone]}</p>
          <h2 className="app-toast__title">{toast.title}</h2>
          <p className="app-toast__body">{toast.description}</p>
        </div>
        <button
          type="button"
          className="app-toast__dismiss"
          onClick={dismissToast}
          aria-label="Dismiss toast"
        >
          Close
        </button>
      </section>
    </div>
  );
};
