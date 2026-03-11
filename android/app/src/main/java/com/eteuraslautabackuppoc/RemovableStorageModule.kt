package com.eteuraslautabackuppoc

import android.os.Environment
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class RemovableStorageModule(
  reactContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "RemovableStorage"

  @ReactMethod
  fun getInfo(promise: Promise) {
    try {
      val path = findMountedRemovableStoragePath()
      val result = Arguments.createMap().apply {
        putBoolean("available", path != null)
        if (path != null) {
          putString("path", path)
        } else {
          putNull("path")
        }
      }

      promise.resolve(result)
    } catch (error: Exception) {
      promise.reject(
        "REMOVABLE_STORAGE_ERROR",
        "Failed to detect removable storage",
        error,
      )
    }
  }

  private fun findMountedRemovableStoragePath(): String? {
    val primaryDir = reactApplicationContext.getExternalFilesDir(null)
    val externalDirs = reactApplicationContext.getExternalFilesDirs(null)

    for (dir in externalDirs) {
      if (dir == null) {
        continue
      }

      if (primaryDir != null && dir.absolutePath == primaryDir.absolutePath) {
        continue
      }

      val state = Environment.getExternalStorageState(dir)
      val removable = Environment.isExternalStorageRemovable(dir)

      if (state == Environment.MEDIA_MOUNTED && removable) {
        return dir.absolutePath
      }
    }

    return null
  }
}