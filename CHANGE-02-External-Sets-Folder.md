================================================================================
POKÉMON TCG PACK SIMULATOR — DAY 4 CHANGE 02 REPORT
Date: March 11, 2026
Change: External Sets Folder (No-Rebuild Set Updates)
================================================================================

PROBLEM
-------
The Tauri v1.0.0 build baked all set JSON files into the app binary via
Vite's dist output. Adding a new set required a full rebuild and reinstall.

SOLUTION
--------
Set JSON files are now stored in a folder alongside the installed .exe and
read at runtime via a Rust IPC command. No rebuild required to add sets.

FILES CHANGED
-------------
src-tauri/src/lib.rs
  Added read_set_file Rust command. Resolves filenames against the app's
  resource directory (sets/ subfolder) and returns file content as a string.

src-tauri/tauri.conf.json
  Added resources bundle entry: "../data/sets/*" → "sets/"
  Installer now copies all set JSONs into the sets/ folder at install time.

src-tauri/capabilities/default.json
  Kept as core:default only. No asset-protocol permissions needed — file
  reads go through the Rust command, not the asset:// URL protocol.

src/utils/jsonSetLoader.ts
  Added isTauri detection. In production Tauri builds, fetchBuiltInSet()
  and getAvailableBuiltInSets() call invoke('read_set_file') and
  JSON.parse() instead of fetch(). Dev server path unchanged.

BUILD RESULT
------------
  npm run tauri:build → SUCCESS
  Installer: src-tauri/target/release/bundle/nsis/
             Pokemon Pack Simulator_1.0.0_x86-setup.exe

HOW TO ADD A NEW SET (NO REBUILD)
----------------------------------
1. Copy {set-name}.json to:
     C:\Users\<you>\AppData\Local\Programs\Pokemon Pack Simulator\sets\

2. Edit sets-manifest.json in that same sets\ folder — add entry:
     { "filename": "{set-name}.json", "setName": "...", "setCode": "..." }

3. Restart the app. The new set appears in the dropdown immediately.

================================================================================
END OF CHANGE 02 REPORT
================================================================================
