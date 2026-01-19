
import React, { useState, useMemo } from 'react';
import { Client, ClientInvoice, InvoiceItem, StockProduct } from '../types.ts';
import { formatCurrency, formatKilos, generateId, downloadCSV } from '../utils.ts';

interface ClientDetailViewProps {
  client: Client;
  invoices: ClientInvoice[];
  stock: StockProduct[];
  onAddStockProduct: (name: string, price: number) => void;
  onCloseInvoice: (invoice: Omit<ClientInvoice, 'invoiceNumber'>) => void;
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

const ClientDetailView: React.FC<ClientDetailViewProps> = ({ client, invoices = [], stock, onAddStockProduct, onCloseInvoice, onDeleteInvoice, onBack }) => {
  const [activeTab, setActiveTab] = useState<'history' | 'new' | 'payment'>('history');
  const [newItems, setNewItems] = useState<InvoiceItem[]>([EMPTY_ITEM()]);
  const [cashPayment, setCashPayment] = useState<number>(0);
  const [directPaymentAmount, setDirectPaymentAmount] = useState<number>(0);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [quickProductName, setQuickProductName] = useState('');
  const [quickProductPrice, setQuickProductPrice] = useState<number>(0);

  const safeNum = (v: any) => {
    const n = Number(v);
    return isNaN(n) ? 0 : n;
  };

  const invoiceTotal = useMemo(() => {
    return (newItems || []).reduce((acc, item) => acc + safeNum(item.total), 0);
  }, [newItems]);

  const finalBalance = safeNum(client.currentBalance) + invoiceTotal - safeNum(cashPayment);

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
      alert('Debe cargar al menos un producto o registrar un abono directo.');
      return;
    }
    
    onCloseInvoice({
      id: generateId(),
      clientId: client.id,
      date: new Date().toLocaleDateString('es-AR'),
      items: validItems,
      previousBalance: safeNum(client.currentBalance),
      invoiceTotal: safeNum(invoiceTotal),
      cashPayment: safeNum(cashPayment),
      finalBalance: safeNum(finalBalance),
      closed: true,
      type: 'sale'
    });
    
    setActiveTab('history');
    setNewItems([EMPTY_ITEM()]);
    setCashPayment(0);
  };

  const handleDirectPayment = () => {
    if (safeNum(directPaymentAmount) <= 0) {
      alert('Ingrese un monto válido.');
      return;
    }
    
    onCloseInvoice({
      id: generateId(),
      clientId: client.id,
      date: new Date().toLocaleDateString('es-AR'),
      items: [],
      previousBalance: safeNum(client.currentBalance),
      invoiceTotal: 0,
      cashPayment: safeNum(directPaymentAmount),
      finalBalance: safeNum(client.currentBalance) - safeNum(directPaymentAmount),
      closed: true,
      type: 'payment'
    });
    
    setDirectPaymentAmount(0);
    setActiveTab('history');
  };

  const shareWhatsApp = (inv: ClientInvoice) => {
    let text = `*DON JORGE - NOTA DE PEDIDO #${inv.invoiceNumber}*\n`;
    text += `*Fecha:* ${inv.date}\n`;
    text += `*Cliente:* ${client.name}\n\n`;
    
    if ((inv.items || []).length > 0) {
      inv.items.forEach(i => {
        text += `• ${i.detail}: ${i.kilos}kg x ${formatCurrency(i.unitPrice)} = *${formatCurrency(i.total)}*\n`;
      });
      text += `\n*Total Venta:* ${formatCurrency(inv.invoiceTotal)}\n`;
    }
    
    if (safeNum(inv.cashPayment) > 0) {
      text += `*Entrega Efectivo:* -${formatCurrency(inv.cashPayment)}\n`;
    }
    
    text += `\n*SALDO FINAL:* ${formatCurrency(inv.finalBalance)}`;
    
    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  const sortedInvoices = useMemo(() => {
    return [...(invoices || [])].sort((a, b) => safeNum(b.invoiceNumber) - safeNum(a.invoiceNumber));
  }, [invoices]);

  return (
    <div className="animate-in fade-in duration-500">
      {showAddProductModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[150] p-4">
          <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md animate-in zoom-in-95">
            <h3 className="text-2xl font-black mb-6 text-slate-900">Nuevo Producto Maestro</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              onAddStockProduct(quickProductName.trim(), safeNum(quickProductPrice));
              setShowAddProductModal(false);
            }} className="space-y-6">
              <input autoFocus type="text" value={quickProductName} onChange={(e) => setQuickProductName(e.target.value)} className="w-full border-2 border-slate-100 rounded-xl px-4 py-4 focus:border-blue-500 outline-none" placeholder="Nombre (ej: Vacío)" required />
              <input type="number" value={quickProductPrice || ''} onChange={(e) => setQuickProductPrice(safeNum(e.target.value))} className="w-full border-2 border-slate-100 rounded-xl px-4 py-4 focus:border-blue-500 outline-none" placeholder="Precio Venta Sugerido" />
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowAddProductModal(false)} className="flex-1 py-4 font-bold text-slate-400">Cancelar</button>
                <button type="submit" className="flex-1 py-4 bg-slate-900 text-white font-black rounded-xl">Crear</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <button onClick={onBack} className="text-blue-600 hover:text-blue-800 text-sm font-black mb-2 flex items-center gap-1 group">
            <span className="group-hover:-translate-x-1 transition-transform">←</span> Volver a Clientes
          </button>
          <h2 className="text-4xl font-black text-slate-900">{client.name}</h2>
          <div className="flex items-center gap-3 mt-3">
            <span className="bg-blue-600 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">Saldo Deudor</span>
            <span className={`text-3xl font-black ${safeNum(client.currentBalance) > 0 ? 'text-rose-500' : 'text-emerald-600'}`}>
              {formatCurrency(safeNum(client.currentBalance))}
            </span>
          </div>
        </div>
      </div>

      <div className="flex bg-slate-100 p-1.5 rounded-[24px] w-fit mb-8 shadow-inner overflow-x-auto max-w-full">
        <button className={`px-6 py-3 rounded-xl font-black text-xs transition-all whitespace-nowrap ${activeTab === 'history' ? 'bg-white text-blue-600 shadow-md' : 'text-slate-400'}`} onClick={() => setActiveTab('history')}>Historial</button>
        <button className={`px-6 py-3 rounded-xl font-black text-xs transition-all whitespace-nowrap ${activeTab === 'new' ? 'bg-white text-blue-600 shadow-md' : 'text-slate-400'}`} onClick={() => setActiveTab('new')}>Nueva Venta</button>
        <button className={`px-6 py-3 rounded-xl font-black text-xs transition-all whitespace-nowrap ${activeTab === 'payment' ? 'bg-white text-emerald-600 shadow-md' : 'text-slate-400'}`} onClick={() => setActiveTab('payment')}>Registrar Pago</button>
      </div>

      {activeTab === 'history' && (
        <div className="space-y-6">
          {sortedInvoices.length === 0 ? (
            <div className="text-center py-20 text-slate-300 bg-white rounded-3xl border-2 border-dashed border-slate-100 italic font-bold">Sin movimientos.</div>
          ) : (
            sortedInvoices.map(inv => (
              <div key={inv.id} className={`bg-white border-2 ${inv.type === 'payment' ? 'border-emerald-100' : 'border-slate-100'} rounded-[32px] overflow-hidden shadow-xl shadow-slate-200/40 animate-fadeIn`}>
                <div className="bg-slate-50/50 px-8 py-4 flex flex-wrap justify-between items-center gap-4 border-b border-slate-100">
                  <div className="flex items-center gap-4">
                    <span className={`${inv.type === 'payment' ? 'bg-emerald-600' : 'bg-slate-900'} text-white px-4 py-1 rounded-full text-[10px] font-black tracking-widest uppercase`}>
                      {inv.type === 'payment' ? 'ABONO' : `BOLETA #${safeNum(inv.invoiceNumber)}`}
                    </span>
                    <span className="text-xs font-black text-slate-400">{inv.date || '-'}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <button onClick={() => shareWhatsApp(inv)} className="text-[10px] font-black text-emerald-600 hover:text-emerald-700 uppercase tracking-widest">WhatsApp 📱</button>
                    <button onClick={() => confirm('¿Eliminar?') && onDeleteInvoice(inv.id)} className="text-[10px] font-black text-rose-400 hover:text-rose-600 uppercase tracking-widest">Borrar</button>
                  </div>
                </div>
                <div className="p-8">
                  {inv.type === 'payment' ? (
                    <div className="flex items-center justify-between">
                      <p className="text-lg font-bold text-slate-600">Entrega de efectivo / Pago a cuenta</p>
                      <p className="text-2xl font-black text-emerald-600">-{formatCurrency(safeNum(inv.cashPayment))}</p>
                    </div>
                  ) : (
                    <table className="excel-table mb-4">
                      <thead>
                        <tr><th className="w-16">Unid.</th><th>Detalle</th><th className="w-24 text-center">Kilos</th><th className="w-32 text-right">Precio</th><th className="w-32 text-right">Total</th></tr>
                      </thead>
                      <tbody>
                        {(inv.items || []).map((item, idx) => (
                          <tr key={idx}>
                            <td className="text-center font-bold text-blue-700">{item.quantity || "-"}</td>
                            <td className="font-bold text-slate-800">{item.detail || "Item"}</td>
                            <td className="text-center font-medium text-slate-500">{safeNum(item.kilos) > 0 ? formatKilos(safeNum(item.kilos)) : '-'}</td>
                            <td className="text-right px-4">{formatCurrency(safeNum(item.unitPrice))}</td>
                            <td className="text-right px-4 font-black text-slate-900">{formatCurrency(safeNum(item.total))}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-slate-50/50">
                        <tr>
                          <td colSpan={4} className="text-right font-black text-[10px] uppercase text-slate-400 px-6 py-2">Total de esta Venta:</td>
                          <td className="text-right font-black text-slate-900 px-4">{formatCurrency(safeNum(inv.invoiceTotal))}</td>
                        </tr>
                        {safeNum(inv.cashPayment) > 0 && (
                          <tr>
                            <td colSpan={4} className="text-right font-black text-[10px] uppercase text-emerald-500 px-6 py-2">Entrega en Efectivo:</td>
                            <td className="text-right font-black text-emerald-600 px-4">-{formatCurrency(safeNum(inv.cashPayment))}</td>
                          </tr>
                        )}
                        <tr className="border-t border-slate-200">
                          <td colSpan={4} className="text-right font-black text-[10px] uppercase text-slate-900 px-6 py-3">Saldo al momento:</td>
                          <td className="text-right font-black text-rose-500 px-4">{formatCurrency(safeNum(inv.finalBalance))}</td>
                        </tr>
                      </tfoot>
                    </table>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'payment' && (
        <div className="bg-white rounded-[40px] p-10 shadow-2xl animate-fadeIn border-4 border-emerald-50 max-w-2xl mx-auto">
          <h3 className="text-3xl font-black text-emerald-600 mb-8 tracking-tighter">Registrar Entrega de Efectivo</h3>
          <div className="space-y-8">
            <div className="bg-emerald-50 p-8 rounded-[32px] border-2 border-emerald-100 shadow-inner">
              <label className="block text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-4">Monto recibido ($)</label>
              <input 
                type="number" 
                autoFocus
                className="w-full bg-white border-4 border-emerald-100 rounded-3xl px-8 py-8 text-5xl font-black text-emerald-700 outline-none focus:border-emerald-500 transition-all shadow-xl"
                placeholder="0"
                value={directPaymentAmount || ''}
                onChange={(e) => setDirectPaymentAmount(safeNum(e.target.value))}
              />
            </div>
            
            <div className="bg-slate-50 p-6 rounded-2xl flex justify-between items-center">
              <span className="text-xs font-black text-slate-400 uppercase">Nuevo Saldo Deudor:</span>
              <span className="text-xl font-black text-rose-500">{formatCurrency(safeNum(client.currentBalance) - safeNum(directPaymentAmount))}</span>
            </div>

            <button 
              onClick={handleDirectPayment}
              className="w-full bg-emerald-600 text-white py-6 rounded-3xl font-black text-xl hover:bg-emerald-700 shadow-xl shadow-emerald-200 active:scale-95 transition-all uppercase tracking-widest"
            >
              ✓ Confirmar Pago Recibido
            </button>
          </div>
        </div>
      )}

      {activeTab === 'new' && (
        <div className="bg-white rounded-[40px] p-10 shadow-2xl animate-fadeIn border-4 border-blue-50">
          <div className="flex justify-between items-center mb-10">
            <h3 className="text-3xl font-black text-slate-900 tracking-tighter">Nota de Venta</h3>
            <button onClick={() => setShowAddProductModal(true)} className="bg-blue-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-200 transition-all">+ Maestro</button>
          </div>
          
          <div className="overflow-x-auto mb-10 rounded-[32px] border-4 border-blue-50">
            <table className="excel-table w-full">
              <thead>
                <tr className="bg-blue-600 text-white">
                  <th className="w-20 !border-blue-700 !text-white">Unid.</th>
                  <th className="!border-blue-700 !text-white">Producto</th>
                  <th className="w-32 !border-blue-700 !text-white">Kilos</th>
                  <th className="w-40 text-right !border-blue-700 !text-white">Precio ($)</th>
                  <th className="w-40 text-right !border-blue-700 !text-white">Subtotal</th>
                  <th className="w-16 text-center !border-blue-700 !text-white"></th>
                </tr>
              </thead>
              <tbody>
                {newItems.map((item, idx) => (
                  <tr key={idx}>
                    <td><input type="number" className="excel-input text-center !font-black !text-blue-700 border-2 border-blue-50 focus:border-blue-500" value={item.quantity || ''} onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)} placeholder="0"/></td>
                    <td className="relative">
                      <input list={`products-list-${idx}`} type="text" className="excel-input !text-slate-900 !font-bold border-2 border-blue-50 focus:border-blue-500" placeholder="Buscar..." value={item.detail} onChange={(e) => handleItemChange(idx, 'detail', e.target.value)}/>
                      <datalist id={`products-list-${idx}`}>
                        {stock.map(p => <option key={p.id} value={p.name}>{formatCurrency(safeNum(p.unitPrice))}</option>)}
                      </datalist>
                    </td>
                    <td><input type="number" className="excel-input text-center border-2 border-blue-50 focus:border-blue-500" value={item.kilos || ''} placeholder="0.00" onChange={(e) => handleItemChange(idx, 'kilos', e.target.value)}/></td>
                    <td><input type="number" className="excel-input text-right border-2 border-blue-50 focus:border-blue-500" value={item.unitPrice || ''} placeholder="0.00" onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}/></td>
                    <td className="text-right px-6 font-black text-slate-900 bg-blue-50/10">{formatCurrency(safeNum(item.total))}</td>
                    <td className="text-center bg-blue-50/10"><button onClick={() => removeItemRow(idx)} className="text-slate-300 hover:text-rose-600 transition-colors">✕</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button onClick={addItemRow} className="text-blue-600 font-black text-[10px] uppercase tracking-[0.2em] hover:text-blue-800 flex items-center gap-2 mb-12 py-4 px-8 bg-blue-50 rounded-2xl transition-all shadow-sm">
            + AGREGAR OTRO PRODUCTO
          </button>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-10 border-t-2 border-slate-100">
            <div className="bg-blue-50/50 p-10 rounded-[40px] border-2 border-blue-100 shadow-inner">
              <label className="block text-[10px] font-black text-blue-500 uppercase tracking-widest mb-6">Paga en este momento ($)</label>
              <input 
                type="number" 
                className="w-full px-8 py-8 rounded-3xl border-4 border-blue-100 text-5xl font-black text-blue-700 outline-none focus:border-blue-500 transition-all bg-white shadow-xl" 
                placeholder="0" 
                value={cashPayment || ''} 
                onChange={(e) => setCashPayment(safeNum(e.target.value))}
              />
            </div>
            <div className="flex flex-col justify-center space-y-6">
               <div className="flex justify-between items-center px-6">
                 <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Boleta:</span>
                 <span className="text-3xl font-black text-slate-900">{formatCurrency(safeNum(invoiceTotal))}</span>
               </div>
               <div className="flex justify-between items-center px-10 py-8 bg-rose-50 rounded-[32px] border-4 border-rose-100 shadow-lg">
                 <span className="text-xs font-black text-rose-500 uppercase tracking-widest">Nuevo Saldo:</span>
                 <span className="text-4xl font-black text-rose-600">{formatCurrency(safeNum(finalBalance))}</span>
               </div>
               <button onClick={handleCloseInvoice} className="bg-blue-600 text-white w-full py-8 rounded-[32px] font-black text-2xl hover:bg-blue-700 shadow-2xl shadow-blue-200 active:scale-95 transition-all uppercase tracking-widest">
                 ✓ GUARDAR NOTA DE VENTA
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientDetailView;
