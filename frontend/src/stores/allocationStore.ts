import { create } from 'zustand'
import type { ClippedItem } from '../features/schedule/api'

interface AllocationStore {
  lastClipped: ClippedItem[]
  setClipped: (items: ClippedItem[]) => void
  clearClipped: () => void
}

export const useAllocationStore = create<AllocationStore>((set) => ({
  lastClipped: [],
  setClipped: (items) => set({ lastClipped: items }),
  clearClipped: () => set({ lastClipped: [] }),
}))