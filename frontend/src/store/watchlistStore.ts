import { create } from "zustand";

type WatchlistState = {
  symbols: string[];
  toggleSymbol: (symbol: string) => void;
  isWatching: (symbol: string) => boolean;
};

export const useWatchlistStore = create<WatchlistState>((set, get) => ({
  symbols: [],
  toggleSymbol: (symbol) => {
    const current = get().symbols;
    if (current.includes(symbol)) {
      set({ symbols: current.filter((item) => item !== symbol) });
    } else {
      set({ symbols: [...current, symbol] });
    }
  },
  isWatching: (symbol) => get().symbols.includes(symbol),
}));
