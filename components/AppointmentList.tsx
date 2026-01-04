
import React, { useState, useMemo, useEffect } from 'react';
import { Appointment, AppointmentStatus, SedeType, Doctor, Sede } from '../types';
import { 
  Search, 
  CheckCircle, 
  XCircle, 
  Clock, 
  LayoutList, 
  LayoutGrid, 
  FileText, 
  Stethoscope, 
  Save, 
  X,
  RefreshCcw,
  CalendarDays,
  ListPlus,
  Calendar,
  Settings2,
  MapPin,
  User,
  Edit3
} from 'lucide-react';
import { CONSULTA_INFO } from '../constants';
import { supabase } from '../services/supabase';

interface Props {
  appointments: Appointment[];
  onUpdateStatus: (id: string, status: AppointmentStatus) => void;
  doctors: Doctor[];
  sedes: Sede[];
}

const getStatusBadge = (status: AppointmentStatus) => {
  switch (status) {
    case 'pendiente':
      return 'bg-purple-100 text-purple-700 border-purple-200';
    case 'confirmada':
      return 'bg-cyan-100 text-cyan-700 border-cyan-200';
    case 'completada':
      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'cancelada':
      return 'bg-rose-100 text-rose-700 border-rose-200';
    default:
      return 'bg-slate-100 text-slate-600 border-slate-200';
  }
};

const AppointmentList: React.FC<Props> = ({ appointments, onUpdateStatus, doctors, sedes }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [activeTab, setActiveTab] = useState<'evolucion' | 'reprogramar' | 'seguimiento'>('evolucion');
  
  const [selectedApp, setSelectedApp] = useState<Appointment | null>(null);
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [treatments, setTreatments] = useState('');
  
  const [editSede, setEditSede] = useState('');
  const [editDoctor, setEditDoctor] = useState('');
  const [editFecha, setEditFecha] = useState('');
  const [editHora, setEditHora] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const [numSessions, setNumSessions] = useState(1);
  const [intervalDays, setIntervalDays] = useState(7);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCustomDates, setIsCustomDates] = useState(false);
  const [sessionDates, setSessionDates] = useState<string[]>([]);

  const filtered = useMemo(() => {
    return appointments.filter(app => {
      const matchesSearch = app.patient.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           app.patient.dni?.includes(searchTerm);
      return matchesSearch;
    });
  }, [appointments, searchTerm]);

  const handleOpenClinical = (app: Appointment) => {
    setSelectedApp(app);
    setClinicalNotes(app.historialClinico || '');
    setTreatments(app.tratamientos || '');
    setEditSede(app.sede);
    setEditDoctor(app.doctor.id);
    setEditFecha(app.fecha);
    setEditHora(app.hora);
    setActiveTab('evolucion');
    setIsCustomDates(false);
    setNumSessions(1);
  };

  const handleUpdateAppointment = async () => {
    if (!selectedApp) return;
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ 
          sede_id: editSede,
          doctor_id: editDoctor,
          fecha: editFecha,
          hora: editHora,
          historial_clinico: clinicalNotes,
          tratamientos: treatments,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedApp.id);
      
      if (error) throw error;
      alert("Cita actualizada con éxito.");
      setSelectedApp(null);
      window.location.reload(); 
    } catch (e) {
      alert("Error al actualizar la cita.");
    } finally {
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    if (selectedApp && !isCustomDates) {
      const baseDate = new Date(selectedApp.fecha);
      const newDates = [];
      for (let i = 1; i <= numSessions; i++) {
        const nextDate = new Date(baseDate);
        nextDate.setDate(baseDate.getDate() + (i * intervalDays));
        newDates.push(nextDate.toISOString().split('T')[0]);
      }
      setSessionDates(newDates);
    }
  }, [numSessions, intervalDays, selectedApp, isCustomDates]);

  const handleBatchGenerate = async () => {
    if (!selectedApp) return;
    if (!confirm(`¿Deseas programar ${numSessions} sesiones para este plan?`)) return;
    
    setIsGenerating(true);
    try {
      const sessions = sessionDates.map((date, index) => ({
        id: `SES-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        patient_name: selectedApp.patient.nombre,
        patient_phone: selectedApp.patient.telefono,
        doctor_id: selectedApp.doctor.id,
        sede_id: selectedApp.sede,
        tipo: selectedApp.tipo,
        fecha: date,
        hora: selectedApp.hora,
        duracion: selectedApp.duracion,
        estado: 'confirmada',
        motivo: `Sesión ${index + 2} de Plan de Tratamiento (Ref: ${selectedApp.id})`,
        company_id: selectedApp.company_id,
        historial_clinico: `Continuación de tratamiento.`,
        tratamientos: selectedApp.tratamientos
      }));

      const { error } = await supabase.from('appointments').insert(sessions);
      if (error) throw error;

      alert(`Plan de ${numSessions} sesiones programado.`);
      setSelectedApp(null);
      window.location.reload();
    } catch (e) {
      alert("Error al generar plan.");
    } finally {
      setIsGenerating(false);
    }
  };

  const columns: AppointmentStatus[] = ['pendiente', 'confirmada', 'completada', 'cancelada'];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Agenda Médica</h2>
          <p className="text-slate-500 mt-1 font-medium">Gestión clínica y flujos de trabajo</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
            <input 
              placeholder="Buscar paciente..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#017E84]/20 font-medium text-sm w-64 shadow-sm"
            />
          </div>
          <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
            <button onClick={() => setViewMode('list')} className={`p-2.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-[#1e3050] text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}><LayoutList size={20} /></button>
            <button onClick={() => setViewMode('kanban')} className={`p-2.5 rounded-xl transition-all ${viewMode === 'kanban' ? 'bg-[#1e3050] text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}><LayoutGrid size={20} /></button>
          </div>
        </div>
      </div>

      {viewMode === 'list' ? (
        <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                <th className="px-6 py-5">Paciente</th>
                <th className="px-6 py-5">Horario</th>
                <th className="px-6 py-5">Estado</th>
                <th className="px-6 py-5">Médico / Sede</th>
                <th className="px-6 py-5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(app => (
                <tr key={app.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-[#017E84]">{app.patient.nombre.charAt(0)}</div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 leading-none">{app.patient.nombre}</p>
                        <p className="text-[10px] text-slate-400 mt-1 font-bold">DNI: {app.patient.dni || '---'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-sm font-bold text-slate-800">{app.fecha}</p>
                    <p className="text-xs text-[#017E84] font-bold mt-1">{app.hora}</p>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${getStatusBadge(app.estado)}`}>
                      {app.estado}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-sm font-bold text-slate-700">{app.doctor.nombre}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">{app.sede}</p>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleOpenClinical(app)} className="p-2 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all"><FileText size={18} /></button>
                      <button onClick={() => onUpdateStatus(app.id, 'completada')} className="p-2 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all"><CheckCircle size={18} /></button>
                      <button onClick={() => onUpdateStatus(app.id, 'cancelada')} className="p-2 rounded-xl bg-red-50 text-red-400 hover:bg-red-500 hover:text-white transition-all"><XCircle size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex gap-6 overflow-x-auto pb-10 custom-scrollbar min-h-[500px]">
           {columns.map(status => (
            <div key={status} className="flex-shrink-0 w-80">
              <h3 className="text-[11px] font-black uppercase text-slate-400 tracking-widest mb-4 px-2 flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  status === 'pendiente' ? 'bg-purple-400' :
                  status === 'confirmada' ? 'bg-cyan-400' :
                  status === 'completada' ? 'bg-emerald-400' : 'bg-rose-400'
                }`} /> {status}
              </h3>
              <div className="space-y-4">
                {filtered.filter(a => a.estado === status).map(app => (
                  <div key={app.id} className={`bg-white p-5 rounded-[28px] border-l-4 border shadow-sm hover:shadow-xl transition-all cursor-default group ${
                    status === 'pendiente' ? 'border-l-purple-400 border-slate-100' :
                    status === 'confirmada' ? 'border-l-cyan-400 border-slate-100' :
                    status === 'completada' ? 'border-l-emerald-400 border-slate-100' : 'border-l-rose-400 border-slate-100'
                  }`}>
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{app.hora}</p>
                      <button onClick={() => handleOpenClinical(app)} className="p-1.5 text-slate-200 hover:text-indigo-500 transition-colors"><Edit3 size={14}/></button>
                    </div>
                    <p className="text-sm font-bold text-slate-800 leading-tight">{app.patient.nombre}</p>
                    <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-50">
                       <p className="text-[9px] font-black text-[#017E84] uppercase tracking-tighter">{app.doctor.nombre}</p>
                       <p className="text-[9px] font-black text-slate-300 uppercase">{app.sede}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
           ))}
        </div>
      )}

      {selectedApp && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#1e3050]/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-5xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-[#017E84] text-white flex items-center justify-center font-black text-xl">{selectedApp.patient.nombre.charAt(0)}</div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{selectedApp.patient.nombre}</h3>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Gestión de Cita: {selectedApp.id}</p>
                </div>
              </div>
              <button onClick={() => setSelectedApp(null)} className="p-3 rounded-2xl hover:bg-slate-100 transition-all text-slate-300 hover:text-red-500"><X size={24} /></button>
            </div>

            <div className="flex px-8 border-b border-slate-50 bg-white">
               {[
                 { id: 'evolucion', label: 'Evolución & Ficha', icon: FileText },
                 { id: 'reprogramar', label: 'Reprogramar & Editar', icon: Calendar },
                 { id: 'seguimiento', label: 'Plan de Sesiones', icon: ListPlus }
               ].map(tab => (
                 <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)} 
                  className={`px-6 py-4 font-bold text-[10px] uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeTab === tab.id ? 'border-[#017E84] text-[#017E84]' : 'border-transparent text-slate-300'}`}
                 >
                   <tab.icon size={14} /> {tab.label}
                 </button>
               ))}
            </div>

            <div className="p-8 overflow-y-auto space-y-8 flex-1 custom-scrollbar">
              {activeTab === 'evolucion' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-left-4">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase text-indigo-500 ml-1">Notas de Evolución</label>
                    <textarea value={clinicalNotes} onChange={(e) => setClinicalNotes(e.target.value)} placeholder="¿Cómo evoluciona el paciente?..." className="w-full h-80 p-6 rounded-3xl bg-slate-50 border-none outline-none text-sm leading-relaxed font-medium resize-none shadow-inner focus:ring-2 focus:ring-indigo-100" />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase text-emerald-500 ml-1">Procedimientos / Tratamiento</label>
                    <textarea value={treatments} onChange={(e) => setTreatments(e.target.value)} placeholder="¿Qué se le aplicó hoy?..." className="w-full h-80 p-6 rounded-3xl bg-slate-50 border-none outline-none text-sm leading-relaxed font-medium resize-none shadow-inner focus:ring-2 focus:ring-emerald-100" />
                  </div>
                </div>
              )}

              {activeTab === 'reprogramar' && (
                <div className="bg-slate-50 p-10 rounded-[40px] border border-slate-100 space-y-8 animate-in slide-in-from-bottom-4">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2"><MapPin size={12}/> Sede de Atención</label>
                        <select value={editSede} onChange={e => setEditSede(e.target.value)} className="w-full p-4 rounded-2xl bg-white border border-slate-100 font-bold text-slate-700 outline-none">
                          {sedes.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2"><User size={12}/> Médico Asignado</label>
                        <select value={editDoctor} onChange={e => setEditDoctor(e.target.value)} className="w-full p-4 rounded-2xl bg-white border border-slate-100 font-bold text-slate-700 outline-none">
                          {doctors.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2"><Calendar size={12}/> Nueva Fecha</label>
                        <input type="date" value={editFecha} onChange={e => setEditFecha(e.target.value)} className="w-full p-4 rounded-2xl bg-white border border-slate-100 font-bold text-slate-700 outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2"><Clock size={12}/> Nuevo Horario</label>
                        <input type="time" value={editHora} onChange={e => setEditHora(e.target.value)} className="w-full p-4 rounded-2xl bg-white border border-slate-100 font-bold text-slate-700 outline-none" />
                      </div>
                   </div>
                   <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100 flex items-start gap-3">
                      <Settings2 className="text-amber-600 mt-1" size={18} />
                      <p className="text-[10px] text-amber-700 font-medium leading-relaxed uppercase tracking-widest">Nota: Al guardar, la cita se reprogramará automáticamente. Asegúrate de que el nuevo horario esté disponible.</p>
                   </div>
                </div>
              )}

              {activeTab === 'seguimiento' && (
                <div className="bg-indigo-50/40 p-10 rounded-[40px] border border-indigo-100 space-y-8 animate-in slide-in-from-right-4">
                   <div className="flex justify-between items-center">
                      <h4 className="text-lg font-bold text-indigo-900">Programador de Tratamiento</h4>
                      <div className="flex bg-white p-1 rounded-xl border border-indigo-100">
                         <button onClick={() => setIsCustomDates(false)} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase ${!isCustomDates ? 'bg-indigo-500 text-white' : 'text-slate-400'}`}>Frecuencia</button>
                         <button onClick={() => setIsCustomDates(true)} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase ${isCustomDates ? 'bg-indigo-500 text-white' : 'text-slate-400'}`}>Manual</button>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase text-indigo-400">¿Cuántas sesiones programar?</label>
                         <input type="range" min="1" max="15" value={numSessions} onChange={e => setNumSessions(parseInt(e.target.value))} className="w-full accent-indigo-500" />
                         <p className="text-2xl font-black text-indigo-900">{numSessions} Sesiones</p>
                      </div>
                      {!isCustomDates && (
                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase text-indigo-400">Frecuencia cada (días)</label>
                           <input type="number" value={intervalDays} onChange={e => setIntervalDays(parseInt(e.target.value))} className="w-full p-4 rounded-2xl bg-white border border-indigo-100 font-bold outline-none" />
                        </div>
                      )}
                   </div>

                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[300px] overflow-y-auto pr-4 custom-scrollbar">
                      {sessionDates.map((date, idx) => (
                        <div key={idx} className="p-4 bg-white rounded-2xl border border-indigo-100 flex flex-col gap-2 shadow-sm">
                           <span className="text-[9px] font-black text-indigo-300 uppercase">Próxima Sesión {idx + 2}</span>
                           <input type="date" value={date} onChange={(e) => {
                             const updated = [...sessionDates];
                             updated[idx] = e.target.value;
                             setSessionDates(updated);
                           }} className="bg-slate-50 p-2 rounded-xl text-xs font-bold border-none outline-none" />
                        </div>
                      ))}
                   </div>
                </div>
              )}
            </div>

            <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
               <button onClick={() => setSelectedApp(null)} className="px-8 py-4 font-bold text-slate-400 hover:text-slate-600 transition-all text-sm">Cancelar</button>
               <button 
                onClick={activeTab === 'seguimiento' ? handleBatchGenerate : handleUpdateAppointment} 
                disabled={isUpdating || isGenerating} 
                className={`px-10 py-4 text-white rounded-2xl font-bold flex items-center gap-3 shadow-xl hover:scale-105 transition-all disabled:opacity-50 ${activeTab === 'seguimiento' ? 'bg-indigo-600' : 'bg-[#1e3050]'}`}
               >
                  {(isUpdating || isGenerating) ? <RefreshCcw className="animate-spin" size={18} /> : <Save size={18} />} 
                  {activeTab === 'seguimiento' ? 'Programar Plan Completo' : 'Guardar Cambios'}
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentList;
