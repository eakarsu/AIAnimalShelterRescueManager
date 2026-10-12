export function listItems(payload, endpoint = 'list') {
  const items = Array.isArray(payload) ? payload : (payload?.data ?? payload?.rows);
  if (!Array.isArray(items)) throw new Error(`Invalid list response from ${endpoint}`);
  return items;
}
