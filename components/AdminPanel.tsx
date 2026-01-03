
import React, { useState } from 'react';
import { Sede, Doctor } from '../types';
import { Building2, Stethoscope, Plus, Trash2, Edit2, CheckCircle } from 'lucide-react';

interface Props {
  sedes: Sede[];
  doctors: Doctor[];
  onUpdateSedes: (sedes: Sede[]) => void;
  onUpdateDoctors: (doctors: Doctor[]) => void;
}

const AdminPanel: React.FC<Props> = ({ sedes, doctors, onUpdateSedes, onUpdateDoctors }) => {
  const [activeTab, setActiveTab] = useState<'sedes' | 'doctors'>('sedes');
  
  const addSede = () => {
    const newSede: Sede = {
      id: Math.random().toString(36).substr(2, 5),
      nombre: 'Nueva Sede',
      direccion: 'Dirección pendiente',
      horarios: { '1': { inicio: '08:00', fin: '18:00' } }
    };
    onUpdateSedes([...sedes, newSede]);
  };

  const addDoctor = () => {
    const newDoc: Doctor = {
      id: Math.random().toString(36).substr(2, 5),
      nombre: 'Nuevo Doctor',
      especialidad: 'General',
      sedes: sedes.length > 0 ? [sedes[0].id] : [],
      activo: true
    };
    onUpdateDoctors([...doctors, newDoc]);
  };

  const removeSede = (id: string) => onUpdateSedes(sedes.filter(s => s.id !== id));
  const removeDoctor = (id: string) => onUpdateDoctors(doctors.filter(d => d.id !== id));

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Panel Administrativo</h2>
          <p className="text-slate-500 mt-1">Gestiona las bases de tu red médica</p>
        </div>
        <div className="flex bg-white p-1 rounded-xl border border-slate-200">
          <button 
            onClick={() => setActiveTab('sedes')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'sedes' ? 'bg-[#00b49d] text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            Sedes
          </button>
          <button 
            onClick={() => setActiveTab('doctors')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'doctors' ? 'bg-[#9e3a7c] text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            Médicos
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            {activeTab === 'sedes' ? <Building2 size={20} className="text-[#00b49d]" /> : <Stethoscope size={20} className="text-[#9e3a7c]" />}
            Listado de {activeTab === 'sedes' ? 'Sedes' : 'Especialistas'}
          </h3>
          <button 
            onClick={activeTab === 'sedes' ? addSede : addDoctor}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-white font-bold transition-all hover:scale-105 ${activeTab === 'sedes' ? 'bg-[#00b49d]' : 'bg-[#9e3a7c]'}`}
          >
            <Plus size={18} />
            Añadir {activeTab === 'sedes' ? 'Sede' : 'Médico'}
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeTab === 'sedes' ? (
              sedes.map(sede => (
                <div key={sede.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50 hover:border-[#00b49d]/30 transition-all group">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-slate-900">{sede.nombre}</h4>
                    <button onClick={() => removeSede(sede.id)} className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 mb-4">{sede.direccion}</p>
                  <div className="flex items-center gap-2 text-[10px] text-[#00b49d] font-bold uppercase tracking-wider">
                    <CheckCircle size={12} /> Operativa
                  </div>
                </div>
              ))
            ) : (
              doctors.map(doc => (
                <div key={doc.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50 hover:border-[#9e3a7c]/30 transition-all group">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[#9e3a7c]/10 text-[#9e3a7c] flex items-center justify-center font-bold">
                        {doc.nombre.charAt(0)}
                      </div>
                      <h4 className="font-bold text-slate-900">{doc.nombre}</h4>
                    </div>
                    <button onClick={() => removeDoctor(doc.id)} className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <p className="text-xs font-semibold text-[#9e3a7c] mb-1">{doc.especialidad}</p>
                  <p className="text-[10px] text-slate-400">Asignado a: {doc.sedes.length} sedes</p>
                </div>
              ))
            )}
          </div>
          {(activeTab === 'sedes' ? sedes : doctors).length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-400">No hay registros creados. Comienza añadiendo uno.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
