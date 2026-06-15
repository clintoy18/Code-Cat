import { create } from 'zustand';

interface ISettingsState {
  volume: number;
  difficulty: 'easy' | 'medium' | 'hard';
  theme: 'light' | 'dark' | 'system';
  setVolume: (value: number) => void;
  setDifficulty: (value: ISettingsState['difficulty']) => void;
  setTheme: (value: ISettingsState['theme']) => void;
}

export const useSettingsStore = create<ISettingsState>((set) => ({
  volume: 70,
  difficulty: 'easy',
  theme: 'system',
  setVolume: (volume) => set({ volume }),
  setDifficulty: (difficulty) => set({ difficulty }),
  setTheme: (theme) => set({ theme }),
}));
