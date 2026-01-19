
import React, { useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  runTransaction
} from "firebase/firestore";
import { db } from './firebase.ts';
import { 
  AppView, 
  Client, 
  StockProduct, 
  Supplier, 
  ClientInvoice, 
  SupplierInvoice, 
  InvoiceItem 
} from './types.ts';
import { generateId } from './utils.ts';
import HomeView from './views/HomeView.tsx';
import ClientsView from './views/ClientsView.tsx';
import StockView from './views/StockView.tsx';
import SuppliersView from './views/SuppliersView.tsx';
import ClientDetailView from './views/ClientDetailView.tsx';
import SupplierDetailView from './views/SupplierDetailView.tsx';
import LoginView from './views/LoginView.tsx';
import MetricsView from './views/MetricsView.tsx';

const App: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [stock, setStock] = useState<StockProduct[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [clientInvoices, setClientInvoices] = useState<ClientInvoice[]>([]);
  const [supplierInvoices, setSupplierInvoices] = useState<SupplierInvoice[]>([]);
  
  const [dbError, setDbError] = useState<{message: string, code?: string} | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const [user, setUser] = useState<string | null>(localStorage.getItem('dj_user_name'));
  const [currentTime, setCurrentTime] = useState(new Date());

  const [currentView, setCurrentView] = useState<AppView>('home');
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);

  const safeNum = (val: any): number => {
    const n = Number(val);
    return isNaN(n) ? 0 : n;
  };

  const sanitizeData = (data: any): any => {
    if (data === null || data === undefined) return null;
    if (typeof data === 'number') return isNaN(data) ? 0 : data;
    if (Array.isArray(data)) return data.map(sanitizeData);
    if (typeof data === 'object' && !(data instanceof Date)) {
      const sanitized: any = {};
      for (const key in data) {
        sanitized[key] = sanitizeData(data[key]);
      }
      return sanitized;
    }
    return data;
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!user) return;

    const handleError = (error: any) => {
      console.error("🔥 Firestore Error:", error);
      setDbError({ 
        message: "Error de conexión con la nube. Reintente.",
        code: error.code 
      });
    };

    const unsubClients = onSnapshot(collection(db, "clients"), (s) => 
      setClients(s.docs.map(d => ({ ...d.data(), id: d.id } as Client))), handleError);
    
    const unsubStock = onSnapshot(collection(db, "stock"), (s) => 
      setStock(s.docs.map(d => ({ ...d.data(), id: d.id } as StockProduct))), handleError);
    
    const unsubSuppliers = onSnapshot(collection(db, "suppliers"), (s) => 
      setSuppliers(s.docs.map(d => ({ ...d.data(), id: d.id } as Supplier))), handleError);
    
    const unsubClientInv = onSnapshot(collection(db, "clientInvoices"), (s) => 
      setClientInvoices(s.docs.map(d => ({ ...d.data(), id: d.id } as ClientInvoice))), handleError);
    
    const unsubSupplierInv = onSnapshot(collection(db, "supplierInvoices"), (s) => 
      setSupplierInvoices(s.docs.map(d => ({ ...d.data(), id: d.id } as SupplierInvoice))), handleError);

    return () => {
      unsubClients(); unsubStock(); unsubSuppliers(); unsubClientInv(); unsubSupplierInv();
    };
  }, [user]);

  const handleLogin = (name: string) => {
    setUser(name);
    localStorage.setItem('dj_user_name', name);
  };

  const handleLogout = () => {
    if(confirm('¿Cerrar sesión?')) {
      setUser(null);
      localStorage.removeItem('dj_user_name');
    }
  };

  const getNextInvoiceNumber = async () => {
    const counterRef = doc(db, "settings", "counters");
    return await runTransaction(db, async (transaction) => {
      const counterDoc = await transaction.get(counterRef);
      if (!counterDoc.exists()) {
        transaction.set(counterRef, { nextNumber: 1000 });
        return 1000;
      }
      const newNumber = counterDoc.data().nextNumber;
      transaction.update(counterRef, { nextNumber: newNumber + 1 });
      return newNumber;
    });
  };

  const addClient = async (name: string) => {
    try {
      setIsSyncing(true);
      const id = generateId();
      await setDoc(doc(db, "clients", id), sanitizeData({ id, name, active: true, currentBalance: 0 }));
    } catch (e: any) { setDbError({ message: "Error al crear cliente", code: e.code }); }
    finally { setIsSyncing(false); }
  };

  const deleteClient = async (id: string) => {
    if (!confirm('¿Eliminar cliente? Se perderán sus saldos.')) return;
    try {
      setIsSyncing(true);
      await deleteDoc(doc(db, "clients", id));
    } catch (e: any) { setDbError({ message: "Error al borrar", code: e.code }); }
    finally { setIsSyncing(false); }
  };

  const addSupplier = async (name: string) => {
    try {
      setIsSyncing(true);
      const id = generateId();
      await setDoc(doc(db, "suppliers", id), sanitizeData({ id, name }));
    } catch (e: any) { setDbError({ message: "Error al crear proveedor", code: e.code }); }
    finally { setIsSyncing(false); }
  };

  const deleteSupplier = async (id: string) => {
    if (!confirm('¿Eliminar proveedor?')) return;
    try {
      setIsSyncing(true);
      await deleteDoc(doc(db, "suppliers", id));
    } catch (e: any) { setDbError({ message: "Error al borrar", code: e.code }); }
    finally { setIsSyncing(false); }
  };

  const addStockProduct = async (name: string, price: number) => {
    try {
      setIsSyncing(true);
      const id = generateId();
      await setDoc(doc(db, "stock", id), sanitizeData({ 
        id, name, quantity: 0, kilos: 0, unitPrice: safeNum(price),
        lastEditedBy: user || 'Sistema',
        lastEditedAt: new Date().toISOString()
      }));
    } catch (e: any) { setDbError({ message: "Error al crear producto", code: e.code }); }
    finally { setIsSyncing(false); }
  };

  const deleteStockProduct = async (id: string) => {
    if (!confirm('¿Eliminar producto del sistema? Esto no se puede deshacer.')) return;
    try {
      setIsSyncing(true);
      await deleteDoc(doc(db, "stock", id));
    } catch (e: any) { setDbError({ message: "Error al borrar producto", code: e.code }); }
    finally { setIsSyncing(false); }
  };

  const updateStockInFirestore = async (items: InvoiceItem[], type: 'sale' | 'purchase' | 'revert_sale' | 'revert_purchase') => {
    for (const item of items) {
      if (!item.detail) continue;
      const itemName = item.detail.trim();
      const product = stock.find(p => p.name.toLowerCase() === itemName.toLowerCase());
      
      const qtyChange = safeNum(item.quantity);
      const kiloChange = safeNum(item.kilos);
      const priceVal = safeNum(item.unitPrice);
      let multiplier = (type === 'sale' || type === 'revert_purchase') ? -1 : 1;

      if (product) {
        await updateDoc(doc(db, "stock", product.id), sanitizeData({
          quantity: safeNum(product.quantity) + (qtyChange * multiplier),
          kilos: safeNum(product.kilos) + (kiloChange * multiplier),
          unitPrice: type === 'purchase' ? priceVal : safeNum(product.unitPrice),
          lastEditedBy: user || 'Sistema',
          lastEditedAt: new Date().toISOString()
        }));
      } else if (type === 'purchase' || type === 'revert_sale') {
        const id = generateId();
        await setDoc(doc(db, "stock", id), sanitizeData({
          id, name: itemName,
          quantity: qtyChange * multiplier,
          kilos: kiloChange * multiplier,
          unitPrice: priceVal,
          lastEditedBy: user || 'Sistema',
          lastEditedAt: new Date().toISOString()
        }));
      }
    }
  };

  const closeClientInvoice = async (invoice: Omit<ClientInvoice, 'invoiceNumber'>) => {
    try {
      setIsSyncing(true);
      const nextNum = await getNextInvoiceNumber();
      const finalInvoice = sanitizeData({ ...invoice, invoiceNumber: nextNum, closed: true });
      await setDoc(doc(db, "clientInvoices", finalInvoice.id), finalInvoice);
      await updateDoc(doc(db, "clients", invoice.clientId), { currentBalance: safeNum(finalInvoice.finalBalance) });
      await updateStockInFirestore(invoice.items, 'sale');
    } catch (e: any) { setDbError({ message: "Error al cerrar boleta", code: e.code }); }
    finally { setIsSyncing(false); }
  };

  const closeSupplierInvoice = async (invoice: Omit<SupplierInvoice, 'invoiceNumber'>) => {
    try {
      setIsSyncing(true);
      const nextNum = await getNextInvoiceNumber();
      const finalInvoice = sanitizeData({ ...invoice, invoiceNumber: nextNum, closed: true });
      await setDoc(doc(db, "supplierInvoices", finalInvoice.id), finalInvoice);
      await updateStockInFirestore(invoice.items, 'purchase');
    } catch (e: any) { setDbError({ message: "Error al ingresar compra", code: e.code }); }
    finally { setIsSyncing(false); }
  };

  const deleteClientInvoice = async (invoiceId: string) => {
    try {
      setIsSyncing(true);
      const inv = clientInvoices.find(i => i.id === invoiceId);
      if (!inv) return;
      const client = clients.find(c => c.id === inv.clientId);
      if (client) {
        await updateDoc(doc(db, "clients", client.id), { 
          currentBalance: safeNum(client.currentBalance) - safeNum(inv.invoiceTotal) + safeNum(inv.cashPayment)
        });
      }
      await updateStockInFirestore(inv.items, 'revert_sale');
      await deleteDoc(doc(db, "clientInvoices", invoiceId));
    } catch (e: any) { setDbError({ message: "Error al borrar", code: e.code }); }
    finally { setIsSyncing(false); }
  };

  const deleteSupplierInvoice = async (invoiceId: string) => {
    try {
      setIsSyncing(true);
      const inv = supplierInvoices.find(i => i.id === invoiceId);
      if (!inv) return;
      await updateStockInFirestore(inv.items, 'revert_purchase');
      await deleteDoc(doc(db, "supplierInvoices", invoiceId));
    } catch (e: any) { setDbError({ message: "Error al borrar", code: e.code }); }
    finally { setIsSyncing(false); }
  };

  if (!user) {
    return <LoginView onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      {dbError && (
        <div className="bg-rose-600 text-white px-6 py-4 shadow-2xl z-[100] fixed top-0 w-full animate-in slide-in-from-top">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xl">🚨</span>
              <div>
                <p className="font-black text-sm uppercase tracking-tight">{dbError.message}</p>
                <p className="text-[10px] opacity-80 font-mono">Código: {dbError.code || 'CLOUD_ERROR'}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setDbError(null); location.reload(); }} className="px-4 py-2 text-[10px] font-bold border border-white rounded-lg hover:bg-white/10 transition-colors">ACTUALIZAR APP</button>
            </div>
          </div>
        </div>
      )}
      
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => { setSelectedEntityId(null); setCurrentView('home'); }}>
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl transition-all group-hover:scale-110">DJ</div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight leading-none">Don Jorge</h1>
            <div className="flex items-center gap-1.5 mt-1">
              <div className={`w-2 h-2 rounded-full ${dbError ? 'bg-rose-500' : 'bg-emerald-500 animate-pulse'}`}></div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Sincronizado</span>
            </div>
          </div>
        </div>
        
        <nav className="hidden md:flex items-center gap-2">
          <button onClick={() => { setSelectedEntityId(null); setCurrentView('clients'); }} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${currentView === 'clients' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}>Clientes</button>
          <button onClick={() => { setSelectedEntityId(null); setCurrentView('stock'); }} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${currentView === 'stock' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}>Stock</button>
          <button onClick={() => { setSelectedEntityId(null); setCurrentView('suppliers'); }} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${currentView === 'suppliers' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}>Proveedores</button>
          <button onClick={() => { setSelectedEntityId(null); setCurrentView('metrics'); }} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${currentView === 'metrics' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}>📈 Métricas</button>
          <div className="w-px h-6 bg-slate-200 mx-2"></div>
          <button onClick={handleLogout} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center hover:bg-rose-50 hover:text-rose-600 transition-colors text-slate-400">🚪</button>
        </nav>
      </header>

      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white px-6 py-3 shadow-lg flex flex-col md:flex-row items-center justify-between gap-2 overflow-hidden relative">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="relative flex items-center gap-3">
          <span className="text-xl">👋</span>
          <p className="text-sm md:text-base font-bold tracking-tight">
            Bienvenido, <span className="text-blue-200 uppercase font-black">{user}</span>
          </p>
        </div>
        <div className="relative bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/20 flex items-center gap-3">
          <span className="text-lg md:text-xl font-black font-mono tracking-widest">
            {currentTime.toLocaleTimeString('es-AR', { hour12: false })}
          </span>
        </div>
      </div>

      <main className={`flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full transition-opacity ${isSyncing ? 'opacity-70' : 'opacity-100'}`}>
        {(() => {
          switch (currentView) {
            case 'home': 
              return <HomeView onNavigate={(v) => { setSelectedEntityId(null); setCurrentView(v); }} allData={{ clients, stock, suppliers }} />;
            case 'clients': 
              return <ClientsView clients={clients} onAddClient={addClient} onDeleteClient={deleteClient} onBack={() => { setSelectedEntityId(null); setCurrentView('home'); }} onSelectClient={(id) => { setSelectedEntityId(id); setCurrentView('client_detail'); }} />;
            case 'client_detail': 
              const c = clients.find(x => x.id === selectedEntityId);
              if (!c) return <div className="p-12 text-center text-rose-500 font-bold bg-white rounded-3xl shadow-sm">Cliente no encontrado.</div>;
              return <ClientDetailView client={c} invoices={clientInvoices.filter(i => i.clientId === c.id)} stock={stock} onAddStockProduct={addStockProduct} onCloseInvoice={closeClientInvoice} onDeleteInvoice={deleteClientInvoice} onBack={() => { setSelectedEntityId(null); setCurrentView('clients'); }} />;
            case 'stock': 
              return <StockView stock={stock} onAddProduct={addStockProduct} onDeleteProduct={deleteStockProduct} onBack={() => { setSelectedEntityId(null); setCurrentView('home'); }} />;
            case 'suppliers': 
              return <SuppliersView suppliers={suppliers} onAddSupplier={addSupplier} onDeleteSupplier={deleteSupplier} onBack={() => { setSelectedEntityId(null); setCurrentView('home'); }} onSelectSupplier={(id) => { setSelectedEntityId(id); setCurrentView('supplier_detail'); }} />;
            case 'supplier_detail':
              const s = suppliers.find(x => x.id === selectedEntityId);
              if (!s) return <div className="p-12 text-center text-rose-500 font-bold bg-white rounded-3xl shadow-sm">Proveedor no encontrado.</div>;
              return <SupplierDetailView supplier={s} invoices={supplierInvoices.filter(i => i.supplierId === s.id)} stock={stock} onAddStockProduct={addStockProduct} onCloseInvoice={closeSupplierInvoice} onDeleteInvoice={deleteSupplierInvoice} onBack={() => { setSelectedEntityId(null); setCurrentView('suppliers'); }} />;
            case 'metrics':
              return <MetricsView clientInvoices={clientInvoices} supplierInvoices={supplierInvoices} clients={clients} onBack={() => { setSelectedEntityId(null); setCurrentView('home'); }} />;
            default: return <div className="p-12 text-center">Iniciando aplicación...</div>;
          }
        })()}
      </main>

      {isSyncing && (
        <div className="fixed bottom-8 right-8 bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce z-[60]">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-black uppercase tracking-widest">Sincronizando...</span>
        </div>
      )}
    </div>
  );
};

export default App;
