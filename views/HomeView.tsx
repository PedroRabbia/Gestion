
import React, { useState, useEffect } from 'react';
import { AppView, Client, StockProduct, Supplier } from '../types.ts';
import { downloadCSV, formatCurrency } from '../utils.ts';

interface HomeViewProps {
  onNavigate: (view: AppView) => void;
  allData?: {
    clients: Client[];
    stock: StockProduct[];
    suppliers: Supplier[];
  };
}

interface DolarData {
  compra: number;
  venta: number;
  fecha: string;
}

const HomeView: React.FC<HomeViewProps> = ({ onNavigate, allData }) => {
  const [dolar, setDolar] = useState<DolarData | null>(null);
  const clients = allData?.clients || [];
  const totalDebt = clients.reduce((acc, c) => acc + (c.currentBalance || 0), 0);
  const totalStockItems = allData?.stock.length || 0;

  useEffect(() => {
    const fetchDolar = async () => {
      try {
        const res = await fetch('https://dolarapi.com/v1/dolares/blue');
        const data = await res.json();
        setDolar(data);
      } catch (err) {
        console.error("Error fetching dolar:", err);
      }
    };
    fetchDolar();
    const interval = setInterval(fetchDolar, 1000 * 60 * 5); // Cada 5 min
    return () => clearInterval(interval);
  }, []);

  const cards = [
    { id: 'clients' as AppView, label: 'Clientes', icon: '👥', desc: 'Saldos y Notas de Pedido', color: 'bg-blue-50', border: 'hover:border-blue-400' },
    { id: 'stock' as AppView, label: 'Stock', icon: '📦', desc: 'Inventario de Mercadería', color: 'bg-emerald-50', border: 'hover:border-emerald-400' },
    { id: 'suppliers' as AppView, label: 'Proveedores', icon: '🚚', desc: 'Compras y Abastecimiento', color: 'bg-orange-50', border: 'hover:border-orange-400' },
    { id: 'metrics' as AppView, label: 'Métricas', icon: '📈', desc: 'Balance de Caja y Ganancias', color: 'bg-purple-50', border: 'hover:border-purple-400' },
  ];

  const handleExportAll = () => {
    if (!allData) return;
    const today = new Date().toLocaleDateString('es-AR');
    const todayFile = today.replace(/\//g, '-');
    
    const stockHeaders = ["PRODUCTO", "UNIDADES", "KILOS", "PRECIO"];
    const stockRows = allData.stock.map(p => [p.name, String(p.quantity), String(p.kilos), formatCurrency(p.unitPrice)]);
    downloadCSV("STOCK_TOTAL", today, stockHeaders, stockRows, `RESPALDO_STOCK_${todayFile}`);
  };

  return (
    <div className="flex flex-col items-center py-6 animate-fadeIn">
      {/* Mini Dashboard con Dólar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-5xl mb-12">
        <div className="bg-white p-6 rounded-[32px] border-2 border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cuentas por Cobrar</p>
            <p className="text-3xl font-black text-rose-500">{formatCurrency(totalDebt)}</p>
          </div>
          <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center text-2xl">💰</div>
        </div>
        <div className="bg-white p-6 rounded-[32px] border-2 border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ítems en Stock</p>
            <p className="text-3xl font-black text-emerald-600">{totalStockItems}</p>
          </div>
          <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-2xl">📦</div>
        </div>
        <div className="bg-slate-900 p-6 rounded-[32px] border-2 border-slate-800 shadow-2xl flex items-center justify-between text-white overflow-hidden relative group">
          <div className="absolute inset-0 bg-blue-600 opacity-0 group-hover:opacity-10 transition-opacity"></div>
          <div className="relative">
            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Dólar Blue Hoy</p>
            <p className="text-3xl font-black text-white">{dolar ? `$${dolar.venta}` : '...'}</p>
            <p className="text-[10px] font-bold text-slate-500 mt-1">Compra: ${dolar?.compra || '0'}</p>
          </div>
          <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">💵</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-6xl mb-12">
        {cards.map((card) => (
          <button 
            key={card.id} 
            onClick={() => onNavigate(card.id)} 
            className={`flex flex-col items-start p-8 rounded-[40px] border-4 border-transparent ${card.border} transition-all transform hover:-translate-y-2 hover:shadow-2xl w-full group ${card.color}`}
          >
            <span className="text-5xl mb-6 grayscale group-hover:grayscale-0 transition-all duration-500">{card.icon}</span>
            <h3 className="text-2xl font-black text-slate-800 mb-2">{card.label}</h3>
            <p className="text-slate-500 text-xs font-medium leading-relaxed">{card.desc}</p>
          </button>
        ))}
      </div>

      <div className="w-full max-w-5xl flex flex-col items-center gap-4">
        <button onClick={handleExportAll} className="bg-slate-900 text-white px-10 py-5 rounded-2xl font-black text-sm hover:bg-black transition-all shadow-xl flex items-center gap-3">
          <span>📥</span> DESCARGAR RESPALDO DE SEGURIDAD
        </button>
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Recomendado descargar una vez al día</p>
      </div>
    </div>
  );
};

export default HomeView;
