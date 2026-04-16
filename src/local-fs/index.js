export { isFileSystemAccessSupported, isFileSystemObserverSupported } from "./capability.js";
export {
  mountFolder,
  unmountFolder,
  isLocalFsMode,
  getState,
  getFolderName,
  saveToLocalFs,
  createInLocalFs,
  deleteFromLocalFs,
  renameInLocalFs,
  changeMainInLocalFs,
  setCallbacks,
  getStorageMode,
  restoreFromPersistedHandle,
  rescanFolder,
  regrantPermission,
  fileToDocument,
  localIdFor,
  LOCAL_ID_PREFIX,
} from "./sync-engine.js";
export { initMountUI, handleMountShortcut } from "./mount-ui.js";
