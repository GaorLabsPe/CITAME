
import React, { useState } from 'react';
import { AppConfig, CompanyProfile } from '../types';
import { Building2, Save, Plus, Trash2, Link, Palette, ExternalLink, ShieldCheck } from 'lucide-react';

interface Props {
  config: AppConfig;
  onSave: (config: AppConfig) => void;
}

const ConfigPanel: React.FC<Props> = ({ config, onSave }) => {
  const [formData, setFormData] = useState<AppConfig>(config);
  const [showAdd, setShowAdd] = useState(false);
  const [newCompany, setNewCompany] = useState<CompanyProfile>({
    id: '', name: '', tagline: '', primaryColor: '#017E84', secondaryColor: '#714B67',
    odoo: { url: '', db: '', username: '', apiKey: '', webhookUrl: '' },
    isActive: true
  });

  const handleAdd = () => {
    if (!newCompany.id || !newCompany.name) return alert("Completa ID y Nombre");
    const updated = { ...formData, companies: [...formData.companies, newCompany] };
    setFormData(updated);
    onSave(updated);
    setShowAdd(false);
  };

  const removeCompany = (id: string) => {
    const updated = { ...formData, companies: formData.companies.filter(c => c.id !== id) };
    setFormData(updated);
    onSave(updated);
  };

  const setActive = (id: string) => {
    const updated = { ...formData, activeCompanyId: id };
    setFormData(updated);
    onSave(updated);
  };

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Configuración SaaS</h2>
          <p className="text-slate-500 mt-1">Gestiona tus centros médicos y conexiones empresariales</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="bg-[#1e3050] text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:scale-105 transition-all">
          <Plus size={20} /> Nueva Compañía
        </button>
      </div>

      {showAdd && (
        <div className="glass p-10 rounded-[40px] border-[#1e305011] animate-in zoom-in-95 duration-300 space-y-8">
           <h3 className="text-xl font-bold flex items-center gap-3"><Building2 className="text-[#017E84]"/> Registrar Nueva Entidad</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <input placeholder="Slug de URL (ej: feetcare)" value={newCompany.id} onChange={e => setNewCompany({...newCompany, id: e.target.value.toLowerCase().replace(/\s/g, '-')})} className="w-full p-4 rounded-2xl bg-white border border-slate-100 outline-none focus:border-[#017E84]" />
              <input placeholder="Nombre Comercial (ej: FeetCare Podología)" value={newCompany.name} onChange={e => setNewCompany({...newCompany, name: e.target.value})} className="w-full p-4 rounded-2xl bg-white border border-slate-100 outline-none focus:border-[#017E84]" />
              <div className="flex items-center gap-4">
                 <input type="color" value={newCompany.primaryColor} onChange={e => setNewCompany({...newCompany, primaryColor: e.target.value})} className="w-12 h-12 rounded-xl cursor-pointer" />
                 <span className="text-xs font-bold text-slate-400">Color Primario</span>
              </div>
              <div className="flex items-center gap-4">
                 <input type="color" value={newCompany.secondaryColor} onChange={e => setNewCompany({...newCompany, secondaryColor: e.target.value})} className="w-12 h-12 rounded-xl cursor-pointer" />
                 <span className="text-xs font-bold text-slate-400">Color Secundario</span>
              </div>
           </div>
           <div className="pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
              <input placeholder="URL Odoo" value={newCompany.odoo.url} onChange={e => setNewCompany({...newCompany, odoo: {...newCompany.odoo, url: e.target.value}})} className="p-4 rounded-2xl bg-white border border-slate-100" />
              <input placeholder="Base de Datos" value={newCompany.odoo.db} onChange={e => setNewCompany({...newCompany, odoo: {...newCompany.odoo, db: e.target.value}})} className="p-4 rounded-2xl bg-white border border-slate-100" />
           </div>
           <div className="flex gap-4">
              <button onClick={handleAdd} className="flex-1 bg-[#017E84] text-white py-4 rounded-2xl font-bold">Guardar Compañía</button>
              <button onClick={() => setShowAdd(false)} className="px-8 bg-slate-100 text-slate-400 py-4 rounded-2xl font-bold">Cancelar</button>
           </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {formData.companies.map(c => (
          <div key={c.id} className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm relative group">
             <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                   <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white" style={{ backgroundColor: c.primaryColor }}>
                      <Building2 size={28} />
                   </div>
                   <div>
                      <h4 className="font-bold text-xl text-slate-900">{c.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                         <span className={`w-2 h-2 rounded-full ${c.isActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{c.isActive ? 'Servicio Activo' : 'Deshabilitado'}</p>
                      </div>
                   </div>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button onClick={() => removeCompany(c.id)} className="p-2 text-slate-300 hover:text-red-500"><Trash2 size={18} /></button>
                </div>
             </div>

             <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-2xl flex items-center justify-between">
                   <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                      <Link size={14} /> URL de Reserva Pública
                   </div>
                   <button onClick={() => {
                     const url = `${window.location.origin}${window.location.pathname}?c=${c.id}`;
                     navigator.clipboard.writeText(url);
                     alert("Copiado: " + url);
                   }} className="text-[#017E84] hover:underline text-[10px] font-black uppercase tracking-tighter">Copiar Link</button>
                </div>

                <div className="flex gap-3">
                   <button 
                     onClick={() => setActive(c.id)}
                     className={`flex-1 py-3 rounded-xl font-bold text-xs transition-all ${
                       formData.activeCompanyId === c.id ? 'bg-[#1e3050] text-white' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                     }`}
                   >
                     {formData.activeCompanyId === c.id ? 'Panel Principal Activo' : 'Gestionar Panel Admin'}
                   </button>
                </div>
             </div>
          </div>
        ))}
        {formData.companies.length === 0 && !showAdd && (
          <div className="col-span-2 py-20 text-center glass rounded-[40px]">
             <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldCheck size={40} className="text-slate-200" />
             </div>
             <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No hay compañías configuradas aún.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConfigPanel;
