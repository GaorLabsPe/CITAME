
import React, { useState, useMemo } from 'react';
import { Appointment, Patient } from '../types';
// Fix: Added missing Users and CheckCircle imports from lucide-react
import { Search, User, Users, Calendar, Clock, ChevronRight, Activity, ExternalLink, History, CheckCircle } from 'lucide-react';
import { CONSULTA_INFO } from '../constants';

interface Props {
  appointments: Appointment[];
}

// Fix: Define an interface for grouped patient data to resolve 'unknown' type issues
interface PatientGroup {
  info: Patient;
  appointments: Appointment[];
}

const PatientList: React.FC<Props> = ({ appointments }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatientEmail, setSelectedPatientEmail] = useState<string | null>(null);

  // Agrupar citas por paciente (usando email como identificador único)
  const patientsMap = useMemo(() => {
    const map = new Map<string, PatientGroup>();
    appointments.forEach(app => {
      const email = app.patient.email.toLowerCase();
      if (!map.has(email)) {
        map.set(email, { info: app.patient, appointments: [] });
      }
      map.get(email)!.appointments.push(app);
    });
    return map;
  }, [appointments]);

  const patientsList = useMemo(() => {
    // Fix: Explicitly type the array from map values to resolve 'unknown' property access errors
    const list: PatientGroup[] = Array.from(patientsMap.values());
    return list.filter(p => 
      p.info.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.info.dni?.includes(searchTerm) ||
      p.info.email.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => b.appointments.length - a.appointments.length);
  }, [patientsMap, searchTerm]);

  const selectedPatientData = useMemo(() => {
    if (!selectedPatientEmail) return null;
    return patientsMap.get(selectedPatientEmail.toLowerCase());
  }, [selectedPatientEmail, patientsMap]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
      {/* Lista de Pacientes */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
          <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Users size={20} className="text-[#017E84]" /> Directorio
          </h2>
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
            <input 
              placeholder="Buscar por nombre o DNI..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-[#017E84]/20 font-medium text-sm"
            />
          </div>
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {patientsList.map(p => (
              <button 
                key={p.info.email}
                onClick={() => setSelectedPatientEmail(p.info.email)}
                className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all text-left group ${
                  selectedPatientEmail === p.info.email ? 'bg-[#1e3050] text-white shadow-lg' : 'hover:bg-slate-50 border border-transparent hover:border-slate-100'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                  selectedPatientEmail === p.info.email ? 'bg-white/10 text-white' : 'bg-[#017E84]/10 text-[#017E84]'
                }`}>
                  {p.info.nombre.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{p.info.nombre}</p>
                  <p className={`text-[10px] truncate ${selectedPatientEmail === p.info.email ? 'text-white/50' : 'text-slate-400'}`}>
                    {p.appointments.length} citas registradas
                  </p>
                </div>
                <ChevronRight size={16} className={selectedPatientEmail === p.info.email ? 'text-white/30' : 'text-slate-200'} />
              </button>
            ))}
            {patientsList.length === 0 && (
              <p className="text-center py-10 text-slate-400 text-sm font-medium">No hay pacientes que coincidan.</p>
            )}
          </div>
        </div>
      </div>

      {/* Historial Detallado */}
      <div className="lg:col-span-2 space-y-6">
        {selectedPatientData ? (
          <div className="animate-in fade-in slide-in-from-right-5">
            <div className="bg-white p-8 rounded-[35px] border border-slate-100 shadow-sm mb-6">
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                  <div className="flex items-center gap-5">
                     <div className="w-20 h-20 rounded-3xl bg-slate-50 flex items-center justify-center text-[#1e3050] font-black text-3xl border border-slate-100">
                        {selectedPatientData.info.nombre.charAt(0)}
                     </div>
                     <div>
                        <h3 className="text-2xl font-bold text-slate-900">{selectedPatientData.info.nombre}</h3>
                        <p className="text-sm text-slate-400 font-medium">Paciente desde: {new Date(selectedPatientData.appointments[selectedPatientData.appointments.length -1].createdAt).toLocaleDateString()}</p>
                        <div className="flex gap-2 mt-2">
                           <span className="px-3 py-1 bg-[#017E84]/10 text-[#017E84] rounded-full text-[10px] font-black uppercase tracking-widest">WhatsApp: {selectedPatientData.info.telefono}</span>
                           <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-[10px] font-black uppercase tracking-widest">DNI: {selectedPatientData.info.dni || 'No reg.'}</span>
                        </div>
                     </div>
                  </div>
                  <div className="text-right">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">ID Odoo Sincronizado</p>
                     <div className="flex items-center justify-end gap-2 font-bold text-[#017E84]">
                        <Activity size={16} /> #{selectedPatientData.appointments[0].odoo_partner_id || 'PENDIENTE'}
                     </div>
                  </div>
               </div>

               <h4 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                  <History size={20} className="text-[#714B67]" /> Historial de Atenciones
               </h4>

               <div className="space-y-6 relative before:absolute before:left-[19px] before:top-4 before:bottom-0 before:w-0.5 before:bg-slate-50">
                  {selectedPatientData.appointments.sort((a,b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()).map((app, idx) => (
                    <div key={app.id} className="relative pl-12 group">
                       <div className={`absolute left-0 top-1 w-10 h-10 rounded-xl flex items-center justify-center z-10 border-4 border-white transition-all group-hover:scale-110 ${
                         app.estado === 'completada' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'
                       }`}>
                          {app.estado === 'completada' ? <CheckCircle size={18} /> : <Clock size={18} />}
                       </div>
                       <div className="p-6 rounded-[24px] bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all">
                          <div className="flex justify-between items-start mb-4">
                             <div>
                                <p className="text-sm font-black text-slate-800">{new Date(app.fecha).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                <p className="text-xs text-slate-400 font-bold uppercase mt-1 tracking-tighter">{app.hora} • Sede {app.sede.toUpperCase()}</p>
                             </div>
                             <div className="flex items-center gap-2">
                                {app.odoo_sale_order_id && (
                                  <div className="flex items-center gap-1.5 px-3 py-1 bg-white rounded-lg border border-slate-100 text-[10px] font-bold text-[#017E84]">
                                    <ExternalLink size={12} /> Pedido Odoo #{app.odoo_sale_order_id}
                                  </div>
                                )}
                                <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                                  app.estado === 'completada' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                                }`}>
                                   {app.estado}
                                </span>
                             </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Servicio</p>
                                <p className="text-sm font-bold text-slate-700">{CONSULTA_INFO[app.tipo].label}</p>
                             </div>
                             <div className="space-y-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Especialista</p>
                                <p className="text-sm font-bold text-slate-700">{app.doctor.nombre}</p>
                             </div>
                          </div>
                          {app.motivo && (
                            <div className="mt-4 pt-4 border-t border-slate-100">
                               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Observaciones</p>
                               <p className="text-sm text-slate-500 leading-relaxed font-medium italic">"{app.motivo}"</p>
                            </div>
                          )}
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        ) : (
          <div className="h-full min-h-[500px] flex flex-col items-center justify-center bg-white rounded-[40px] border border-slate-100 border-dashed">
             <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                <History size={48} className="text-slate-200" />
             </div>
             <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">Selecciona un paciente para ver su historial</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientList;
