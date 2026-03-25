module.exports = {
  dependencies: {
    'react-native-ble-plx': {
      platforms: {
        android: {
          // Force RN CLI to skip generating/including nonexistent CMake codegen bits
          cmakeListsPath: null,
          componentDescriptors: [],
          libraryName: null,
        },
      },
    },
    'react-native-wifi-p2p': {
      platforms: {
        android: {
          packageImportPath: 'import io.wifi.p2p.WiFiP2PManagerPackage;',
          packageInstance: 'new WiFiP2PManagerPackage()',
          // Disable CMake codegen for wifi-p2p as it's not needed
          cmakeListsPath: null,
          componentDescriptors: [],
          libraryName: null,
        },
      },
    },
  },
};
