
import React, { useState } from 'react';
import { AppConfig, CompanyProfile, OdooConfig } from '../types';
import { Building2, Save, Plus, Trash2, ShieldCheck, Zap, RefreshCcw, CheckCircle2, AlertCircle, Unlink, Globe, Search, Database } from 'lucide-react';
import { supabase } from '../services/supabase';
import { OdooService } from '../services/odooService';

interface Props {
  config: AppConfig;
  onSave: (config: AppConfig) => void;
}

const ConfigPanel: React.FC<Props> = ({ config, onSave }) => {
  const [formData, setFormData] = useState<AppConfig>(config);
  const [showAdd, setShowAdd] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [testResult, setTestResult] = useState<Record<string, 'loading' | 'success' | 'error' | null>>({});
  
  // Estado para la conexión maestra (vida_master)
  const [masterConn, setMasterConn] = useState({
    url: 'https://vida.facturaclic.pe',
    db: 'vida_master',
    username: 'soporte@facturaclic.pe',
    apiKey: ''
  });

  const [discoveredCompanies, setDiscoveredCompanies] = useState<{id: number, name: string}[]>([]);
  const [isDiscovering, setIsDiscovering] = useState(false);

  const handleDiscover = async () => {
    if (!masterConn.apiKey) return alert("Ingrese la API Key para conectar con Odoo.");
    setIsDiscovering(true);
    setDiscoveredCompanies([]);
    try {
      const odoo = new OdooService({ ...masterConn, webhookUrl: '' });
      const companies = await odoo.getOdooCompanies();
      setDiscoveredCompanies(companies);
      if (companies.length === 0) alert("No se encontraron compañías o error de credenciales.");
    } catch (e) {
      console.error(e);
      alert("Error de conexión: Verifique URL y API Key.");
    } finally {
      setIsDiscovering(false);
    }
  };

  const handleVincularClinica = async (odooCo: {id: number, name: string}) => {
    const slug = odooCo.name.toLowerCase().replace(/\s+/g, '-');
    
    // Preparar perfil
    const clinicProfile: CompanyProfile = {
      id: slug,
      name: odooCo.name,
      tagline: 'Centro Médico Especializado',
      primaryColor: '#017E84',
      secondaryColor: '#714B67',
      isActive: true,
      odoo: {
        ...masterConn,
        odooCompanyId: odooCo.id,
        webhookUrl: ''
      }
    };

    try {
      const { error } = await supabase.from('companies').insert({
        id: clinicProfile.id,
        name: clinicProfile.name,
        tagline: clinicProfile.tagline,
        primary_color: clinicProfile.primaryColor,
        secondary_color: clinicProfile.secondaryColor,
        odoo_config: clinicProfile.odoo,
        is_active: true
      });

      if (error) {
        if (error.code === '23505') return alert("Esta clínica ya ha sido vinculada anteriormente.");
        throw error;
      }

      const updated = { ...formData, companies: [...formData.companies, clinicProfile] };
      setFormData(updated);
      onSave(updated);
      setShowAdd(false);
      setDiscoveredCompanies([]);
      alert(`¡${odooCo.name} vinculada con éxito!`);
    } catch (e) {
      console.error(e);
      alert("Error al guardar en base de datos.");
    }
  };

  const handleDeleteClinic = async (companyId: string) => {
    if (!confirm("¿Deseas eliminar este perfil de clínica? Esta acción no se puede deshacer.")) return;
    try {
      await supabase.from('companies').delete().eq('id', companyId);
      const updated = { ...formData, companies: formData.companies.filter(c => c.id !== companyId) };
      setFormData(updated);
      onSave(updated);
    } catch (e) {
      alert("Error al eliminar.");
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-24">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Gestión <span className="text-[#017E84]">Multi-Compañía</span></h2>
          <p className="text-slate-500 mt-1">Conecta tu base de datos de Odoo y gestiona múltiples sedes independientes.</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="bg-[#1e3050] text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:scale-105 transition-all shadow-xl">
          <Database size={20} /> Vincular Base Odoo
        </button>
      </div>

      {showAdd && (
        <div className="glass p-10 rounded-[40px] border-[#1e305011] animate-in zoom-in-95 duration-300 space-y-8">
           <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold flex items-center gap-3"><Building2 className="text-[#017E84]"/> Paso 1: Conectar con Base Maestra</h3>
              <button onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-slate-600">Cerrar</button>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Instancia Odoo</label>
                 <input value={masterConn.url} onChange={e => setMasterConn({...masterConn, url: e.target.value})} className="w-full p-4 rounded-2xl bg-white border border-slate-100 outline-none focus:border-[#017E84] font-bold text-slate-600" />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Base de Datos</label>
                 <input value={masterConn.db} onChange={e => setMasterConn({...masterConn, db: e.target.value})} className="w-full p-4 rounded-2xl bg-white border border-slate-100 outline-none focus:border-[#017E84] font-bold text-slate-600" />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Usuario Maestro</label>
                 <input value={masterConn.username} onChange={e => setMasterConn({...masterConn, username: e.target.value})} className="w-full p-4 rounded-2xl bg-white border border-slate-100 outline-none focus:border-[#017E84] font-bold text-slate-600" />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase text-slate-400 ml-1">API Key / Token</label>
                 <input type="password" value={masterConn.apiKey} onChange={e => setMasterConn({...masterConn, apiKey: e.target.value})} className="w-full p-4 rounded-2xl bg-white border border-slate-100 outline-none focus:border-[#017E84] font-bold text-slate-600" placeholder="••••••••" />
              </div>
           </div>

           <button 
             onClick={handleDiscover} 
             disabled={isDiscovering} 
             className="w-full bg-[#017E84] text-white py-5 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-lg shadow-[#017E8433] hover:bg-[#015e63] transition-all disabled:opacity-50"
           >
             {isDiscovering ? <RefreshCcw className="animate-spin" size={24}/> : <Search size={24}/>}
             {isDiscovering ? 'Consultando Compañías de Odoo...' : 'Conectar y Ver Compañías de la Base'}
           </button>

           {discoveredCompanies.length > 0 && (
             <div className="space-y-6 pt-6 border-t border-slate-100 animate-in fade-in slide-in-from-top-4">
                <h4 className="text-lg font-bold text-slate-800">Paso 2: Selecciona las compañías que deseas activar</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                   {discoveredCompanies.map(oc => (
                     <div key={oc.id} className="p-6 rounded-[30px] bg-slate-50 border border-slate-100 flex flex-col justify-between hover:bg-white hover:border-[#017E84]/30 transition-all group">
                        <div className="mb-4">
                           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Odoo ID: #{oc.id}</p>
                           <h5 className="text-lg font-bold text-slate-900 mt-1">{oc.name}</h5>
                        </div>
                        <button 
                          onClick={() => handleVincularClinica(oc)}
                          className="w-full py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-[#017E84] hover:bg-[#017E84] hover:text-white transition-all shadow-sm"
                        >
                          Vincular como Clínica
                        </button>
                     </div>
                   ))}
                </div>
             </div>
           )}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {formData.companies.map(c => (
          <div key={c.id} className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm relative group overflow-hidden">
             <div className="absolute top-0 right-0 p-8">
                <button onClick={() => handleDeleteClinic(c.id)} className="p-3 text-slate-200 hover:text-red-500 transition-colors bg-slate-50 rounded-2xl">
                   <Trash2 size={20} />
                </button>
             </div>

             <div className="flex items-center gap-5 mb-8">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold" style={{ backgroundColor: c.primaryColor }}>
                   {c.name.charAt(0)}
                </div>
                <div>
                   <h4 className="font-bold text-2xl text-slate-900 tracking-tight">{c.name}</h4>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                     <span className="text-[#017E84]">Vinculado a Odoo ID: {c.odoo.odooCompanyId}</span> • URL: {c.id}
                   </p>
                </div>
             </div>

             <div className="space-y-4">
                <div className="p-6 bg-slate-50 rounded-[30px] border border-slate-100 grid grid-cols-2 gap-6">
                   <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Base de Datos</p>
                      <p className="text-sm font-bold text-slate-700 mt-1">{c.odoo.db}</p>
                   </div>
                   <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Estado Sync</p>
                      <div className="flex items-center gap-2 mt-1">
                         <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                         <span className="text-xs font-bold text-emerald-600">Activo</span>
                      </div>
                   </div>
                </div>

                <button 
                   onClick={() => onSave({...formData, activeCompanyId: c.id})}
                   className={`w-full py-5 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-3 ${
                     formData.activeCompanyId === c.id ? 'bg-[#017E84] text-white shadow-xl shadow-[#017E8422]' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                   }`}
                >
                   {formData.activeCompanyId === c.id ? (
                     <><CheckCircle2 size={20} /> Gestionando Actualmente</>
                   ) : 'Gestionar esta Clínica'}
                </button>
             </div>
          </div>
        ))}

        {formData.companies.length === 0 && !showAdd && (
          <div className="xl:col-span-2 border-2 border-dashed border-slate-200 rounded-[40px] p-20 text-center">
             <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Database size={40} className="text-slate-300" />
             </div>
             <h3 className="text-xl font-bold text-slate-400">No hay clínicas vinculadas</h3>
             <p className="text-slate-400 mt-2">Usa el botón superior para conectar tu base de datos de Odoo.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConfigPanel;
