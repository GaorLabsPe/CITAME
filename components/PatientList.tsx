
import React, { useState, useMemo } from 'react';
import { Appointment, Patient, CompanyProfile } from '../types';
import { Search, Users, History, CheckCircle, Clock, ExternalLink, RefreshCcw, UserPlus, Database, AlertCircle, SearchCode, FileText } from 'lucide-react';
import { CONSULTA_INFO } from '../constants';
import { OdooService } from '../services/odooService';
import { supabase } from '../services/supabase';

interface Props {
  appointments: Appointment[];
  activeCompany?: CompanyProfile;
}

interface PatientGroup {
  info: Patient;
  appointments: Appointment[];
}

const PatientList: React.FC<Props> = ({ appointments, activeCompany }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatientEmail, setSelectedPatientEmail] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [odooDetails, setOdooDetails] = useState<any>(null);

  const patientsMap = useMemo(() => {
    const map = new Map<string, PatientGroup>();
    appointments.forEach(app => {
      const email = app.patient.email?.toLowerCase() || `no-email-${app.patient.nombre}`;
      if (!map.has(email)) {
        map.set(email, { info: app.patient, appointments: [] });
      }
      map.get(email)!.appointments.push(app);
    });
    return map;
  }, [appointments]);

  const patientsList = useMemo(() => {
    const list: PatientGroup[] = Array.from(patientsMap.values());
    return list.filter(p => 
      p.info.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.info.dni?.includes(searchTerm) ||
      p.info.email?.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => b.appointments.length - a.appointments.length);
  }, [patientsMap, searchTerm]);

  const selectedPatientData = useMemo(() => {
    if (!selectedPatientEmail) return null;
    return patientsMap.get(selectedPatientEmail.toLowerCase());
  }, [selectedPatientEmail, patientsMap]);

  // Efecto para cargar detalles extendidos de Odoo cuando se selecciona un paciente vinculado
  React.useEffect(() => {
    const loadOdooDetails = async () => {
      if (selectedPatientData?.info.odoo_partner_id && activeCompany?.odoo.apiKey) {
        try {
          const odoo = new OdooService(activeCompany.odoo);
          const partners = await odoo.searchPartners(selectedPatientData.info.dni);
          const match = partners.find(p => p.id === selectedPatientData.info.odoo_partner_id);
          if (match) setOdooDetails(match);
        } catch (e) {
          console.error("Error cargando detalles Odoo", e);
        }
      } else {
        setOdooDetails(null);
      }
    };
    loadOdooDetails();
  }, [selectedPatientEmail, activeCompany]);

  const handleSearchDniInOdoo = async (p: Patient) => {
    if (!p.dni) return alert("Ingrese un DNI en el perfil del paciente primero.");
    if (!activeCompany?.odoo.apiKey) return alert("Configure Odoo primero.");
    
    setIsSyncing(true);
    try {
      const odoo = new OdooService(activeCompany.odoo);
      const odooPartner = await odoo.getPartnerByVat(p.dni);
      
      if (odooPartner) {
        if (confirm(`Se encontró a "${odooPartner.name}" en Odoo.\nHistoria Clínica: ${odooPartner.ref || 'No asignada'}\n¿Deseas vincular y actualizar sus datos?`)) {
          const { error } = await supabase
            .from('patients')
            .update({ 
              odoo_partner_id: odooPartner.id,
              nombre: odooPartner.name,
              telefono: odooPartner.phone || odooPartner.mobile || p.telefono,
              email: odooPartner.email || p.email
            })
            .eq('email', p.email.toLowerCase());
          
          if (error) throw error;
          alert("¡Datos sincronizados desde Odoo con éxito!");
          window.location.reload();
        }
      } else {
        alert("No se encontró ningún contacto con ese DNI en Odoo.");
      }
    } catch (e) {
      console.error(e);
      alert("Error al consultar Odoo.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncPatient = async (p: Patient) => {
    if (!activeCompany?.odoo.apiKey) return alert("Configure Odoo primero.");
    setIsSyncing(true);
    try {
      const odoo = new OdooService(activeCompany.odoo);
      const partnerId = await odoo.findOrCreatePartner(p);
      
      const { error } = await supabase
        .from('patients')
        .update({ odoo_partner_id: partnerId })
        .eq('email', p.email.toLowerCase());
      
      if (error) throw error;
      alert(`Paciente vinculado exitosamente con Odoo (ID: ${partnerId})`);
      window.location.reload();
    } catch (e) {
      alert("Error al sincronizar.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleImportFromOdoo = async () => {
    if (!activeCompany?.odoo.apiKey) return alert("Configure Odoo primero.");
    if (!confirm("Esto buscará contactos en Odoo para importarlos. ¿Continuar?")) return;
    
    setIsSyncing(true);
    try {
      const odoo = new OdooService(activeCompany.odoo);
      const partners = await odoo.searchPartners();
      
      for (const p of partners) {
        if (!p.email && !p.vat) continue;
        await supabase.from('patients').upsert({
          email: p.email ? p.email.toLowerCase() : `${p.id}@odoo.local`,
          nombre: p.name,
          dni: p.vat || p.ref,
          telefono: p.phone,
          odoo_partner_id: p.id
        }, { onConflict: 'email' });
      }
      alert(`Importación completada.`);
      window.location.reload();
    } catch (e) {
      alert("Error en importación masiva.");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-5 duration-700 pb-20">
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Users size={20} className="text-[#017E84]" /> Directorio
            </h2>
            <button 
              onClick={handleImportFromOdoo}
              disabled={isSyncing}
              className="text-[10px] font-black uppercase text-[#017E84] flex items-center gap-1 hover:underline disabled:opacity-50"
            >
              {isSyncing ? <RefreshCcw className="animate-spin" size={14}/> : <Database size={14} />}
              Importar Odoo
            </button>
          </div>
          
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
                  <div className="flex items-center gap-2">
                    <p className={`text-[9px] font-black uppercase tracking-tighter ${selectedPatientEmail === p.info.email ? 'text-white/50' : 'text-slate-400'}`}>
                      {p.appointments.length} citas
                    </p>
                    {p.info.odoo_partner_id && (
                      <span className="text-[9px] font-black text-emerald-400">● ERP SYNC</span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

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
                        <div className="flex flex-wrap gap-2 mt-2">
                           <span className="px-3 py-1 bg-[#017E84]/10 text-[#017E84] rounded-full text-[10px] font-black uppercase tracking-widest">WhatsApp: {selectedPatientData.info.telefono}</span>
                           <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-[10px] font-black uppercase tracking-widest">DNI: {selectedPatientData.info.dni || 'No reg.'}</span>
                           {odooDetails?.ref && (
                             <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1 shadow-sm">
                               <FileText size={12} /> H. Clínica: {odooDetails.ref}
                             </span>
                           )}
                        </div>
                     </div>
                  </div>
                  <div className="text-right space-y-3">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Estatus Odoo ERP</p>
                     
                     {selectedPatientData.info.odoo_partner_id ? (
                       <div className="flex flex-col items-end gap-1">
                          <div className="flex items-center justify-end gap-2 font-bold text-[#017E84] text-lg">
                             <CheckCircle size={18} /> ID: #{selectedPatientData.info.odoo_partner_id}
                          </div>
                          {odooDetails?.street && (
                            <p className="text-[10px] text-slate-400 font-medium italic">{odooDetails.street}</p>
                          )}
                       </div>
                     ) : (
                       <div className="flex flex-col gap-2">
                          <button 
                            onClick={() => handleSearchDniInOdoo(selectedPatientData.info)}
                            disabled={isSyncing || !selectedPatientData.info.dni}
                            className="bg-white border-2 border-[#017E84] text-[#017E84] px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 hover:bg-[#017E84] hover:text-white transition-all disabled:opacity-30"
                          >
                            <SearchCode size={14} /> Buscar DNI en Odoo
                          </button>
                          <button 
                            onClick={() => handleSyncPatient(selectedPatientData.info)}
                            disabled={isSyncing}
                            className="bg-[#1e3050] text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 hover:scale-105 transition-all shadow-md disabled:opacity-50"
                          >
                            {isSyncing ? <RefreshCcw className="animate-spin" size={12}/> : <RefreshCcw size={12}/>}
                            Forzar Sincronización
                          </button>
                       </div>
                     )}
                  </div>
               </div>

               <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 mb-8 flex items-start gap-3">
                  <AlertCircle className="text-[#017E84] mt-0.5" size={18} />
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    El <b>Historial en Odoo</b> (Referencia Interna) vincula este perfil con su ficha clínica oficial. Si el paciente ya existe, sincronizarlo evita duplicar cobros y permite ver su historial de pagos completo en el ERP.
                  </p>
               </div>

               <h4 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                  <History size={20} className="text-[#714B67]" /> Historial de Atenciones en Citame
               </h4>

               <div className="space-y-4">
                  {selectedPatientData.appointments.sort((a,b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()).map((app) => (
                    <div key={app.id} className="p-5 rounded-[24px] bg-slate-50 border border-slate-100 hover:bg-white transition-all group">
                        <div className="flex justify-between items-center mb-3">
                           <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${app.estado === 'completada' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-400'}`}>
                                 {app.estado === 'completada' ? <CheckCircle size={16} /> : <Clock size={16} />}
                              </div>
                              <div>
                                 <p className="text-xs font-bold text-slate-800">{new Date(app.fecha).toLocaleDateString()} • {app.hora}</p>
                                 <p className="text-[10px] font-bold text-[#017E84] uppercase tracking-tighter">{CONSULTA_INFO[app.tipo].label}</p>
                              </div>
                           </div>
                           <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase ${app.estado === 'completada' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                              {app.estado}
                           </span>
                        </div>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        ) : (
          <div className="h-full min-h-[500px] flex flex-col items-center justify-center bg-white rounded-[40px] border border-slate-100 border-dashed">
             <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                <Users size={40} className="text-slate-200" />
             </div>
             <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Selecciona un paciente para gestionar</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientList;
