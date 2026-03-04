import React from 'react';
import {HomeView} from '../views/pages/HomeView';
import {useHomeController} from '../controllers/HomeController';
import {DatabaseContainer} from './DatabaseContainer';

export const HomeContainer: React.FC = () => {
  const {
    homeData,
    isRefreshing,
    activeTab,
    syncState,
    syncLog,
    recentItems,
    sdCardOverview,
    handleRefresh,
    handleTabChange,
  } = useHomeController();

  return (
    <HomeView
      title={homeData.title}
      subtitle={homeData.subtitle}
      activeTab={activeTab}
      sdCardAvailable={sdCardOverview.available}
      sdCardPath={sdCardOverview.path}
      sdCardBackups={sdCardOverview.backups}
      syncState={syncState}
      syncLog={syncLog}
      recentItems={recentItems}
      isRefreshing={isRefreshing}
      onRefresh={handleRefresh}
      onTabChange={handleTabChange}
      databaseContent={<DatabaseContainer />}
    />
  );
};
