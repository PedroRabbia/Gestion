
import React, { useState, useMemo } from 'react';
import { ClientInvoice, SupplierInvoice, Client } from '../types';
import { formatCurrency } from '../utils';

interface MetricsViewProps {
  clientInvoices: ClientInvoice[];
  supplierInvoices: SupplierInvoice[];
  clients: Client[];
  onBack: () => void;
}

type Period = 'daily' | 'weekly' | 'monthly';

const MetricsView: React.FC<MetricsViewProps> = ({ clientInvoices = [], supplierInvoices = [], clients = [], onBack }) => {
  const [period, setPeriod] = useState<Period>('daily');

  // Función auxiliar para parsear fechas de forma robusta (soporta DD/MM/YYYY y DD-MM-YYYY)
  const parseInvoiceDate = (dateStr: string) => {
    if (!dateStr) return null;
    const parts = dateStr.includes('/') ? dateStr.split('/') : dateStr.split('-');
    if (parts.length < 3) return null;
    // Asumimos formato DD/MM/YYYY
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Mes 0-indexed
    const year = parseInt(parts[2], 10);
    return new Date(year, month, day);
  };

  const chartData = useMemo(() => {
    const now = new Date();
    const result: { label: string; sales: number; purchases: number }[] = [];

    if (period === 'daily') {
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const dayLabel = d.toLocaleDateString('es-AR', { weekday: 'short' });
        const dateKey = d.toLocaleDateString('es-AR');
        
        const sales = clientInvoices
          .filter(inv => inv.date === dateKey)
          .reduce((acc, inv) => acc + (Number(inv.invoiceTotal) || 0), 0);
          
        const purchases = supplierInvoices
          .filter(inv => inv.date === dateKey)
          .reduce((acc, inv) => {
            const itemsTotal = (inv.items || []).reduce((sum, item) => sum + (Number(item.total) || 0), 0);
            return acc + itemsTotal;
          }, 0);

        result.push({ label: dayLabel.toUpperCase(), sales, purchases });
      }
    } else if (period === 'weekly') {
      // Agrupación por las últimas 4 semanas
      for (let i = 3; i >= 0; i--) {
        const start = new Date();
        start.setDate(now.getDate() - (i + 1) * 7);
        const end = new Date();
        end.setDate(now.getDate() - i * 7);

        const sales = clientInvoices
          .filter(inv => {
            const invDate = parseInvoiceDate(inv.date);
            return invDate && invDate >= start && invDate <= end;
          })
          .reduce((acc, inv) => acc + (Number(inv.invoiceTotal) || 0), 0);

        const purchases = supplierInvoices
          .filter(inv => {
            const invDate = parseInvoiceDate(inv.date);
            return invDate && invDate >= start && invDate <= end;
          })
          .reduce((acc, inv) => {
            const itemsTotal = (inv.items || []).reduce((sum, item) => sum + (Number(item.total) || 0), 0);
            return acc + itemsTotal;
          }, 0);

        result.push({ label: `SEM ${4-i}`, sales, purchases });
      }
    } else if (period === 'monthly') {
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(now.getMonth() - i);
        const monthLabel = d.toLocaleDateString('es-AR', { month: 'short' }).toUpperCase();
        const targetMonth = d.getMonth();
        const targetYear = d.getFullYear();
        
        const sales = clientInvoices
          .filter(inv => {
            const invDate = parseInvoiceDate(inv.date);
            return invDate && invDate.getMonth() === targetMonth && invDate.getFullYear() === targetYear;
          })
          .reduce((acc, inv) => acc + (Number(inv.invoiceTotal) || 0), 0);

        const purchases = supplierInvoices
          .filter(inv => {
            const invDate = parseInvoiceDate(inv.date);
            return invDate && invDate.getMonth() === targetMonth && invDate.getFullYear() === targetYear;
          })
          .reduce((acc, inv) => {
            const itemsTotal = (inv.items || []).reduce((sum, item) => sum + (Number(item.total) || 0), 0);
            return acc + itemsTotal;
          }, 0);

        result.push({ label: monthLabel, sales, purchases });
      }
    }

    return result;
  }, [period, clientInvoices, supplierInvoices]);

  const totalSales = useMemo(() => clientInvoices.reduce((acc, inv) => acc + (Number(inv.invoiceTotal) || 0), 0), [clientInvoices]);
  const totalPurchases = useMemo(() => supplierInvoices.reduce((acc, inv) => acc + (inv.items || []).reduce((sum, i) => sum + (Number(i.total) || 0), 0), 0), [supplierInvoices]);
  const totalDebt = useMemo(() => clients.reduce((acc, c) => acc + (Number(c.currentBalance) || 0), 0), [clients]);

  const maxVal = Math.max(...chartData.map(d => Math.max(d.sales, d.purchases)), 1);

  return (
    <div className="animate-in fade-in duration-500 pb-20">
      <div className="mb-8">
        <button onClick={onBack} className="text-purple-600 hover:text-purple-800 text-sm font-black mb-2 flex items-center gap-1 group">
          <span className="group-hover:-translate-x-1 transition-transform">←</span> Volver
        </button>
        <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Economía y Métricas</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ventas Totales</p>
          <p className="text-3xl font-black text-blue-600">{formatCurrency(totalSales)}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Compras Totales</p>
          <p className="text-3xl font-black text-orange-600">{formatCurrency(totalPurchases)}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ganancia Bruta</p>
          <p className="text-3xl font-black text-emerald-600">{formatCurrency(totalSales - totalPurchases)}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cuentas por Cobrar</p>
          <p className="text-3xl font-black text-rose-500">{formatCurrency(totalDebt)}</p>
        </div>
      </div>

      <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-2xl mb-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h3 className="text-2xl font-black text-slate-900">Evolución de Caja</h3>
            <p className="text-slate-500 text-sm font-medium">Comparativa de ingresos vs. egresos de mercadería</p>
          </div>
          
          <div className="flex bg-slate-100 p-1 rounded-2xl">
            {(['daily', 'weekly', 'monthly'] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                  period === p ? 'bg-white text-purple-600 shadow-md' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {p === 'daily' ? 'Diario' : p === 'weekly' ? 'Semanal' : 'Mensual'}
              </button>
            ))}
          </div>
        </div>

        <div className="h-80 w-full flex items-end justify-between gap-4 px-4 relative border-b-2 border-slate-100 pb-2">
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-5">
            {[1, 2, 3, 4].map(i => <div key={i} className="w-full border-t-2 border-slate-900"></div>)}
          </div>
          
          {chartData.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-3 h-full justify-end group">
              <div className="w-full flex justify-center items-end gap-1 h-full">
                <div 
                  className="w-1/3 bg-blue-500 rounded-t-lg transition-all duration-700 relative hover:brightness-110"
                  style={{ height: `${(d.sales / maxVal) * 100}%` }}
                >
                   <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[8px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    Venta: {formatCurrency(d.sales)}
                   </div>
                </div>
                <div 
                  className="w-1/3 bg-orange-400 rounded-t-lg transition-all duration-700 relative hover:brightness-110"
                  style={{ height: `${(d.purchases / maxVal) * 100}%` }}
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[8px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    Compra: {formatCurrency(d.purchases)}
                   </div>
                </div>
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter text-center">{d.label}</span>
            </div>
          ))}
        </div>

        <div className="flex justify-center gap-8 mt-8">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Ventas</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-400 rounded-full"></div>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Compras</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl">
          <h4 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
            🥩 MARGEN OPERATIVO
          </h4>
          <div className="flex flex-col items-center justify-center h-48">
            <div className="text-6xl font-black text-emerald-600 mb-2">
              {totalSales > 0 ? (((totalSales - totalPurchases) / totalSales) * 100).toFixed(1) : '0'}%
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Sobre el volumen total de ventas</p>
          </div>
        </div>
        
        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl flex flex-col justify-center text-center">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center text-3xl mx-auto mb-6">💰</div>
          <h4 className="text-2xl font-black text-slate-900 mb-2">Salud de Caja</h4>
          <p className="text-slate-500 font-medium mb-8">Estado actual de cobranzas vs. facturación.</p>
          <div className="text-4xl font-black text-emerald-600 mb-2">
             OPTIMO
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">SISTEMA EN LÍNEA</p>
        </div>
      </div>
    </div>
  );
};

export default MetricsView;
