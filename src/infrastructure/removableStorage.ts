import {NativeModules, Platform} from 'react-native';

export interface RemovableStorageInfo {
  available: boolean;
  path: string | null;
}

interface RemovableStorageNativeModule {
  getInfo(): Promise<RemovableStorageInfo>;
}

const nativeModule = NativeModules.RemovableStorage as
  | RemovableStorageNativeModule
  | undefined;

export async function getRemovableStorageInfo(): Promise<RemovableStorageInfo> {
  if (Platform.OS !== 'android' || !nativeModule?.getInfo) {
    return {available: false, path: null};
  }

  try {
    const info = await nativeModule.getInfo();
    return {
      available: Boolean(info?.available && info?.path),
      path: info?.path ?? null,
    };
  } catch {
    return {available: false, path: null};
  }
}