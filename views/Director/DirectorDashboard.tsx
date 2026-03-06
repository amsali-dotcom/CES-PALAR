
import React, { useState, useEffect } from 'react';
import { 
  School, 
  RefreshCw, 
  LogOut, 
  Brain, 
  Bot, 
  Search, 
  Presentation, 
  Users, 
  User as UserIcon, 
  Trash2, 
  Filter, 
  GraduationCap 
} from 'lucide-react';
import { User, Student, SchoolConfig, PushNotification } from '../../types';
import { STUDENTS, CLASSES, SCHEDULE } from '../../mockData';
import { getSmartInsights } from '../../geminiService';

interface Props {
  user: User;
  onLogout: () => void;
  onSendNotification: (notif: Omit<PushNotification, 'id' | 'timestamp'>) => void;
  allNotifications?: PushNotification[];
  students?: Student[];
}

const DirectorDashboard: React.FC<Props> = ({ onLogout, onSendNotification, allNotifications = [], students = STUDENTS }) => {
  const [activeTab, setActiveTab] = useState<'STATS' | 'STUDENTS' | 'USERS' | 'FINANCE' | 'DISCIPLINE' | 'CONFIG' | 'SCHEDULE'>('STATS');
  const [selectedClassId, setSelectedClassId] = useState<string>(CLASSES[0].id);
  const [insights, setInsights] = useState('Analyse stratégique en cours...');
  const [allRegisteredUsers, setAllRegisteredUsers] = useState<User[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [financeSearch, setFinanceSearch] = useState('');
  
  const [paymentModal, setPaymentModal] = useState<{show: boolean, student?: Student, amount: string}>({
      show: false,
      amount: ''
  });

  const [convocationModal, setConvocationModal] = useState<{show: boolean, student?: Student, motive: string}>({
      show: false,
      motive: ''
  });

  const [config, setConfig] = useState<SchoolConfig>({
    absenceAlertThreshold: 5,
    pensionsByLevel: { '2nde': 450000, '1ère': 500000, 'Term': 550000 },
    examPeriods: [{ name: 'Trimestre 3', startDate: '2024-06-15' }]
  });

  const fetchData = async () => {
    try {
      const [usersRes, configRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/config')
      ]);
      
      if (usersRes.ok) setAllRegisteredUsers(await usersRes.json());
      if (configRes.ok) setConfig(await configRes.json());
    } catch {
      console.error("Failed to fetch director data");
    }
  };

  useEffect(() => {
    const init = async () => {
      await fetchData();
    };
    init();
  }, []);

  const unpaidStudents = students.filter(s => s.pensionPaid < s.pensionTotal);
  const paidStudents = students.filter(s => s.pensionPaid >= s.pensionTotal);

  useEffect(() => {
    if (activeTab === 'STATS') {
      const fetchInsights = async () => {
        const result = await getSmartInsights({ 
          unpaidCount: unpaidStudents.length, 
          totalPaid: students.reduce((acc, s) => acc + s.pensionPaid, 0)
        }, 'DIRECTOR');
        setInsights(result);
      };
      fetchInsights();
    }
  }, [activeTab, students, unpaidStudents.length]);

  const handlePayment = async () => {
    if (!paymentModal.student || !paymentModal.amount) return;
    const amount = parseInt(paymentModal.amount);
    if (isNaN(amount) || amount <= 0) return;

    const updated = students.map(s => {
      if (s.id === paymentModal.student?.id) {
        return { ...s, pensionPaid: Math.min(s.pensionPaid + amount, s.pensionTotal) };
      }
      return s;
    });

    try {
      const response = await fetch('/api/students/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      
      if (response.ok) {
        const parent = allRegisteredUsers.find(u => u.role === 'PARENT' && u.childrenIds?.includes(paymentModal.student!.matricule));
        if (parent) {
            onSendNotification({
                recipientId: parent.uniqueId,
                title: "Reçu de paiement",
                body: `Versement de ${amount.toLocaleString()} FCFA reçu pour ${paymentModal.student.name}.`,
                type: 'FINANCE'
            });
        }
        setPaymentModal({ show: false, amount: '' });
        alert("Paiement enregistré.");
      }
    } catch {
      console.error("Failed to save payment");
    }
  };

  const handleRelance = (student: Student) => {
    const parent = allRegisteredUsers.find(u => u.role === 'PARENT' && u.childrenIds?.includes(student.matricule));
    if (parent) {
      onSendNotification({
        recipientId: parent.uniqueId,
        title: "RELANCE PAIEMENT",
        body: `M./Mme ${parent.name}, la scolarité de ${student.name} présente un reliquat de ${(student.pensionTotal - student.pensionPaid).toLocaleString()} FCFA. Merci de régulariser sous 48h.`,
        type: 'FINANCE'
      });
      alert("Notification de relance envoyée au parent.");
    } else {
      alert("Erreur : Aucun compte parent lié à cet élève.");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Voulez-vous vraiment supprimer ce compte utilisateur ?")) return;
    try {
      const response = await fetch(`/api/users/${userId}`, { method: 'DELETE' });
      if (response.ok) {
        setAllRegisteredUsers(prev => prev.filter(u => u.id !== userId));
      }
    } catch {
      console.error("Failed to delete user");
    }
  };

  const handleSendConvocation = () => {
    if (!convocationModal.student || !convocationModal.motive) return;
    const parent = allRegisteredUsers.find(u => u.role === 'PARENT' && u.childrenIds?.includes(convocationModal.student!.matricule));
    
    if (!parent) {
      alert("Erreur : Aucun compte parent trouvé pour cet élève.");
      return;
    }

    onSendNotification({
      recipientId: parent.uniqueId,
      title: "CONVOCATION OFFICIELLE",
      body: `M./Mme ${parent.name}, vous êtes convoqué(e) à la direction pour votre enfant ${convocationModal.student.name}. Motif : ${convocationModal.motive}`,
      type: 'CONVOCATION',
      meta: {
        studentId: convocationModal.student.matricule,
        studentName: convocationModal.student.name
      }
    });

    setConvocationModal({ show: false, motive: '' });
    alert("Convocation officielle envoyée.");
  };

  const handleSaveConfig = async () => {
    try {
      const response = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      if (response.ok) alert("Paramètres sauvegardés.");
    } catch {
      console.error("Failed to save config");
    }
  };

  const sentConvocations = allNotifications.filter(n => n.type === 'CONVOCATION');
  
  const handleResetDB = async () => {
    if (!confirm("Voulez-vous vraiment réinitialiser la base de données ? Tous les utilisateurs et notifications seront supprimés.")) return;
    try {
      const response = await fetch('/api/reset', { method: 'POST' });
      if (response.ok) {
        alert("Base de données réinitialisée. Vous allez être déconnecté.");
        onLogout();
      }
    } catch {
      alert("Erreur lors de la réinitialisation.");
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="bg-blue-900 p-6 text-white rounded-b-[40px] shadow-xl z-10 sticky top-0">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <School className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-black tracking-tight">Direction NÉO</h1>
          </div>
          <div className="flex items-center space-x-2">
            <button onClick={fetchData} className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center active:scale-95 transition-all">
              <RefreshCw className="w-5 h-5" />
            </button>
            <button onClick={onLogout} className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center active:scale-95 transition-all">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto no-scrollbar -mx-2 px-2">
          <div className="flex space-x-1 bg-black/20 p-1 rounded-xl min-w-max">
            {(['STATS', 'STUDENTS', 'USERS', 'FINANCE', 'DISCIPLINE', 'SCHEDULE', 'CONFIG'] as const).map(t => (
              <button 
                key={t} 
                onClick={() => setActiveTab(t)} 
                className={`py-2 px-4 text-[9px] font-black rounded-lg transition-all whitespace-nowrap ${activeTab === t ? 'bg-white text-blue-900 shadow-sm' : 'text-blue-100 hover:bg-white/5'}`}
              >
                {t === 'STATS' ? 'TABLEAU' : t === 'STUDENTS' ? 'ÉLÈVES' : t === 'USERS' ? 'COMPTES' : t === 'FINANCE' ? 'FINANCE' : t === 'DISCIPLINE' ? 'DISCIPLINE' : t === 'SCHEDULE' ? 'EMPLOI' : 'RÉGLAGES'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-4 flex-1 overflow-y-auto no-scrollbar space-y-4">
        {activeTab === 'STATS' && (
          <div className="animate-fadeIn space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Insolvables</p>
                <p className="text-3xl font-black text-red-600">{unpaidStudents.length}</p>
              </div>
              <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">À Jour</p>
                <p className="text-3xl font-black text-green-600">{paidStudents.length}</p>
              </div>
            </div>
            <div className="bg-blue-50 p-6 rounded-[32px] border border-blue-100 relative overflow-hidden">
              <Brain className="absolute -right-4 -bottom-4 w-32 h-32 text-blue-900/5 rotate-12" />
              <h3 className="text-sm font-black text-blue-900 mb-3 flex items-center">
                <Bot className="w-5 h-5 mr-2 text-blue-500" /> Vision IA Direction
              </h3>
              <p className="text-xs text-blue-800 leading-relaxed font-medium italic">{insights}</p>
            </div>
          </div>
        )}

        {activeTab === 'USERS' && (
            <div className="animate-fadeIn space-y-4">
               <div className="bg-white p-2 rounded-2xl shadow-sm flex items-center px-4 border border-slate-100">
                 <Search className="w-5 h-5 text-slate-300 mr-3" />
                 <input 
                  type="text" 
                  placeholder="Rechercher un utilisateur..." 
                  className="w-full py-2 bg-transparent text-xs font-bold outline-none text-slate-900" 
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                 />
               </div>
               <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden divide-y divide-slate-50">
                  {allRegisteredUsers.filter(u => u.name.toLowerCase().includes(userSearch.toLowerCase())).map(u => (
                    <div key={u.id} className="p-4 flex items-center justify-between">
                       <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm ${u.role === 'TEACHER' ? 'bg-emerald-500' : u.role === 'PARENT' ? 'bg-orange-500' : 'bg-blue-500'}`}>
                            {u.role === 'TEACHER' ? <Presentation className="w-5 h-5" /> : u.role === 'PARENT' ? <Users className="w-5 h-5" /> : <UserIcon className="w-5 h-5" />}
                          </div>
                          <div>
                            <p className="text-xs font-black text-slate-800">{u.name}</p>
                            <p className="text-[9px] text-slate-400 font-bold uppercase">{u.role} • {u.uniqueId}</p>
                          </div>
                       </div>
                       <button onClick={() => handleDeleteUser(u.id)} className="w-9 h-9 text-red-300 hover:text-red-500 transition-colors flex items-center justify-center">
                         <Trash2 className="w-5 h-5" />
                       </button>
                    </div>
                  ))}
               </div>
            </div>
        )}

        {activeTab === 'FINANCE' && (
          <div className="animate-fadeIn space-y-6">
            <div className="bg-white p-2 rounded-2xl shadow-sm flex items-center px-4 border border-slate-100">
              <Filter className="w-5 h-5 text-slate-300 mr-3" />
              <input 
                type="text" 
                placeholder="Rechercher un élève insolvable..." 
                className="w-full py-2 bg-transparent text-xs font-bold outline-none text-slate-900" 
                value={financeSearch}
                onChange={e => setFinanceSearch(e.target.value)}
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Élèves Insolvables</h3>
              {unpaidStudents.filter(s => s.name.toLowerCase().includes(financeSearch.toLowerCase())).map(s => (
                <div key={s.id} className="bg-white p-5 rounded-[32px] shadow-sm border border-slate-100 animate-fadeIn">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-sm font-black text-slate-800">{s.name}</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{s.matricule}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-red-600">{(s.pensionTotal - s.pensionPaid).toLocaleString()} F</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button onClick={() => setPaymentModal({ show: true, student: s, amount: '' })} className="flex-1 py-3 bg-blue-600 text-white text-[10px] font-black uppercase rounded-2xl shadow-lg">Encaisser</button>
                    <button onClick={() => handleRelance(s)} className="flex-1 py-3 bg-red-50 text-red-600 text-[10px] font-black uppercase rounded-2xl border border-red-100">Relance</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'DISCIPLINE' && (
          <div className="animate-fadeIn space-y-6">
            <div className="bg-slate-900 p-6 rounded-[40px] text-white">
                <h3 className="text-sm font-black mb-1">Suivi des Convocations</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Contrôle des Accusés de Réception</p>
                
                <div className="mt-6 space-y-3">
                    {sentConvocations.length === 0 ? (
                        <p className="text-xs italic text-slate-500 text-center py-4">Aucune convocation envoyée récemment.</p>
                    ) : (
                        sentConvocations.map(notif => (
                            <div key={notif.id} className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/5">
                                <div className="flex-1 min-w-0 pr-4">
                                    <p className="text-[11px] font-black truncate">{notif.meta?.studentName || 'Élève inconnu'}</p>
                                    <p className="text-[8px] text-slate-500 uppercase font-black">{new Date(notif.timestamp).toLocaleDateString()}</p>
                                </div>
                                <div>
                                    {notif.acknowledged ? (
                                        <span className="text-[8px] px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full font-black uppercase border border-emerald-500/20">
                                            Reçu
                                        </span>
                                    ) : (
                                        <span className="text-[8px] px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full font-black uppercase border border-orange-500/20">
                                            En attente
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Convoquer un Parent</h3>
            <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden divide-y divide-slate-50">
              {students.slice(0, 15).map(s => (
                <div key={s.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-800">{s.name}</p>
                      <p className="text-[8px] text-slate-400 font-bold uppercase">{s.matricule}</p>
                    </div>
                  </div>
                  <button onClick={() => setConvocationModal({ show: true, student: s, motive: '' })} className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-[9px] font-black uppercase active:scale-95 transition-all">Convoquer</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ONGLET CONFIG & STUDENTS identiques ... */}
        {activeTab === 'STUDENTS' && (
          <div className="animate-fadeIn space-y-4">
            <div className="flex space-x-2 overflow-x-auto no-scrollbar pb-2">
              {CLASSES.map(c => (
                <button 
                  key={c.id} 
                  onClick={() => setSelectedClassId(c.id)} 
                  className={`whitespace-nowrap px-6 py-2 rounded-2xl text-[10px] font-black transition-all ${selectedClassId === c.id ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-blue-600 border border-blue-100'}`}
                >
                  {c.name}
                </button>
              ))}
            </div>
            <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden divide-y divide-slate-50">
                {students.filter(s => s.classId === selectedClassId).map(s => (
                  <div key={s.id} className="p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 text-xs font-black">{s.name.charAt(0)}</div>
                      <div>
                        <p className="text-xs font-black text-slate-800">{s.name}</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase">{s.matricule}</p>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {activeTab === 'SCHEDULE' && (
          <div className="animate-fadeIn space-y-4">
            <div className="flex space-x-2 overflow-x-auto no-scrollbar pb-2">
              {CLASSES.map(c => (
                <button 
                  key={c.id} 
                  onClick={() => setSelectedClassId(c.id)} 
                  className={`whitespace-nowrap px-6 py-2 rounded-2xl text-[10px] font-black transition-all ${selectedClassId === c.id ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-blue-600 border border-blue-100'}`}
                >
                  {c.name}
                </button>
              ))}
            </div>
            <div className="space-y-3">
              {['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'].map(day => {
                const dayItems = SCHEDULE.filter(i => i.day === day && i.classId === selectedClassId);
                if (dayItems.length === 0) return null;
                return (
                  <div key={day} className="space-y-2">
                    <h4 className="text-[10px] font-black text-blue-600 uppercase ml-2">{day}</h4>
                    {dayItems.map(item => (
                      <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm border border-blue-100 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 text-[10px] font-black">
                            {item.startTime.split(':')[0]}h
                          </div>
                          <div>
                            <p className="text-xs font-black text-slate-800">{item.subject}</p>
                            <p className="text-[8px] text-slate-400 font-bold uppercase">{item.teacherName} • {item.room}</p>
                          </div>
                        </div>
                        <div className="text-[8px] font-black text-slate-300 uppercase">
                          {item.startTime} - {item.endTime}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'CONFIG' && (
          <div className="animate-fadeIn space-y-6">
            <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 space-y-6">
              <section>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2 mb-4">Seuils & Alertes</h4>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-700">Alerte Absences (jours)</span>
                  <input 
                    type="number" 
                    className="w-16 p-2 bg-slate-50 rounded-lg text-center font-black" 
                    value={config.absenceAlertThreshold} 
                    onChange={e => setConfig({...config, absenceAlertThreshold: parseInt(e.target.value)})} 
                  />
                </div>
              </section>
              <button 
                onClick={handleSaveConfig} 
                className="w-full py-4 bg-blue-600 text-white font-black text-xs uppercase rounded-2xl shadow-xl active:scale-95 transition-all"
              >
                Sauvegarder
              </button>
              <button 
                onClick={handleResetDB}
                className="w-full mt-8 p-4 bg-red-50 text-red-600 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-red-100 active:scale-95 transition-all flex items-center justify-center"
              >
                <Trash2 className="w-4 h-4 mr-2" /> Réinitialiser la Simulation
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL PAIEMENT & CONVOCATION identiques ... */}
      {paymentModal.show && (
        <div className="fixed inset-0 bg-blue-900/80 z-50 flex items-center justify-center p-6 backdrop-blur-md animate-fadeIn">
          <div className="bg-white w-full max-w-sm rounded-[40px] p-8 shadow-2xl space-y-6 text-slate-900">
            <h3 className="text-xl font-black text-center">Encaissement Caisse</h3>
            <input type="number" placeholder="Montant" className="w-full p-5 bg-slate-50 rounded-2xl outline-none text-2xl font-black text-center" value={paymentModal.amount} onChange={e => setPaymentModal({...paymentModal, amount: e.target.value})} />
            <div className="flex space-x-3">
              <button onClick={() => setPaymentModal({show: false, amount: ''})} className="flex-1 py-4 bg-slate-100 text-slate-600 font-black rounded-2xl text-[10px] uppercase">Annuler</button>
              <button onClick={handlePayment} className="flex-[2] py-4 bg-blue-600 text-white font-black rounded-2xl text-[10px] uppercase">Valider</button>
            </div>
          </div>
        </div>
      )}

      {convocationModal.show && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-6 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-sm rounded-[32px] p-6 shadow-2xl space-y-6 text-slate-900">
            <h3 className="text-lg font-black">Nouvelle Convocation</h3>
            <textarea placeholder="Motif de la convocation..." className="w-full h-32 p-4 bg-slate-50 rounded-2xl border border-transparent outline-none text-xs font-bold resize-none" value={convocationModal.motive} onChange={e => setConvocationModal({...convocationModal, motive: e.target.value})} />
            <div className="flex space-x-3">
              <button onClick={() => setConvocationModal({show: false, motive: ''})} className="flex-1 py-4 bg-slate-100 text-slate-600 font-black rounded-2xl text-[10px] uppercase">Annuler</button>
              <button onClick={handleSendConvocation} disabled={!convocationModal.motive} className="flex-[2] py-4 bg-blue-600 text-white font-black rounded-2xl text-[10px] uppercase disabled:opacity-50">Envoyer au parent</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DirectorDashboard;
