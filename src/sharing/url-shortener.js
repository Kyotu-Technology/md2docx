export function isPrivateHost(urlString) {
  try {
    const { hostname } = new URL(urlString);
    if (
      hostname === "localhost" ||
      hostname === "[::1]" ||
      hostname === "0.0.0.0" ||
      /^127\./.test(hostname) ||
      /^10\./.test(hostname) ||
      /^192\.168\./.test(hostname) ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(hostname)
    ) {
      return true;
    }
  } catch {
    return false;
  }
  return false;
}

export async function shortenUrl(url) {
  if (isPrivateHost(url)) {
    throw new Error("URL shortening requires a public URL");
  }

  if (url.length > 5_000) {
    throw new Error("URL too long for shortener (max ~5 KB)");
  }

  const endpoint = `https://is.gd/create.php?format=json&url=${encodeURIComponent(url)}`;
  const resp = await fetch(endpoint);

  if (!resp.ok) {
    throw new Error(`Shortener returned ${resp.status}`);
  }

  const data = await resp.json();

  if (data.errorcode) {
    throw new Error(data.errormessage || "URL shortening failed");
  }

  return data.shorturl;
}
