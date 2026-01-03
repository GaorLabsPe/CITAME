
import React from 'react';
import { Activity, ArrowRight, Activity as ActivityIcon, Calendar, Users, Shield, Zap } from 'lucide-react';
import { Appointment } from '../types';

interface Props {
  onEnter: () => void;
  appointments: Appointment[];
}

const Landing: React.FC<Props> = ({ onEnter, appointments }) => {
  return (
    <div className="min-h-screen bg-[#f4f7f6] overflow-hidden selection:bg-[#017E84]/20">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#017E84]/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#714B67]/10 rounded-full blur-[120px] animate-pulse" />

      <nav className="relative z-10 px-8 py-6 flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
           <div className="bg-gradient-to-br from-[#017E84] to-[#714B67] p-2 rounded-xl">
             <ActivityIcon className="text-white" size={24} />
           </div>
           <span className="text-2xl font-bold text-[#1e3050]">MedConnect <span className="text-[#017E84]">31</span></span>
        </div>
        <button 
          onClick={onEnter}
          className="bg-[#1e3050] text-white px-6 py-2.5 rounded-2xl font-bold flex items-center gap-2 hover:scale-105 transition-all shadow-xl hover:shadow-[#1e305044]"
        >
          Acceder al Sistema <ArrowRight size={18} />
        </button>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-8 pt-20 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div className="space-y-8 animate-stagger-1">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#017E84]/10 rounded-full text-[#017E84] font-bold text-xs uppercase tracking-widest">
            <Zap size={14} /> Nueva Generación de Gestión Médica
          </div>
          <h1 className="text-6xl font-bold text-[#1e3050] leading-[1.1]">
            Control total de tu <span className="text-[#017E84] relative">Agenda Médica<div className="absolute bottom-2 left-0 w-full h-3 bg-[#017E84]/10 -z-10" /></span> en la Nube.
          </h1>
          <p className="text-xl text-slate-500 max-w-lg leading-relaxed">
            Sincronización en tiempo real con Odoo ERP, gestión multi-sede inteligente y recordatorios automáticos vía WhatsApp.
          </p>
          
          <div className="flex gap-4 pt-4">
            <button 
              onClick={onEnter}
              className="bg-gradient-to-r from-[#017E84] to-[#00a38d] text-white px-10 py-5 rounded-[24px] font-bold text-lg shadow-2xl hover:shadow-[#017E8466] hover:translate-y-[-4px] transition-all flex items-center gap-3"
            >
              Comenzar Ahora <ArrowRight />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-8 pt-12">
            <div>
              <p className="text-3xl font-bold text-[#1e3050]">{appointments.length}</p>
              <p className="text-sm text-slate-400 font-medium">Citas Gestionadas</p>
            </div>
            <div className="border-x border-slate-200 px-8">
              <p className="text-3xl font-bold text-[#1e3050]">100%</p>
              <p className="text-sm text-slate-400 font-medium">Cloud Sync</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-[#1e3050]">2</p>
              <p className="text-sm text-slate-400 font-medium">Sedes Activas</p>
            </div>
          </div>
        </div>

        <div className="relative animate-stagger-2">
           <div className="relative glass p-4 rounded-[40px] shadow-2xl overflow-hidden border-white/50">
              <img 
                src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=1000" 
                className="rounded-[32px] w-full h-[500px] object-cover"
                alt="Medical Interface"
              />
              <div className="absolute bottom-8 left-8 right-8 glass p-6 rounded-3xl shadow-xl flex items-center gap-4 animate-bounce-slow">
                 <div className="bg-[#017E84] p-3 rounded-2xl text-white">
                    <Calendar size={24} />
                 </div>
                 <div>
                    <p className="text-xs font-bold text-slate-400 uppercase">Próxima Cita</p>
                    <p className="text-lg font-bold text-[#1e3050]">Dr. Carlos Mendoza - 10:30 AM</p>
                 </div>
              </div>
           </div>
           
           {/* Floating Cards */}
           <div className="absolute -top-10 -right-10 glass p-6 rounded-3xl shadow-xl space-y-3 animate-stagger-3 hidden xl:block">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full bg-[#714B67] flex items-center justify-center text-white font-bold">M</div>
                 <div>
                    <p className="text-sm font-bold text-[#1e3050]">María Silva</p>
                    <p className="text-[10px] text-slate-400">Ginecología • Sincronizada</p>
                 </div>
              </div>
           </div>
        </div>
      </main>

      <section className="max-w-7xl mx-auto px-8 py-32 grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { icon: Users, title: "Multi-Usuario", text: "Comparte agendas entre todo tu equipo médico en tiempo real.", color: "#017E84" },
          { icon: Shield, title: "Seguridad Cloud", text: "Tus datos protegidos con cifrado de grado médico en Supabase.", color: "#714B67" },
          { icon: Activity, title: "Integración ERP", text: "Generación automática de pedidos de venta directos a Odoo.", color: "#1e3050" }
        ].map((feat, i) => (
          <div key={i} className="glass p-8 rounded-[32px] hover-card transition-all cursor-default border-white/40">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 text-white`} style={{ backgroundColor: feat.color }}>
              <feat.icon size={28} />
            </div>
            <h3 className="text-xl font-bold text-[#1e3050] mb-3">{feat.title}</h3>
            <p className="text-slate-500 leading-relaxed font-medium">{feat.text}</p>
          </div>
        ))}
      </section>
    </div>
  );
};

export default Landing;
