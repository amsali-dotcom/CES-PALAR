
import React from 'react';
import { 
  User, 
  Shield, 
  Presentation, 
  Users, 
  GraduationCap, 
  ChevronRight 
} from 'lucide-react';
import { Role } from '../../types';

interface RoleSelectionProps {
  onSelect: (role: Role) => void;
}

const RoleSelection: React.FC<RoleSelectionProps> = ({ onSelect }) => {
  const roles: { id: Role; label: string; icon: React.ReactNode; color: string }[] = [
    { id: 'DIRECTOR', label: 'Direction', icon: <User className="w-6 h-6" />, color: 'bg-blue-600 shadow-blue-100' },
    { id: 'CPE', label: 'Vigilance (CPE)', icon: <Shield className="w-6 h-6" />, color: 'bg-indigo-600 shadow-indigo-100' },
    { id: 'TEACHER', label: 'Enseignant', icon: <Presentation className="w-6 h-6" />, color: 'bg-emerald-600 shadow-emerald-100' },
    { id: 'PARENT', label: 'Parent d\'élève', icon: <Users className="w-6 h-6" />, color: 'bg-orange-600 shadow-orange-100' },
    { id: 'STUDENT', label: 'Espace Élève', icon: <GraduationCap className="w-6 h-6" />, color: 'bg-purple-600 shadow-purple-100' },
  ];

  return (
    <div className="relative p-6 flex flex-col items-center justify-start min-h-full bg-[#050505] text-white overflow-hidden">
      {/* Arrière-plan stylisé */}
      <div className="absolute -top-20 -left-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-[100px]"></div>
      <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-[100px]"></div>

      <div className="relative z-10 w-full flex flex-col items-center">
        <div className="mb-6 text-center mt-6">
          <div className="w-20 h-20 bg-emerald-600 rounded-[30%] flex items-center justify-center text-white shadow-[0_0_40px_rgba(16,185,129,0.2)] mb-4 mx-auto animate-float border border-emerald-500/20">
            <GraduationCap className="w-10 h-10" />
          </div>
          <h1 className="text-4xl font-light text-white tracking-tighter serif">NÉO</h1>
          <p className="text-emerald-400/50 text-[10px] font-black uppercase tracking-[0.4em]">Smart Education System</p>
        </div>

        {/* Illustration d'une école/savoir avec le nom sur le toit */}
        <div className="w-full max-w-[240px] mb-8 animate-fadeIn opacity-40 grayscale contrast-125">
          <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-sm">
            <rect x="40" y="60" width="120" height="80" rx="4" fill="#1A1A1A" />
            <path d="M100 20L30 65V70H170V65L100 20Z" fill="#10B981" />
            
            {/* Cercle jaune (Horloge/Emblème) */}
            <circle cx="100" cy="54" r="5" fill="#FACC15" />
            
            {/* Texte juste en bas du cercle jaune */}
            <text x="100" y="68" fill="white" fontSize="8" fontWeight="900" textAnchor="middle" style={{ pointerEvents: 'none', letterSpacing: '0.02em' }}>CES DE PALAR</text>
            
            <rect x="90" y="110" width="20" height="30" fill="#262626" />
            
            <rect x="60" y="80" width="20" height="20" rx="2" fill="#333" />
            <rect x="120" y="80" width="20" height="20" rx="2" fill="#333" />
            <path d="M40 140H160" stroke="#333" strokeWidth="4" strokeLinecap="round" />
          </svg>
        </div>
        
        <div className="w-full space-y-3">
          <h2 className="text-[10px] font-black text-emerald-400/40 mb-2 uppercase tracking-widest text-center px-4">Choisissez votre portail</h2>
          
          {roles.map((role) => (
            <button
              key={role.id}
              onClick={() => onSelect(role.id)}
              className="flex items-center w-full p-4 rounded-3xl shadow-sm border border-white/5 bg-white/5 backdrop-blur-md hover:bg-white/10 transition-all active:scale-95 text-left group"
            >
              <div className={`w-12 h-12 rounded-2xl ${role.color} flex items-center justify-center text-white mr-4 shadow-lg group-hover:rotate-6 transition-transform opacity-80`}>
                {role.icon}
              </div>
              <div className="flex-1">
                <span className="text-sm font-medium text-white uppercase tracking-tight block">{role.label}</span>
                <span className="text-[8px] text-emerald-400/40 font-bold uppercase tracking-wider">Accès sécurisé</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/20 group-hover:bg-emerald-500/20 group-hover:text-emerald-400 transition-all">
                <ChevronRight className="w-4 h-4" />
              </div>
            </button>
          ))}
        </div>
        
        <p className="mt-10 text-[9px] text-white/20 font-black uppercase tracking-[0.2em] text-center opacity-60">
          Système de Gestion de Scolarité • v2.6.1-DARK
        </p>

        <div className="mt-4 text-center">
          <button 
            onClick={() => {
              const url = new URL(window.location.href);
              url.searchParams.set('t', Date.now().toString());
              window.location.href = url.toString();
            }}
            className="text-[9px] text-white/10 hover:text-emerald-400/40 transition-colors uppercase tracking-widest font-bold"
          >
            ⚙️ Réparer la connexion
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoleSelection;
