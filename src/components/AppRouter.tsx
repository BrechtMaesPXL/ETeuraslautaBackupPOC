import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '../controllers/NavigationController';
import { HomeContainer } from '../containers/HomeContainer';
import { SDStorageContainer } from '../containers/SDStorageContainer';
import { TabStorageContainer } from '../containers/TabStorageContainer';
import { InternalStorageContainer } from '../containers/InternalStorageContainer';

export const AppRouter: React.FC = () => {
  const { navigationState } = useNavigation();

  const renderCurrentScreen = () => {
    switch (navigationState.currentScreen) {
      case 'Home':
        return <HomeContainer />;
      case 'SDStorage':
        return <SDStorageContainer />;
      case 'TabStorage':
        return <TabStorageContainer />;
      case 'InternalStorage':
        return <InternalStorageContainer />;
      case 'StorageDetails':
        // For future implementation of a generic storage details screen
        return (
          <View style={styles.placeholderContainer}>
            <Text style={styles.placeholderText}>
              Storage Details Screen
            </Text>
            <Text style={styles.placeholderSubtext}>
              Storage ID: {navigationState.params?.storageId}
            </Text>
          </View>
        );
      default:
        return (
          <View style={styles.placeholderContainer}>
            <Text style={styles.placeholderText}>
              Screen Not Found
            </Text>
            <Text style={styles.placeholderSubtext}>
              {navigationState.currentScreen}
            </Text>
          </View>
        );
    }
  };

  return <View style={styles.container}>{renderCurrentScreen()}</View>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  placeholderText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  placeholderSubtext: {
    fontSize: 14,
    color: '#6c757d',
  },
});