
import React, { useState } from 'react';
import { AppConfig } from '../types';
import { Database, Link, Lock, User, Globe, CheckCircle, Save, Cloud, Server } from 'lucide-react';

interface Props {
  config: AppConfig | null;
  onSave: (config: AppConfig) => void;
}

const ConfigPanel: React.FC<Props> = ({ config, onSave }) => {
  const [formData, setFormData] = useState<AppConfig>(config || {
    odoo: { url: '', db: '', username: '', apiKey: '', webhookUrl: '' },
    supabase: { url: '', anonKey: '' }
  });
  const [isSaved, setIsSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div>
        <h2 className="text-3xl font-bold text-slate-900">Seguridad y Sincronización</h2>
        <p className="text-slate-500 mt-1">Conecta tus nodos de datos para una gestión unificada Citame.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-[#017E84]/10 rounded-xl text-[#017E84]">
               <Cloud size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Cloud Data Hub</h3>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-slate-400 tracking-widest px-1">Endpoint de Nube</label>
              <input 
                type="url" 
                value={formData.supabase.url}
                onChange={e => setFormData({...formData, supabase: {...formData.supabase, url: e.target.value}})}
                placeholder="https://hub.citame.network"
                className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-[#017E8408] outline-none transition-all font-medium"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-slate-400 tracking-widest px-1">Token de Acceso Seguro</label>
              <input 
                type="password" 
                value={formData.supabase.anonKey}
                onChange={e => setFormData({...formData, supabase: {...formData.supabase, anonKey: e.target.value}})}
                className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-[#017E8408] outline-none transition-all font-medium"
              />
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-3 mb-2">
             <div className="p-2 bg-[#714B67]/10 rounded-xl text-[#714B67]">
                <Server size={24} />
             </div>
            <h3 className="text-xl font-bold text-slate-900">Enterprise Sync Node</h3>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-slate-400 tracking-widest px-1">Servidor Empresarial</label>
              <input 
                type="url" 
                placeholder="https://enterprise.network"
                value={formData.odoo.url}
                onChange={e => setFormData({...formData, odoo: {...formData.odoo, url: e.target.value}})}
                className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-[#714B6708] outline-none transition-all font-medium"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-400 tracking-widest px-1">Identificador Nodo</label>
                <input 
                  placeholder="ID Nodo"
                  value={formData.odoo.db}
                  onChange={e => setFormData({...formData, odoo: {...formData.odoo, db: e.target.value}})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-[#714B6708] outline-none transition-all font-medium"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-400 tracking-widest px-1">ID Operador</label>
                <input 
                  placeholder="Operador"
                  value={formData.odoo.username}
                  onChange={e => setFormData({...formData, odoo: {...formData.odoo, username: e.target.value}})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-[#714B6708] outline-none transition-all font-medium"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-slate-400 tracking-widest px-1">Llave de Sincronización</label>
              <input 
                type="password"
                placeholder="Key de Seguridad"
                value={formData.odoo.apiKey}
                onChange={e => setFormData({...formData, odoo: {...formData.odoo, apiKey: e.target.value}})}
                className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-[#714B6708] outline-none transition-all font-medium"
              />
            </div>
          </div>
        </div>

        <button 
          type="submit"
          className="w-full bg-[#1e293b] hover:bg-black text-white py-5 rounded-[24px] font-bold shadow-lg transition-all flex items-center justify-center gap-2 group"
        >
          {isSaved ? <CheckCircle size={22} className="text-[#017E84]" /> : <Save size={22} />}
          {isSaved ? 'Sincronización Validada' : 'Confirmar Parámetros'}
        </button>
      </form>
    </div>
  );
};

export default ConfigPanel;
