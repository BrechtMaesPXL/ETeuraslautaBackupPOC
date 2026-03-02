import { NavigationScreen, NavigationParams } from '../../types/StorageTypes';

export interface INavigationState {
  currentScreen: NavigationScreen;
  params?: NavigationParams;
  history: Array<{ screen: NavigationScreen; params?: NavigationParams }>;
}

export class NavigationService {
  private static instance: NavigationService;
  private listeners: Array<(state: INavigationState) => void> = [];
  private state: INavigationState = {
    currentScreen: 'Home',
    params: undefined,
    history: [{ screen: 'Home' }],
  };

  public static getInstance(): NavigationService {
    if (!NavigationService.instance) {
      NavigationService.instance = new NavigationService();
    }
    return NavigationService.instance;
  }

  public subscribe(listener: (state: INavigationState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.state));
  }

  public navigate(screen: NavigationScreen, params?: NavigationParams): void {
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
      this.state.history.pop();
      
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

  public getCurrentState(): INavigationState {
    return { ...this.state };
  }

  public canGoBack(): boolean {
    return this.state.history.length > 1;
  }
}