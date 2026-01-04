
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  List, 
  Calendar as CalendarIcon, 
  Users, 
  ShieldCheck, 
  Settings, 
  LogOut,
  PlusCircle,
  Building2
} from 'lucide-react';
import { supabase } from './services/supabase';
import { Appointment, Doctor, Sede, CompanyProfile, AppConfig, AppointmentStatus } from './types';
import Dashboard from './components/Dashboard';
import AppointmentForm from './components/AppointmentForm';
import AppointmentList from './components/AppointmentList';
import ConfigPanel from './components/ConfigPanel';
import CalendarView from './components/CalendarView';
import AdminPanel from './components/AdminPanel';
import Login from './components/Login';
import PublicBooking from './components/PublicBooking';
import PatientList from './components/PatientList';
import { sendWebhook } from './services/webhookService';
import { OdooService } from './services/odooService';

const App: React.FC = () => {
  const [view, setView] = useState<'login' | 'app' | 'booking'>('login');
  const [activeView, setActiveView] = useState<'dashboard' | 'list' | 'calendar' | 'patients' | 'admin' | 'config' | 'new'>('dashboard');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [sedes, setSedes] = useState<Sede[]>([]);
  const [config, setConfig] = useState<AppConfig>({ companies: [], activeCompanyId: '' });
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: companiesData } = await supabase.from('companies').select('*');
      const companies: CompanyProfile[] = (companiesData || []).map(c => ({
        id: c.id,
        name: c.name,
        tagline: c.tagline,
        primaryColor: c.primary_color,
        secondaryColor: c.secondary_color,
        odoo: c.odoo_config,
        isActive: c.is_active,
        logo: c.logo
      }));

      const activeId = companies.length > 0 ? companies[0].id : '';
      setConfig({ companies, activeCompanyId: activeId });

      const { data: docsData } = await supabase.from('doctors').select('*');
      const mappedDocs = docsData || [];
      setDoctors(mappedDocs);

      const { data: sedesData } = await supabase.from('sedes').select('*');
      setSedes(sedesData || []);

      const { data: appsData } = await supabase.from('appointments').select('*').order('fecha', { ascending: true });
      const mappedApps: Appointment[] = (appsData || []).map(a => ({
        id: a.id,
        patient: {
          nombre: a.patient_name || 'Paciente',
          email: a.patient_email || '',
          telefono: a.patient_phone || '',
          dni: a.patient_dni || '',
          odoo_partner_id: a.odoo_partner_id
        },
        doctor: mappedDocs.find((d: Doctor) => d.id === a.doctor_id) || { id: a.doctor_id, nombre: 'Médico' } as Doctor,
        sede: a.sede_id || 'Principal',
        tipo: a.tipo || 'general',
        fecha: a.fecha,
        hora: a.hora,
        duracion: a.duracion || 30,
        estado: a.estado || 'pendiente',
        motivo: a.motivo || '',
        historialClinico: a.historial_clinico,
        tratamientos: a.tratamientos,
        odoo_partner_id: a.odoo_partner_id,
        odoo_sale_order_id: a.odoo_sale_order_id,
        company_id: a.company_id,
        createdAt: a.created_at,
        updatedAt: a.updated_at
      }));
      setAppointments(mappedApps);

    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateStatus = async (id: string, status: AppointmentStatus) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ estado: status, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, estado: status } : a));

      const app = appointments.find(a => a.id === id);
      const activeCompany = config.companies.find(c => c.id === config.activeCompanyId);
      
      if (app && activeCompany?.odoo.webhookUrl) {
        sendWebhook(activeCompany.odoo.webhookUrl, `cita_${status}` as any, app);
      }

      if (status === 'confirmada' && app && activeCompany) {
        const odoo = new OdooService(activeCompany.odoo);
        const partnerId = await odoo.findOrCreatePartner(app.patient);
        const products = await odoo.getMedicalProducts();
        const product = products.find(p => p.default_code === 'CONSULTA') || products[0];
        if (product) {
          const orderId = await odoo.createSaleOrder(app, partnerId, product.id);
          await supabase.from('appointments').update({ 
            odoo_sale_order_id: orderId, 
            odoo_partner_id: partnerId 
          }).eq('id', id);
        }
      }
    } catch (error) {
      console.error('Error al actualizar estado:', error);
    }
  };

  const handleSaveAppointment = async (app: Appointment) => {
    try {
      // Inserción explícita de campos para evitar errores de esquema
      const insertData = {
        id: app.id,
        patient_name: app.patient.nombre,
        patient_phone: app.patient.telefono,
        doctor_id: app.doctor.id,
        sede_id: app.sede,
        tipo: app.tipo,
        fecha: app.fecha,
        hora: app.hora,
        duracion: app.duracion,
        estado: app.estado,
        motivo: app.motivo,
        company_id: app.company_id,
        created_at: app.createdAt,
        updated_at: app.updatedAt
      };

      // Agregar campos opcionales solo si tienen valor para evitar nulos problemáticos en esquemas viejos
      if (app.patient.email) (insertData as any).patient_email = app.patient.email;
      if (app.patient.dni) (insertData as any).patient_dni = app.patient.dni;

      const { error } = await supabase.from('appointments').insert([insertData]);

      if (error) {
        console.error("Error de Supabase:", error);
        alert(`Error al guardar: ${error.message}. Asegúrese de haber ejecutado el SQL para las columnas patient_dni/email.`);
        return;
      }

      setAppointments(prev => [...prev, app]);
      setActiveView('list');

      const activeCompany = config.companies.find(c => c.id === config.activeCompanyId);
      if (activeCompany?.odoo.webhookUrl) {
        sendWebhook(activeCompany.odoo.webhookUrl, 'cita_creada', app);
      }
    } catch (error: any) {
      console.error('Error inesperado:', error);
      alert(`Error inesperado: ${error.message || error}`);
    }
  };

  const activeCompany = config.companies.find(c => c.id === config.activeCompanyId);

  if (view === 'login') return <Login onLogin={() => setView('app')} onPublicBooking={() => setView('booking')} />;
  if (view === 'booking' && activeCompany) return (
    <PublicBooking 
      company={activeCompany} 
      sedes={sedes} 
      doctors={doctors} 
      appointments={appointments} 
      onSave={handleSaveAppointment} 
    />
  );

  return (
    <div className="flex h-screen bg-[#f4f7f6] overflow-hidden">
      <aside className="w-72 bg-[#1e3050] text-white flex flex-col p-6 shadow-2xl z-20">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="bg-[#017E84] p-2 rounded-xl">
            <ShieldCheck size={28} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Citame <span className="text-[#017E84]">Pro</span></h1>
        </div>

        <nav className="flex-1 space-y-2">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'list', label: 'Agenda', icon: List },
            { id: 'calendar', label: 'Calendario', icon: CalendarIcon },
            { id: 'patients', label: 'Pacientes', icon: Users },
            { id: 'admin', label: 'Estructura', icon: Building2 },
            { id: 'config', label: 'Ajustes', icon: Settings },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id as any)}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-bold text-sm ${
                activeView === item.id 
                  ? 'bg-[#017E84] text-white shadow-lg shadow-[#017E8433]' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon size={20} />
              {item.label}
            </button>
          ))}
        </nav>

        <button 
          onClick={() => setActiveView('new')}
          className="mt-6 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#017E84] to-[#00a38d] text-white py-4 rounded-2xl font-bold shadow-xl hover:scale-105 transition-all"
        >
          <PlusCircle size={20} /> Nueva Atención
        </button>

        <div className="mt-auto pt-6 border-t border-white/10">
          <button 
            onClick={() => setView('login')}
            className="w-full flex items-center gap-4 px-5 py-4 text-slate-400 hover:text-red-400 font-bold transition-all"
          >
            <LogOut size={20} /> Salir
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-10 custom-scrollbar">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 border-4 border-[#017E84]/20 border-t-[#017E84] rounded-full animate-spin" />
            <p className="text-slate-400 font-bold animate-pulse">Sincronizando datos...</p>
          </div>
        ) : (
          <>
            {activeView === 'dashboard' && <Dashboard appointments={appointments} onNewCita={() => setActiveView('new')} />}
            {activeView === 'new' && (
              <AppointmentForm 
                onSave={handleSaveAppointment} 
                appointments={appointments} 
                sedes={sedes} 
                doctors={doctors} 
                activeCompany={activeCompany} 
              />
            )}
            {activeView === 'list' && (
              <AppointmentList 
                appointments={appointments} 
                onUpdateStatus={handleUpdateStatus} 
                doctors={doctors}
                sedes={sedes}
              />
            )}
            {activeView === 'calendar' && <CalendarView appointments={appointments} onSelectDay={() => setActiveView('new')} />}
            {activeView === 'patients' && <PatientList appointments={appointments} activeCompany={activeCompany} />}
            {activeView === 'admin' && <AdminPanel sedes={sedes} doctors={doctors} onUpdateSedes={fetchData} onUpdateDoctors={fetchData} />}
            {activeView === 'config' && <ConfigPanel config={config} onSave={(newCfg) => setConfig(newCfg)} />}
          </>
        )}
      </main>
    </div>
  );
};

export default App;
