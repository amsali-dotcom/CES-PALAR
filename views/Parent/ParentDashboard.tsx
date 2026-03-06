
import React, { useState } from 'react';
import { 
  Users, 
  LogOut, 
  ChevronRight, 
  Bell, 
  ChevronLeft, 
  Power, 
  Star, 
  Clock, 
  Wallet, 
  BellOff, 
  CheckCircle, 
  Heart, 
  Eye, 
  CalendarCheck, 
  CreditCard, 
  Receipt 
} from 'lucide-react';
import { User, Student, PushNotification } from '../../types';
import { STUDENTS, CLASSES } from '../../mockData';

interface Props {
  user: User;
  onLogout: () => void;
  notifications?: PushNotification[];
  onUpdateNotification?: (id: string, updates: Partial<PushNotification>) => void;
  students?: Student[];
}

const ParentDashboard: React.FC<Props> = ({ user, onLogout, notifications = [], onUpdateNotification, students = STUDENTS }) => {
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'GRADES' | 'ABSENCES' | 'FINANCE' | 'NOTIFS'>('GRADES');
  
  const myChildren = students.filter(s => user.childrenIds?.includes(s.matricule));
  
  if (myChildren.length === 0) {
    return (
      <div className="flex flex-col h-full bg-slate-50 p-8 items-center justify-center text-center space-y-4">
        <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center text-orange-500">
          <Users className="w-10 h-10" />
        </div>
        <h2 className="text-xl font-black text-slate-800">Aucun enfant lié</h2>
        <p className="text-sm text-slate-500 max-w-xs">
          Nous n'avons trouvé aucun élève correspondant aux matricules enregistrés pour votre compte (<span className="font-bold">{user.childrenIds?.join(', ') || 'aucun'}</span>).
        </p>
        <button onClick={onLogout} className="px-6 py-3 bg-orange-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg">
          Déconnexion
        </button>
      </div>
    );
  }

  const selectedChild = myChildren.find(c => c.id === selectedChildId);

  // Filtrage des notifications par enfant sélectionné
  const childGrades = notifications.filter(n => n.type === 'GRADE' && n.recipientId === selectedChild?.matricule);
  const childFinance = notifications.filter(n => n.type === 'FINANCE' && n.recipientId === selectedChild?.matricule);
  const childAbsences = notifications.filter(n => n.type === 'ABSENCE' && n.recipientId === selectedChild?.matricule);

  const paymentPercentage = selectedChild 
    ? Math.round((selectedChild.pensionPaid / selectedChild.pensionTotal) * 100)
    : 0;

  const handleAcknowledge = (notifId: string) => {
    if (onUpdateNotification) {
      onUpdateNotification(notifId, { acknowledged: true });
    }
  };

  const handleOpenFile = async (notif: PushNotification) => {
    if (!notif.meta?.fileData) return;
    try {
      const response = await fetch(notif.meta.fileData);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch {
      alert("Impossible de visualiser. Essayez le téléchargement.");
    }
  };

  if (!selectedChildId && activeSubTab !== 'NOTIFS') {
    return (
      <div className="flex flex-col h-full bg-slate-50 p-6 overflow-y-auto no-scrollbar">
        <div className="flex justify-between items-center mb-10">
           <div>
             <h1 className="text-3xl font-black text-slate-800 tracking-tighter">Mes Enfants</h1>
             <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Espace Famille NÉO</p>
           </div>
           <button onClick={onLogout} className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-slate-400 border border-slate-100 active:scale-95 transition-all">
             <LogOut className="w-6 h-6" />
           </button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {myChildren.map(child => (
            <button
              key={child.id}
              onClick={() => setSelectedChildId(child.id)}
              className="bg-white p-6 rounded-[32px] border border-slate-100 flex items-center group active:scale-95 transition-all hover:shadow-xl hover:shadow-orange-100/50"
            >
              <div className="w-16 h-16 rounded-[22px] bg-gradient-to-br from-orange-500 to-orange-600 text-white flex items-center justify-center text-2xl font-black shadow-lg shadow-orange-200 mr-5 group-hover:rotate-6 transition-transform">
                {child.name.charAt(0)}
              </div>
              <div className="text-left flex-1">
                <p className="text-lg font-black text-slate-800 tracking-tight">{child.name}</p>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{child.matricule} • {CLASSES.find(c => c.id === child.classId)?.name}</p>
                <div className="mt-2 flex items-center">
                    <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden max-w-[80px]">
                        <div 
                            className="h-full bg-orange-500 rounded-full" 
                            style={{ width: `${Math.round((child.pensionPaid / child.pensionTotal) * 100)}%` }}
                        ></div>
                    </div>
                    <span className="ml-2 text-[8px] font-black text-slate-400 uppercase">Scolarité {Math.round((child.pensionPaid / child.pensionTotal) * 100)}%</span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-200 group-hover:text-orange-400 transition-colors" />
            </button>
          ))}
        </div>

        <div className="mt-12">
           <button 
             onClick={() => setActiveSubTab('NOTIFS')}
             className="w-full p-5 bg-slate-900 text-white rounded-[28px] font-black flex items-center justify-center space-x-4 relative shadow-2xl active:scale-95 transition-all"
           >
              <Bell className="w-5 h-5 text-orange-400" />
              <span className="uppercase text-xs tracking-[0.2em]">Flux d'activités</span>
              {notifications.length > 0 && (
                <span className="absolute -top-3 -right-2 w-8 h-8 bg-orange-600 text-white text-[10px] flex items-center justify-center rounded-full border-4 border-slate-50 font-black shadow-lg">
                  {notifications.length}
                </span>
              )}
           </button>
        </div>
        
        <p className="mt-auto pt-8 text-center text-[9px] font-black text-slate-300 uppercase tracking-widest">CES DE PALAR • Mobile Parent</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="bg-orange-600 p-6 text-white sticky top-0 z-20 shadow-xl rounded-b-[40px]">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-4">
            <button 
                onClick={() => {
                  if (activeSubTab === 'NOTIFS') setActiveSubTab('GRADES');
                  else setSelectedChildId(null);
                }}
                className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md active:scale-90 transition-all"
            >
                <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-black tracking-tight truncate max-w-[180px]">
                {activeSubTab === 'NOTIFS' ? 'Flux d\'Alertes' : selectedChild?.name}
              </h1>
              <p className="text-orange-100 text-[9px] uppercase font-black tracking-widest opacity-80">
                {activeSubTab === 'NOTIFS' ? 'Toute la famille' : `${selectedChild?.matricule} • ${CLASSES.find(c => c.id === selectedChild?.classId)?.name}`}
              </p>
            </div>
          </div>
          <button onClick={onLogout} className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center active:scale-95 transition-all">
            <Power className="w-5 h-5" />
          </button>
        </div>

        <div className="flex bg-orange-700/30 p-1 rounded-2xl">
          {[
            { id: 'GRADES', label: 'Notes', icon: Star },
            { id: 'ABSENCES', label: 'Suivi', icon: Clock },
            { id: 'FINANCE', label: 'Scolarité', icon: Wallet },
            { id: 'NOTIFS', label: 'Flux', icon: Bell }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as 'GRADES' | 'ABSENCES' | 'FINANCE' | 'NOTIFS')}
              className={`flex-1 py-3 rounded-xl text-[9px] font-black flex flex-col items-center space-y-1 transition-all ${activeSubTab === tab.id ? 'bg-white text-orange-600 shadow-sm' : 'text-orange-100/60'}`}
            >
              <tab.icon className="w-5 h-5" />
              <span className="uppercase tracking-tighter">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 no-scrollbar pb-24">
        {activeSubTab === 'NOTIFS' && (
            <div className="space-y-4 animate-fadeIn">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2 mb-4">Flux d'activités récent</h3>
                {notifications.length === 0 ? (
                    <div className="bg-white p-12 rounded-[32px] text-center text-slate-300 italic text-sm border border-slate-100 flex flex-col items-center">
                        <BellOff className="w-10 h-10 mb-4 opacity-10" />
                        <span className="font-bold uppercase text-[10px] tracking-widest">Aucune notification pour le moment.</span>
                    </div>
                ) : (
                    notifications.map(notif => (
                        <div key={notif.id} className={`bg-white p-5 rounded-[28px] shadow-sm border-l-4 ${notif.type === 'GRADE' ? 'border-emerald-500' : notif.type === 'COURSE' ? 'border-purple-500' : notif.type === 'ABSENCE' ? 'border-red-500' : notif.type === 'CONVOCATION' ? 'border-slate-800' : 'border-orange-500'}`}>
                            <div className="flex justify-between items-start mb-2">
                                <span className={`text-[8px] px-2 py-0.5 rounded-full text-white font-black uppercase tracking-widest ${notif.type === 'GRADE' ? 'bg-emerald-500' : notif.type === 'COURSE' ? 'bg-purple-500' : notif.type === 'ABSENCE' ? 'bg-red-500' : notif.type === 'CONVOCATION' ? 'bg-slate-800' : 'bg-orange-500'}`}>
                                  {notif.type === 'CONVOCATION' ? 'Urgent : Convocation' : notif.type}
                                </span>
                                <span className="text-[8px] text-slate-300 font-bold uppercase">{new Date(notif.timestamp).toLocaleDateString()}</span>
                            </div>
                            <h4 className="text-xs font-black text-slate-800 mb-1 leading-tight">{notif.title}</h4>
                            <p className="text-[11px] leading-relaxed text-slate-500 font-bold mb-3">{notif.body}</p>
                            
                            {notif.type === 'CONVOCATION' && (
                              <div className="mt-4">
                                {notif.acknowledged ? (
                                  <div className="flex items-center space-x-2 text-emerald-500 bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                                    <CheckCircle className="w-4 h-4" />
                                    <span className="text-[9px] font-black uppercase tracking-widest">Réception accusée le {new Date(notif.timestamp).toLocaleDateString()}</span>
                                  </div>
                                ) : (
                                  <button 
                                    onClick={() => handleAcknowledge(notif.id)}
                                    className="w-full py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-lg flex items-center justify-center space-x-2"
                                  >
                                    <Heart className="w-4 h-4" />
                                    <span>Accuser Réception</span>
                                  </button>
                                )}
                              </div>
                            )}

                            {notif.meta?.fileName && (
                                <div className="flex space-x-2 mt-3">
                                    <button 
                                        onClick={() => handleOpenFile(notif)}
                                        className="flex-1 p-3 bg-purple-50 text-purple-700 rounded-xl text-[9px] font-black uppercase flex items-center justify-center space-x-2 border border-purple-100 active:scale-95 transition-all"
                                    >
                                        <Eye className="w-4 h-4" />
                                        <span>Consulter</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        )}

        {activeSubTab === 'GRADES' && (
          <div className="space-y-4 animate-fadeIn">
             <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">Évaluations et Notes</h3>
             {childGrades.length > 0 ? childGrades.map(g => (
               <div key={g.id} className="bg-white p-5 rounded-[32px] shadow-sm flex items-center justify-between border border-slate-100 group">
                 <div className="flex items-center">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black mr-4 text-sm shadow-inner ${g.meta?.grade && g.meta.grade >= 10 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                      {g.meta?.grade}/20
                    </div>
                    <div>
                       <p className="text-sm font-black text-slate-800 leading-none mb-1">{g.meta?.subject}</p>
                       <p className="text-[9px] text-slate-400 font-black uppercase tracking-tighter">Séquence {g.meta?.sequence} • {new Date(g.timestamp).toLocaleDateString()}</p>
                    </div>
                 </div>
                 <ChevronRight className="w-5 h-5 text-slate-100 group-hover:text-orange-300 transition-all" />
               </div>
             )) : (
                <div className="bg-white p-10 rounded-[32px] text-center border-2 border-dashed border-slate-100">
                    <p className="text-xs font-black text-slate-300 uppercase italic">Aucune note enregistrée</p>
                </div>
             )}
          </div>
        )}

        {activeSubTab === 'ABSENCES' && (
            <div className="space-y-6 animate-fadeIn">
                <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 relative overflow-hidden">
                    <div className="relative z-10 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Présence Globale</p>
                            <h4 className="text-3xl font-black text-slate-800">96.5%</h4>
                            <p className="text-[9px] text-emerald-500 font-bold uppercase mt-1">Excellent assiduité</p>
                        </div>
                        <div className="w-16 h-16 rounded-full border-[6px] border-emerald-500 flex items-center justify-center">
                            <span className="text-xs font-black text-emerald-600">P+</span>
                        </div>
                    </div>
                    <CalendarCheck className="absolute -right-6 -bottom-6 w-32 h-32 text-slate-50 opacity-10" />
                </div>

                <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">Historique de Présence</h3>
                    {childAbsences.length > 0 ? childAbsences.map(abs => (
                        <div key={abs.id} className="bg-white p-5 rounded-[28px] shadow-sm border border-slate-100 flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <div className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center">
                                    <Clock className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-black text-slate-800">{abs.title}</p>
                                    <p className="text-[9px] text-slate-400 font-bold uppercase">{new Date(abs.timestamp).toLocaleString()}</p>
                                </div>
                            </div>
                            <span className="text-[8px] font-black uppercase text-red-500 bg-red-50 px-2 py-1 rounded-full">Non Justifié</span>
                        </div>
                    )) : (
                        <div className="bg-white p-10 rounded-[32px] text-center border-2 border-dashed border-slate-100">
                            <CheckCircle className="w-8 h-8 text-emerald-500 mb-3 mx-auto" />
                            <p className="text-xs font-black text-slate-500 uppercase">Aucune absence signalée</p>
                        </div>
                    )}
                </div>
            </div>
        )}

        {activeSubTab === 'FINANCE' && (
            <div className="space-y-6 animate-fadeIn">
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-[40px] text-white shadow-2xl relative overflow-hidden">
                    <Wallet className="absolute -right-4 -bottom-4 w-40 h-40 opacity-10" />
                    
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <p className="text-[10px] font-black text-orange-400 uppercase tracking-[0.2em] mb-1">Status Pension</p>
                                <h4 className="text-2xl font-black">{paymentPercentage}% Soldé</h4>
                            </div>
                            <div className="bg-white/10 p-2 rounded-xl backdrop-blur-md">
                                <CreditCard className="w-5 h-5" />
                            </div>
                        </div>

                        <div className="space-y-2 mb-8">
                            <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
                                <span>Progression</span>
                                <span>{selectedChild?.pensionPaid.toLocaleString()} / {selectedChild?.pensionTotal.toLocaleString()} FCFA</span>
                            </div>
                            <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-orange-500 rounded-full shadow-[0_0_15px_rgba(249,115,22,0.6)]" 
                                    style={{ width: `${paymentPercentage}%` }}
                                ></div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/5 p-4 rounded-3xl border border-white/10">
                                <p className="text-[9px] text-slate-400 font-bold uppercase mb-1">Restant</p>
                                <p className="text-lg font-black text-red-400">
                                    {((selectedChild?.pensionTotal || 0) - (selectedChild?.pensionPaid || 0)).toLocaleString()} F
                                </p>
                            </div>
                            <div className="bg-white/5 p-4 rounded-3xl border border-white/10">
                                <p className="text-[9px] text-slate-400 font-bold uppercase mb-1">Niveau</p>
                                <p className="text-lg font-black">{selectedChild?.level}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">Historique des Paiements</h3>
                    {childFinance.length > 0 ? childFinance.map(pay => (
                        <div key={pay.id} className="bg-white p-5 rounded-[28px] shadow-sm border border-slate-100 flex items-center justify-between group">
                            <div className="flex items-center space-x-4">
                                <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                                    <Receipt className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-black text-slate-800">{pay.title}</p>
                                    <p className="text-[9px] text-slate-400 font-bold uppercase">{new Date(pay.timestamp).toLocaleDateString()} • Reçu N°{pay.timestamp % 10000 + 1000}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-black text-emerald-600">Payé</p>
                                <CheckCircle className="w-4 h-4 text-emerald-500 mx-auto" />
                            </div>
                        </div>
                    )) : (
                        <div className="bg-white p-10 rounded-[32px] text-center border-2 border-dashed border-slate-100">
                            <p className="text-xs font-black text-slate-300 uppercase italic">Aucun versement enregistré</p>
                        </div>
                    )}
                    
                    <button className="w-full py-5 bg-orange-50 text-orange-600 rounded-[28px] border-2 border-dashed border-orange-200 text-xs font-black uppercase tracking-widest active:scale-95 transition-all mt-4">
                        Demander un état des comptes
                    </button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default ParentDashboard;
