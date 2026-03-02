/**
 * eTeuraslauta Backup POC App
 * Using MVC Architecture Pattern with Navigation
 *
 * @format
 */

import React from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { AppContainer } from './src/views/containers/AppContainer';

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <>
      <StatusBar 
        barStyle={isDarkMode ? 'light-content' : 'dark-content'} 
        backgroundColor={isDarkMode ? '#2c3e50' : '#ffffff'}
      />
      <AppContainer />
    </>
  );
}

export default App;
