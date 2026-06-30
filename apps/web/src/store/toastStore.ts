import { create } from 'zustand';

export type ToastTone = 'success' | 'error';

export interface IToastMessage {
  id: number;
  tone: ToastTone;
  title: string;
  description: string;
}

interface IToastState {
  toast: IToastMessage | null;
  showToast: (payload: Omit<IToastMessage, 'id'>) => void;
  dismissToast: () => void;
}

let toastTimer: ReturnType<typeof setTimeout> | null = null;

export const useToastStore = create<IToastState>((set) => ({
  toast: null,
  showToast: (payload) => {
    if (toastTimer) {
      globalThis.clearTimeout(toastTimer);
      toastTimer = null;
    }

    set({
      toast: {
        id: Date.now(),
        ...payload,
      },
    });

    toastTimer = globalThis.setTimeout(() => {
      set({ toast: null });
      toastTimer = null;
    }, 3200);
  },
  dismissToast: () => {
    if (toastTimer) {
      globalThis.clearTimeout(toastTimer);
      toastTimer = null;
    }

    set({ toast: null });
  },
}));
