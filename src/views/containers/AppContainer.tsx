import React, {useEffect} from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useNavigation } from '../../controllers/hooks/useNavigation';
import { HomeContainer } from '../../containers/HomeContainer';
import { StorageView } from '../pages/StorageView';
import {p2pTransfer} from '../../features/p2pTransfer/p2pTransferService';
import {WifiDirectAdapter} from '../../features/p2pTransfer/wifiDirectAdapter';

export const AppContainer: React.FC = () => {
  const { currentScreen, params } = useNavigation();

  useEffect(() => {
    // Register Wi-Fi Direct adapter so the P2P tab can discover peers.
    p2pTransfer.setAdapter(new WifiDirectAdapter());
  }, []);

  const renderScreen = () => {
    switch (currentScreen) {
      case 'Home':
        return <HomeContainer />;
      case 'SDStorage':
        return (
          <StorageView
            storageType="sd"
            title="SD Storage"
            params={params}
          />
        );
      case 'TabStorage':
        return (
          <StorageView
            storageType="tab"
            title="Tab Storage"
            params={params}
          />
        );
      case 'InternalStorage':
        return (
          <StorageView
            storageType="internal"
            title="Internal Storage"
            params={params}
          />
        );
      default:
        return <HomeContainer />;
    }
  };

  return (
    <SafeAreaProvider>
      {renderScreen()}
    </SafeAreaProvider>
  );
};