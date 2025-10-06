import { create } from 'zustand';

const useFileStore = create((set) => ({
  files: [],
  currentMode: 'browse', // 'browse', 'upload', 'organize'
  filters: {
    fileType: 'all',
    category: 'all',
    dateRange: 'all',
    searchQuery: '', // Add search query to store
  },
  setFiles: (files) => set({ files }),
  addFile: (file) => set((state) => ({ files: [...state.files, file] })),
  removeFile: (fileId) =>
    set((state) => ({ files: state.files.filter((f) => f.id !== fileId) })),
  setMode: (mode) => set({ currentMode: mode }),
  setFilters: (filters) => set({ filters }),
  setSearchQuery: (query) => set((state) => ({ 
    filters: { ...state.filters, searchQuery: query } 
  })),
  clearFilters: () => set({ 
    filters: {
      fileType: 'all',
      category: 'all',
      dateRange: 'all',
      searchQuery: '',
    }
  }),
}));

export default useFileStore;