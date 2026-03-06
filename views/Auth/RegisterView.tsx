
import React, { useState } from 'react';
import { ArrowLeft, Trash2, Plus } from 'lucide-react';
import { Role, User } from '../../types';
import { VALID_IDS, CLASSES } from '../../mockData';

const SUBJECTS = ["Mathématiques", "Français", "Anglais", "Physique-Chimie", "SVT", "Histoire-Géo", "Philosophie", "EPS", "Informatique"];

interface RegisterViewProps {
  role: Role;
  onSuccess: (user: User) => void;
  onBack: () => void;
}

const RegisterView: React.FC<RegisterViewProps> = ({ role, onSuccess, onBack }) => {
  const [uniqueId, setUniqueId] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [selectedSubject, setSelectedSubject] = useState(SUBJECTS[0]);
  const [childMatricules, setChildMatricules] = useState<string[]>(['']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleClassToggle = (classId: string) => {
    setSelectedClasses(prev => prev.includes(classId) ? prev.filter(id => id !== classId) : [...prev, classId]);
  };

  const handleVerify = async () => {
    if (!password || password.length < 4) {
      setError("Le mot de passe doit contenir au moins 4 caractères.");
      return;
    }

    setLoading(true);
    setError('');

    const normalizedId = uniqueId.trim().toUpperCase();
    const isValidId = VALID_IDS[role].some(id => id.toUpperCase() === normalizedId);
    
    if (!isValidId) {
      setError(`L'identifiant ${uniqueId} n'est pas autorisé pour le rôle ${role}.`);
      setLoading(false);
      return;
    }

    let finalChildrenIds: string[] = [];
    if (role === 'PARENT') {
      const matricules = childMatricules.filter(m => m.trim() !== '').map(m => m.trim().toUpperCase());
      if (matricules.length === 0) {
        setError("Veuillez saisir au moins un matricule d'enfant.");
        setLoading(false);
        return;
      }
      finalChildrenIds = matricules;
    }

    const newUser: Partial<User> = {
      email: `${normalizedId}@neo.edu`,
      name: name || `Utilisateur ${role}`,
      role,
      uniqueId: normalizedId,
      password,
      isValidated: true,
      classes: role === 'TEACHER' ? selectedClasses : undefined,
      subject: role === 'TEACHER' ? selectedSubject : undefined,
      childrenIds: role === 'PARENT' ? finalChildrenIds : undefined
    };

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      });

      if (response.ok) {
        const createdUser = await response.json();
        onSuccess(createdUser);
      } else {
        const data = await response.json();
        setError(data.error || "Erreur lors de l'inscription.");
      }
    } catch {
      setError("Erreur de connexion au serveur.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 flex flex-col h-full bg-white overflow-y-auto no-scrollbar">
      <button onClick={onBack} className="mb-6 flex items-center text-blue-600 font-bold self-start">
        <ArrowLeft className="w-4 h-4 mr-2" /> Retour
      </button>

      <div className="text-center mb-8">
        <h2 className="text-2xl font-black text-gray-800 tracking-tight">Inscription {role}</h2>
        <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mt-1 italic">Vérification de l'Identité NÉO</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest">Identifiant Unique</label>
          <input 
            type="text" 
            placeholder="Ex: PROF-001, PAR-100..." 
            className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold text-slate-900"
            value={uniqueId}
            onChange={e => setUniqueId(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest">Nom complet</label>
          <input 
            type="text" 
            placeholder="Nom et Prénom" 
            className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold text-slate-900"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>

        {role === 'TEACHER' && (
          <>
            <div>
              <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest">Matière Enseignée</label>
              <select 
                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold text-slate-900"
                value={selectedSubject}
                onChange={e => setSelectedSubject(e.target.value)}
              >
                {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest">Classes assignées</label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {CLASSES.map(c => (
                  <button 
                    key={c.id} 
                    onClick={() => handleClassToggle(c.id)}
                    className={`p-3 rounded-xl text-[10px] font-black uppercase border transition-all ${selectedClasses.includes(c.id) ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-slate-100 text-slate-400'}`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {role === 'PARENT' && (
           <div>
            <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest">Matricules des enfants</label>
            {childMatricules.map((m, idx) => (
              <div key={idx} className="flex space-x-2 mb-2">
                <input 
                  type="text" 
                  placeholder="Ex: MAT-1000" 
                  className="flex-1 p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold text-slate-900"
                  value={m}
                  onChange={e => {
                    const newM = [...childMatricules];
                    newM[idx] = e.target.value;
                    setChildMatricules(newM);
                  }}
                />
                {idx > 0 && (
                  <button 
                    onClick={() => setChildMatricules(childMatricules.filter((_, i) => i !== idx))} 
                    className="w-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            <button 
              onClick={() => setChildMatricules([...childMatricules, ''])} 
              className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center"
            >
              <Plus className="w-3 h-3 mr-1" /> Ajouter un enfant
            </button>
           </div>
        )}

        <div>
          <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest">Mot de passe</label>
          <input 
            type="password" 
            placeholder="Minimum 4 caractères" 
            className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold text-slate-900"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
        </div>

        {error && <p className="text-[10px] text-red-500 font-black uppercase bg-red-50 p-3 rounded-xl">{error}</p>}

        <button 
          onClick={handleVerify} 
          disabled={loading || !uniqueId || !password}
          className="w-full p-5 bg-blue-600 text-white font-black uppercase text-xs tracking-widest rounded-[24px] shadow-xl shadow-blue-100 active:scale-95 transition-all disabled:opacity-50"
        >
          {loading ? 'Création...' : 'Créer mon compte'}
        </button>
      </div>
    </div>
  );
};

export default RegisterView;
