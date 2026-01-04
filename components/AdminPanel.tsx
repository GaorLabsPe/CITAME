
import React, { useState, useEffect } from 'react';
import { Sede, Doctor, AppUser, CompanyProfile } from '../types';
import { Building2, Stethoscope, Plus, Trash2, Users, ShieldCheck, Mail, MapPin, Edit3, RefreshCcw, Save, Globe, AlertTriangle } from 'lucide-react';
import { supabase } from '../services/supabase';

interface Props {
  sedes: Sede[];
  doctors: Doctor[];
  onUpdateSedes: () => void;
  onUpdateDoctors: () => void;
  activeCompany?: CompanyProfile;
}

const AdminPanel: React.FC<Props> = ({ sedes, doctors, onUpdateSedes, onUpdateDoctors, activeCompany }) => {
  const [activeTab, setActiveTab] = useState<'sedes' | 'doctors' | 'users' | 'branding'>('sedes');
  const [users, setUsers] = useState<AppUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingBranding, setIsSavingBranding] = useState(false);
  
  const [brandData, setBrandData] = useState({
    name: activeCompany?.name || '',
    tagline: activeCompany?.tagline || '',
    logo: activeCompany?.logo || '',
    whatsappHelp: activeCompany?.whatsappHelp || ''
  });

  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
  }, [activeTab]);

  useEffect(() => {
    if (activeCompany) {
      setBrandData({
        name: activeCompany.name,
        tagline: activeCompany.tagline,
        logo: activeCompany.logo || '',
        whatsappHelp: activeCompany.whatsappHelp || ''
      });
    }
  }, [activeCompany]);

  const fetchUsers = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from('app_users').select('*');
    if (error) console.error("Error cargando usuarios:", error);
    setUsers(data || []);
    setIsLoading(false);
  };

  // --- GESTIÓN DE SEDES ---
  const handleAddSede = async () => {
    if (!activeCompany) return alert("Seleccione una clínica en Ajustes primero.");
    const nombre = prompt("Nombre de la sede:");
    const direccion = prompt("Dirección:");
    if (!nombre) return;

    setIsLoading(true);
    const { error } = await supabase.from('sedes').insert({
      nombre,
      direccion,
      company_id: activeCompany.id
    });

    if (error) alert("Error al crear sede: " + error.message);
    else onUpdateSedes();
    setIsLoading(false);
  };

  const handleEditSede = async (sede: Sede) => {
    const nuevoNombre = prompt("Nuevo nombre de la sede:", sede.nombre);
    const nuevaDireccion = prompt("Nueva dirección:", sede.direccion);
    if (!nuevoNombre) return;

    setIsLoading(true);
    const { error } = await supabase.from('sedes')
      .update({ nombre: nuevoNombre, direccion: nuevaDireccion })
      .eq('id', sede.id);

    if (error) alert("Error al editar sede: " + error.message);
    else onUpdateSedes();
    setIsLoading(false);
  };

  const handleDeleteSede = async (id: string) => {
    if (!confirm("¿Eliminar sede?")) return;
    setIsLoading(true);
    const { error } = await supabase.from('sedes').delete().eq('id', id);
    if (error) alert("Error al eliminar (puede tener dependencias): " + error.message);
    else onUpdateSedes();
    setIsLoading(false);
  };

  // --- GESTIÓN DE ESPECIALISTAS ---
  const handleAddDoctor = async () => {
    if (!activeCompany) return;
    const nombre = prompt("Nombre del especialista:");
    const especialidad = prompt("Especialidad:");
    if (!nombre) return;

    setIsLoading(true);
    const { error } = await supabase.from('doctors').insert({
      nombre,
      especialidad,
      company_id: activeCompany.id,
      sedes: sedes.map(s => s.id),
      activo: true
    });

    if (error) alert("Error al crear especialista: " + error.message);
    else onUpdateDoctors();
    setIsLoading(false);
  };

  const handleEditDoctor = async (doc: Doctor) => {
    const nuevoNombre = prompt("Nuevo nombre:", doc.nombre);
    const nuevaEspec = prompt("Nueva especialidad:", doc.especialidad);
    if (!nuevoNombre) return;

    setIsLoading(true);
    const { error } = await supabase.from('doctors')
      .update({ nombre: nuevoNombre, especialidad: nuevaEspec })
      .eq('id', doc.id);

    if (error) alert("Error al editar especialista: " + error.message);
    else onUpdateDoctors();
    setIsLoading(false);
  };

  const handleDeleteDoctor = async (id: string) => {
    if (!confirm("¿Eliminar especialista?")) return;
    setIsLoading(true);
    const { error } = await supabase.from('doctors').delete().eq('id', id);
    if (error) alert("Error al eliminar especialista: " + error.message);
    else onUpdateDoctors();
    setIsLoading(false);
  };

  // --- GESTIÓN DE PERSONAL ---
  const handleAddUser = async () => {
    if (!activeCompany) return;
    const nombre = prompt("Nombre completo del personal:");
    const email = prompt("Correo electrónico:");
    const role = prompt("Rol (admin_negocio o recepcion_sede):", "recepcion_sede");
    if (!nombre || !email) return;

    setIsLoading(true);
    const { error } = await supabase.from('app_users').insert({
      nombre,
      email: email.toLowerCase().trim(),
      role: role === 'admin_negocio' ? 'admin_negocio' : 'recepcion_sede',
      company_id: activeCompany.id
    });

    if (error) alert("Error al crear personal: " + error.message);
    else fetchUsers();
    setIsLoading(false);
  };

  const handleEditUser = async (user: AppUser) => {
    const nombre = prompt("Editar nombre:", user.nombre);
    const role = prompt("Editar rol (admin_negocio/recepcion_sede):", user.role);
    if (!nombre) return;

    setIsLoading(true);
    const { error } = await supabase.from('app_users')
      .update({ nombre, role })
      .eq('id', user.id);

    if (error) alert("Error al editar: " + error.message);
    else fetchUsers();
    setIsLoading(false);
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm("¿Eliminar este usuario?")) return;
    setIsLoading(true);
    const { error } = await supabase.from('app_users').delete().eq('id', id);
    if (error) alert("Error al eliminar: " + error.message);
    else fetchUsers();
    setIsLoading(false);
  };

  const handleSaveBranding = async () => {
    if (!activeCompany) return;
    setIsSavingBranding(true);
    const { error } = await supabase.from('companies')
      .update({
        name: brandData.name,
        tagline: brandData.tagline,
        logo: brandData.logo,
        whatsapp_help: brandData.whatsappHelp
      })
      .eq('id', activeCompany.id);

    if (error) alert("Error al guardar marca: " + error.message);
    else {
      alert("Marca actualizada con éxito.");
      window.location.reload();
    }
    setIsSavingBranding(false);
  };

  if (!activeCompany) return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400">
      <AlertTriangle size={64} className="mb-6 opacity-20 text-amber-500" />
      <h3 className="text-xl font-bold text-slate-900 mb-2">Clínica no vinculada</h3>
      <p className="font-medium text-slate-400 max-w-xs text-center">Debe ir a la pestaña de AJUSTES y vincular una base de datos Odoo o crear un perfil de clínica primero.</p>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Estructura Médica</h2>
          <p className="text-slate-500 mt-1 font-medium italic">Gestión de sedes, especialistas y personal administrativo</p>
        </div>
        <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
          {[
            { id: 'sedes', label: 'Sedes', icon: Building2 },
            { id: 'doctors', label: 'Especialistas', icon: Stethoscope },
            { id: 'users', label: 'Personal', icon: Users },
            { id: 'branding', label: 'Marca Online', icon: Globe }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-[#1e3050] text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center bg-slate-50/40 gap-4">
          <h3 className="font-bold text-xl text-slate-800 flex items-center gap-3">
             {activeTab === 'sedes' && <Building2 className="text-[#017E84]" />}
             {activeTab === 'doctors' && <Stethoscope className="text-[#714B67]" />}
             {activeTab === 'users' && <Users className="text-[#1e3050]" />}
             {activeTab === 'branding' && <Globe className="text-[#017E84]" />}
             {activeTab === 'branding' ? 'Identidad de la Clínica' : `Gestionar ${activeTab}`}
          </h3>
          {activeTab !== 'branding' && (
            <button 
              disabled={isLoading}
              onClick={
                activeTab === 'sedes' ? handleAddSede : 
                activeTab === 'doctors' ? handleAddDoctor : 
                handleAddUser
              } 
              className="w-full md:w-auto bg-[#1e3050] text-white px-8 py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:scale-105 transition-all shadow-xl disabled:opacity-50"
            >
              {isLoading ? <RefreshCcw size={18} className="animate-spin" /> : <Plus size={18} />}
              Agregar {activeTab === 'sedes' ? 'Sede' : activeTab === 'doctors' ? 'Especialista' : 'Personal'}
            </button>
          )}
        </div>

        <div className="p-8">
          {activeTab === 'branding' ? (
            <div className="max-w-4xl space-y-8 animate-in slide-in-from-bottom-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Nombre Comercial</label>
                  <input value={brandData.name} onChange={e => setBrandData({...brandData, name: e.target.value})} className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none focus:border-[#017E84] font-bold text-slate-700" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Eslogan</label>
                  <input value={brandData.tagline} onChange={e => setBrandData({...brandData, tagline: e.target.value})} className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none focus:border-[#017E84] font-bold text-slate-700" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">URL Logo (Imagen PNG)</label>
                  <input value={brandData.logo} onChange={e => setBrandData({...brandData, logo: e.target.value})} className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none focus:border-[#017E84] font-bold text-slate-700" placeholder="https://..." />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1 flex items-center gap-2">WhatsApp Ayuda (Sin espacios)</label>
                  <input value={brandData.whatsappHelp} onChange={e => setBrandData({...brandData, whatsappHelp: e.target.value})} className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none focus:border-[#017E84] font-bold text-slate-700" placeholder="51999888777" />
                </div>
              </div>
              <button onClick={handleSaveBranding} disabled={isSavingBranding} className="bg-[#017E84] text-white px-10 py-4 rounded-2xl font-bold flex items-center gap-3 shadow-xl hover:scale-105 transition-all">
                {isSavingBranding ? <RefreshCcw size={20} className="animate-spin"/> : <Save size={20} />} Guardar Branding
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeTab === 'sedes' && sedes.map(sede => (
                <div key={sede.id} className="p-6 rounded-[30px] border border-slate-100 bg-slate-50 group hover:bg-white hover:shadow-xl transition-all relative">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#017E8415] text-[#017E84] flex items-center justify-center"><Building2 size={24} /></div>
                    <div className="flex gap-1">
                      <button onClick={() => handleEditSede(sede)} className="p-2 text-slate-300 hover:text-blue-500 transition-colors"><Edit3 size={18} /></button>
                      <button onClick={() => handleDeleteSede(sede.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                    </div>
                  </div>
                  <h4 className="font-bold text-slate-900 text-lg leading-tight">{sede.nombre}</h4>
                  <p className="text-xs text-slate-400 mt-2 flex items-center gap-1.5"><MapPin size={12} /> {sede.direccion || 'Sin dirección registrada'}</p>
                </div>
              ))}

              {activeTab === 'doctors' && doctors.map(doc => (
                <div key={doc.id} className="p-6 rounded-[30px] border border-slate-100 bg-slate-50 group hover:bg-white hover:shadow-xl transition-all relative">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#714B67] text-white flex items-center justify-center font-black text-xl shadow-lg">{doc.nombre.charAt(0)}</div>
                    <div className="flex gap-1">
                      <button onClick={() => handleEditDoctor(doc)} className="p-2 text-slate-300 hover:text-blue-500 transition-colors"><Edit3 size={18} /></button>
                      <button onClick={() => handleDeleteDoctor(doc.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                    </div>
                  </div>
                  <h4 className="font-bold text-slate-900 leading-tight">{doc.nombre}</h4>
                  <p className="text-[10px] font-black text-[#714B67] uppercase tracking-tighter mt-1">{doc.especialidad}</p>
                </div>
              ))}

              {activeTab === 'users' && users.map(user => (
                <div key={user.id} className="p-6 rounded-[30px] border border-slate-100 bg-slate-50 group hover:bg-white hover:shadow-xl transition-all">
                   <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-[#1e3050]"><ShieldCheck size={24} /></div>
                      <div className="flex gap-1">
                         <button onClick={() => handleEditUser(user)} className="p-2 text-slate-300 hover:text-blue-500 transition-colors"><Edit3 size={18} /></button>
                         <button onClick={() => handleDeleteUser(user.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                      </div>
                   </div>
                   <h4 className="font-bold text-slate-900 mb-1 leading-tight truncate">{user.nombre}</h4>
                   <p className="text-[11px] text-slate-400 flex items-center gap-2 mb-4 truncate"><Mail size={12}/> {user.email}</p>
                   <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${user.role === 'admin_negocio' ? 'bg-[#017E8415] text-[#017E84]' : 'bg-slate-200 text-slate-500'}`}>{user.role.replace('_', ' ')}</span>
                </div>
              ))}

              {((activeTab === 'sedes' && sedes.length === 0) || 
                (activeTab === 'doctors' && doctors.length === 0) || 
                (activeTab === 'users' && users.length === 0)) && (
                <div className="col-span-full py-20 text-center text-slate-300 font-bold uppercase tracking-widest text-xs">No hay datos en la nube. Pulse el botón para agregar.</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
