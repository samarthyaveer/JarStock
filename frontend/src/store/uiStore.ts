import { create } from "zustand";

type UiState = {
  selectedSymbol: string | null;
  setSelectedSymbol: (symbol: string) => void;
};

export const useUiStore = create<UiState>((set) => ({
  selectedSymbol: null,
  setSelectedSymbol: (symbol) => set({ selectedSymbol: symbol }),
}));
