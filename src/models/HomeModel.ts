export interface IFeature {
  id: string;
  title: string;
  description: string;
  icon: string;
  isEnabled: boolean;
  order: number;
}

export interface IHomeData {
  id: string;
  title: string;
  subtitle: string;
  features: IFeature[];
  lastUpdated: Date;
  version: string;
}

export interface IUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'viewer';
  preferences: {
    theme: 'light' | 'dark';
    language: string;
  };
}

export class HomeModel {
  private static instance: HomeModel;
  private homeData: IHomeData | null = null;
  private currentUser: IUser | null = null;

  public static getInstance(): HomeModel {
    if (!HomeModel.instance) {
      HomeModel.instance = new HomeModel();
    }
    return HomeModel.instance;
  }

  public async loadHomeData(): Promise<IHomeData> {
    // Simulate API call or data loading
    if (!this.homeData) {
      this.homeData = {
        id: 'home-001',
        title: 'eTeuraslauta Backup POC',
        subtitle: 'Digital meat processing and quality control system',
        features: [
          {
            id: 'quality-control',
            title: 'Quality Control',
            description: 'Monitor and track meat quality parameters',
            icon: '🔍',
            isEnabled: true,
            order: 1,
          },
          {
            id: 'inventory',
            title: 'Inventory',
            description: 'Manage stock levels and track products',
            icon: '📦',
            isEnabled: true,
            order: 2,
          },
          {
            id: 'reports',
            title: 'Reports',
            description: 'Generate detailed analytics and reports',
            icon: '📊',
            isEnabled: true,
            order: 3,
          },
          {
            id: 'settings',
            title: 'Settings',
            description: 'Configure system preferences',
            icon: '⚙️',
            isEnabled: true,
            order: 4,
          },
        ],
        lastUpdated: new Date(),
        version: '1.0.0',
      };
    }
    return this.homeData;
  }

  public async saveHomeData(data: IHomeData): Promise<boolean> {
    try {
      // Simulate API call to save data
      this.homeData = { ...data, lastUpdated: new Date() };
      return true;
    } catch (error) {
      console.error('Error saving home data:', error);
      return false;
    }
  }

  public getCurrentUser(): IUser | null {
    return this.currentUser;
  }

  public setCurrentUser(user: IUser): void {
    this.currentUser = user;
  }

  public getEnabledFeatures(): IFeature[] {
    if (!this.homeData) return [];
    return this.homeData.features
      .filter(feature => feature.isEnabled)
      .sort((a, b) => a.order - b.order);
  }

  public updateFeature(featureId: string, updates: Partial<IFeature>): boolean {
    if (!this.homeData) return false;
    
    const featureIndex = this.homeData.features.findIndex(f => f.id === featureId);
    if (featureIndex === -1) return false;

    this.homeData.features[featureIndex] = {
      ...this.homeData.features[featureIndex],
      ...updates,
    };
    
    return true;
  }

  public addFeature(feature: IFeature): boolean {
    if (!this.homeData) return false;
    
    // Check if feature already exists
    if (this.homeData.features.find(f => f.id === feature.id)) {
      return false;
    }
    
    this.homeData.features.push(feature);
    return true;
  }

  public removeFeature(featureId: string): boolean {
    if (!this.homeData) return false;
    
    const featureIndex = this.homeData.features.findIndex(f => f.id === featureId);
    if (featureIndex === -1) return false;

    this.homeData.features.splice(featureIndex, 1);
    return true;
  }

  public resetToDefaults(): void {
    this.homeData = null;
    this.currentUser = null;
  }
}