import { useCallback } from 'react';

export const useElectronAPI = () => {
  const electronAPI = window.electronAPI;

  const getAppVersion = useCallback(async () => {
    if (electronAPI) {
      return await electronAPI.getAppVersion();
    }
    return '0.0.0';
  }, [electronAPI]);

  const getPlatform = useCallback(async () => {
    if (electronAPI) {
      return await electronAPI.getPlatform();
    }
    return 'unknown';
  }, [electronAPI]);

  const getStoreValue = useCallback(
    async (key: string) => {
      if (electronAPI) {
        return await electronAPI.getStoreValue(key);
      }
      return null;
    },
    [electronAPI]
  );

  const setStoreValue = useCallback(
    async (key: string, value: any) => {
      if (electronAPI) {
        return await electronAPI.setStoreValue(key, value);
      }
    },
    [electronAPI]
  );

  const showMessageBox = useCallback(
    async (options: any) => {
      if (electronAPI) {
        return await electronAPI.showMessageBox(options);
      }
      return { response: 0 };
    },
    [electronAPI]
  );

  const getBackendStatus = useCallback(async () => {
    if (electronAPI) {
      return await electronAPI.getBackendStatus();
    }
    return { running: false, port: null };
  }, [electronAPI]);

  const getOllamaStatus = useCallback(async () => {
    if (electronAPI) {
      return await electronAPI.getOllamaStatus();
    }
    return { running: false, models: [] };
  }, [electronAPI]);

  const installOllamaModel = useCallback(
    async (modelName: string) => {
      if (electronAPI) {
        return await electronAPI.installOllamaModel(modelName);
      }
      return false;
    },
    [electronAPI]
  );

  const removeOllamaModel = useCallback(
    async (modelName: string) => {
      if (electronAPI) {
        return await electronAPI.removeOllamaModel(modelName);
      }
      return false;
    },
    [electronAPI]
  );

  const listOllamaModels = useCallback(async () => {
    if (electronAPI) {
      return await electronAPI.listOllamaModels();
    }
    return [];
  }, [electronAPI]);

  return {
    getAppVersion,
    getPlatform,
    getStoreValue,
    setStoreValue,
    showMessageBox,
    getBackendStatus,
    getOllamaStatus,
    installOllamaModel,
    removeOllamaModel,
    listOllamaModels,
    isElectron: !!electronAPI,
  };
};
