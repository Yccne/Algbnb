const memoryStore = {};

const hasLocalStorage = () => typeof localStorage !== 'undefined';

export const storage = {
  getItem(key) {
    if (hasLocalStorage()) return localStorage.getItem(key);
    return memoryStore[key] ?? null;
  },
  setItem(key, value) {
    if (hasLocalStorage()) {
      localStorage.setItem(key, value);
      return;
    }
    memoryStore[key] = value;
  },
  removeItem(key) {
    if (hasLocalStorage()) {
      localStorage.removeItem(key);
      return;
    }
    delete memoryStore[key];
  },
};
