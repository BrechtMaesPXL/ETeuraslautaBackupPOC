import { useState, useEffect } from 'react';
import { NavigationService, INavigationState } from '../services/NavigationService';
import { NavigationScreen, NavigationParams } from '../../types/StorageTypes';

export interface INavigationHook {
  currentScreen: NavigationScreen;
  params?: NavigationParams;
  navigate: (screen: NavigationScreen, params?: NavigationParams) => void;
  goBack: () => boolean;
  canGoBack: boolean;
}

export const useNavigation = (): INavigationHook => {
  const navigationService = NavigationService.getInstance();
  const [navigationState, setNavigationState] = useState<INavigationState>(
    navigationService.getCurrentState()
  );

  useEffect(() => {
    const unsubscribe = navigationService.subscribe((state: INavigationState) => {
      setNavigationState(state);
    });

    return unsubscribe;
  }, [navigationService]);

  const navigate = (screen: NavigationScreen, params?: NavigationParams): void => {
    navigationService.navigate(screen, params);
  };

  const goBack = (): boolean => {
    return navigationService.goBack();
  };

  return {
    currentScreen: navigationState.currentScreen,
    params: navigationState.params,
    navigate,
    goBack,
    canGoBack: navigationState.history.length > 1,
  };
};