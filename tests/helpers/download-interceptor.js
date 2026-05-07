export async function installDownloadInterceptor(page) {
  await page.evaluate(() => {
    if (window.__downloadInterceptorInstalled) return;
    window.__downloadInterceptorInstalled = true;
    window.__downloadCaptures = [];
    window.__blobMap = new Map();
    window.__pendingReads = new Set();

    const origCreateObjectURL = URL.createObjectURL.bind(URL);
    const origRevokeObjectURL = URL.revokeObjectURL.bind(URL);
    window.__origRevokeObjectURL = origRevokeObjectURL;

    URL.createObjectURL = function (blob) {
      const url = origCreateObjectURL(blob);
      window.__blobMap.set(url, blob);
      return url;
    };

    URL.revokeObjectURL = function (url) {
      if (window.__pendingReads.has(url)) return;
      window.__blobMap.delete(url);
      origRevokeObjectURL(url);
    };

    const origClick = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function () {
      if (this.download && this.href && this.href.startsWith("blob:")) {
        const blob = window.__blobMap.get(this.href);
        if (blob) {
          const blobUrl = this.href;
          window.__pendingReads.add(blobUrl);
          const reader = new FileReader();
          reader.onload = () => {
            window.__downloadCaptures.push({
              filename: this.download,
              data: Array.from(new Uint8Array(reader.result)),
            });
            window.__pendingReads.delete(blobUrl);
            window.__blobMap.delete(blobUrl);
            origRevokeObjectURL(blobUrl);
          };
          reader.readAsArrayBuffer(blob);
        }
        return;
      }
      return origClick.call(this);
    };
  });
}
