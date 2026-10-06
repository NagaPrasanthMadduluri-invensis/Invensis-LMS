// Minimal RFC4180-ish CSV parser — handles quoted fields, commas/newlines
// inside quotes, and "" escaped quotes. No dependency. Returns
// { headers, rows } where each row is an object keyed by the lowercased,
// trimmed header. Good enough for admin bulk-import files.
export function parseCsv(text) {
  const s = String(text ?? "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const grid = [];
  let field = "";
  let row = [];
  let inQuotes = false;

  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inQuotes) {
      if (c === '"') {
        if (s[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field); field = "";
    } else if (c === "\n") {
      row.push(field); field = "";
      grid.push(row); row = [];
    } else {
      field += c;
    }
  }
  row.push(field);
  grid.push(row);

  // Drop rows that are entirely empty (e.g. trailing newline).
  const nonEmpty = grid.filter((r) => r.some((cell) => cell.trim() !== ""));
  if (nonEmpty.length === 0) return { headers: [], rows: [] };

  const headers = nonEmpty[0].map((h) => h.trim().toLowerCase());
  const rows = nonEmpty.slice(1).map((r) => {
    const obj = {};
    headers.forEach((h, idx) => { obj[h] = (r[idx] ?? "").trim(); });
    return obj;
  });
  return { headers, rows };
}
