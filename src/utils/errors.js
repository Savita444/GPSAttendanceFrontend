// Pull the most useful, user-readable message out of an axios error.
// Falls back through: server `message` → HTTP status → network error → unknown.
export function errorMessage(err, fallback = 'Something went wrong') {
  if (!err) return fallback;
  const data = err.response?.data;
  if (data?.message) return data.message;
  if (typeof data === 'string' && data.trim()) return data;
  if (err.response?.status) {
    if (err.response.status === 404) return 'Endpoint not found (is the backend running?)';
    if (err.response.status === 401) return 'Session expired — please log in again';
    if (err.response.status === 403) return 'You do not have permission for this action';
    return `Request failed (HTTP ${err.response.status})`;
  }
  if (err.code === 'ERR_NETWORK' || /Network/i.test(err.message || '')) {
    return 'Cannot reach the server — backend may not be running';
  }
  return err.message || fallback;
}
