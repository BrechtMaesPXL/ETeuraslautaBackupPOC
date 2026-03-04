# eTeuraslauta Backup POC

A proof-of-concept React Native application for Android tablet field devices, researching robust data persistence, offline-tolerant sync, and physical storage management in environments with unreliable connectivity.

---

## Research Context

Field tablets operating in environments with intermittent or no connectivity face a class of problems that typical mobile apps don't encounter: data must survive power loss, SD card ejection, failed syncs, and app restarts without any data loss. This POC explores whether React Native with the New Architecture is a viable platform for this type of industrial use case.

Three core research questions drive this project:

1. **Is JSI-based SQLite fast enough for real-time CRUD on a constrained Android tablet?**
2. **Can a React Native app reliably detect and react to physical storage changes (SD card ejection/insertion) without native code?**
3. **What does a practical offline-first sync architecture look like when the "cloud" is periodically reachable?**

---

## Technology Decisions

### React Native 0.84 + New Architecture

The New Architecture (Fabric renderer + JSI) was chosen over the legacy bridge because JSI allows synchronous, direct calls into native code without serialising data to JSON. This matters for SQLite: every database operation in the old architecture required marshalling data across the JS bridge, adding latency that compounds on large result sets.

Hermes was kept as the JS engine. On ARM64 Android tablets Hermes start-up is ~40% faster than V8 and its bytecode precompilation means the app is interactive sooner — relevant when a field worker powers on the device and immediately needs data.

### `@op-engineering/op-sqlite` over `react-native-sqlite-storage`

Three SQLite libraries were evaluated:

| Library | Architecture | Binding type | Async? |
|---------|-------------|--------------|--------|
| `react-native-sqlite-storage` | Legacy bridge | NativeModule | Yes |
| `expo-sqlite` | New Arch | JSI | Yes |
| `@op-engineering/op-sqlite` | New Arch | JSI | Yes |

`op-sqlite` was selected because it exposes the most complete SQLite API surface (including `transaction()` for atomic bulk inserts), has the lowest overhead per query, and its maintainer benchmarks it against the others publicly. For this use case — frequent small reads, occasional bulk imports from backup restore — the JSI path means query results land in JS memory without an extra copy through the bridge.

### MVC with Singleton Services

A deliberate choice against the popular React hooks-everywhere pattern. The reasoning:

- **Controllers** hold business logic that has no UI dependency. This makes logic testable without mounting components.
- **Singletons** mean that `DatabaseService`, `SyncService`, and `BackupService` are initialised once and shared. There is no risk of two instances of the database connection being open simultaneously — a real concern with SQLite on Android where concurrent writers cause `SQLITE_BUSY` errors.
- **Containers** are thin: they wire hook state to pure view components. Views have no logic and can be rendered in isolation for visual testing.

The trade-off is that singletons make unit testing harder (global state). For this POC the priority was correctness over testability.

---

## Storage Architecture Research

### SD Card as a Backup Destination

Android does not provide a stable API for SD card path detection. The path varies by manufacturer (`/storage/sdcard1`, `/storage/extSdCard`, `/storage/XXXX-XXXX`). Research into the problem produced two findings:

1. `react-native-fs` exposes `ExternalStorageDirectoryPath` and `ExternalDirectoryPath`, but these point to internal emulated storage on many devices, not the physical SD card.
2. The reliable method is scanning `/proc/mounts` or `/storage` for VFAT-mounted volumes that are not the internal emulated partition.

`BackupService` implements this scan at runtime, which means it works across manufacturer firmware differences without hardcoding paths.

**SD card ejection detection** was added after testing showed that a backup in progress when the card was physically removed would leave a partial file and crash silently. The solution: a 5-second polling interval that re-checks availability and updates UI state. This is a compromise — the correct solution would be a native `BroadcastReceiver` for `ACTION_MEDIA_REMOVED`, but that requires a native module. The polling approach works for this POC with acceptable latency.

### JSON Backup Format

Backups are structured JSON with a metadata envelope:

```json
{
  "metadata": {
    "formatVersion": "1.0",
    "appVersion": "...",
    "databaseVersion": 1,
    "timestamp": "2026-03-03T10:00:00.000Z",
    "itemCount": 42,
    "deviceInfo": "..."
  },
  "items": [ ... ]
}
```

The `formatVersion` field allows future schema migrations: a reader can refuse to restore a backup from a newer format version. The `databaseVersion` field tracks SQLite schema version separately, allowing backup/restore across app updates that added columns.

Plain JSON was chosen over binary formats (SQLite dump, Protocol Buffers) for human readability and ease of debugging in the field. At the scale of this application (thousands of items at most) the size difference is not a practical concern.

---

## Sync Architecture Research

### The Offline-First Problem

The device operates in environments where connectivity exists for short windows — when a truck returns to base, when a worker walks into a building with Wi-Fi. Sync must therefore be opportunistic rather than demand-driven.

The implemented pattern:
1. A **30-second polling interval** checks whether the API endpoint is reachable and attempts a push sync.
2. On manual interaction, **immediate sync** is triggered.
3. The last successful sync timestamp and the API-enabled toggle are **persisted in SQLite** (`sync_state` table), so the sync configuration survives app restarts without requiring the user to re-enable it.

### MockApiService as a Simulation Tool

Rather than requiring a real server during development, `MockApiService` simulates the failure modes of a real endpoint:

- **500–1500 ms artificial latency** models realistic WAN round-trip times.
- **~10% random server errors** model intermittent connectivity and server-side failures.
- **Writes to a local JSON file** (`mock_api_cloud.json`) so the "uploaded" data can be inspected directly on the device.

This makes it possible to develop and test the sync state machine — idle → syncing → synced/error — without network infrastructure.

### Sync Logging

Every sync attempt is recorded in a `sync_log` SQLite table (timestamp, success/fail, item count, error message). This serves two research purposes:

1. **Audit trail**: in a field deployment, knowing when data last left the device and whether it succeeded is a compliance requirement.
2. **Failure analysis**: error messages from failed syncs are stored and surfaced in the UI, allowing diagnosis without log access.

---

## UI Research

### Three-Tab Home Screen

The home screen was structured around three concerns that a field operator needs to monitor independently:

| Tab | Concern |
|-----|---------|
| SD Card | Physical storage health — is the backup medium present and what's on it? |
| Sync | Data pipeline health — is data reaching the server and when did it last sync? |
| Database | Data management — CRUD, backup/restore, API toggle |

Earlier iterations used a flat two-tab layout (Storage / Database) but user feedback indicated that SD card status and sync status are conceptually distinct — one is about the physical device, the other about the network pipeline.

### Real-Time Status Polling

Both SD card status and sync overview data are polled every 5 seconds from the Home screen. This gives the operator an up-to-date view without requiring manual refresh, which matters when the device is mounted in a fixed position and the operator is not interacting with it.

---

## Open Research Questions

This POC deliberately left several questions unanswered for future investigation:

- **Conflict resolution**: the current sync is push-only (device → server). What happens when the server has newer data, for example after a restore from backup on a different device?
- **Delta sync**: the entire dataset is pushed on every sync. For large datasets this is wasteful. Is a Merkle-tree or timestamp-based delta approach tractable on a constrained device?
- **Native SD card events**: replacing the 5-second polling with a `BroadcastReceiver` native module would give instant ejection detection. Is the additional native code complexity worth it?
- **Encryption**: backup files are plaintext JSON. If backups are stored on removable SD cards they could be read by anyone with physical access. Should backup files be encrypted at rest?
- **Background sync**: the current sync only runs when the app is in the foreground. Android's `WorkManager` could enable background sync, but it has its own constraints (battery optimisation, Doze mode).

---

## Getting Started

> Requires [React Native environment setup](https://reactnative.dev/docs/set-up-your-environment) with Android SDK.

```sh
# Install dependencies
npm install

# Start Metro bundler
npm start

# Run on Android (physical device or emulator)
npm run android
```

### Android Physical Device Notes

- Enable **Developer Options** and **USB Debugging** on the tablet.
- For SD card functionality, use a physical device — Android emulators do not emulate removable storage.
- The app targets Android 10+ (API 29+). Scoped storage rules apply; the app uses app-specific external storage directories to avoid `READ_EXTERNAL_STORAGE` permission requirements.
