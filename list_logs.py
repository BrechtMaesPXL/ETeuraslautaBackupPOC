#!/usr/bin/env python3
import os
from pathlib import Path
from datetime import datetime

# Get .log files in root
root_logs = []
root_dir = Path("C:\\dev\\TestGit\\eTeuraslautaBackupPOC")

for log_file in root_dir.glob("*.log"):
    stat = log_file.stat()
    root_logs.append({
        'name': log_file.name,
        'path': str(log_file),
        'mtime': datetime.fromtimestamp(stat.st_mtime),
        'size_kb': round(stat.st_size / 1024, 2)
    })

# Get .log files in android directory (recursive)
android_logs = []
android_dir = root_dir / "android"
if android_dir.exists():
    for log_file in android_dir.rglob("*.log"):
        stat = log_file.stat()
        android_logs.append({
            'name': log_file.name,
            'path': str(log_file),
            'mtime': datetime.fromtimestamp(stat.st_mtime),
            'size_kb': round(stat.st_size / 1024, 2)
        })

# Sort by modification time (most recent first)
all_logs = root_logs + android_logs
all_logs.sort(key=lambda x: x['mtime'], reverse=True)

# Print results
if all_logs:
    print("=== LOG FILES (Sorted by Modification Date - Most Recent First) ===\n")
    print(f"{'File Name':<50} {'Modified':<20} {'Size (KB)':<12}")
    print("-" * 82)
    for log in all_logs:
        print(f"{log['name']:<50} {log['mtime'].strftime('%Y-%m-%d %H:%M:%S'):<20} {log['size_kb']:<12}")
else:
    print("No .log files found")
