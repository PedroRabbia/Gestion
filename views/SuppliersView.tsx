
import React, { useState } from 'react';
import { Supplier } from '../types';

interface SuppliersViewProps {
  suppliers: Supplier[];
  onAddSupplier: (name: string) => void;
  onDeleteSupplier: (id: string) => void;
  onSelectSupplier: (id: string) => void;
  onBack: () => void;
}

const SuppliersView: React.FC<SuppliersViewProps> = ({ suppliers, onAddSupplier, onDeleteSupplier, onSelectSupplier, onBack }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim()) {
      onAddSupplier(newName.trim());
      setNewName('');
      setIsAdding(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <button 
            onClick={onBack}
            className="text-orange-600 hover:text-orange-800 text-sm font-black mb-2 flex items-center gap-1 group"
          >
            <span className="group-hover:-translate-x-1 transition-transform">←</span> Volver al inicio
          </button>
          <h2 className="text-3xl font-black text-slate-900">Proveedores</h2>
        </div>
        
        <div className="flex gap-3">
          <div className="relative">
            <input 
              type="text"
              placeholder="Buscar proveedor..."
              className="pl-10 pr-4 py-2.5 rounded-xl border-2 border-slate-200 focus:border-orange-500 outline-none w-full md:w-64 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30">🔍</span>
          </div>
          <button
            onClick={() => setIsAdding(true)}
            className="bg-orange-500 text-white px-6 py-2.5 rounded-xl hover:bg-orange-600 transition-all font-bold shadow-lg shadow-orange-100 whitespace-nowrap"
          >
            + Nuevo Proveedor
          </button>
        </div>
      </div>

      {isAdding && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-black mb-6 text-slate-900">Agregar Proveedor</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Razón Social / Nombre</label>
                <input
                  autoFocus
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full border-2 border-slate-100 rounded-xl px-4 py-4 focus:border-orange-500 outline-none transition-all text-lg"
                  placeholder="Ej: Distribuidora Norte"
                  required
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="flex-1 px-4 py-4 text-slate-400 font-bold hover:bg-slate-50 rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-4 bg-orange-500 text-white font-black rounded-xl hover:bg-orange-600 transition-all shadow-xl shadow-orange-100"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <table className="excel-table w-full">
          <thead>
            <tr className="bg-slate-50/50">
              <th className="py-5 px-8 text-xs font-black text-slate-400 uppercase tracking-widest">Nombre del Proveedor</th>
              <th className="py-5 px-8 text-xs font-black text-slate-400 uppercase tracking-widest text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredSuppliers.length === 0 ? (
              <tr>
                <td colSpan={2} className="py-20 text-center text-slate-300 font-bold italic">
                  {searchTerm ? 'No se encontraron proveedores para la búsqueda.' : 'No hay proveedores registrados.'}
                </td>
              </tr>
            ) : (
              filteredSuppliers.map((supplier) => (
                <tr 
                  key={supplier.id} 
                  className="hover:bg-orange-50/50 transition-colors cursor-pointer group"
                  onClick={() => onSelectSupplier(supplier.id)}
                >
                  <td className="py-5 px-8 text-lg font-bold text-slate-800">{supplier.name}</td>
                  <td className="py-5 px-8 text-center flex items-center justify-center gap-4">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSupplier(supplier.id);
                      }}
                      className="text-rose-400 hover:text-rose-600 font-black text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      BORRAR
                    </button>
                    <span className="text-orange-500 font-black text-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">GESTIONAR COMPRAS →</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SuppliersView;
