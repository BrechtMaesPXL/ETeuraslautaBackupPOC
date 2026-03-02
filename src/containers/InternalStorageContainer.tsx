import React from 'react';
import { InternalStorageView } from '../views/pages/InternalStorageView';
import { useInternalStorageController } from '../controllers/InternalStorageController';

export const InternalStorageContainer: React.FC = () => {
  const {
    storageData,
    isRefreshing,
    handleBack,
    handleSystemItemPress,
    handleRefresh,
    handleSystemCleanup,
  } = useInternalStorageController();

  if (!storageData) {
    return null;
  }

  return (
    <InternalStorageView
      title={storageData.title}
      subtitle={storageData.subtitle}
      totalSpace={storageData.totalSpace}
      usedSpace={storageData.usedSpace}
      systemItems={storageData.systemItems}
      onBack={handleBack}
      onSystemItemPress={handleSystemItemPress}
      onRefresh={handleRefresh}
      onSystemCleanup={handleSystemCleanup}
    />
  );
};