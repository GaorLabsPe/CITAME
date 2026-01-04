
import React, { useState, useMemo } from 'react';
import { Sede, Doctor, Appointment, Patient, ConsultaType, CompanyProfile } from '../types';
import { CONSULTA_INFO } from '../constants';
import { 
  ChevronLeft, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  ChevronRight,
  Activity,
  CalendarCheck,
  Stethoscope,
  ShieldCheck,
  Zap,
  HeartPulse,
  MessageSquareText,
  Phone,
  User,
  MessageCircle,
  HelpCircle
} from 'lucide-react';

interface Props {
  company: CompanyProfile;
  sedes: Sede[];
  doctors: Doctor[];
  appointments: Appointment[];
  onSave: (app: Appointment) => void;
}

type Step = 'sede' | 'service' | 'time' | 'details' | 'success';

const PublicBooking: React.FC<Props> = ({ company, sedes, doctors, appointments, onSave }) => {
  const [step, setStep] = useState<Step>('sede');
  const [sedeId, setSedeId] = useState('');
  const [tipo, setTipo] = useState<ConsultaType | ''>('');
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [patient, setPatient] = useState<Patient>({ nombre: '', telefono: '' });
  const [motivo, setMotivo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const themeStyles = {
    primary: company.primaryColor || '#017E84',
    secondary: company.secondaryColor || '#714B67',
  };

  const handleHelpWhatsApp = () => {
    if (!company.whatsappHelp) return;
    const url = `https://wa.me/${company.whatsappHelp}?text=Hola, necesito ayuda con mi reserva en ${company.name}`;
    window.open(url, '_blank');
  };

  const availableDoctorsInSede = useMemo(() => 
    doctors.filter(d => d.sedes.includes(sedeId) && d.activo), 
  [sedeId, doctors]);

  const slots = useMemo(() => {
    if (!fecha || !sedeId || availableDoctorsInSede.length === 0) return [];
    const schedule = sedes.find(s => s.id === sedeId)?.horarios['1'] || { inicio: '08:00', fin: '18:00' };
    const res = [];
    let curr = new Date(fecha + 'T' + schedule.inicio);
    const end = new Date(fecha + 'T' + schedule.fin);
    while (curr < end) {
      const t = curr.toTimeString().substring(0, 5);
      const anyDoctorAvailable = availableDoctorsInSede.some(doc => 
        !appointments.some(a => a.fecha === fecha && a.hora === t && a.doctor.id === doc.id && a.estado !== 'cancelada')
      );
      if (anyDoctorAvailable) res.push(t);
      curr.setMinutes(curr.getMinutes() + 30);
    }
    return res;
  }, [fecha, sedeId, availableDoctorsInSede, appointments, sedes]);

  const handleFinish = async () => {
    if (!patient.nombre || !patient.telefono) return alert("Completa tu nombre y teléfono.");
    if (!tipo) return alert("Selecciona el tipo de servicio.");
    if (!motivo.trim()) return alert("Por favor, describe brevemente qué necesitas.");
    
    setIsSubmitting(true);
    const assignedDoctor = availableDoctorsInSede.find(doc => 
      !appointments.some(a => a.fecha === fecha && a.hora === hora && a.doctor.id === doc.id && a.estado !== 'cancelada')
    ) || availableDoctorsInSede[0];

    const newApp: Appointment = {
      id: `WEB-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      patient: { ...patient, email: '', dni: '' },
      doctor: assignedDoctor,
      sede: sedeId,
      tipo: tipo as ConsultaType,
      fecha,
      hora,
      duracion: 30,
      estado: 'pendiente',
      motivo: motivo,
      company_id: company.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    onSave(newApp);
    setTimeout(() => { 
      setIsSubmitting(false); 
      setStep('success'); 
    }, 1500);
  };

  const handleWhatsAppConfirm = () => {
    const sedeNombre = sedes.find(s => s.id === sedeId)?.nombre || 'Sede';
    const servicio = tipo ? CONSULTA_INFO[tipo as ConsultaType].label : 'Consulta';
    const msg = `Hola, acabo de reservar una cita en ${company.name}:\n\n` +
                `*Paciente:* ${patient.nombre}\n` +
                `*Servicio:* ${servicio}\n` +
                `*Sede:* ${sedeNombre}\n` +
                `*Fecha:* ${fecha}\n` +
                `*Hora:* ${hora}\n\n` +
                `Deseo confirmar mi atención. ¡Gracias!`;
    
    const whatsappUrl = `https://wa.me/51${patient.telefono}?text=${encodeURIComponent(msg)}`;
    window.open(whatsappUrl, '_blank');
  };

  const serviceIcons: Record<string, any> = {
    general: Stethoscope,
    especializada: ShieldCheck,
    control: Zap,
    urgencia: HeartPulse
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-ubuntu">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          {company.logo ? (
            <img src={company.logo} className="h-10 w-10 object-contain rounded-xl" alt="logo" />
          ) : (
            <div className="p-2.5 rounded-2xl text-white shadow-lg" style={{ backgroundColor: themeStyles.primary }}>
              <Activity size={24} />
            </div>
          )}
          <div>
            <h1 className="font-black text-xl tracking-tighter text-slate-800 uppercase leading-none">{company.name}</h1>
            <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{company.tagline || 'RESERVAS EN LÍNEA'}</p>
          </div>
        </div>
        {company.whatsappHelp && (
          <button 
            onClick={handleHelpWhatsApp}
            className="flex items-center gap-2 bg-[#25D366] text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-md"
          >
            <MessageCircle size={14} /> Ayuda WhatsApp
          </button>
        )}
      </header>

      <main className="flex-1 flex flex-col items-center p-6 max-w-xl mx-auto w-full pt-10">
        {step !== 'success' && (
          <div className="w-full flex justify-between mb-10 relative px-4">
             <div className="absolute top-1/2 left-0 w-full h-[1px] bg-slate-200 -z-10 -translate-y-1/2" />
             {['Sede', 'Servicio', 'Horario', 'Datos'].map((s, i) => {
               const isActive = ['sede', 'service', 'time', 'details'].indexOf(step) >= i;
               return (
                 <div key={s} className="flex flex-col items-center gap-2">
                   <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold transition-all border shadow-sm" 
                        style={isActive ? { backgroundColor: themeStyles.primary, borderColor: themeStyles.primary, color: 'white' } : { backgroundColor: 'white', borderColor: '#e2e8f0', color: '#cbd5e1' }}>
                     {i + 1}
                   </div>
                   <span className="text-[9px] font-black uppercase tracking-tighter" style={isActive ? { color: themeStyles.primary } : { color: '#cbd5e1' }}>{s}</span>
                 </div>
               );
             })}
          </div>
        )}

        <div className="w-full">
          {step === 'sede' && (
            <div className="space-y-4 animate-in slide-in-from-bottom-4">
              <h2 className="text-2xl font-black text-center text-slate-800 mb-6 uppercase tracking-tighter">¿En qué sede desea atenderse?</h2>
              {sedes.map(s => (
                <button key={s.id} onClick={() => { setSedeId(s.id); setStep('service'); }} className="w-full bg-white p-6 rounded-[24px] border border-slate-100 hover:border-slate-300 shadow-sm hover:shadow-md transition-all flex items-center gap-5 group text-left">
                   <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                      <MapPin size={24} />
                   </div>
                   <div className="flex-1">
                     <h3 className="font-bold text-slate-800">{s.nombre}</h3>
                     <p className="text-xs text-slate-400">{s.direccion}</p>
                   </div>
                   <ChevronRight className="text-slate-200 group-hover:text-slate-400" size={20} />
                </button>
              ))}
            </div>
          )}

          {step === 'service' && (
            <div className="space-y-4 animate-in slide-in-from-bottom-4">
              <button onClick={() => setStep('sede')} className="text-[10px] font-black uppercase text-slate-400 mb-2 flex items-center gap-1"><ChevronLeft size={14}/> Regresar</button>
              <h2 className="text-2xl font-black text-center text-slate-800 mb-6 uppercase tracking-tighter">Tipo de Servicio</h2>
              {Object.keys(CONSULTA_INFO).map(k => {
                const Icon = serviceIcons[k] || Stethoscope;
                const info = CONSULTA_INFO[k as ConsultaType];
                return (
                  <button key={k} onClick={() => { setTipo(k as ConsultaType); setStep('time'); }} className="w-full bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm hover:shadow-md transition-all flex items-center gap-5 group text-left">
                    <div className="w-12 h-12 rounded-xl text-white flex items-center justify-center shadow-lg" style={{ backgroundColor: themeStyles.primary }}>
                        <Icon size={24} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-800">{info.label}</h3>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Categoría médica</p>
                    </div>
                    <ChevronRight className="text-slate-200" size={20} />
                  </button>
                );
              })}
            </div>
          )}

          {step === 'time' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4">
              <button onClick={() => setStep('service')} className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1"><ChevronLeft size={14}/> Cambiar Servicio</button>
              <h2 className="text-2xl font-black text-center text-slate-800 mb-6 uppercase tracking-tighter">Agenda tu Hora</h2>
              <div className="bg-white p-6 rounded-[30px] shadow-sm border border-slate-100 space-y-6">
                 <input type="date" min={new Date().toISOString().split('T')[0]} value={fecha} onChange={(e) => setFecha(e.target.value)} className="w-full p-4 rounded-2xl bg-slate-50 border-none outline-none font-bold text-slate-700" />
                 {fecha && (
                    <div className="grid grid-cols-3 gap-3 max-h-[250px] overflow-y-auto pr-1 custom-scrollbar">
                       {slots.map(s => (
                         <button key={s} onClick={() => setHora(s)} className={`py-4 rounded-xl font-bold text-xs transition-all ${hora === s ? 'text-white shadow-lg' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`} style={hora === s ? { backgroundColor: themeStyles.primary } : {}}>
                           {s}
                         </button>
                       ))}
                    </div>
                 )}
              </div>
              {hora && <button onClick={() => setStep('details')} className="w-full text-white py-5 rounded-[22px] font-bold text-lg shadow-xl" style={{ backgroundColor: themeStyles.primary }}>Siguiente Paso</button>}
            </div>
          )}

          {step === 'details' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4">
              <h2 className="text-2xl font-black text-center text-slate-800 mb-6 uppercase tracking-tighter">Tus Datos</h2>
              <div className="bg-white p-8 rounded-[35px] shadow-sm space-y-6 border border-slate-100">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                       <MessageSquareText size={14} /> ¿Qué necesita realizarse? *
                    </label>
                    <textarea 
                      placeholder="Ej: Curación, Limpieza, Evaluación..." 
                      value={motivo} 
                      onChange={e => setMotivo(e.target.value)} 
                      className="w-full p-4 rounded-2xl bg-slate-50 border-none outline-none font-medium text-sm h-32 resize-none"
                    />
                 </div>
                 <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1"><User size={10}/> Nombre Completo *</label>
                      <input placeholder="Su nombre" value={patient.nombre} onChange={e => setPatient({...patient, nombre: e.target.value})} className="w-full p-4 rounded-xl bg-slate-50 border-none outline-none text-sm font-bold" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1"><Phone size={10}/> Teléfono de Contacto *</label>
                      <input placeholder="999 999 999" value={patient.telefono} onChange={e => setPatient({...patient, telefono: e.target.value})} className="w-full p-4 rounded-xl bg-slate-50 border-none outline-none text-sm font-bold" />
                    </div>
                 </div>
              </div>
              <button onClick={handleFinish} disabled={isSubmitting} className="w-full bg-[#1e293b] text-white py-5 rounded-[22px] font-bold text-lg shadow-2xl flex items-center justify-center gap-3">
                {isSubmitting ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Confirmar Reserva'}
              </button>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center py-12 animate-in zoom-in-95 duration-700">
               <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                  <CalendarCheck size={48} className="text-emerald-500" />
               </div>
               <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">¡Reserva Enviada!</h2>
               <p className="text-slate-400 mt-4 font-medium max-w-sm mx-auto">Su solicitud ha sido recibida. Por favor, confirme su asistencia enviando un mensaje al consultorio:</p>
               
               <div className="mt-8 space-y-4">
                  <button 
                    onClick={handleWhatsAppConfirm}
                    className="w-full bg-[#25D366] text-white py-5 rounded-[22px] font-bold text-lg shadow-xl flex items-center justify-center gap-3 hover:scale-[1.02] transition-all"
                  >
                    <MessageCircle size={24} /> Confirmar por WhatsApp
                  </button>

                  <div className="p-8 bg-white rounded-[40px] shadow-sm text-left border border-slate-100">
                    <div className="flex justify-between py-3 border-b border-slate-50"><span className="text-[10px] font-black text-slate-300 uppercase">Paciente</span><span className="font-bold text-slate-700 text-sm">{patient.nombre}</span></div>
                    <div className="flex justify-between py-3 border-b border-slate-50"><span className="text-[10px] font-black text-slate-300 uppercase">Sede</span><span className="font-bold text-slate-700 text-sm">{sedes.find(s => s.id === sedeId)?.nombre}</span></div>
                    <div className="flex justify-between py-3 border-b border-slate-50"><span className="text-[10px] font-black text-slate-300 uppercase">Fecha/Hora</span><span className="font-bold text-slate-700 text-sm">{fecha} • {hora}</span></div>
                  </div>
               </div>

               <button onClick={() => window.location.reload()} className="mt-12 text-sm font-bold text-slate-400 hover:text-slate-600 underline">Volver al inicio</button>
            </div>
          )}
        </div>
      </main>

      {company.whatsappHelp && (
        <div className="fixed bottom-8 right-8 z-50 animate-bounce-slow">
          <button 
            onClick={handleHelpWhatsApp}
            className="group relative bg-[#25D366] text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-all"
          >
            <HelpCircle size={32} />
            <span className="absolute right-full mr-4 bg-white text-slate-800 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg border border-slate-100">
              ¿Necesitas ayuda? Escríbenos
            </span>
          </button>
        </div>
      )}

      <footer className="p-10 text-center opacity-40">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">© 2025 Powered by Citame Ecosystem</p>
      </footer>
    </div>
  );
};

export default PublicBooking;
