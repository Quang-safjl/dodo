const KEY = "reportHistory.v1";

function readAll() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeAll(items) {
  localStorage.setItem(KEY, JSON.stringify(items.slice(0, 50)));
}

export function addReportHistory(entry) {
  const all = readAll();
  writeAll([{ ...entry, at: new Date().toISOString() }, ...all]);
}

export function getReportHistory(type) {
  return readAll().filter((x) => x.type === type);
}

