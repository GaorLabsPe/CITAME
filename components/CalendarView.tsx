
import React, { useState } from 'react';
import { Appointment } from '../types';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

interface Props {
  appointments: Appointment[];
  onSelectDay: (date: string) => void;
}

const CalendarView: React.FC<Props> = ({ appointments, onSelectDay }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const days = daysInMonth(year, month);
  const firstDay = firstDayOfMonth(year, month);
  
  const monthName = currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

  // Agrupar citas por fecha
  const appointmentsByDate = appointments.reduce((acc: any, app) => {
    if (!acc[app.fecha]) acc[app.fecha] = [];
    acc[app.fecha].push(app);
    return acc;
  }, {});

  const renderCells = () => {
    const cells = [];
    // Espacios vacíos para el inicio del mes (corregido para Lunes inicio)
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
          className="h-32 border-b border-r border-slate-100 p-2 hover:bg-blue-50/30 transition-colors cursor-pointer group relative"
        >
          <div className="flex justify-between items-start">
            <span className={`text-sm font-bold ${isToday ? 'w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center' : 'text-slate-500'}`}>
              {d}
            </span>
            {dayAppointments.length > 0 && (
              <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-bold">
                {dayAppointments.length}
              </span>
            )}
          </div>
          
          <div className="mt-1 space-y-1 overflow-y-auto max-h-[70px] scrollbar-hide">
            {dayAppointments.slice(0, 3).map((app: Appointment) => (
              <div key={app.id} className="text-[10px] p-1 rounded bg-white border border-slate-100 shadow-sm truncate">
                <span className={`w-1.5 h-1.5 inline-block rounded-full mr-1 ${
                  app.estado === 'pendiente' ? 'bg-amber-400' :
                  app.estado === 'confirmada' ? 'bg-blue-500' :
                  'bg-emerald-500'
                }`} />
                <span className="font-semibold text-slate-700">{app.hora}</span> {app.patient.nombre}
              </div>
            ))}
            {dayAppointments.length > 3 && (
              <p className="text-[9px] text-slate-400 text-center font-medium">+{dayAppointments.length - 3} más</p>
            )}
          </div>

          <button className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-blue-600 text-white p-1 rounded-lg">
            <Plus size={14} />
          </button>
        </div>
      );
    }
    return cells;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-500">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900 capitalize">{monthName}</h2>
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="p-2 hover:bg-slate-50 rounded-lg transition-colors border border-slate-200">
            <ChevronLeft size={20} />
          </button>
          <button onClick={() => setCurrentDate(new Date())} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-lg">
            Hoy
          </button>
          <button onClick={nextMonth} className="p-2 hover:bg-slate-50 rounded-lg transition-colors border border-slate-200">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/50">
        {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => (
          <div key={d} className="py-3 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {renderCells()}
      </div>
    </div>
  );
};

export default CalendarView;
