
import React, { useState, useMemo } from 'react';
import { Sede, Doctor, Appointment, Patient, ConsultaType, CompanyProfile } from '../types';
import { CONSULTA_INFO } from '../constants';
import { 
  ChevronLeft, 
  MapPin, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  ChevronRight,
  Activity,
  Share2
} from 'lucide-react';

interface Props {
  company: CompanyProfile;
  sedes: Sede[];
  doctors: Doctor[];
  appointments: Appointment[];
  onSave: (app: Appointment) => void;
}

type Step = 'sede' | 'doctor' | 'time' | 'details' | 'success';

const PublicBooking: React.FC<Props> = ({ company, sedes, doctors, appointments, onSave }) => {
  const [step, setStep] = useState<Step>('sede');
  const [sedeId, setSedeId] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [tipo, setTipo] = useState<ConsultaType>('general');
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [patient, setPatient] = useState<Patient>({ nombre: '', email: '', telefono: '', dni: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estilos dinámicos basados en la identidad de la empresa
  const themeStyles = {
    primary: company.primaryColor || '#017E84',
    secondary: company.secondaryColor || '#714B67',
  };

  const availableDoctors = useMemo(() => 
    doctors.filter(d => d.sedes.includes(sedeId) && d.activo), 
  [sedeId, doctors]);

  const slots = useMemo(() => {
    if (!fecha || !sedeId || !doctorId) return [];
    const schedule = sedes.find(s => s.id === sedeId)?.horarios['1'] || { inicio: '08:00', fin: '18:00' };
    const res = [];
    let curr = new Date(fecha + 'T' + schedule.inicio);
    const end = new Date(fecha + 'T' + schedule.fin);
    while (curr < end) {
      const t = curr.toTimeString().substring(0, 5);
      if (!appointments.some(a => a.fecha === fecha && a.hora === t && a.doctor.id === doctorId && a.estado !== 'cancelada')) {
        res.push(t);
      }
      curr.setMinutes(curr.getMinutes() + 30);
    }
    return res;
  }, [fecha, sedeId, doctorId, appointments, sedes]);

  const handleFinish = async () => {
    setIsSubmitting(true);
    const selectedDoctor = doctors.find(d => d.id === doctorId)!;
    const newApp: Appointment = {
      id: `WEB-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      patient,
      doctor: selectedDoctor,
      sede: sedeId,
      tipo,
      fecha,
      hora,
      duracion: 30,
      estado: 'pendiente',
      motivo: 'Reserva Online Directa',
      company_id: company.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    onSave(newApp);
    setTimeout(() => { setIsSubmitting(false); setStep('success'); }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-ubuntu">
      <header className="bg-white border-b border-slate-100 px-6 py-5 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="p-2.5 rounded-2xl text-white shadow-lg" style={{ backgroundColor: themeStyles.primary }}>
            <Activity size={24} />
          </div>
          <div>
            <h1 className="font-black text-2xl tracking-tight text-slate-800 uppercase leading-none">{company.name}</h1>
            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{company.tagline || 'AGENDA ONLINE'}</p>
          </div>
        </div>
        <button onClick={() => {
          navigator.clipboard.writeText(window.location.href);
          alert("¡Link de reserva copiado!");
        }} className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-100 transition-colors">
          <Share2 size={20} />
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center p-6 max-w-xl mx-auto w-full pt-12">
        {step !== 'success' && (
          <div className="w-full flex justify-between mb-12 relative px-4">
             <div className="absolute top-1/2 left-0 w-full h-[2px] bg-slate-100 -z-10 -translate-y-1/2" />
             {['Sede', 'Médico', 'Fecha', 'Datos'].map((s, i) => {
               const isActive = ['sede', 'doctor', 'time', 'details'].indexOf(step) >= i;
               return (
                 <div key={s} className="flex flex-col items-center gap-2">
                   <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all border-2" 
                        style={isActive ? { backgroundColor: themeStyles.primary, borderColor: themeStyles.primary, color: 'white' } : { backgroundColor: 'white', borderColor: '#e2e8f0', color: '#cbd5e1' }}>
                     {i + 1}
                   </div>
                   <span className="text-[10px] font-black uppercase tracking-widest" style={isActive ? { color: themeStyles.primary } : { color: '#cbd5e1' }}>{s}</span>
                 </div>
               );
             })}
          </div>
        )}

        <div className="w-full">
          {step === 'sede' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4">
              <h2 className="text-3xl font-bold text-center text-slate-800 mb-8">¿A qué sede deseas asistir?</h2>
              {sedes.map(s => (
                <button key={s.id} onClick={() => { setSedeId(s.id); setStep('doctor'); }} className="w-full bg-white p-6 rounded-[28px] border-2 border-transparent hover:border-slate-200 shadow-sm hover:shadow-xl transition-all flex items-center gap-5 group">
                   <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:scale-110 transition-transform">
                      <MapPin size={28} />
                   </div>
                   <div className="text-left flex-1">
                     <h3 className="font-bold text-lg text-slate-800">{s.nombre}</h3>
                     <p className="text-sm text-slate-400">{s.direccion}</p>
                   </div>
                   <ChevronRight className="text-slate-200" />
                </button>
              ))}
            </div>
          )}

          {step === 'doctor' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4">
              <button onClick={() => setStep('sede')} className="text-xs font-bold text-slate-400 mb-4 flex items-center gap-1"><ChevronLeft size={14}/> Atrás</button>
              <h2 className="text-3xl font-bold text-center text-slate-800 mb-8">Elige tu especialista</h2>
              {availableDoctors.map(d => (
                <button key={d.id} onClick={() => { setDoctorId(d.id); setStep('time'); }} className="w-full bg-white p-6 rounded-[28px] shadow-sm hover:shadow-xl transition-all flex items-center gap-5 group">
                   <div className="w-14 h-14 rounded-2xl text-white flex items-center justify-center font-bold text-xl" style={{ backgroundColor: themeStyles.secondary }}>
                      {d.nombre.charAt(0)}
                   </div>
                   <div className="text-left flex-1">
                     <h3 className="font-bold text-lg text-slate-800">{d.nombre}</h3>
                     <p className="text-xs font-bold uppercase tracking-tighter" style={{ color: themeStyles.secondary }}>{d.especialidad}</p>
                   </div>
                </button>
              ))}
            </div>
          )}

          {step === 'time' && (
            <div className="space-y-8 animate-in slide-in-from-bottom-4">
              <button onClick={() => setStep('doctor')} className="text-xs font-bold text-slate-400 flex items-center gap-1"><ChevronLeft size={14}/> Cambiar Médico</button>
              <div className="bg-white p-8 rounded-[35px] shadow-sm border border-slate-100 space-y-8">
                 <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Fecha</label>
                    <input type="date" min={new Date().toISOString().split('T')[0]} value={fecha} onChange={(e) => setFecha(e.target.value)} className="w-full p-5 rounded-2xl bg-slate-50 border-none outline-none font-bold text-slate-700 focus:ring-4 focus:ring-slate-100" />
                 </div>
                 {fecha && (
                    <div className="grid grid-cols-3 gap-3">
                       {slots.map(s => (
                         <button key={s} onClick={() => setHora(s)} className={`py-3 rounded-xl font-bold text-sm transition-all ${hora === s ? 'text-white shadow-lg' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`} style={hora === s ? { backgroundColor: themeStyles.primary } : {}}>
                           {s}
                         </button>
                       ))}
                    </div>
                 )}
              </div>
              {hora && <button onClick={() => setStep('details')} className="w-full text-white py-5 rounded-[24px] font-bold text-lg shadow-xl" style={{ backgroundColor: themeStyles.primary }}>Confirmar Horario</button>}
            </div>
          )}

          {step === 'details' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4">
              <h2 className="text-3xl font-bold text-center text-slate-800 mb-8">Tus Datos</h2>
              <div className="bg-white p-8 rounded-[35px] shadow-sm space-y-6">
                 <input placeholder="Nombre completo" value={patient.nombre} onChange={e => setPatient({...patient, nombre: e.target.value})} className="w-full p-5 rounded-2xl bg-slate-50 border-none outline-none font-medium" />
                 <input placeholder="WhatsApp (+51...)" value={patient.telefono} onChange={e => setPatient({...patient, telefono: e.target.value})} className="w-full p-5 rounded-2xl bg-slate-50 border-none outline-none font-medium" />
                 <input placeholder="Correo electrónico" value={patient.email} onChange={e => setPatient({...patient, email: e.target.value})} className="w-full p-5 rounded-2xl bg-slate-50 border-none outline-none font-medium" />
                 <select value={tipo} onChange={e => setTipo(e.target.value as any)} className="w-full p-5 rounded-2xl bg-slate-50 border-none outline-none font-bold text-slate-700">
                    {Object.keys(CONSULTA_INFO).map(k => <option key={k} value={k}>{CONSULTA_INFO[k as any].label}</option>)}
                 </select>
              </div>
              <button onClick={handleFinish} disabled={isSubmitting} className="w-full text-white py-6 rounded-[24px] font-bold text-xl shadow-xl flex items-center justify-center gap-3" style={{ backgroundColor: '#1e293b' }}>
                {isSubmitting ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Agendar Ahora'}
              </button>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center py-16 animate-in zoom-in-95">
               <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-8">
                  <CheckCircle2 size={60} className="text-emerald-500" />
               </div>
               <h2 className="text-4xl font-black text-slate-800 uppercase">¡Reservado!</h2>
               <p className="text-slate-400 mt-4 font-medium max-w-xs mx-auto">Tu cita en <span className="text-slate-800 font-bold">{company.name}</span> ha sido confirmada.</p>
               <div className="mt-12 p-8 bg-white rounded-[35px] shadow-sm text-left space-y-4">
                  <div className="flex justify-between"><span className="text-[10px] font-black text-slate-300 uppercase">Médico</span><span className="font-bold" style={{ color: themeStyles.primary }}>{doctors.find(d => d.id === doctorId)?.nombre}</span></div>
                  <div className="flex justify-between"><span className="text-[10px] font-black text-slate-300 uppercase">Fecha</span><span className="font-bold">{fecha}</span></div>
                  <div className="flex justify-between"><span className="text-[10px] font-black text-slate-300 uppercase">Hora</span><span className="font-bold">{hora}</span></div>
               </div>
               <p className="mt-12 text-[10px] font-black text-slate-300 uppercase tracking-widest">Recibirás un recordatorio por WhatsApp</p>
            </div>
          )}
        </div>
      </main>

      <footer className="p-10 text-center opacity-40">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">© 2025 Powered by Citame SaaS for {company.name}</p>
      </footer>
    </div>
  );
};

export default PublicBooking;
