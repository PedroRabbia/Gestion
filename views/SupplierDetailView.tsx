
import React, { useState, useMemo } from 'react';
import { Supplier, SupplierInvoice, InvoiceItem, StockProduct } from '../types.ts';
import { formatCurrency, formatKilos, generateId, downloadCSV } from '../utils.ts';

interface SupplierDetailViewProps {
  supplier: Supplier;
  invoices: SupplierInvoice[];
  stock: StockProduct[];
  onAddStockProduct: (name: string, price: number) => void;
  onCloseInvoice: (invoice: Omit<SupplierInvoice, 'invoiceNumber'>) => void;
  onDeleteInvoice: (invoiceId: string) => void;
  onBack: () => void;
}

const EMPTY_ITEM = (): InvoiceItem => ({
  id: generateId(),
  quantity: 0,
  detail: '',
  kilos: 0,
  unitPrice: 0,
  total: 0
});

const SupplierDetailView: React.FC<SupplierDetailViewProps> = ({ supplier, invoices = [], stock, onAddStockProduct, onCloseInvoice, onDeleteInvoice, onBack }) => {
  const [activeTab, setActiveTab] = useState<'history' | 'new'>('new');
  const [newItems, setNewItems] = useState<InvoiceItem[]>([EMPTY_ITEM()]);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [quickProductName, setQuickProductName] = useState('');

  const safeNum = (v: any) => {
    const n = Number(v);
    return isNaN(n) ? 0 : n;
  };

  const invoiceTotal = useMemo(() => {
    return (newItems || []).reduce((acc, item) => acc + safeNum(item.total), 0);
  }, [newItems]);

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
    const updated = [...newItems];
    const item = { ...updated[index], [field]: value };
    
    if (field === 'detail') {
      const match = stock.find(p => (p.name || '').toLowerCase() === String(value).toLowerCase());
      if (match) item.unitPrice = safeNum(match.unitPrice);
    }

    const kg = field === 'kilos' ? safeNum(value) : safeNum(item.kilos);
    const price = field === 'unitPrice' ? safeNum(value) : safeNum(item.unitPrice);
    item.total = kg * price;
    
    updated[index] = item;
    setNewItems(updated);
  };

  // Fix: Added addItemRow function
  const addItemRow = () => {
    setNewItems([...newItems, EMPTY_ITEM()]);
  };

  // Fix: Added removeItemRow function
  const removeItemRow = (index: number) => {
    if (newItems.length > 1) {
      setNewItems(newItems.filter((_, i) => i !== index));
    } else {
      setNewItems([EMPTY_ITEM()]);
    }
  };

  const handleCloseInvoice = () => {
    const validItems = newItems.filter(item => (item.detail || '').trim() !== '');
    if (validItems.length === 0) {
      alert('Cargue al menos un ítem para ingresar stock.');
      return;
    }
    onCloseInvoice({
      id: generateId(),
      supplierId: supplier.id,
      date: new Date().toLocaleDateString('es-AR'),
      items: validItems,
      closed: true
    });
    setActiveTab('history');
    setNewItems([EMPTY_ITEM()]);
  };

  const sortedInvoices = useMemo(() => {
    return [...(invoices || [])].sort((a, b) => safeNum(b.invoiceNumber) - safeNum(a.invoiceNumber));
  }, [invoices]);

  return (
    <div className="animate-in fade-in duration-500">
      {showAddProductModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[150] p-4">
          <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md animate-in zoom-in-95">
            <h3 className="text-2xl font-black mb-6">Nuevo Producto Maestro</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              onAddStockProduct(quickProductName.trim(), 0);
              setShowAddProductModal(false);
            }} className="space-y-6">
              <input autoFocus type="text" value={quickProductName} onChange={(e) => setQuickProductName(e.target.value)} className="w-full border-2 border-slate-100 rounded-xl px-4 py-4 focus:border-orange-500 outline-none" placeholder="Nombre (ej: Media Res)" required />
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowAddProductModal(false)} className="flex-1 py-4 font-bold text-slate-400">Cancelar</button>
                <button type="submit" className="flex-1 py-4 bg-orange-600 text-white font-black rounded-xl">Crear</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <button onClick={onBack} className="text-orange-600 hover:text-orange-800 text-sm font-black mb-2 flex items-center gap-1 group">
            <span className="group-hover:-translate-x-1 transition-transform">←</span> Volver a Proveedores
          </button>
          <h2 className="text-4xl font-black text-slate-900">{supplier.name}</h2>
          <p className="text-slate-400 font-medium uppercase text-[10px] tracking-widest mt-1">Gestión de Ingresos de Mercadería</p>
        </div>
      </div>

      <div className="flex bg-slate-100 p-1.5 rounded-[24px] w-fit mb-8 shadow-inner">
        <button className={`px-8 py-3 rounded-xl font-black text-xs transition-all ${activeTab === 'new' ? 'bg-white text-orange-600 shadow-md' : 'text-slate-400'}`} onClick={() => setActiveTab('new')}>Nueva Compra</button>
        <button className={`px-8 py-3 rounded-xl font-black text-xs transition-all ${activeTab === 'history' ? 'bg-white text-orange-600 shadow-md' : 'text-slate-400'}`} onClick={() => setActiveTab('history')}>Historial</button>
      </div>

      {activeTab === 'history' && (
        <div className="space-y-8">
          {sortedInvoices.length === 0 ? (
            <div className="text-center py-20 text-slate-300 bg-white rounded-3xl border-2 border-dashed border-slate-100 italic font-bold">Sin compras registradas.</div>
          ) : (
            sortedInvoices.map(inv => (
              <div key={inv.id} className="bg-white border-2 border-orange-100 rounded-[32px] overflow-hidden shadow-xl shadow-slate-200/40 animate-fadeIn">
                <div className="bg-orange-50/50 px-8 py-4 flex flex-wrap justify-between items-center gap-4 border-b border-orange-100">
                  <div className="flex items-center gap-4">
                    <span className="bg-slate-900 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">COMPRA #{safeNum(inv.invoiceNumber)}</span>
                    <span className="text-xs font-black text-slate-400">{inv.date || '-'}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <button onClick={() => confirm('¿Borrar?') && onDeleteInvoice(inv.id)} className="text-[10px] font-black text-rose-400 hover:text-rose-600 uppercase tracking-widest">Borrar Registro</button>
                  </div>
                </div>
                <div className="p-8">
                  <table className="excel-table">
                    <thead>
                      <tr className="bg-slate-50/50"><th className="w-16">Unid.</th><th>Producto</th><th className="w-24 text-center">Kilos</th><th className="w-32 text-right">Costo Unit.</th><th className="w-32 text-right">Total</th></tr>
                    </thead>
                    <tbody>
                      {(inv.items || []).map((item, idx) => (
                        <tr key={idx}>
                          <td className="text-center font-bold text-orange-600">{item.quantity || "-"}</td>
                          <td className="font-bold text-slate-800">{item.detail || "Item"}</td>
                          <td className="text-center text-slate-500">{safeNum(item.kilos) > 0 ? formatKilos(safeNum(item.kilos)) : '-'}</td>
                          <td className="text-right px-4">{formatCurrency(safeNum(item.unitPrice))}</td>
                          <td className="text-right px-4 font-black text-slate-900">{formatCurrency(safeNum(item.total))}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-orange-50/30">
                       <tr>
                        <td colSpan={4} className="text-right font-black text-[10px] uppercase text-orange-400 px-6 py-4">Inversión Total de esta Compra:</td>
                        <td className="text-right font-black text-orange-600 px-4 text-xl">{formatCurrency(safeNum((inv.items || []).reduce((acc, i) => acc + safeNum(i.total), 0)))}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'new' && (
        <div className="bg-white rounded-[40px] p-10 shadow-2xl animate-fadeIn border-4 border-orange-50">
          <div className="flex justify-between items-center mb-10">
            <h3 className="text-3xl font-black text-slate-900 tracking-tighter">Ingreso de Mercadería</h3>
            <button onClick={() => setShowAddProductModal(true)} className="bg-orange-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-orange-200">+ Maestro</button>
          </div>
          
          <div className="overflow-x-auto mb-10 border-4 border-orange-50 rounded-[32px]">
            <table className="excel-table w-full">
              <thead>
                <tr className="bg-orange-500 text-white">
                  <th className="w-20 !text-white !border-orange-600">Unid.</th>
                  <th className="!text-white !border-orange-600">Detalle / Producto</th>
                  <th className="w-32 !text-white !border-orange-600">Kilos</th>
                  <th className="w-40 text-right !text-white !border-orange-600">Costo ($)</th>
                  <th className="w-40 text-right !text-white !border-orange-600">Subtotal</th>
                  <th className="w-16 text-center !text-white !border-orange-600"></th>
                </tr>
              </thead>
              <tbody>
                {newItems.map((item, idx) => (
                  <tr key={idx}>
                    <td><input type="number" className="excel-input text-center !font-black !text-orange-600 border-2 border-orange-50 focus:border-orange-500" value={item.quantity || ''} onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)} placeholder="0"/></td>
                    <td className="relative">
                      <input list={`products-list-${idx}`} type="text" className="excel-input !text-slate-900 !font-bold border-2 border-orange-50 focus:border-orange-500" placeholder="Producto..." value={item.detail} onChange={(e) => handleItemChange(idx, 'detail', e.target.value)}/>
                      <datalist id={`products-list-${idx}`}>
                        {stock.map(p => <option key={p.id} value={p.name}>{p.quantity} unid. en stock</option>)}
                      </datalist>
                    </td>
                    <td><input type="number" className="excel-input text-center border-2 border-orange-50 focus:border-orange-500" value={item.kilos || ''} placeholder="0.00" onChange={(e) => handleItemChange(idx, 'kilos', e.target.value)}/></td>
                    <td><input type="number" className="excel-input text-right border-2 border-orange-50 focus:border-orange-500" value={item.unitPrice || ''} placeholder="0.00" onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}/></td>
                    <td className="text-right px-6 font-black text-slate-900 bg-orange-50/10">{formatCurrency(safeNum(item.total))}</td>
                    <td className="text-center bg-orange-50/10"><button onClick={() => removeItemRow(idx)} className="text-slate-300 hover:text-rose-600 transition-colors">✕</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button onClick={addItemRow} className="text-orange-600 font-black text-[10px] uppercase tracking-[0.2em] hover:text-orange-800 flex items-center gap-2 mb-12 py-4 px-8 bg-orange-50 rounded-2xl transition-all">
            + AGREGAR OTRO PRODUCTO
          </button>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 pt-10 border-t-2 border-slate-100">
            <div className="bg-orange-50/50 p-8 rounded-[40px] border-2 border-orange-100 flex-1 max-w-sm shadow-inner">
              <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest block mb-2">Total de esta Compra</span>
              <span className="text-4xl font-black text-orange-600">{formatCurrency(safeNum(invoiceTotal))}</span>
            </div>
            <div className="flex gap-4">
              <button onClick={() => confirm('¿Limpiar?') && setNewItems([EMPTY_ITEM()])} className="px-8 py-4 font-bold text-slate-400 hover:text-slate-600">Limpiar</button>
              <button onClick={handleCloseInvoice} className="bg-orange-600 text-white px-12 py-6 rounded-3xl font-black text-xl hover:bg-orange-700 shadow-2xl shadow-orange-200 active:scale-95 transition-all uppercase tracking-widest">
                ✓ REGISTRAR INGRESO
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplierDetailView;
