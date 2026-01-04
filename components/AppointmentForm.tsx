
import React, { useState, useMemo } from 'react';
import { Appointment, Patient, Sede, Doctor, ConsultaType, CompanyProfile } from '../types';
import { CONSULTA_INFO } from '../constants';
import { Save, User, Clock, MessageSquarePlus, FileText, Phone } from 'lucide-react';

interface Props {
  onSave: (app: Appointment) => void;
  appointments: Appointment[];
  initialDate?: string;
  sedes: Sede[];
  doctors: Doctor[];
  activeCompany?: CompanyProfile;
}

const AppointmentForm: React.FC<Props> = ({ onSave, appointments, initialDate, sedes, doctors, activeCompany }) => {
  const [patient, setPatient] = useState<Patient>({ nombre: '', telefono: '' });
  const [sedeId, setSedeId] = useState(sedes[0]?.id || '');
  const [tipo, setTipo] = useState<ConsultaType>('general');
  const [fecha, setFecha] = useState(initialDate || '');
  const [hora, setHora] = useState('');
  const [motivo, setMotivo] = useState('');

  const availableDoctors = useMemo(() => doctors.filter(d => d.sedes.includes(sedeId) && d.activo), [sedeId, doctors]);

  const slots = useMemo(() => {
    if (!fecha || !sedeId || availableDoctors.length === 0) return [];
    const dateObj = new Date(fecha + 'T00:00:00');
    const day = dateObj.getDay().toString();
    const schedule = sedes.find(s => s.id === sedeId)?.horarios[day] || { inicio: '08:00', fin: '18:00' };
    
    const res = [];
    let curr = new Date(fecha + 'T' + schedule.inicio);
    const end = new Date(fecha + 'T' + schedule.fin);
    while (curr < end) {
      const t = curr.toTimeString().substring(0, 5);
      const hasAnyDoctorFree = availableDoctors.some(doc => 
        !appointments.some(a => a.fecha === fecha && a.hora === t && a.doctor.id === doc.id && a.estado !== 'cancelada')
      );
      if (hasAnyDoctorFree) res.push(t);
      curr.setMinutes(curr.getMinutes() + 20);
    }
    return res;
  }, [fecha, sedeId, availableDoctors, appointments, sedes]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patient.nombre || !patient.telefono || !fecha || !hora || !motivo.trim()) return alert("Completa nombre, teléfono y motivo de la cita.");
    
    const assignedDoctor = availableDoctors.find(doc => 
      !appointments.some(a => a.fecha === fecha && a.hora === hora && a.doctor.id === doc.id && a.estado !== 'cancelada')
    ) || availableDoctors[0];

    onSave({
      id: `CITA-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      patient: { ...patient, email: '', dni: '' },
      doctor: assignedDoctor,
      sede: sedeId,
      tipo,
      fecha,
      hora,
      duracion: 30,
      estado: 'pendiente',
      motivo,
      company_id: activeCompany?.id || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-10 animate-in slide-in-from-bottom-5 duration-700 pb-20">
      <div className="lg:col-span-2 space-y-8">
        <div className="glass p-10 rounded-[40px] border-white/50 shadow-sm">
          <h3 className="text-2xl font-bold text-[#1e3050] flex items-center gap-4 mb-8">
            <div className="p-3 bg-[#017E84]/10 text-[#017E84] rounded-2xl"><User size={24} /></div>
            Datos del Paciente
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
               <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Nombre Completo *</label>
               <input placeholder="Nombre y Apellidos" value={patient.nombre} onChange={e => setPatient({...patient, nombre: e.target.value})} className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-white font-bold text-lg outline-none focus:border-[#017E84]" />
            </div>
            <div className="space-y-2">
               <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 flex items-center gap-1"><Phone size={12}/> Teléfono WhatsApp *</label>
               <input placeholder="999 999 999" value={patient.telefono} onChange={e => setPatient({...patient, telefono: e.target.value})} className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-white font-bold text-lg outline-none focus:border-[#017E84]" />
            </div>
          </div>
          <p className="mt-4 text-[10px] text-slate-400 font-medium italic">Nota: DNI y Correo se solicitarán durante la recepción del paciente.</p>
        </div>

        <div className="glass p-10 rounded-[40px] border-white/50 shadow-sm">
          <h3 className="text-2xl font-bold text-[#1e3050] mb-8 flex items-center gap-4">
            <div className="p-3 bg-[#714B67]/10 text-[#714B67] rounded-2xl"><MessageSquarePlus size={24} /></div>
            Motivo del Servicio
          </h3>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Sede de Atención</label>
                <select value={sedeId} onChange={e => setSedeId(e.target.value)} className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-white font-bold text-slate-700 outline-none">
                  {sedes.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Categoría del Servicio</label>
                <select value={tipo} onChange={e => setTipo(e.target.value as any)} className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-white font-bold text-slate-700 outline-none">
                   {Object.keys(CONSULTA_INFO).map(k => <option key={k} value={k}>{CONSULTA_INFO[k as any].label}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-2">
               <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 flex items-center gap-2">
                  <FileText size={14} className="text-[#017E84]" /> Descripción del problema o necesidad *
               </label>
               <textarea 
                 placeholder="Ej: Curación de uñero, limpieza, dolor plantar..."
                 value={motivo} 
                 onChange={e => setMotivo(e.target.value)} 
                 className="w-full p-6 rounded-[30px] border border-slate-100 bg-white h-40 resize-none font-medium text-slate-700 outline-none"
               />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        <div className="glass p-8 rounded-[40px] border-white/50 shadow-sm sticky top-10">
           <h3 className="font-bold text-[#1e3050] mb-6 flex items-center gap-3"><Clock size={20} className="text-[#017E84]" /> Agenda</h3>
           <div className="space-y-4">
              <div className="space-y-2">
                 <label className="text-[9px] font-black uppercase text-slate-400">Fecha de Cita</label>
                 <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className="w-full p-4 rounded-xl bg-slate-50 border-none font-bold text-slate-600" />
              </div>
              {slots.length > 0 ? (
                <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                   {slots.map(t => (
                     <button key={t} type="button" onClick={() => setHora(t)} className={`py-3 rounded-xl border text-xs font-bold transition-all ${
                       hora === t ? 'bg-[#017E84] text-white border-[#017E84] shadow-lg' : 'bg-white border-slate-100 text-slate-400 hover:bg-slate-50'
                     }`}>{t}</button>
                   ))}
                </div>
              ) : (
                <p className="text-center py-10 text-[10px] font-bold text-slate-300 uppercase">Elija fecha</p>
              )}
           </div>

           <div className="mt-10 pt-8 border-t border-slate-100">
              <button type="submit" className="w-full bg-[#1e3050] text-white py-5 rounded-[24px] font-bold text-lg shadow-2xl flex items-center justify-center gap-3">
                 <Save size={20} /> Agendar Turno
              </button>
           </div>
        </div>
      </div>
    </form>
  );
};

export default AppointmentForm;
