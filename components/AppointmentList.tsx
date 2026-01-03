
import React, { useState, useMemo } from 'react';
import { Appointment, AppointmentStatus, SedeType } from '../types';
import { Search, Filter, MoreVertical, CheckCircle, XCircle, Clock, ExternalLink } from 'lucide-react';
import { COLORS, CONSULTA_INFO } from '../constants';

interface Props {
  appointments: Appointment[];
  onUpdateStatus: (id: string, status: AppointmentStatus) => void;
}

const AppointmentList: React.FC<Props> = ({ appointments, onUpdateStatus }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSede, setFilterSede] = useState<SedeType | 'all'>('all');
  const [filterEstado, setFilterEstado] = useState<AppointmentStatus | 'all'>('all');

  const filtered = useMemo(() => {
    return appointments.filter(app => {
      const matchesSearch = app.patient.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           app.patient.dni?.includes(searchTerm);
      const matchesSede = filterSede === 'all' || app.sede === filterSede;
      const matchesEstado = filterEstado === 'all' || app.estado === filterEstado;
      return matchesSearch && matchesSede && matchesEstado;
    });
  }, [appointments, searchTerm, filterSede, filterEstado]);

  const StatusBadge = ({ status }: { status: AppointmentStatus }) => {
    const config = {
      pendiente: { color: 'bg-amber-100 text-amber-600', label: 'Pendiente' },
      confirmada: { color: 'bg-blue-100 text-blue-600', label: 'Confirmada' },
      completada: { color: 'bg-emerald-100 text-emerald-600', label: 'Completada' },
      cancelada: { color: 'bg-red-100 text-red-600', label: 'Cancelada' },
    };
    const { color, label } = config[status];
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${color}`}>
        {label}
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Listado de Citas</h2>
          <p className="text-slate-500 mt-1">Gestiona y supervisa todas las programaciones</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por paciente o DNI..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
          <button className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors">
            <Filter size={20} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center gap-4 p-4 border-b border-slate-100 bg-slate-50/50">
          <select 
            className="text-sm bg-transparent font-medium text-slate-600 outline-none"
            value={filterSede}
            onChange={e => setFilterSede(e.target.value as any)}
          >
            <option value="all">Todas las sedes</option>
            <option value="centro">Sede Centro</option>
            <option value="norte">Sede Norte</option>
          </select>
          <div className="h-4 w-[1px] bg-slate-200" />
          <select 
            className="text-sm bg-transparent font-medium text-slate-600 outline-none"
            value={filterEstado}
            onChange={e => setFilterEstado(e.target.value as any)}
          >
            <option value="all">Todos los estados</option>
            <option value="pendiente">Pendientes</option>
            <option value="confirmada">Confirmadas</option>
            <option value="completada">Completadas</option>
            <option value="cancelada">Canceladas</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 text-xs font-bold uppercase tracking-widest">
                <th className="px-6 py-4">Paciente</th>
                <th className="px-6 py-4">Fecha / Hora</th>
                <th className="px-6 py-4">Médico / Especialidad</th>
                <th className="px-6 py-4">Sede / Servicio</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(app => (
                <tr key={app.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                        {app.patient.nombre.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 leading-none">{app.patient.nombre}</p>
                        <p className="text-xs text-slate-500 mt-1">{app.patient.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-semibold text-slate-900">{new Date(app.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}</p>
                    <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                      <Clock size={12} />
                      {app.hora}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-semibold text-slate-900">{app.doctor.nombre}</p>
                    <p className="text-xs text-slate-500 mt-1">{app.doctor.especialidad}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-semibold text-slate-900 capitalize">{app.sede}</p>
                    <p className="text-xs text-slate-500 mt-1">{CONSULTA_INFO[app.tipo].label}</p>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={app.estado} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {app.estado === 'pendiente' && (
                        <button 
                          onClick={() => onUpdateStatus(app.id, 'confirmada')}
                          className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all"
                          title="Confirmar"
                        >
                          <CheckCircle size={18} />
                        </button>
                      )}
                      {app.estado !== 'cancelada' && app.estado !== 'completada' && (
                        <>
                          <button 
                            onClick={() => onUpdateStatus(app.id, 'completada')}
                            className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all"
                            title="Completar"
                          >
                            <CheckCircle size={18} />
                          </button>
                          <button 
                            onClick={() => onUpdateStatus(app.id, 'cancelada')}
                            className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all"
                            title="Cancelar"
                          >
                            <XCircle size={18} />
                          </button>
                        </>
                      )}
                      {app.odoo_sale_order_id && (
                        <div className="p-1.5 rounded-lg bg-slate-100 text-slate-400 cursor-help" title={`SO ID Odoo: ${app.odoo_sale_order_id}`}>
                          <ExternalLink size={18} />
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    No se encontraron citas que coincidan con los filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AppointmentList;
