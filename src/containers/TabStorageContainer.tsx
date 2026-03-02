import React from 'react';
import { TabStorageView } from '../views/pages/TabStorageView';
import { useTabStorageController } from '../controllers/TabStorageController';

export const TabStorageContainer: React.FC = () => {
  const {
    storageData,
    isRefreshing,
    handleBack,
    handleAppPress,
    handleRefresh,
    handleOptimizeStorage,
  } = useTabStorageController();

  if (!storageData) {
    return null;
  }

  return (
    <TabStorageView
      title={storageData.title}
      subtitle={storageData.subtitle}
      totalSpace={storageData.totalSpace}
      usedSpace={storageData.usedSpace}
      apps={storageData.apps}
      onBack={handleBack}
      onAppPress={handleAppPress}
      onRefresh={handleRefresh}
      onOptimizeStorage={handleOptimizeStorage}
    />
  );
};