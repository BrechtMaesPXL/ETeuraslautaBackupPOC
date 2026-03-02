import { useState } from 'react';

export type ScreenName = 
  | 'Home' 
  | 'SDStorage' 
  | 'TabStorage' 
  | 'InternalStorage'
  | 'StorageDetails';

export interface NavigationParams {
  storageId?: string;
  storageType?: 'sd' | 'tab' | 'internal';
  [key: string]: any;
}

export interface NavigationState {
  currentScreen: ScreenName;
  params?: NavigationParams;
  history: Array<{ screen: ScreenName; params?: NavigationParams }>;
}

export class NavigationController {
  private static instance: NavigationController;
  private listeners: Array<(state: NavigationState) => void> = [];
  private state: NavigationState = {
    currentScreen: 'Home',
    params: undefined,
    history: [{ screen: 'Home' }],
  };

  public static getInstance(): NavigationController {
    if (!NavigationController.instance) {
      NavigationController.instance = new NavigationController();
    }
    return NavigationController.instance;
  }

  public subscribe(listener: (state: NavigationState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.state));
  }

  public navigate(screen: ScreenName, params?: NavigationParams): void {
    // Add current state to history if it's not the same screen
    if (this.state.currentScreen !== screen) {
      this.state.history.push({ 
        screen: this.state.currentScreen, 
        params: this.state.params 
      });
    }

    this.state = {
      ...this.state,
      currentScreen: screen,
      params,
    };

    console.log(`Navigating to: ${screen}`, params);
    this.notifyListeners();
  }

  public goBack(): boolean {
    if (this.state.history.length > 1) {
      // Remove current state
      this.state.history.pop();
      
      // Get previous state
      const previousState = this.state.history[this.state.history.length - 1];
      
      this.state = {
        ...this.state,
        currentScreen: previousState.screen,
        params: previousState.params,
      };

      console.log(`Going back to: ${previousState.screen}`);
      this.notifyListeners();
      return true;
    }
    return false;
  }

  public reset(screen: ScreenName = 'Home', params?: NavigationParams): void {
    this.state = {
      currentScreen: screen,
      params,
      history: [{ screen, params }],
    };
    
    console.log(`Resetting navigation to: ${screen}`);
    this.notifyListeners();
  }

  public getCurrentState(): NavigationState {
    return { ...this.state };
  }

  public canGoBack(): boolean {
    return this.state.history.length > 1;
  }

  // Navigation helper methods
  public navigateToSDStorage(storageId?: string): void {
    this.navigate('SDStorage', { storageId, storageType: 'sd' });
  }

  public navigateToTabStorage(storageId?: string): void {
    this.navigate('TabStorage', { storageId, storageType: 'tab' });
  }

  public navigateToInternalStorage(storageId?: string): void {
    this.navigate('InternalStorage', { storageId, storageType: 'internal' });
  }

  public navigateToStorageDetails(storageId: string, storageType: 'sd' | 'tab' | 'internal'): void {
    this.navigate('StorageDetails', { storageId, storageType });
  }

  public navigateToHome(): void {
    this.navigate('Home');
  }
}

// Custom hook for using navigation in React components
export const useNavigation = () => {
  const [navigationState, setNavigationState] = useState<NavigationState>(() => 
    NavigationController.getInstance().getCurrentState()
  );

  const navigation = NavigationController.getInstance();

  // Subscribe to navigation changes
  useState(() => {
    const unsubscribe = navigation.subscribe(setNavigationState);
    return unsubscribe;
  });

  return {
    navigationState,
    navigate: navigation.navigate.bind(navigation),
    goBack: navigation.goBack.bind(navigation),
    reset: navigation.reset.bind(navigation),
    canGoBack: navigation.canGoBack.bind(navigation),
    // Helper methods
    navigateToSDStorage: navigation.navigateToSDStorage.bind(navigation),
    navigateToTabStorage: navigation.navigateToTabStorage.bind(navigation),
    navigateToInternalStorage: navigation.navigateToInternalStorage.bind(navigation),
    navigateToStorageDetails: navigation.navigateToStorageDetails.bind(navigation),
    navigateToHome: navigation.navigateToHome.bind(navigation),
  };
};