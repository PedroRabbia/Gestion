
import React, { useState } from 'react';
import { StockProduct } from '../types.ts';
import { formatCurrency, formatKilos } from '../utils.ts';

interface StockViewProps {
  stock: StockProduct[];
  onAddProduct: (name: string, price: number) => void;
  onDeleteProduct: (id: string) => void;
  onBack: () => void;
}

const StockView: React.FC<StockViewProps> = ({ stock = [], onAddProduct, onDeleteProduct, onBack }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState<number>(0);

  const filteredStock = stock.filter(p => 
    (p.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedStock = [...filteredStock].sort((a, b) => 
    (a.name || '').localeCompare(b.name || '')
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim()) {
      onAddProduct(newName.trim(), newPrice);
      setNewName('');
      setNewPrice(0);
      setIsAdding(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <button 
            onClick={onBack}
            className="text-blue-600 hover:text-blue-800 text-sm font-black mb-2 flex items-center gap-1 group"
          >
            <span className="group-hover:-translate-x-1 transition-transform">←</span> Volver al inicio
          </button>
          <h2 className="text-3xl font-black text-slate-900">Stock de Mercadería</h2>
        </div>

        <div className="flex gap-3">
          <div className="relative">
            <input 
              type="text"
              placeholder="Buscar producto..."
              className="pl-10 pr-4 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-500 outline-none w-full md:w-64 transition-all shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30 text-lg">🔍</span>
          </div>
          <button
            onClick={() => setIsAdding(true)}
            className="bg-slate-900 text-white px-6 py-3 rounded-xl hover:bg-black transition-all font-bold shadow-lg shadow-slate-200 whitespace-nowrap"
          >
            + Nuevo Producto
          </button>
        </div>
      </div>

      {isAdding && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-black mb-6 text-slate-900">Alta de Producto</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Nombre del Producto</label>
                <input
                  autoFocus
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full border-2 border-slate-100 rounded-xl px-4 py-4 focus:border-blue-500 outline-none transition-all text-lg"
                  placeholder="Ej: Media Res"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Precio Sugerido ($)</label>
                <input
                  type="number"
                  value={newPrice || ''}
                  onChange={(e) => setNewPrice(Number(e.target.value))}
                  className="w-full border-2 border-slate-100 rounded-xl px-4 py-4 focus:border-blue-500 outline-none transition-all text-lg"
                  placeholder="0.00"
                />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setIsAdding(false)} className="flex-1 px-4 py-4 text-slate-400 font-bold hover:bg-slate-50 rounded-xl">Cancelar</button>
                <button type="submit" className="flex-1 px-4 py-4 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 shadow-xl">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="excel-table w-full">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="py-5 px-8 text-xs font-black text-slate-400 uppercase tracking-widest">Producto / Editor</th>
                <th className="py-5 px-8 text-xs font-black text-slate-400 uppercase tracking-widest text-center">Cantidad</th>
                <th className="py-5 px-8 text-xs font-black text-slate-400 uppercase tracking-widest text-center">Kilos Disp.</th>
                <th className="py-5 px-8 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Últ. Precio</th>
                <th className="py-5 px-8 text-xs font-black text-slate-400 uppercase tracking-widest text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedStock.length === 0 ? (
                <tr><td colSpan={5} className="py-24 text-center text-slate-300 font-bold italic">No hay productos registrados.</td></tr>
              ) : (
                sortedStock.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="py-5 px-8">
                      <div className="text-lg font-black text-slate-800 leading-none">{product.name || 'Sin nombre'}</div>
                      <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1.5 flex items-center gap-1">
                        <span>🖊️</span> {product.lastEditedBy || 'Carga Inicial'} - {product.lastEditedAt ? new Date(product.lastEditedAt).toLocaleDateString() : ''}
                      </div>
                    </td>
                    <td className="py-5 px-8 text-center">
                      <span className={`px-4 py-1.5 rounded-xl font-black text-sm ${(Number(product.quantity) || 0) <= 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-600'}`}>
                        {Number(product.quantity) || 0}
                      </span>
                    </td>
                    <td className="py-5 px-8 text-center text-slate-600 font-bold">{(Number(product.kilos) || 0) > 0 ? formatKilos(product.kilos) : '-'}</td>
                    <td className="py-5 px-8 text-right font-black text-blue-600">{formatCurrency(Number(product.unitPrice) || 0)}</td>
                    <td className="py-5 px-8 text-center">
                      <button 
                        onClick={() => onDeleteProduct(product.id)}
                        className="text-[10px] font-black text-rose-300 hover:text-rose-600 uppercase tracking-widest transition-colors opacity-0 group-hover:opacity-100"
                      >
                        🗑️ Eliminar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StockView;
