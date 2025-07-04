import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';

export const ConnectionStatus: React.FC = () => {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkConnection = async () => {
    setIsChecking(true);
    try {
      const connected = await apiService.checkHealth();
      setIsConnected(connected);
    } catch (error) {
      setIsConnected(false);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkConnection();
    // Check connection every 10 seconds
    const interval = setInterval(checkConnection, 10000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = () => {
    if (isConnected === null || isChecking) return 'text-gray-500';
    return isConnected ? 'text-green-500' : 'text-red-500';
  };

  const getStatusText = () => {
    if (isChecking) return 'Checking...';
    if (isConnected === null) return 'Unknown';
    return isConnected ? 'Connected' : 'Disconnected';
  };

  const getStatusIcon = () => {
    if (isChecking) return '🔄';
    if (isConnected === null) return '❓';
    return isConnected ? '🟢' : '🔴';
  };

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className={`font-medium ${getStatusColor()}`}>
        {getStatusIcon()} API: {getStatusText()}
      </span>
      {!isConnected && isConnected !== null && (
        <button
          onClick={checkConnection}
          disabled={isChecking}
          className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
        >
          Retry
        </button>
      )}
    </div>
  );
};

export default ConnectionStatus;
