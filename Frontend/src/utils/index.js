export const buildUploadedFileUrl = (filePath) => {
  if (!filePath) return '';
  if (/^(https?:|blob:)/i.test(filePath)) return filePath;

  const relativePath = String(filePath).replace(/^\/+/, '');
  const apiBaseUrl = import.meta.env.VITE_API_URL || '';
  const uploadsBaseUrl = apiBaseUrl.replace(/\/api\/?$/, '').replace(/\/$/, '');

  // In development Vite proxies /uploads; in deployed builds VITE_API_URL can point at the backend.
  return uploadsBaseUrl ? `${uploadsBaseUrl}/${relativePath}` : `/${relativePath}`;
};
