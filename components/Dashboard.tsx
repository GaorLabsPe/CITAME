
import React from 'react';
import { Appointment } from '../types';
import { Users, CalendarCheck, CheckCircle, Clock, Plus, Activity, ArrowUpRight, AlertCircle } from 'lucide-react';
import { CONSULTA_INFO } from '../constants';

interface DashboardProps {
  appointments: Appointment[];
  onNewCita: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ appointments, onNewCita }) => {
  const today = new Date().toISOString().split('T')[0];
  const todayApps = appointments.filter(a => a.fecha === today);
  const pendingValidation = appointments.filter(a => a.estado === 'pendiente').length;
  const completed = todayApps.filter(a => a.estado === 'completada').length;

  return (
    <div className="space-y-10 animate-in fade-in duration-1000">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-4xl font-bold text-[#1e3050] tracking-tight">Panel Central <span className="text-[#017E84]">Citame</span></h2>
          <p className="text-slate-500 mt-2 font-medium">Gestión inteligente de flujos médicos y pacientes</p>
        </div>
        <button 
          onClick={onNewCita} 
          className="bg-gradient-to-r from-[#017E84] to-[#00a38d] hover:scale-105 hover:rotate-1 text-white px-8 py-4 rounded-[22px] font-bold flex items-center gap-3 transition-all shadow-xl shadow-[#017E8433]"
        >
          <Plus size={22} /> Nueva Atención
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Agenda Hoy', val: todayApps.length, icon: CalendarCheck, col: '#017E84', sub: 'Citas programadas' },
          { label: 'Por Validar', val: pendingValidation, icon: AlertCircle, col: '#f59e0b', sub: 'Reservas web pendientes' },
          { label: 'Atendidos', val: completed, icon: CheckCircle, col: '#1e3050', sub: 'Sesiones finalizadas' },
          { label: 'Productividad', val: `$${appointments.filter(a => a.estado === 'completada').reduce((s, a) => s + CONSULTA_INFO[a.tipo].price, 0)}`, icon: Activity, col: '#017E84', sub: 'Ingresos estimados' }
        ].map((item, i) => (
          <div key={i} className="glass p-7 rounded-[32px] border-white/50 hover-card group cursor-default">
            <div className="flex justify-between items-start mb-6">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:rotate-12" style={{ backgroundColor: `${item.col}15`, color: item.col }}>
                <item.icon size={28} />
              </div>
              <ArrowUpRight className="text-slate-300 group-hover:text-[#017E84]" size={20} />
            </div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{item.label}</p>
            <h3 className="text-3xl font-bold text-[#1e3050] mt-2">{item.val}</h3>
            <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase">{item.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass p-8 rounded-[35px] border-white/50">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-bold text-[#1e3050]">Próximos Pacientes</h3>
            <button className="text-xs font-bold text-[#017E84] uppercase tracking-widest hover:underline">Ver Agenda Completa</button>
          </div>
          <div className="space-y-4">
            {todayApps.slice(0, 5).map(app => (
              <div key={app.id} className="flex items-center gap-5 p-5 rounded-2xl bg-white/50 hover:bg-white transition-all border border-transparent hover:border-slate-100 group">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col items-center justify-center text-[#1e3050] border border-slate-200 group-hover:bg-[#017E84] group-hover:text-white group-hover:border-[#017E84] transition-all">
                  <span className="text-[10px] font-black uppercase opacity-60">Hora</span>
                  <span className="text-lg font-bold leading-none">{app.hora}</span>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-[#1e3050] text-lg">{app.patient.nombre}</p>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-tighter">{app.doctor.nombre} • {CONSULTA_INFO[app.tipo].label}</p>
                </div>
                <div className="flex items-center gap-3">
                   <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                     app.estado === 'pendiente' ? 'bg-amber-100 text-amber-600' : 'bg-[#017E84]/10 text-[#017E84]'
                   }`}>
                     {app.estado}
                   </span>
                </div>
              </div>
            ))}
            {todayApps.length === 0 && (
              <div className="text-center py-20">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 opacity-50">
                  <Clock size={40} className="text-slate-300" />
                </div>
                <p className="text-slate-400 font-bold">No hay actividad para hoy</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-gradient-to-br from-[#1e3050] to-[#2c3e50] p-8 rounded-[35px] text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute top-[-20%] right-[-20%] w-[150px] h-[150px] bg-[#017E84]/20 rounded-full blur-[40px] group-hover:scale-150 transition-transform duration-1000" />
            <h4 className="text-2xl font-bold mb-4">Citame Network™</h4>
            <p className="text-slate-400 text-sm font-medium leading-relaxed mb-8">Toda tu red de centros médicos sincronizada. Los cambios en agendas se reflejan instantáneamente.</p>
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-[#017E84] rounded-2xl flex items-center justify-center shadow-lg shadow-[#017E8466]">
                  <Activity size={24} />
               </div>
               <div>
                  <p className="text-xs font-bold text-slate-400">Canal</p>
                  <p className="text-sm font-bold">Conexión Segura</p>
               </div>
            </div>
          </div>

          <div className="glass p-8 rounded-[35px] border-white/50">
             <h4 className="font-bold text-[#1e3050] mb-6">Ocupación por Sede</h4>
             <div className="space-y-6">
               {['centro', 'norte'].map(s => (
                 <div key={s} className="group cursor-default">
                    <div className="flex justify-between items-end mb-3">
                       <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Sede {s}</p>
                       <p className="text-xs font-black text-[#017E84]">{Math.round((appointments.filter(a => a.sede === s).length / (appointments.length || 1)) * 100)}%</p>
                    </div>
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                       <div 
                         className="h-full bg-gradient-to-r from-[#017E84] to-[#714B67] rounded-full transition-all duration-1000 ease-out" 
                         style={{ width: `${(appointments.filter(a => a.sede === s).length / (appointments.length || 1)) * 100}%` }}
                       />
                    </div>
                 </div>
               ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
