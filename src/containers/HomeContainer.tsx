import React from 'react';
import {HomeView} from '../views/pages/HomeView';
import {useHomeController} from '../controllers/HomeController';
import {DatabaseContainer} from './DatabaseContainer';

export const HomeContainer: React.FC = () => {
  const {
    homeData,
    selectedStorageId,
    isRefreshing,
    activeTab,
    handleStoragePress,
    handleRefresh,
    handleCleanStorage,
    handleBackupStorage,
    handleTabChange,
  } = useHomeController();

  if (!homeData) {
    return null;
  }

  return (
    <HomeView
      title={homeData.title}
      subtitle={homeData.subtitle}
      storageData={homeData.storageData}
      selectedStorageId={selectedStorageId}
      isRefreshing={isRefreshing}
      activeTab={activeTab}
      onStoragePress={handleStoragePress}
      onRefresh={handleRefresh}
      onCleanStorage={handleCleanStorage}
      onBackupStorage={handleBackupStorage}
      onTabChange={handleTabChange}
      databaseContent={<DatabaseContainer />}
    />
  );
};
