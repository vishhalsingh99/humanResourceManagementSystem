 const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || '';
 
async function openPrintPage(endpoint, payload) {
  const token = localStorage.getItem('hrmsToken');

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to generate print page');
  }

  const html = await response.text();
  const blob = new Blob([html], { type: 'text/html' });
  const url = window.URL.createObjectURL(blob);
  window.open(url, '_blank');
}

export function openEmployeePrintPage(employee) {
  return openPrintPage('/api/pdf/employee-form', { employee });
}

export function openEmployeesListPrintPage(employees) {
  return openPrintPage('/api/pdf/employees-list', { employees });
}
