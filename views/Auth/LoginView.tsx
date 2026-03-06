
import React, { useState } from 'react';
import { 
  ArrowLeft, 
  User, 
  Users, 
  GraduationCap, 
  Lock, 
  Eye, 
  EyeOff, 
  AlertCircle 
} from 'lucide-react';
import { User as UserType, Role } from '../../types';

interface LoginViewProps {
  role: Role;
  onSuccess: (user: UserType) => void;
  onRegister: () => void;
  onBack: () => void;
}

const RoleIcon = ({ role }: { role: Role }) => {
  switch (role) {
    case 'DIRECTOR': return <User className="w-8 h-8" />;
    case 'PARENT': return <Users className="w-8 h-8" />;
    case 'STUDENT': return <GraduationCap className="w-8 h-8" />;
    default: return <Lock className="w-8 h-8" />;
  }
};

const LoginView: React.FC<LoginViewProps> = ({ role, onSuccess, onRegister, onBack }) => {
  const [uniqueId, setUniqueId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    setError('');
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uniqueId, password, role })
      });

      if (response.ok) {
        const foundUser = await response.json();
        onSuccess(foundUser);
      } else {
        const data = await response.json();
        setError(data.error || "Identifiant ou mot de passe incorrect.");
      }
    } catch {
      setError("Erreur de connexion au serveur.");
    }
  };

  return (
    <div className="p-6 flex flex-col h-full bg-[#050505] text-white relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute -top-20 -left-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-[100px]" />
      <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-[100px]" />

      <div className="absolute top-4 right-4 bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border border-emerald-500/30 backdrop-blur-md">
        v2.6.1-DARK
      </div>
      
      <button onClick={onBack} className="mb-8 flex items-center text-emerald-400 font-medium self-start z-10 hover:opacity-80 transition-opacity">
        <ArrowLeft className="w-4 h-4 mr-2" /> Retour
      </button>
      
      <div className="text-center mb-10 z-10">
        <div className="w-20 h-20 bg-emerald-500/10 rounded-[32px] flex items-center justify-center text-emerald-400 mx-auto mb-4 border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
          <RoleIcon role={role} />
        </div>
        <h2 className="text-3xl font-light text-white tracking-tight serif">Espace {role}</h2>
        <p className="text-emerald-400/50 text-[10px] font-black uppercase tracking-[0.3em] mt-2">Identification Sécurisée</p>
      </div>

      <div className="space-y-6 z-10">
        <div>
          <label className="block text-[10px] font-black text-emerald-400/40 mb-2 uppercase tracking-widest">Identifiant Unique NÉO</label>
          <input 
            type="text" 
            placeholder="Ex: PAR-100, DIR-001..." 
            className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all font-medium text-white placeholder:text-white/20"
            value={uniqueId}
            onChange={e => setUniqueId(e.target.value)}
          />
        </div>
        
        <div>
          <label className="block text-[10px] font-black text-emerald-400/40 mb-2 uppercase tracking-widest">Mot de passe secret</label>
          <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="Votre mot de passe" 
                className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all font-medium text-white placeholder:text-white/20"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 text-red-400 rounded-2xl text-[10px] font-black uppercase flex items-center border border-red-500/20 animate-shake">
            <AlertCircle className="w-5 h-5 mr-3" />
            <span>{error}</span>
          </div>
        )}

        <button 
          onClick={handleLogin}
          disabled={!uniqueId || !password}
          className={`w-full p-4 bg-emerald-600 text-white font-black uppercase text-xs tracking-[0.2em] rounded-2xl shadow-[0_10px_30px_rgba(16,185,129,0.2)] transition-all active:scale-95 mt-4 ${(!uniqueId || !password) ? 'opacity-30 grayscale' : 'hover:bg-emerald-500 hover:shadow-emerald-500/40'}`}
        >
          Se connecter
        </button>

        <div className="pt-8 border-t border-white/5 text-center">
            <p className="text-xs text-white/30 font-medium mb-4">
                Pas encore de compte {role} ?
            </p>
            <button 
                onClick={onRegister}
                className="text-emerald-400 font-black uppercase text-[10px] tracking-widest hover:text-white transition-colors bg-emerald-500/5 px-6 py-3 rounded-xl border border-emerald-500/10"
            >
                S'inscrire maintenant
            </button>
        </div>

        <div className="pt-4 text-center">
          <button 
            onClick={() => {
              const url = new URL(window.location.href);
              url.searchParams.set('t', Date.now().toString());
              window.location.href = url.toString();
            }}
            className="text-[9px] text-white/20 hover:text-emerald-400/60 transition-colors uppercase tracking-widest font-bold"
          >
            ⚙️ Réparer la connexion (Force Refresh)
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
