
import React, { useState, useEffect } from 'react';
import { Sede, Doctor, AppUser, CompanyProfile } from '../types';
import { Building2, Stethoscope, Plus, Trash2, Users, ShieldCheck, Mail, MapPin, CheckCircle, Image as ImageIcon, MessageCircle, Save, Globe, Edit3, RefreshCcw } from 'lucide-react';
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
  const [isSaving, setIsSaving] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  
  // Estado para Branding
  const [brandData, setBrandData] = useState({
    name: activeCompany?.name || '',
    tagline: activeCompany?.tagline || '',
    logo: activeCompany?.logo || '',
    whatsappHelp: activeCompany?.whatsappHelp || ''
  });

  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
  }, [activeTab]);

  const fetchUsers = async () => {
    const { data, error } = await supabase.from('app_users').select('*');
    if (error) {
      console.error("Error fetching users:", error);
      return;
    }
    setUsers(data || []);
  };

  const handleSaveBranding = async () => {
    if (!activeCompany) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('companies')
        .update({
          name: brandData.name,
          tagline: brandData.tagline,
          logo: brandData.logo,
          whatsapp_help: brandData.whatsappHelp
        })
        .eq('id', activeCompany.id);

      if (error) throw error;
      alert("Configuración de marca actualizada correctamente.");
      window.location.reload();
    } catch (e) {
      alert("Error al guardar la configuración.");
    } finally {
      setIsSaving(false);
    }
  };

  // --- GESTIÓN DE SEDES ---
  const handleAddSede = async () => {
    const nombre = prompt("Nombre de la sede:");
    const direccion = prompt("Dirección:");
    if (!nombre) return;
    
    setIsActionLoading(true);
    const companyId = activeCompany?.id || 'default';
    const id = nombre.toLowerCase().replace(/\s+/g, '-').normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    const { error } = await supabase.from('sedes').insert({
      id,
      nombre,
      direccion,
      company_id: companyId
    });

    if (error) alert("Error al crear sede: " + error.message);
    onUpdateSedes();
    setIsActionLoading(false);
  };

  const handleEditSede = async (sede: Sede) => {
    const nombre = prompt("Nuevo nombre de la sede:", sede.nombre);
    const direccion = prompt("Nueva dirección:", sede.direccion);
    if (!nombre) return;

    setIsActionLoading(true);
    const { error } = await supabase.from('sedes')
      .update({ nombre, direccion })
      .eq('id', sede.id);

    if (error) alert("Error al editar sede: " + error.message);
    onUpdateSedes();
    setIsActionLoading(false);
  };

  const handleDeleteSede = async (id: string) => {
    if (!confirm("¿Eliminar sede? Nota: Si hay citas vinculadas a esta sede, la operación podría fallar por integridad de datos.")) return;
    setIsActionLoading(true);
    const { error } = await supabase.from('sedes').delete().eq('id', id);
    if (error) alert("No se pudo eliminar la sede. Es probable que tenga citas o personal asociados.");
    onUpdateSedes();
    setIsActionLoading(false);
  };

  // --- GESTIÓN DE DOCTORES ---
  const handleAddDoctor = async () => {
    const nombre = prompt("Nombre del Especialista:");
    const especialidad = prompt("Especialidad:");
    if (!nombre) return;
    
    setIsActionLoading(true);
    const companyId = activeCompany?.id || 'default';
    
    const { error } = await supabase.from('doctors').insert({
      nombre,
      especialidad,
      company_id: companyId,
      sedes: sedes.map(s => s.id),
      activo: true
    });

    if (error) alert("Error al crear médico: " + error.message);
    onUpdateDoctors();
    setIsActionLoading(false);
  };

  const handleEditDoctor = async (doc: Doctor) => {
    const nombre = prompt("Nuevo nombre del especialista:", doc.nombre);
    const especialidad = prompt("Nueva especialidad:", doc.especialidad);
    if (!nombre) return;

    setIsActionLoading(true);
    const { error } = await supabase.from('doctors')
      .update({ nombre, especialidad })
      .eq('id', doc.id);

    if (error) alert("Error al editar especialista: " + error.message);
    onUpdateDoctors();
    setIsActionLoading(false);
  };

  const handleDeleteDoctor = async (id: string) => {
    if (!confirm("¿Eliminar médico?")) return;
    setIsActionLoading(true);
    const { error } = await supabase.from('doctors').delete().eq('id', id);
    if (error) alert("Error al eliminar médico: " + error.message);
    onUpdateDoctors();
    setIsActionLoading(false);
  };

  // --- GESTIÓN DE PERSONAL (USUARIOS) ---
  const handleAddUser = async () => {
    const nombre = prompt("Nombre completo del personal:");
    const email = prompt("Correo electrónico:");
    const roleInput = prompt("Rol (escriba exacto: admin_negocio o recepcion_sede):", "recepcion_sede");
    
    if (!nombre || !email) return;
    
    setIsActionLoading(true);
    const companyId = activeCompany?.id || 'default';
    
    const { error } = await supabase.from('app_users').insert({
      nombre,
      email: email.toLowerCase().trim(),
      role: roleInput === 'admin_negocio' ? 'admin_negocio' : 'recepcion_sede',
      company_id: companyId
    });

    if (error) {
      alert("Error al crear usuario: " + error.message);
    } else {
      alert("Personal creado exitosamente.");
      fetchUsers();
    }
    setIsActionLoading(false);
  };

  const handleEditUser = async (user: AppUser) => {
    const nombre = prompt("Nuevo nombre del personal:", user.nombre);
    const roleInput = prompt("Nuevo Rol (admin_negocio o recepcion_sede):", user.role);
    if (!nombre) return;

    setIsActionLoading(true);
    const { error } = await supabase.from('app_users')
      .update({ 
        nombre, 
        role: roleInput === 'admin_negocio' ? 'admin_negocio' : 'recepcion_sede' 
      })
      .eq('id', user.id);

    if (error) alert("Error al editar personal: " + error.message);
    fetchUsers();
    setIsActionLoading(false);
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm("¿Eliminar acceso a este usuario?")) return;
    setIsActionLoading(true);
    const { error } = await supabase.from('app_users').delete().eq('id', id);
    if (error) alert("Error al eliminar personal: " + error.message);
    fetchUsers();
    setIsActionLoading(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Estructura Médica</h2>
          <p className="text-slate-500 mt-1">Gestión de activos, personal y presencia online</p>
        </div>
        <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
          {[
            { id: 'sedes', label: 'Sedes', icon: Building2 },
            { id: 'doctors', label: 'Especialistas', icon: Stethoscope },
            { id: 'users', label: 'Personal', icon: Users },
            { id: 'branding', label: 'Agenda Online', icon: Globe }
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
             {activeTab === 'branding' && <Globe className="text-[#017E84]" />}
             {activeTab === 'branding' ? 'Configuración de Marca y Agenda Pública' : `Administrar ${activeTab.toUpperCase()}`}
          </h3>
          {activeTab !== 'branding' && (
            <button 
              disabled={isActionLoading}
              onClick={
                activeTab === 'sedes' ? handleAddSede : 
                activeTab === 'doctors' ? handleAddDoctor : 
                handleAddUser
              } 
              className="bg-[#1e3050] text-white px-6 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 hover:scale-105 transition-all shadow-lg disabled:opacity-50"
            >
              {isActionLoading ? <RefreshCcw size={18} className="animate-spin" /> : <Plus size={18} />}
              {isActionLoading ? 'Procesando...' : `Agregar ${activeTab === 'sedes' ? 'Sede' : activeTab === 'doctors' ? 'Especialista' : 'Personal'}`}
            </button>
          )}
        </div>

        <div className="p-8">
          {activeTab === 'branding' ? (
            <div className="max-w-4xl space-y-8 animate-in slide-in-from-bottom-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Nombre Comercial del Negocio</label>
                  <input 
                    value={brandData.name} 
                    onChange={e => setBrandData({...brandData, name: e.target.value})} 
                    className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none focus:border-[#017E84] font-bold text-slate-700" 
                    placeholder="Ej: Clínica Dental Vida"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Lema o Slogan</label>
                  <input 
                    value={brandData.tagline} 
                    onChange={e => setBrandData({...brandData, tagline: e.target.value})} 
                    className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none focus:border-[#017E84] font-bold text-slate-700" 
                    placeholder="Ej: Cuidamos tu sonrisa con tecnología"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">URL del Logo (Imagen PNG/JPG)</label>
                  <div className="flex gap-2">
                    <input 
                      value={brandData.logo} 
                      onChange={e => setBrandData({...brandData, logo: e.target.value})} 
                      className="flex-1 p-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none focus:border-[#017E84] font-bold text-slate-700" 
                      placeholder="https://ejemplo.com/logo.png"
                    />
                    {brandData.logo && (
                      <div className="w-14 h-14 bg-white border border-slate-100 rounded-xl flex items-center justify-center overflow-hidden">
                        <img src={brandData.logo} alt="Preview" className="w-full h-full object-contain" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1 flex items-center gap-2"><MessageCircle size={14} className="text-[#25D366]"/> WhatsApp de Ayuda al Paciente</label>
                  <input 
                    value={brandData.whatsappHelp} 
                    onChange={e => setBrandData({...brandData, whatsappHelp: e.target.value})} 
                    className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none focus:border-[#017E84] font-bold text-slate-700" 
                    placeholder="Ej: 51987654321"
                  />
                  <p className="text-[9px] text-slate-400 italic">Formato: Código de país + número (sin espacios ni el signo +)</p>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100">
                <button 
                  onClick={handleSaveBranding}
                  disabled={isSaving}
                  className="bg-[#017E84] text-white px-10 py-4 rounded-2xl font-bold flex items-center gap-3 shadow-xl hover:scale-105 transition-all disabled:opacity-50"
                >
                  <Save size={20} /> {isSaving ? 'Guardando...' : 'Guardar Configuración Pública'}
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeTab === 'sedes' && sedes.map(sede => (
                <div key={sede.id} className="p-6 rounded-[28px] border border-slate-100 bg-slate-50 group hover:bg-white hover:shadow-xl transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#017E8415] text-[#017E84] flex items-center justify-center">
                      <Building2 size={24} />
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEditSede(sede)} className="p-2 text-slate-400 hover:text-blue-500 transition-colors"><Edit3 size={18} /></button>
                      <button onClick={() => handleDeleteSede(sede.id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                    </div>
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
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEditDoctor(doc)} className="p-2 text-slate-400 hover:text-blue-500 transition-colors"><Edit3 size={18} /></button>
                      <button onClick={() => handleDeleteDoctor(doc.id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                    </div>
                  </div>
                  <h4 className="font-bold text-slate-900">{doc.nombre}</h4>
                  <p className="text-xs font-bold text-[#714B67] uppercase tracking-tighter mt-1">{doc.especialidad}</p>
                  <div className="flex flex-wrap gap-2 mt-4">
                     {doc.sedes && Array.isArray(doc.sedes) ? doc.sedes.map(s => (
                       <span key={s} className="px-2.5 py-1 bg-white border border-slate-100 rounded-lg text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                          {sedes.find(sd => sd.id === s)?.nombre || s}
                       </span>
                     )) : (
                       <span className="text-[9px] text-slate-300 italic">Sin sedes asignadas</span>
                     )}
                  </div>
                </div>
              ))}

              {activeTab === 'users' && users.map(user => (
                <div key={user.id} className="p-6 rounded-[28px] border border-slate-100 bg-slate-50 group hover:bg-white hover:shadow-xl transition-all">
                   <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-[#1e3050]">
                         <ShieldCheck size={24} />
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button onClick={() => handleEditUser(user)} className="p-2 text-slate-400 hover:text-blue-500 transition-colors"><Edit3 size={18} /></button>
                         <button onClick={() => handleDeleteUser(user.id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
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
              
              {activeTab === 'users' && users.length === 0 && (
                <div className="col-span-full py-20 text-center">
                   <p className="text-slate-400 font-bold">No hay personal registrado aún.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
