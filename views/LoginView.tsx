
import React, { useState } from 'react';

interface LoginViewProps {
  onLogin: (name: string) => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onLogin(name.trim());
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decoración de fondo */}
      <div className="absolute top-0 -left-20 w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
      <div className="absolute bottom-0 -right-20 w-96 h-96 bg-emerald-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-700"></div>

      <div className="w-full max-w-md relative">
        <div className="bg-white/10 backdrop-blur-xl p-10 rounded-[40px] border border-white/10 shadow-2xl text-center">
          <div className="w-24 h-24 bg-blue-600 rounded-3xl mx-auto mb-8 flex items-center justify-center text-white text-4xl font-black shadow-2xl shadow-blue-500/50">
            DJ
          </div>
          
          <h1 className="text-4xl font-black text-white mb-2 tracking-tighter">Don Jorge</h1>
          <p className="text-slate-400 font-medium mb-12">Gestión Comercial de Carnes</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="text-left">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-4">
                Tu Nombre
              </label>
              <input
                autoFocus
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white/5 border-2 border-white/10 rounded-2xl px-6 py-5 text-white text-xl font-bold outline-none focus:border-blue-500 focus:bg-white/10 transition-all placeholder:text-slate-600"
                placeholder="Ej: Jorge"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-2xl shadow-xl shadow-blue-600/20 transition-all active:scale-95 text-lg"
            >
              ACCEDER AL SISTEMA
            </button>
          </form>

          <div className="mt-12 flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Servidor en línea</span>
          </div>
        </div>
        
        <p className="text-center text-slate-600 text-[10px] font-bold mt-8 uppercase tracking-[0.3em]">
          &copy; 2024 Don Jorge Software
        </p>
      </div>
    </div>
  );
};

export default LoginView;
