import { contextBridge, ipcRenderer } from 'electron';

export type ElectronAPI = {
  getAppVersion: () => Promise<string>;
  getPlatform: () => Promise<string>;
  getStoreValue: (key: string) => Promise<any>;
  setStoreValue: (key: string, value: any) => Promise<void>;
  showMessageBox: (options: any) => Promise<any>;
  getBackendStatus: () => Promise<{ running: boolean; port: number | null }>;
  getOllamaStatus: () => Promise<{ running: boolean; models: string[] }>;
  installOllamaModel: (modelName: string) => Promise<boolean>;
  removeOllamaModel: (modelName: string) => Promise<boolean>;
  listOllamaModels: () => Promise<string[]>;
};

const electronAPI: ElectronAPI = {
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getPlatform: () => ipcRenderer.invoke('get-platform'),
  getStoreValue: (key: string) => ipcRenderer.invoke('get-store-value', key),
  setStoreValue: (key: string, value: any) =>
    ipcRenderer.invoke('set-store-value', key, value),
  showMessageBox: (options: any) =>
    ipcRenderer.invoke('show-message-box', options),
  getBackendStatus: () => ipcRenderer.invoke('get-backend-status'),
  getOllamaStatus: () => ipcRenderer.invoke('get-ollama-status'),
  installOllamaModel: (modelName: string) =>
    ipcRenderer.invoke('install-ollama-model', modelName),
  removeOllamaModel: (modelName: string) =>
    ipcRenderer.invoke('remove-ollama-model', modelName),
  listOllamaModels: () => ipcRenderer.invoke('list-ollama-models'),
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// Types for the renderer process
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
