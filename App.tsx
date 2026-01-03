
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
  LogOut,
  Building2
} from 'lucide-react';
import { Appointment, Sede, Doctor, AppConfig, CompanyProfile } from './types';
import { OdooService } from './services/odooService';
import { DEFAULT_SEDES } from './constants';
import Dashboard from './components/Dashboard';
import CalendarView from './components/CalendarView';
import AppointmentList from './components/AppointmentList';
import AppointmentForm from './components/AppointmentForm';
import ConfigPanel from './components/ConfigPanel';
import AdminPanel from './components/AdminPanel';
import Login from './components/Login';
import PublicBooking from './components/PublicBooking';

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

type View = 'login' | 'dashboard' | 'calendar' | 'list' | 'new-appointment' | 'config' | 'admin' | 'public-booking';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>('login');
  const [config, setConfig] = useState<AppConfig>({ companies: [], activeCompanyId: '' });
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [sedes, setSedes] = useState<Sede[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [publicCompany, setPublicCompany] = useState<CompanyProfile | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        // 1. Cargar Configuración SaaS
        const storedConfig = await window.storage.get('app_config_saas');
        const parsedConfig: AppConfig = storedConfig ? JSON.parse(storedConfig) : { companies: [], activeCompanyId: '' };
        setConfig(parsedConfig);

        // 2. Detectar si estamos en una URL de reserva pública (?c=slug)
        const params = new URLSearchParams(window.location.search);
        const companySlug = params.get('c');
        
        if (companySlug) {
          const found = parsedConfig.companies.find(c => c.id === companySlug && c.isActive);
          if (found) {
            setPublicCompany(found);
            setActiveView('public-booking');
          }
        }

        // 3. Cargar datos maestros
        const storedSedes = await window.storage.get('sedes');
        setSedes(storedSedes ? JSON.parse(storedSedes) : DEFAULT_SEDES);

        const storedDoctors = await window.storage.get('doctors');
        setDoctors(storedDoctors ? JSON.parse(storedDoctors) : []);

        const storedAppointments = await window.storage.get('appointments');
        setAppointments(storedAppointments ? JSON.parse(storedAppointments) : []);
        
      } catch (e) {
        console.error("Error loading SaaS data", e);
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
    
    if (activeView !== 'public-booking') setActiveView('list');

    // Sincronización con Odoo de la compañía específica
    const currentCompany = publicCompany || config.companies.find(c => c.id === config.activeCompanyId);
    if (currentCompany?.odoo.url) {
      try {
        const odoo = new OdooService(currentCompany.odoo);
        const authed = await odoo.init();
        if (authed) {
          const partnerId = await odoo.findOrCreatePartner(newAppointment.patient);
          const products = await odoo.getMedicalProducts();
          const targetProduct = products[0]; 
          if (targetProduct) {
            const saleOrderId = await odoo.createSaleOrder(newAppointment, partnerId, targetProduct.id);
            setAppointments(prev => {
              const res = prev.map(app => app.id === newAppointment.id ? { ...app, odoo_partner_id: partnerId, odoo_sale_order_id: saleOrderId } : app);
              persist('appointments', res);
              return res;
            });
          }
        }
      } catch (e) { console.error("Sync failed for company " + currentCompany.name, e); }
    }
  };

  const handleUpdateSaaSConfig = async (newConfig: AppConfig) => {
    setConfig(newConfig);
    await persist('app_config_saas', newConfig);
  };

  if (isLoading) return <div className="flex items-center justify-center h-screen bg-[#f4f7f6]"><div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#017E84]" /></div>;

  if (activeView === 'public-booking' && publicCompany) {
    return <PublicBooking 
              company={publicCompany} 
              sedes={sedes} 
              doctors={doctors} 
              appointments={appointments} 
              onSave={handleCreateAppointment} 
            />;
  }

  if (activeView === 'login') {
    return <Login onLogin={() => setActiveView('dashboard')} onPublicBooking={() => {
      if (config.companies.length > 0) {
        setPublicCompany(config.companies[0]);
        setActiveView('public-booking');
      } else {
        alert("Primero configura una compañía en el panel administrativo.");
      }
    }} />;
  }

  const activeCompany = config.companies.find(c => c.id === config.activeCompanyId) || { name: 'CITAME Admin', primaryColor: '#017E84' };

  return (
    <div className="flex min-h-screen bg-[#f4f7f6]">
      <aside className={`fixed lg:static inset-y-0 left-0 w-72 bg-[#1e3050] text-white z-50 transform transition-transform duration-500 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-6 flex flex-col h-full">
          <div className="flex items-center gap-4 mb-12">
            <div className="p-2.5 rounded-2xl shadow-lg" style={{ backgroundColor: activeCompany.primaryColor }}>
              <Activity size={28} className="text-white" />
            </div>
            <div>
               <h1 className="text-xl font-bold tracking-tight leading-none uppercase">{activeCompany.name}</h1>
               <p className="text-[9px] text-white/40 font-bold tracking-widest mt-1">POWERED BY CITAME</p>
            </div>
          </div>

          <nav className="space-y-2 flex-1">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'calendar', label: 'Calendario', icon: Calendar },
              { id: 'list', label: 'Agenda Global', icon: ClipboardList },
              { id: 'new-appointment', label: 'Agendar Cita', icon: UserPlus },
              { id: 'admin', label: 'Recursos', icon: Building2 },
              { id: 'config', label: 'SaaS / Odoo', icon: ShieldCheck },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => { setActiveView(item.id as any); setIsSidebarOpen(false); }}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-2xl transition-all ${
                  activeView === item.id ? 'bg-white/10 text-white shadow-xl' : 'text-white/40 hover:text-white'
                }`}
                style={activeView === item.id ? { borderLeft: `4px solid ${activeCompany.primaryColor}` } : {}}
              >
                <item.icon size={20} />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>

          <button onClick={() => setActiveView('login')} className="flex items-center gap-3 px-4 py-3 text-white/40 hover:text-red-400 transition-colors mt-auto font-medium">
            <LogOut size={20} /> Cerrar Sesión
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <header className="sticky top-0 bg-white/60 backdrop-blur-xl border-b border-slate-200 px-8 py-5 flex justify-between items-center z-30">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 lg:hidden text-slate-600"><Menu size={24} /></button>
          
          <div className="flex items-center gap-6 ml-auto">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-slate-900 leading-none">{activeCompany.name}</p>
              <p className="text-[10px] text-slate-400 mt-1 font-bold">Identificador: {config.activeCompanyId || 'SaaS-Global'}</p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-slate-200 p-0.5 flex items-center justify-center font-bold text-[#1e3050]">
              {activeCompany.name.charAt(0)}
            </div>
          </div>
        </header>

        <div className="p-8 max-w-[1400px] mx-auto animate-in fade-in slide-in-from-bottom-5 duration-700">
          {activeView === 'dashboard' && <Dashboard appointments={appointments} onNewCita={() => setActiveView('new-appointment')} />}
          {activeView === 'calendar' && <CalendarView appointments={appointments} onSelectDay={(d) => setActiveView('new-appointment')} />}
          {activeView === 'list' && <AppointmentList appointments={appointments} onUpdateStatus={() => {}} />}
          {activeView === 'new-appointment' && <AppointmentForm appointments={appointments} sedes={sedes} doctors={doctors} onSave={handleCreateAppointment} />}
          {activeView === 'config' && <ConfigPanel config={config} onSave={handleUpdateSaaSConfig} />}
          {activeView === 'admin' && <AdminPanel sedes={sedes} doctors={doctors} onUpdateSedes={(s) => {setSedes(s); persist('sedes', s)}} onUpdateDoctors={(d) => {setDoctors(d); persist('doctors', d)}} />}
        </div>
      </main>
    </div>
  );
};

export default App;
