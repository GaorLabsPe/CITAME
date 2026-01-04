
import React, { useState } from 'react';
import { Appointment, AppointmentStatus } from '../types';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  X, 
  User, 
  Clock, 
  MapPin, 
  Stethoscope, 
  FileText,
  Calendar as CalendarIcon,
  CheckCircle2
} from 'lucide-react';
import { COLORS } from '../constants';

interface Props {
  appointments: Appointment[];
  onSelectDay: (date: string) => void;
}

const getStatusStyles = (status: AppointmentStatus) => {
  switch (status) {
    case 'pendiente':
      return 'bg-purple-50 text-purple-700 border-purple-100 hover:bg-purple-100';
    case 'confirmada':
      return 'bg-cyan-50 text-cyan-700 border-cyan-100 hover:bg-cyan-100';
    case 'completada':
      return 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100';
    case 'cancelada':
      return 'bg-rose-50 text-rose-700 border-rose-100 hover:bg-rose-100';
    default:
      return 'bg-slate-50 text-slate-700 border-slate-100';
  }
};

const CalendarView: React.FC<Props> = ({ appointments, onSelectDay }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [summaryApp, setSummaryApp] = useState<Appointment | null>(null);

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const days = daysInMonth(year, month);
  const firstDay = firstDayOfMonth(year, month);
  
  const monthName = currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

  const appointmentsByDate = appointments.reduce((acc: any, app) => {
    if (!acc[app.fecha]) acc[app.fecha] = [];
    acc[app.fecha].push(app);
    return acc;
  }, {});

  const handleAppClick = (e: React.MouseEvent, app: Appointment) => {
    e.stopPropagation();
    setSummaryApp(app);
  };

  const renderCells = () => {
    const cells = [];
    const emptyDays = firstDay === 0 ? 6 : firstDay - 1;
    for (let i = 0; i < emptyDays; i++) {
      cells.push(<div key={`empty-${i}`} className="h-32 border-b border-r border-slate-100 bg-slate-50/30" />);
    }

    for (let d = 1; d <= days; d++) {
      const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
      const dayAppointments = appointmentsByDate[dateStr] || [];
      const isToday = new Date().toISOString().split('T')[0] === dateStr;

      cells.push(
        <div 
          key={d} 
          onClick={() => onSelectDay(dateStr)}
          className="h-32 border-b border-r border-slate-100 p-2 hover:bg-slate-50/50 transition-colors cursor-pointer group relative overflow-hidden"
        >
          <div className="flex justify-between items-start mb-1">
            <span className={`text-xs font-black ${isToday ? 'w-6 h-6 bg-[#017E84] text-white rounded-full flex items-center justify-center shadow-lg' : 'text-slate-400'}`}>
              {d}
            </span>
          </div>
          
          <div className="space-y-1 max-h-[85px] overflow-y-auto custom-scrollbar-hide">
            {dayAppointments.slice(0, 3).map((app: Appointment) => (
              <button 
                key={app.id} 
                onClick={(e) => handleAppClick(e, app)}
                className={`w-full text-left text-[9px] p-1.5 rounded-lg border shadow-sm truncate transition-all flex flex-col gap-0.5 ${getStatusStyles(app.estado)}`}
              >
                <div className="flex justify-between items-center w-full">
                  <span className="font-black uppercase tracking-tighter opacity-70">{app.hora}</span>
                </div>
                <span className="font-bold truncate">{app.patient.nombre}</span>
              </button>
            ))}
            {dayAppointments.length > 3 && (
              <p className="text-[8px] text-slate-400 text-center font-black uppercase tracking-widest mt-1">+{dayAppointments.length - 3} agendas</p>
            )}
          </div>

          <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="p-1.5 bg-[#017E84]/10 text-[#017E84] rounded-lg">
              <Plus size={12} />
            </div>
          </div>
        </div>
      );
    }
    return cells;
  };

  return (
    <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-700 relative">
      <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 capitalize tracking-tight">{monthName}</h2>
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">Gestión Visual de Agenda</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="p-3 hover:bg-white hover:shadow-md rounded-2xl transition-all border border-slate-100 text-slate-400 hover:text-[#017E84]">
            <ChevronLeft size={20} />
          </button>
          <button onClick={() => setCurrentDate(new Date())} className="px-6 py-3 text-xs font-black uppercase tracking-widest text-slate-600 hover:bg-white hover:shadow-md border border-slate-100 rounded-2xl transition-all">
            Hoy
          </button>
          <button onClick={nextMonth} className="p-3 hover:bg-white hover:shadow-md rounded-2xl transition-all border border-slate-100 text-slate-400 hover:text-[#017E84]">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/50">
        {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => (
          <div key={d} className="py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {renderCells()}
      </div>

      {summaryApp && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-[35px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-white">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#017E84] text-white rounded-xl shadow-lg">
                    <CalendarIcon size={18} />
                  </div>
                  <h3 className="font-bold text-slate-800 text-sm uppercase tracking-tight">Detalle de Agenda</h3>
               </div>
               <button onClick={() => setSummaryApp(null)} className="p-2 hover:bg-slate-200 rounded-xl transition-all text-slate-400"><X size={18}/></button>
            </div>

            <div className="p-8 space-y-6">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#017E84]/10 text-[#017E84] flex items-center justify-center font-black text-lg">
                    {summaryApp.patient.nombre.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Paciente</p>
                    <h4 className="font-bold text-slate-800 truncate">{summaryApp.patient.nombre}</h4>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1 flex items-center gap-1"><Clock size={10}/> Horario</p>
                    <p className="text-xs font-bold text-slate-700">{summaryApp.hora}</p>
                  </div>
                  <div className={`p-3 rounded-2xl border ${getStatusStyles(summaryApp.estado)}`}>
                    <p className="text-[8px] font-black uppercase tracking-widest mb-1 opacity-60">Estado</p>
                    <p className="text-[10px] font-black uppercase tracking-tighter">{summaryApp.estado}</p>
                  </div>
               </div>

               <div className="space-y-3">
                  <div className="flex items-center gap-3 text-slate-600">
                    <Stethoscope size={14} className="text-[#017E84] flex-shrink-0" />
                    <p className="text-xs font-bold truncate">{summaryApp.doctor.nombre}</p>
                  </div>
                  <div className="flex items-center gap-3 text-slate-500">
                    <MapPin size={14} className="text-[#714B67] flex-shrink-0" />
                    <p className="text-xs font-medium uppercase tracking-tighter">{summaryApp.sede}</p>
                  </div>
                  <div className="flex items-start gap-3 text-slate-500 pt-2 border-t border-slate-50">
                    <FileText size={14} className="text-slate-300 flex-shrink-0 mt-0.5" />
                    <p className="text-[10px] font-medium leading-relaxed line-clamp-2">
                       {summaryApp.motivo || 'Sin observaciones adicionales.'}
                    </p>
                  </div>
               </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100">
               <button 
                 onClick={() => setSummaryApp(null)} 
                 className="w-full bg-[#1e3050] text-white py-4 rounded-2xl font-bold text-xs uppercase tracking-widest shadow-xl hover:bg-black transition-all active:scale-95"
               >
                 Cerrar Resumen
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarView;
