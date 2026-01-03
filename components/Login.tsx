
import React, { useState } from 'react';
import { Key, ArrowRight, UserCircle2, BarChart3, Database, ShieldCheck, LayoutGrid } from 'lucide-react';

interface Props {
  onLogin: () => void;
}

const Login: React.FC<Props> = ({ onLogin }) => {
  const [accessKey, setAccessKey] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (accessKey.trim()) {
      onLogin();
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f4f8] flex flex-col items-center justify-center p-4 selection:bg-[#017E84]/20 overflow-hidden font-ubuntu">
      {/* Container Principal con sombra suave y esquinas redondeadas según la imagen */}
      <div className="w-full max-w-[1000px] bg-white rounded-[40px] shadow-[0_35px_60px_-15px_rgba(0,0,0,0.15)] flex flex-col md:flex-row overflow-hidden animate-stagger-1 border border-white/20">
        
        {/* Lado Izquierdo: Branding y Beneficios (Gradiente profundo) */}
        <div className="w-full md:w-[48%] bg-gradient-to-br from-[#015e63] via-[#1e3050] to-[#0f172a] p-12 text-white flex flex-col relative overflow-hidden">
          {/* Círculos de fondo decorativos sutiles para profundidad */}
          <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-[#017E84]/20 rounded-full blur-[80px]" />
          <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-[#714B67]/10 rounded-full blur-[80px]" />

          <div className="relative z-10 flex items-center gap-3 mb-16 animate-stagger-1">
            <div className="bg-white/10 backdrop-blur-md p-2.5 rounded-xl border border-white/10">
              <BarChart3 size={28} className="text-white" />
            </div>
          </div>

          <div className="relative z-10 mt-4 space-y-6 animate-stagger-2">
            <div>
              <h1 className="text-5xl font-bold leading-tight mb-4 tracking-tight">Citame</h1>
              <p className="text-white/60 text-lg leading-relaxed max-w-sm font-light">
                Inteligencia de gestión médica unificada para tu ecosistema profesional.
              </p>
            </div>

            <div className="space-y-4 pt-12">
              <div className="bg-white/5 backdrop-blur-md p-5 rounded-3xl border border-white/10 flex items-center gap-4 hover:bg-white/10 transition-all cursor-default">
                 <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
                    <LayoutGrid size={20} className="text-white/80" />
                 </div>
                 <div>
                    <p className="text-sm font-bold">Multi-Sede Unificada</p>
                    <p className="text-[11px] text-white/50">Control de datos centralizado y en red.</p>
                 </div>
              </div>

              <div className="bg-white/5 backdrop-blur-md p-5 rounded-3xl border border-white/10 flex items-center gap-4 hover:bg-white/10 transition-all cursor-default">
                 <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
                    <ShieldCheck size={20} className="text-white/80" />
                 </div>
                 <div>
                    <p className="text-sm font-bold">Seguridad de Datos</p>
                    <p className="text-[11px] text-white/50">Acceso cifrado y gestión por perfiles.</p>
                 </div>
              </div>
            </div>
          </div>
        </div>

        {/* Lado Derecho: Formulario de Acceso Limpio */}
        <div className="flex-1 bg-white p-12 md:p-20 flex flex-col justify-center animate-stagger-3">
          <div className="max-w-sm mx-auto w-full">
            <h2 className="text-4xl font-bold text-[#1e293b] mb-3 tracking-tight">Bienvenido</h2>
            <p className="text-slate-400 font-medium mb-12 text-sm">Accede a tu panel de control personalizado.</p>

            <form onSubmit={handleLogin} className="space-y-8">
              <div className="space-y-3">
                <label className="text-xs font-black uppercase text-slate-400 tracking-widest ml-1">Clave de Acceso</label>
                <div className="relative group">
                  <Key className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#017E84] transition-colors" size={20} />
                  <input 
                    type="password" 
                    placeholder="Ej: CL-8829-XP"
                    value={accessKey}
                    onChange={(e) => setAccessKey(e.target.value)}
                    className="w-full pl-14 pr-6 py-5 bg-white border border-slate-200 rounded-[20px] focus:border-[#017E84] focus:ring-4 focus:ring-[#017E8408] outline-none transition-all font-bold text-slate-700 placeholder:text-slate-200"
                  />
                </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-[#017E84] hover:bg-[#016a6f] text-white py-5 rounded-[18px] font-bold text-lg shadow-xl shadow-[#017E8422] transition-all flex items-center justify-center gap-3 hover:translate-y-[-2px] active:scale-[0.98] group"
              >
                Ingresar al Dashboard <ArrowRight className="group-hover:translate-x-1 transition-transform" />
              </button>
            </form>

            <div className="mt-16 pt-8 border-t border-slate-50 flex items-center justify-center gap-2">
               <UserCircle2 size={18} className="text-slate-300" />
               <button className="text-xs font-bold text-slate-400 hover:text-[#714B67] transition-colors">Soy Administrador</button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer corporativo sutil */}
      <footer className="mt-10 text-center space-y-1 opacity-40">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
          © 2025 Citame Analytics. Secure Connection via Enterprise Sync.
        </p>
        <p className="text-[10px] text-slate-400 font-medium">
          Desarrollado por <a href="https://gaorsystem.vercel.app/" target="_blank" rel="noopener noreferrer" className="font-bold text-[#017E84] hover:underline">GaorSystem Perú</a>
        </p>
      </footer>
    </div>
  );
};

export default Login;
