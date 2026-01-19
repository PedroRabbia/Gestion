
export const formatCurrency = (value: number | undefined | null) => {
  const safeValue = value || 0;
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
  }).format(safeValue);
};

export const formatKilos = (value: number | undefined | null) => {
  const safeValue = value || 0;
  return `${safeValue.toFixed(2)} kg`;
};

export const generateId = () => Math.random().toString(36).substr(2, 9);

/**
 * Exporta datos a CSV con estructura exacta de Nota de Pedido
 */
export const downloadCSV = (
  entityName: string, 
  date: string, 
  headers: string[], 
  rows: string[][], 
  filename: string,
  invoiceNumber?: string | number
) => {
  const BOM = "\uFEFF"; 
  const SEP = ";"; 

  const reportRows = [
    [`"NOTA DE PEDIDO"`, `""`, `""`, `""`, `""`, `"${date}"`],
    [`"SEÑORES: ${entityName.toUpperCase()}"`, `""`, `""`, `""`, `""`, invoiceNumber ? `"N°: ${invoiceNumber}"` : `""`],
    [``],
    headers.map(h => `"${h.toUpperCase()}"`).join(SEP),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(SEP))
  ];

  const finalContent = BOM + reportRows.map(r => Array.isArray(r) ? r.join(SEP) : r).join("\n");
  
  const blob = new Blob([finalContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
