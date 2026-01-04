
import React, { useState, useMemo } from 'react';
import { Appointment, Patient, Sede, Doctor, ConsultaType, CompanyProfile } from '../types';
import { CONSULTA_INFO } from '../constants';
import { Save, User, Clock, MessageSquarePlus, FileText, Phone, SearchCode, RefreshCcw, CheckCircle2, UserPlus, AlertCircle } from 'lucide-react';
import { OdooService } from '../services/odooService';

interface Props {
  onSave: (app: Appointment) => void;
  appointments: Appointment[];
  initialDate?: string;
  sedes: Sede[];
  doctors: Doctor[];
  activeCompany?: CompanyProfile;
}

const AppointmentForm: React.FC<Props> = ({ onSave, appointments, initialDate, sedes, doctors, activeCompany }) => {
  const [patient, setPatient] = useState<Patient>({ nombre: '', telefono: '', dni: '', email: '' });
  const [sedeId, setSedeId] = useState(sedes[0]?.id || '');
  const [tipo, setTipo] = useState<ConsultaType>('general');
  const [fecha, setFecha] = useState(initialDate || '');
  const [hora, setHora] = useState('');
  const [motivo, setMotivo] = useState('');
  
  // Estados de Odoo
  const [odooStatus, setOdooStatus] = useState<'idle' | 'checking' | 'found' | 'not_found' | 'creating' | 'error'>('idle');
  const [isValidating, setIsValidating] = useState(false);

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

  const handleValidateOdoo = async () => {
    if (!patient.dni) return alert("Ingrese un DNI para validar.");
    if (!activeCompany) return;
    
    setIsValidating(true);
    setOdooStatus('checking');
    try {
      const odoo = new OdooService(activeCompany.odoo);
      const partner = await odoo.getPartnerByVat(patient.dni);
      if (partner) {
        setPatient({
          ...patient,
          nombre: partner.name,
          email: partner.email || '',
          telefono: partner.phone || partner.mobile || patient.telefono,
          odoo_partner_id: partner.id
        });
        setOdooStatus('found');
      } else {
        setOdooStatus('not_found');
      }
    } catch (e) {
      setOdooStatus('error');
      alert("Error conectando con Odoo.");
    } finally {
      setIsValidating(false);
    }
  };

  const handleCreateInOdoo = async () => {
    if (!patient.nombre || !patient.telefono) return alert("Complete nombre y teléfono para registrar en Odoo.");
    setOdooStatus('creating');
    try {
      const odoo = new OdooService(activeCompany!.odoo);
      const partnerId = await odoo.findOrCreatePartner(patient);
      setPatient(prev => ({ ...prev, odoo_partner_id: partnerId }));
      setOdooStatus('found');
      alert(`Paciente registrado exitosamente en Odoo (ID: ${partnerId})`);
    } catch (e) {
      setOdooStatus('error');
      alert("Error al crear paciente en Odoo.");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patient.nombre || !patient.telefono || !fecha || !hora || !motivo.trim()) return alert("Completa los datos obligatorios.");
    
    const assignedDoctor = availableDoctors.find(doc => 
      !appointments.some(a => a.fecha === fecha && a.hora === hora && a.doctor.id === doc.id && a.estado !== 'cancelada')
    ) || availableDoctors[0];

    onSave({
      id: `CITA-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      patient: { ...patient },
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
        <div className="glass p-10 rounded-[40px] border-white/50 shadow-sm relative overflow-hidden">
          {/* Odoo Status Indicator */}
          <div className="absolute top-0 right-0 p-4">
             {odooStatus === 'found' && (
               <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-full border border-emerald-100 animate-in zoom-in">
                  <CheckCircle2 size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Odoo Sincronizado</span>
               </div>
             )}
             {odooStatus === 'not_found' && (
               <div className="flex items-center gap-2 bg-amber-50 text-amber-600 px-4 py-2 rounded-full border border-amber-100 animate-in zoom-in">
                  <AlertCircle size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">No existe en Odoo</span>
               </div>
             )}
          </div>

          <h3 className="text-2xl font-bold text-[#1e3050] flex items-center gap-4 mb-8">
            <div className="p-3 bg-[#017E84]/10 text-[#017E84] rounded-2xl"><User size={24} /></div>
            Datos del Paciente
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 col-span-1">
               <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 flex items-center gap-2">DNI / Identificación</label>
               <div className="flex gap-2">
                 <input 
                    placeholder="DNI" 
                    value={patient.dni} 
                    onChange={e => {
                      setPatient({...patient, dni: e.target.value});
                      setOdooStatus('idle');
                    }} 
                    className="flex-1 px-6 py-4 rounded-2xl border border-slate-100 bg-white font-bold text-lg outline-none focus:border-[#017E84]" 
                 />
                 <button 
                    type="button" 
                    onClick={handleValidateOdoo} 
                    disabled={isValidating || !patient.dni} 
                    className="bg-[#1e3050] text-white px-5 rounded-2xl hover:bg-black transition-all disabled:opacity-50 flex items-center gap-2"
                 >
                    {isValidating ? <RefreshCcw size={18} className="animate-spin" /> : <SearchCode size={18} />}
                    <span className="text-[10px] font-black uppercase">Validar</span>
                 </button>
               </div>
            </div>

            <div className="space-y-2">
               <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Nombre Completo *</label>
               <input placeholder="Nombre y Apellidos" value={patient.nombre} onChange={e => setPatient({...patient, nombre: e.target.value})} className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-white font-bold text-lg outline-none focus:border-[#017E84]" />
            </div>

            <div className="space-y-2">
               <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 flex items-center gap-1"><Phone size={12}/> Teléfono Móvil *</label>
               <input placeholder="999 999 999" value={patient.telefono} onChange={e => setPatient({...patient, telefono: e.target.value})} className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-white font-bold text-lg outline-none focus:border-[#017E84]" />
            </div>

            <div className="space-y-2">
               <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Correo Electrónico</label>
               <input type="email" placeholder="paciente@ejemplo.com" value={patient.email} onChange={e => setPatient({...patient, email: e.target.value})} className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-white font-bold text-lg outline-none focus:border-[#017E84]" />
            </div>
          </div>

          {odooStatus === 'not_found' && (
            <div className="mt-8 p-6 bg-slate-50 rounded-[30px] border border-slate-200 border-dashed animate-in fade-in slide-in-from-top-2">
               <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center">
                        <UserPlus size={20} />
                     </div>
                     <div>
                        <p className="font-bold text-slate-800 text-sm">El paciente no existe en Odoo</p>
                        <p className="text-[10px] text-slate-400 uppercase font-black">Puedes crearlo ahora mismo para sincronizar</p>
                     </div>
                  </div>
                  <button 
                    type="button"
                    onClick={handleCreateInOdoo}
                    disabled={odooStatus === 'creating'}
                    className="bg-[#017E84] text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-[#017E8433] flex items-center gap-2 hover:scale-105 transition-all"
                  >
                    {odooStatus === 'creating' ? <RefreshCcw size={14} className="animate-spin" /> : <Save size={14} />}
                    Registrar en Odoo ERP
                  </button>
               </div>
            </div>
          )}
        </div>

        <div className="glass p-10 rounded-[40px] border-white/50 shadow-sm">
          <h3 className="text-2xl font-bold text-[#1e3050] mb-8 flex items-center gap-4">
            <div className="p-3 bg-[#714B67]/10 text-[#714B67] rounded-2xl"><MessageSquarePlus size={24} /></div>
            Detalles de la Consulta
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
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Tipo de Servicio</label>
                <select value={tipo} onChange={e => setTipo(e.target.value as any)} className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-white font-bold text-slate-700 outline-none">
                   {Object.keys(CONSULTA_INFO).map(k => <option key={k} value={k}>{CONSULTA_INFO[k as any].label}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-2">
               <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 flex items-center gap-2">
                  <FileText size={14} className="text-[#017E84]" /> Motivo de la Cita *
               </label>
               <textarea 
                 placeholder="Ej: Dolor de muela, revisión general, limpieza..."
                 value={motivo} 
                 onChange={e => setMotivo(e.target.value)} 
                 className="w-full p-6 rounded-[30px] border border-slate-100 bg-white h-32 resize-none font-medium text-slate-700 outline-none focus:border-[#017E84] transition-colors"
               />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        <div className="glass p-8 rounded-[40px] border-white/50 shadow-sm sticky top-10">
           <h3 className="font-bold text-[#1e3050] mb-6 flex items-center gap-3"><Clock size={20} className="text-[#017E84]" /> Disponibilidad</h3>
           <div className="space-y-4">
              <div className="space-y-2">
                 <label className="text-[9px] font-black uppercase text-slate-400">Seleccionar Fecha</label>
                 <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className="w-full p-4 rounded-xl bg-slate-50 border-none font-bold text-slate-600 outline-none" />
              </div>
              {slots.length > 0 ? (
                <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                   {slots.map(t => (
                     <button key={t} type="button" onClick={() => setHora(t)} className={`py-3 rounded-xl border text-xs font-bold transition-all ${
                       hora === t ? 'bg-[#017E84] text-white border-[#017E84] shadow-lg shadow-[#017E8433]' : 'bg-white border-slate-100 text-slate-400 hover:bg-slate-50'
                     }`}>{t}</button>
                   ))}
                </div>
              ) : (
                <div className="py-10 text-center">
                   <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No hay horarios o elija fecha</p>
                </div>
              )}
           </div>

           <div className="mt-10 pt-8 border-t border-slate-100">
              <button 
                type="submit" 
                className="w-full bg-[#1e3050] text-white py-5 rounded-[24px] font-bold text-lg shadow-2xl flex items-center justify-center gap-3 hover:bg-black transition-all hover:translate-y-[-2px] active:translate-y-0"
              >
                 <Save size={20} /> Agendar Atentación
              </button>
              <p className="text-[9px] text-center text-slate-400 font-bold uppercase tracking-widest mt-4">Sincronización Cloud Automática</p>
           </div>
        </div>
      </div>
    </form>
  );
};

export default AppointmentForm;
