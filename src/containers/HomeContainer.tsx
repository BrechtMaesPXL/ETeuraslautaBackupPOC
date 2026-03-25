import React from 'react';
import {HomeView} from '../views/pages/HomeView';
import {useHomeController} from '../controllers/HomeController';
import {DatabaseContainer} from './DatabaseContainer';
import {P2PTabView} from '../views/pages/P2PTabView';

export const HomeContainer: React.FC = () => {
  const {
    homeData,
    isRefreshing,
    activeTab,
    syncState,
    syncLog,
    recentItems,
    sdCardOverview,
    p2pOverview,
    isDiscoveringPeers,
    isReceivingPeers,
    p2pStatus,
    handleRefresh,
    handleTabChange,
    handleDiscoverPeers,
    handleStartReceiving,
    handleConnectPeer,
    handleShareBluetooth,
    handleImportExternal,
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
      p2pContent={
        <P2PTabView
          isDiscovering={isDiscoveringPeers}
          isReceiving={isReceivingPeers}
          peers={p2pOverview.discoveredPeers}
          localBackups={p2pOverview.localBackups}
          status={p2pStatus}
          onDiscover={handleDiscoverPeers}
          onReceive={handleStartReceiving}
          onConnect={handleConnectPeer}
          onShareBluetooth={handleShareBluetooth}
          onImportExternal={handleImportExternal}
        />
      }
    />
  );
};
