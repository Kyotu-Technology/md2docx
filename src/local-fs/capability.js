export function isFileSystemAccessSupported() {
  return typeof window !== "undefined" && "showDirectoryPicker" in window && window.isSecureContext;
}

export function isFileSystemObserverSupported() {
  return typeof window !== "undefined" && "FileSystemObserver" in window;
}
