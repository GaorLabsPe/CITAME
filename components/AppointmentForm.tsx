
import React, { useState, useMemo } from 'react';
import { Appointment, Patient, Sede, Doctor, ConsultaType } from '../types';
import { CONSULTA_INFO } from '../constants';
import { Save, Info, User, Stethoscope, Clock, MapPin, Zap } from 'lucide-react';

interface Props {
  onSave: (app: Appointment) => void;
  appointments: Appointment[];
  initialDate?: string;
  sedes: Sede[];
  doctors: Doctor[];
}

const AppointmentForm: React.FC<Props> = ({ onSave, appointments, initialDate, sedes, doctors }) => {
  const [patient, setPatient] = useState<Patient>({ nombre: '', email: '', telefono: '', dni: '' });
  const [sedeId, setSedeId] = useState(sedes[0]?.id || '');
  const [doctorId, setDoctorId] = useState('');
  const [tipo, setTipo] = useState<ConsultaType>('general');
  const [fecha, setFecha] = useState(initialDate || '');
  const [hora, setHora] = useState('');
  const [motivo, setMotivo] = useState('');

  const availableDoctors = useMemo(() => doctors.filter(d => d.sedes.includes(sedeId) && d.activo), [sedeId, doctors]);

  const slots = useMemo(() => {
    if (!fecha || !sedeId || !doctorId) return [];
    const dateObj = new Date(fecha + 'T00:00:00');
    const day = dateObj.getDay().toString();
    const schedule = sedes.find(s => s.id === sedeId)?.horarios[day] || { inicio: '08:00', fin: '18:00' };
    
    const res = [];
    let curr = new Date(fecha + 'T' + schedule.inicio);
    const end = new Date(fecha + 'T' + schedule.fin);
    while (curr < end) {
      const t = curr.toTimeString().substring(0, 5);
      if (!appointments.some(a => a.fecha === fecha && a.hora === t && a.doctor.id === doctorId && a.estado !== 'cancelada')) {
        res.push(t);
      }
      curr.setMinutes(curr.getMinutes() + 20);
    }
    return res;
  }, [fecha, sedeId, doctorId, appointments, sedes]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patient.nombre || !doctorId || !fecha || !hora) return alert("Completa los campos obligatorios");
    
    const selectedDoctor = doctors.find(d => d.id === doctorId)!;
    onSave({
      id: `CITA-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      patient,
      doctor: selectedDoctor,
      sede: sedeId,
      tipo,
      fecha,
      hora,
      duracion: 30,
      estado: 'pendiente',
      motivo,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-10 animate-in slide-in-from-bottom-5 duration-700 pb-20">
      <div className="lg:col-span-2 space-y-8">
        <div className="glass p-10 rounded-[40px] border-white/50 shadow-sm">
          <h3 className="text-2xl font-bold text-[#1e3050] mb-8 flex items-center gap-4">
            <div className="p-3 bg-[#017E84]/10 text-[#017E84] rounded-2xl"><User size={24} /></div>
            Perfil del Paciente
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
               <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Nombre Completo *</label>
               <input placeholder="Ej: Juan Pérez" value={patient.nombre} onChange={e => setPatient({...patient, nombre: e.target.value})} className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-white focus:ring-4 focus:ring-[#017E8411] focus:border-[#017E84] outline-none transition-all font-medium" />
            </div>
            <div className="space-y-2">
               <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">WhatsApp / Celular *</label>
               <input placeholder="+51 900 000 000" value={patient.telefono} onChange={e => setPatient({...patient, telefono: e.target.value})} className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-white focus:ring-4 focus:ring-[#017E8411] focus:border-[#017E84] outline-none transition-all font-medium" />
            </div>
            <div className="space-y-2">
               <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Correo Electrónico *</label>
               <input placeholder="paciente@servidor.com" value={patient.email} onChange={e => setPatient({...patient, email: e.target.value})} className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-white focus:ring-4 focus:ring-[#017E8411] focus:border-[#017E84] outline-none transition-all font-medium" />
            </div>
            <div className="space-y-2">
               <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Documento Identidad</label>
               <input placeholder="DNI / Pasaporte" value={patient.dni} onChange={e => setPatient({...patient, dni: e.target.value})} className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-white focus:ring-4 focus:ring-[#017E8411] focus:border-[#017E84] outline-none transition-all font-medium" />
            </div>
          </div>
        </div>

        <div className="glass p-10 rounded-[40px] border-white/50 shadow-sm">
          <h3 className="text-2xl font-bold text-[#1e3050] mb-8 flex items-center gap-4">
            <div className="p-3 bg-[#714B67]/10 text-[#714B67] rounded-2xl"><Stethoscope size={24} /></div>
            Detalles Médicos
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
               <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Centro de Atención</label>
               <div className="relative">
                 <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                 <select value={sedeId} onChange={e => setSedeId(e.target.value)} className="w-full pl-12 pr-6 py-4 rounded-2xl border border-slate-100 bg-white focus:ring-4 focus:ring-[#714B6711] focus:border-[#714B67] outline-none transition-all font-medium appearance-none">
                   {sedes.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                 </select>
               </div>
            </div>
            <div className="space-y-2">
               <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Médico Especialista</label>
               <div className="relative">
                 <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                 <select value={doctorId} onChange={e => setDoctorId(e.target.value)} className="w-full pl-12 pr-6 py-4 rounded-2xl border border-slate-100 bg-white focus:ring-4 focus:ring-[#714B6711] focus:border-[#714B67] outline-none transition-all font-medium appearance-none">
                   <option value="">Selecciona Especialista</option>
                   {availableDoctors.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
                 </select>
               </div>
            </div>
            <div className="space-y-2">
               <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Servicio Requerido</label>
               <select value={tipo} onChange={e => setTipo(e.target.value as any)} className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-white focus:ring-4 focus:ring-[#714B6711] focus:border-[#714B67] outline-none transition-all font-medium">
                 {Object.keys(CONSULTA_INFO).map(k => <option key={k} value={k}>{CONSULTA_INFO[k as any].label}</option>)}
               </select>
            </div>
            <div className="space-y-2">
               <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Fecha de la Cita</label>
               <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-white focus:ring-4 focus:ring-[#714B6711] focus:border-[#714B67] outline-none transition-all font-medium" />
            </div>
          </div>
          <div className="mt-8 space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Motivo / Notas Adicionales</label>
            <textarea placeholder="Ingresa síntomas o detalles relevantes..." value={motivo} onChange={e => setMotivo(e.target.value)} className="w-full p-6 rounded-[24px] border border-slate-100 bg-white focus:ring-4 focus:ring-[#714B6711] focus:border-[#714B67] h-32 resize-none outline-none font-medium" />
          </div>
        </div>
      </div>

      <div className="space-y-8">
        <div className="glass p-8 rounded-[40px] border-white/50 shadow-sm sticky top-32">
          <h3 className="font-bold text-[#1e3050] mb-6 flex items-center gap-3">
             <Clock size={20} className="text-[#017E84]" /> Horarios Disponibles
          </h3>
          {slots.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {slots.map(t => (
                <button 
                  key={t} 
                  type="button" 
                  onClick={() => setHora(t)} 
                  className={`py-3 rounded-2xl border font-bold text-sm transition-all duration-300 ${
                    hora === t ? 'bg-[#017E84] text-white border-[#017E84] shadow-lg shadow-[#017E8444] scale-105' : 'bg-white text-slate-500 border-slate-100 hover:border-[#017E84] hover:bg-slate-50'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 px-6">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                 <Zap size={30} className="text-slate-200" />
              </div>
              <p className="text-slate-400 text-sm font-bold leading-relaxed">Configura médico y fecha para visualizar slots disponibles.</p>
            </div>
          )}

          <div className="mt-10 pt-8 border-t border-slate-100">
             <div className="flex justify-between items-center mb-8">
                <span className="text-slate-400 font-bold uppercase text-[11px] tracking-widest">Inversión Total</span>
                <span className="text-4xl font-black text-[#1e3050] tracking-tighter">${CONSULTA_INFO[tipo].price}<span className="text-lg opacity-40">.00</span></span>
             </div>
             <button 
                type="submit" 
                className="w-full bg-[#1e3050] hover:bg-black text-white py-6 rounded-[28px] font-bold text-lg transition-all shadow-2xl flex items-center justify-center gap-3 hover:translate-y-[-4px] active:scale-95 group"
             >
                <Save size={22} className="group-hover:rotate-12 transition-transform" /> Confirmar Agenda
             </button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default AppointmentForm;
