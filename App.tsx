
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Calendar, 
  Settings, 
  UserPlus, 
  ClipboardList, 
  Menu, 
  Activity,
  Bell,
  ShieldCheck,
  LogOut
} from 'lucide-react';
import { Appointment, Sede, Doctor, AppConfig } from './types';
import { OdooService } from './services/odooService';
import { DEFAULT_SEDES } from './constants';
import Dashboard from './components/Dashboard';
import CalendarView from './components/CalendarView';
import AppointmentList from './components/AppointmentList';
import AppointmentForm from './components/AppointmentForm';
import ConfigPanel from './components/ConfigPanel';
import AdminPanel from './components/AdminPanel';
import Login from './components/Login';

declare global {
  interface Window {
    storage: {
      get: (key: string) => Promise<string | null>;
      set: (key: string, value: string) => Promise<void>;
    };
  }
}

if (typeof window !== 'undefined' && !window.storage) {
  window.storage = {
    get: async (key: string) => localStorage.getItem(key),
    set: async (key: string, value: string) => localStorage.setItem(key, value),
  };
}

type View = 'login' | 'dashboard' | 'calendar' | 'list' | 'new-appointment' | 'config' | 'admin';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>('login');
  const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [sedes, setSedes] = useState<Sede[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const storedConfig = await window.storage.get('app_config');
        if (storedConfig) setConfig(JSON.parse(storedConfig));

        const storedSedes = await window.storage.get('sedes');
        setSedes(storedSedes ? JSON.parse(storedSedes) : DEFAULT_SEDES);

        const storedDoctors = await window.storage.get('doctors');
        setDoctors(storedDoctors ? JSON.parse(storedDoctors) : []);

        const storedAppointments = await window.storage.get('appointments');
        if (storedAppointments) setAppointments(JSON.parse(storedAppointments));
        
      } catch (e) {
        console.error("Error loading data", e);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const persist = async (key: string, data: any) => {
    await window.storage.set(key, JSON.stringify(data));
  };

  const handleCreateAppointment = async (newAppointment: Appointment) => {
    const updated = [newAppointment, ...appointments];
    setAppointments(updated);
    await persist('appointments', updated);
    setActiveView('list');

    if (config?.odoo.url) {
      try {
        const odoo = new OdooService(config.odoo);
        const authed = await odoo.init();
        if (authed) {
          const partnerId = await odoo.findOrCreatePartner(newAppointment.patient);
          const products = await odoo.getMedicalProducts();
          const targetProduct = products[0]; 
          if (targetProduct) {
            // Fix: Changed createSaleOrderId to createSaleOrder to match OdooService definition
            const saleOrderId = await odoo.createSaleOrder(newAppointment, partnerId, targetProduct.id);
            setAppointments(prev => {
              const res = prev.map(app => app.id === newAppointment.id ? { ...app, odoo_partner_id: partnerId, odoo_sale_order_id: saleOrderId } : app);
              persist('appointments', res);
              return res;
            });
          }
        }
      } catch (e) { console.error("Sync failed", e); }
    }
  };

  const updateAppointmentStatus = (id: string, status: Appointment['estado']) => {
    const updated = appointments.map(app => app.id === id ? { ...app, estado: status, updatedAt: new Date().toISOString() } : app);
    setAppointments(updated);
    persist('appointments', updated);
  };

  const handleUpdateConfig = async (newConfig: AppConfig) => {
    setConfig(newConfig);
    await persist('app_config', newConfig);
  };

  const NavItem = ({ icon: Icon, label, view }: { icon: any, label: string, view: View }) => (
    <button
      onClick={() => { setActiveView(view); setIsSidebarOpen(false); }}
      className={`flex items-center gap-3 w-full px-4 py-3 rounded-2xl transition-all duration-300 ${
        activeView === view 
        ? 'bg-[#017E84] text-white shadow-lg shadow-[#017E8444] scale-105' 
        : 'text-slate-400 hover:bg-slate-700/30 hover:text-white'
      }`}
    >
      <Icon size={20} />
      <span className="font-medium">{label}</span>
    </button>
  );

  if (activeView === 'login') {
    return <Login onLogin={() => setActiveView('dashboard')} />;
  }

  return (
    <div className="flex min-h-screen bg-[#f4f7f6]">
      {isSidebarOpen && <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)} />}

      <aside className={`fixed lg:static inset-y-0 left-0 w-72 bg-[#1e3050] text-white z-50 transform transition-transform duration-500 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-6 flex flex-col h-full">
          <div className="flex items-center gap-4 mb-12 animate-stagger-1">
            <div className="bg-gradient-to-br from-[#017E84] to-[#714B67] p-2.5 rounded-2xl shadow-lg">
              <Activity size={28} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">CITAME</h1>
          </div>

          <nav className="space-y-2 flex-1 animate-stagger-2">
            <NavItem icon={LayoutDashboard} label="Panel Central" view="dashboard" />
            <NavItem icon={Calendar} label="Calendario" view="calendar" />
            <NavItem icon={ClipboardList} label="Agenda Global" view="list" />
            <NavItem icon={UserPlus} label="Nueva Cita" view="new-appointment" />
            
            <div className="pt-8 mt-8 border-t border-slate-700/50 space-y-2">
              <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Administración</p>
              <NavItem icon={Settings} label="Recursos" view="admin" />
              <NavItem icon={ShieldCheck} label="Seguridad" view="config" />
            </div>
          </nav>

          <button 
            onClick={() => setActiveView('login')}
            className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-red-400 transition-colors mt-auto font-medium"
          >
            <LogOut size={20} />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto bg-[radial-gradient(circle_at_top_right,_#017E8408,_transparent_40%)]">
        <header className="sticky top-0 bg-white/60 backdrop-blur-xl border-b border-slate-200 px-8 py-5 flex justify-between items-center z-30">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 lg:hidden text-slate-600 transition-transform active:scale-95"><Menu size={24} /></button>
          
          <div className="flex items-center gap-6 ml-auto">
            <div className="relative group cursor-pointer">
              <div className="p-2.5 bg-slate-100 rounded-xl text-slate-500 group-hover:text-[#714B67] transition-all">
                <Bell size={20} />
              </div>
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-[#714B67] rounded-full border-2 border-white" />
            </div>
            
            <div className="h-10 w-[1px] bg-slate-200" />

            <div className="flex items-center gap-4 group cursor-pointer">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-900 leading-none group-hover:text-[#017E84] transition-colors">Admin Citame</p>
                <p className="text-[10px] text-slate-400 mt-1.5 font-bold uppercase tracking-tighter">Gestión de Red</p>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#017E84] to-[#714B67] p-0.5 shadow-lg group-hover:rotate-6 transition-transform">
                <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center text-[#017E84] font-bold">C</div>
              </div>
            </div>
          </div>
        </header>

        <div className="p-8 max-w-[1400px] mx-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-[70vh]"><div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#017E84]" /></div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-5 duration-700">
              {activeView === 'dashboard' && <Dashboard appointments={appointments} onNewCita={() => setActiveView('new-appointment')} />}
              {activeView === 'calendar' && <CalendarView appointments={appointments} onSelectDay={(d) => { setSelectedDate(d); setActiveView('new-appointment'); }} />}
              {activeView === 'list' && <AppointmentList appointments={appointments} onUpdateStatus={updateAppointmentStatus} />}
              {activeView === 'new-appointment' && <AppointmentForm onSave={handleCreateAppointment} appointments={appointments} initialDate={selectedDate} sedes={sedes} doctors={doctors} />}
              {activeView === 'config' && <ConfigPanel config={config} onSave={handleUpdateConfig} />}
              {activeView === 'admin' && <AdminPanel sedes={sedes} doctors={doctors} onUpdateSedes={(s) => { setSedes(s); persist('sedes', s); }} onUpdateDoctors={(d) => { setDoctors(d); persist('doctors', d); }} />}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
