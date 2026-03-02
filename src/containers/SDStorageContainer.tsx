import React from 'react';
import { SDStorageView } from '../views/pages/SDStorageView';
import { useSDStorageController } from '../controllers/SDStorageController';

export const SDStorageContainer: React.FC = () => {
  const {
    storageData,
    isRefreshing,
    handleBack,
    handleFilePress,
    handleRefresh,
    handleManageStorage,
  } = useSDStorageController();

  if (!storageData) {
    return null;
  }

  return (
    <SDStorageView
      title={storageData.title}
      subtitle={storageData.subtitle}
      totalSpace={storageData.totalSpace}
      usedSpace={storageData.usedSpace}
      files={storageData.files}
      onBack={handleBack}
      onFilePress={handleFilePress}
      onRefresh={handleRefresh}
      onManageStorage={handleManageStorage}
    />
  );
};