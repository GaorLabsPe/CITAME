
import React, { useState, useEffect } from 'react';
import { Sede, Doctor, AppUser } from '../types';
import { Building2, Stethoscope, Plus, Trash2, Users, ShieldCheck, Mail, MapPin, CheckCircle } from 'lucide-react';
import { supabase } from '../services/supabase';

interface Props {
  sedes: Sede[];
  doctors: Doctor[];
  onUpdateSedes: () => void;
  onUpdateDoctors: () => void;
}

const AdminPanel: React.FC<Props> = ({ sedes, doctors, onUpdateSedes, onUpdateDoctors }) => {
  const [activeTab, setActiveTab] = useState<'sedes' | 'doctors' | 'users'>('sedes');
  const [users, setUsers] = useState<AppUser[]>([]);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
  }, [activeTab]);

  const fetchUsers = async () => {
    const { data } = await supabase.from('app_users').select('*');
    setUsers(data || []);
  };

  const handleAddSede = async () => {
    const nombre = prompt("Nombre de la sede:");
    const direccion = prompt("Dirección:");
    if (!nombre) return;
    
    const companyId = sedes[0]?.company_id || 'default';
    const id = nombre.toLowerCase().replace(/\s+/g, '-');
    
    await supabase.from('sedes').insert({
      id,
      nombre,
      direccion,
      company_id: companyId
    });
    onUpdateSedes();
  };

  const handleAddDoctor = async () => {
    const nombre = prompt("Nombre del Especialista:");
    const especialidad = prompt("Especialidad:");
    if (!nombre) return;
    
    const companyId = sedes[0]?.company_id || 'default';
    
    await supabase.from('doctors').insert({
      nombre,
      especialidad,
      company_id: companyId,
      sedes: sedes.map(s => s.id),
      activo: true
    });
    onUpdateDoctors();
  };

  const handleDeleteSede = async (id: string) => {
    if (!confirm("¿Eliminar sede? Esto afectará citas vinculadas.")) return;
    await supabase.from('sedes').delete().eq('id', id);
    onUpdateSedes();
  };

  const handleDeleteDoctor = async (id: string) => {
    if (!confirm("¿Eliminar médico?")) return;
    await supabase.from('doctors').delete().eq('id', id);
    onUpdateDoctors();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Estructura Médica</h2>
          <p className="text-slate-500 mt-1">Gestión de activos, personal y puntos de atención</p>
        </div>
        <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
          {[
            { id: 'sedes', label: 'Sedes', icon: Building2 },
            { id: 'doctors', label: 'Especialistas', icon: Stethoscope },
            { id: 'users', label: 'Personal', icon: Users }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === tab.id ? 'bg-[#1e3050] text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-[35px] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
          <h3 className="font-bold text-xl text-slate-800 flex items-center gap-3">
             {activeTab === 'sedes' && <Building2 className="text-[#017E84]" />}
             {activeTab === 'doctors' && <Stethoscope className="text-[#714B67]" />}
             {activeTab === 'users' && <Users className="text-[#1e3050]" />}
             Administrar {activeTab.toUpperCase()}
          </h3>
          <button 
            onClick={activeTab === 'sedes' ? handleAddSede : activeTab === 'doctors' ? handleAddDoctor : () => {}} 
            className="bg-[#1e3050] text-white px-6 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 hover:scale-105 transition-all shadow-lg"
          >
            <Plus size={18} /> Agregar {activeTab === 'sedes' ? 'Sede' : 'Médico'}
          </button>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeTab === 'sedes' && sedes.map(sede => (
              <div key={sede.id} className="p-6 rounded-[28px] border border-slate-100 bg-slate-50 group hover:bg-white hover:shadow-xl transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#017E8415] text-[#017E84] flex items-center justify-center">
                    <Building2 size={24} />
                  </div>
                  <button onClick={() => handleDeleteSede(sede.id)} className="text-slate-200 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={18} /></button>
                </div>
                <h4 className="font-bold text-slate-900 text-lg leading-tight">{sede.nombre}</h4>
                <p className="text-xs text-slate-400 mt-2 flex items-center gap-1.5"><MapPin size={12} /> {sede.direccion}</p>
                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                   <span className="text-[10px] font-black uppercase text-[#017E84] tracking-widest">Sede Operativa</span>
                   <div className="w-2 h-2 rounded-full bg-[#017E84] animate-pulse" />
                </div>
              </div>
            ))}

            {activeTab === 'doctors' && doctors.map(doc => (
              <div key={doc.id} className="p-6 rounded-[28px] border border-slate-100 bg-slate-50 group hover:bg-white hover:shadow-xl transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#714B67] text-white flex items-center justify-center font-bold text-xl shadow-lg shadow-[#714B6733]">
                    {doc.nombre.charAt(0)}
                  </div>
                  <button onClick={() => handleDeleteDoctor(doc.id)} className="text-slate-200 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={18} /></button>
                </div>
                <h4 className="font-bold text-slate-900">{doc.nombre}</h4>
                <p className="text-xs font-bold text-[#714B67] uppercase tracking-tighter mt-1">{doc.especialidad}</p>
                <div className="flex flex-wrap gap-2 mt-4">
                   {doc.sedes.map(s => (
                     <span key={s} className="px-2.5 py-1 bg-white border border-slate-100 rounded-lg text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                        {sedes.find(sd => sd.id === s)?.nombre || s}
                     </span>
                   ))}
                </div>
              </div>
            ))}

            {activeTab === 'users' && users.map(user => (
              <div key={user.id} className="p-6 rounded-[28px] border border-slate-100 bg-slate-50 group hover:bg-white hover:shadow-xl transition-all">
                 <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-[#1e3050]">
                       <ShieldCheck size={24} />
                    </div>
                 </div>
                 <h4 className="font-bold text-slate-900 mb-1">{user.nombre}</h4>
                 <p className="text-xs text-slate-400 flex items-center gap-2 mb-4"><Mail size={12}/> {user.email}</p>
                 <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                   user.role === 'admin_negocio' ? 'bg-[#017E8415] text-[#017E84]' : 'bg-slate-200 text-slate-500'
                 }`}>
                   {user.role.replace('_', ' ')}
                 </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
