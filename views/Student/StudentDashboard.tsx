
import React, { useState } from 'react';
import { 
  User as UserIcon, 
  GraduationCap, 
  LogOut, 
  TrendingUp, 
  AlertTriangle, 
  FileText, 
  Eye, 
  Download, 
  FolderOpen, 
  Lightbulb, 
  Loader2, 
  MessageSquare, 
  Lock, 
  Send 
} from 'lucide-react';
import { User, PushNotification, Student, Message } from '../../types';
import { STUDENTS, CLASSES, INITIAL_HOMEWORK, SCHEDULE } from '../../mockData';
import { getRevisionHelp } from '../../geminiService';

interface Props {
  user: User;
  onLogout: () => void;
  notifications?: PushNotification[];
  students?: Student[];
  messages?: Message[];
  onSendMessage?: (msg: Omit<Message, 'id' | 'timestamp'>) => void;
}

const StudentDashboard: React.FC<Props> = ({ user, onLogout, notifications = [], students = STUDENTS, messages = [], onSendMessage }) => {
  const [activeTab, setActiveTab] = useState<'HOME' | 'REVISION' | 'GRADES' | 'COURSES' | 'SCHEDULE' | 'CHAT'>('HOME');
  const [revisionTopic, setRevisionTopic] = useState('');
  const [revisionResult, setRevisionResult] = useState('');
  const [loadingIA, setLoadingIA] = useState(false);
  const [chatMessage, setChatMessage] = useState('');

  const me = students.find((s: Student) => s.matricule === user.uniqueId) || 
             STUDENTS.find(s => s.matricule === user.uniqueId);
  
  const coursesReceived = notifications.filter(n => n.type === 'COURSE');
  const gradeNotifications = notifications.filter(n => n.type === 'GRADE' && n.meta?.grade !== undefined);

  const stats = (() => {
    if (gradeNotifications.length === 0) return null;
    const grades = gradeNotifications.map(n => ({
        val: n.meta!.grade as number,
        subject: n.meta!.subject as string
    }));
    const sorted = [...grades].sort((a, b) => b.val - a.val);
    const average = grades.reduce((acc, curr) => acc + curr.val, 0) / grades.length;
    const subjectsToImprove = Array.from(new Set(grades.filter(g => g.val < 10).map(g => g.subject)));
    return { best: sorted[0], worst: sorted[sorted.length - 1], average, subjectsToImprove };
  })();

  if (!me) {
    console.error("Student profile not found for uniqueId:", user.uniqueId);
    return (
      <div className="p-8 text-center flex flex-col items-center justify-center h-full space-y-4">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center text-red-500">
          <UserIcon className="w-10 h-10" />
        </div>
        <h2 className="text-xl font-black text-gray-800">Profil introuvable</h2>
        <p className="text-sm text-gray-500 max-w-xs">
          Nous n'avons pas pu trouver les informations scolaires associées au matricule <span className="font-bold text-red-600">{user.uniqueId}</span>.
        </p>
        <button onClick={onLogout} className="px-6 py-3 bg-red-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg">
          Retour à la connexion
        </button>
      </div>
    );
  }

  const myClass = CLASSES.find(c => c.id === me.classId);
  const homework = INITIAL_HOMEWORK.filter(h => h.classId === me.classId);

  const handleRevision = async (subject: string) => {
    if (!revisionTopic) return;
    setLoadingIA(true);
    const res = await getRevisionHelp(subject, revisionTopic);
    setRevisionResult(res);
    setLoadingIA(false);
  };

  const handleSendChatMessage = () => {
    if (!chatMessage.trim() || !onSendMessage) return;
    onSendMessage({
      senderId: user.uniqueId,
      senderName: user.name,
      recipientId: 'PROF-001', // Par défaut pour le prototype
      content: chatMessage
    });
    setChatMessage('');
  };

  const handleOpenFile = async (notif: PushNotification) => {
    if (!notif.meta?.fileData) return;
    try {
      const response = await fetch(notif.meta.fileData);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const win = window.open(url, '_blank');
      if (!win) alert("Veuillez autoriser les pop-ups pour visualiser le fichier.");
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch {
      alert("Erreur d'ouverture. Utilisez le bouton Télécharger.");
    }
  };

  const handleDownloadFile = (notif: PushNotification) => {
    if (!notif.meta?.fileData || !notif.meta?.fileName) return;
    const link = document.createElement('a');
    link.href = notif.meta.fileData;
    link.download = notif.meta.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col h-full bg-purple-50">
      <div className="bg-purple-900 p-6 text-white rounded-b-[40px] shadow-xl z-10 sticky top-0">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3">
             <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center animate-float">
                <GraduationCap className="w-6 h-6" />
             </div>
             <div>
                <h1 className="text-lg font-black tracking-tight">{user.name}</h1>
                <p className="text-purple-200 text-[10px] font-black uppercase tracking-widest">{myClass?.name}</p>
             </div>
          </div>
          <button onClick={onLogout} className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center transition-all active:scale-95">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
        <div className="flex bg-purple-950/40 p-1 rounded-2xl overflow-x-auto no-scrollbar">
          {(['HOME', 'REVISION', 'COURSES', 'GRADES', 'SCHEDULE', 'CHAT'] as const).map(t => (
            <button 
                key={t} 
                onClick={() => setActiveTab(t)} 
                className={`flex-1 py-2 px-3 text-[9px] font-black rounded-xl uppercase tracking-tighter transition-all whitespace-nowrap ${activeTab === t ? 'bg-white text-purple-900 shadow-sm' : 'text-purple-200'}`}
            >
              {t === 'HOME' ? 'Bilan' : t === 'REVISION' ? 'Réviser' : t === 'COURSES' ? `Cours (${coursesReceived.length})` : t === 'SCHEDULE' ? 'Emploi' : t === 'CHAT' ? 'Chat' : 'Notes'}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 flex-1 overflow-y-auto no-scrollbar pb-20">
        {activeTab === 'HOME' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-6 rounded-[32px] text-white shadow-lg relative overflow-hidden">
               <TrendingUp className="absolute right-2 bottom-2 w-24 h-24 text-white opacity-10" />
               <p className="text-[10px] font-bold uppercase opacity-80 tracking-widest">Bilan de Performance</p>
               <h2 className="text-3xl font-black mb-1">{stats ? stats.average.toFixed(2) : '--'} / 20</h2>
               <p className="text-[10px] font-bold bg-white/20 inline-block px-3 py-1 rounded-full backdrop-blur-sm">Moyenne Générale</p>
            </div>

            {stats && (
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
                        <p className="text-[9px] font-black text-green-500 uppercase mb-1">Meilleure Note</p>
                        <p className="text-xl font-black text-slate-800">{stats.best.val}/20</p>
                        <p className="text-[8px] font-bold text-slate-400 uppercase truncate">{stats.best.subject}</p>
                    </div>
                    <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
                        <p className="text-[9px] font-black text-red-500 uppercase mb-1">Faible Note</p>
                        <p className="text-xl font-black text-slate-800">{stats.worst.val}/20</p>
                        <p className="text-[8px] font-bold text-slate-400 uppercase truncate">{stats.worst.subject}</p>
                    </div>
                </div>
            )}

            {stats && stats.subjectsToImprove.length > 0 && (
                <div className="bg-orange-50 p-5 rounded-[32px] border border-orange-100">
                    <h4 className="text-[10px] font-black text-orange-600 uppercase mb-3 flex items-center">
                        <AlertTriangle className="w-4 h-4 mr-2" /> Efforts Requis
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        {stats.subjectsToImprove.map(s => (
                            <span key={s} className="px-3 py-1 bg-white text-orange-600 rounded-full text-[9px] font-black border border-orange-100">{s}</span>
                        ))}
                    </div>
                    <p className="text-[9px] text-orange-400 mt-3 italic font-medium">Tes notes dans ces matières sont inférieures à 10/20.</p>
                </div>
            )}
            
            <section className="space-y-3">
              <h3 className="font-black text-gray-400 text-[10px] uppercase tracking-widest px-2">Cahier de textes</h3>
              <div className="space-y-3">
                {homework.map(h => (
                  <div key={h.id} className="bg-white p-5 rounded-[28px] shadow-sm border-l-4 border-purple-500">
                    <p className="text-[10px] font-black text-purple-600 uppercase mb-1">{h.subject}</p>
                    <p className="text-xs font-bold text-gray-800 leading-tight">{h.description}</p>
                  </div>
                ))}
                {homework.length === 0 && <p className="text-center py-6 text-xs text-slate-300 italic">Aucun devoir à faire.</p>}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'COURSES' && (
            <div className="space-y-4 animate-fadeIn">
                <h3 className="font-black text-gray-400 text-[10px] uppercase tracking-widest px-2">Supports de cours partagés</h3>
                {coursesReceived.map(notif => (
                    <div key={notif.id} className="bg-white p-5 rounded-[32px] shadow-sm border border-purple-100">
                        <div className="flex items-center space-x-3 mb-3">
                            <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
                                <FileText className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="text-xs font-black text-gray-800 truncate">{notif.title.replace('SUPPORT DE COURS : ', '')}</h4>
                                <p className="text-[9px] text-gray-400 font-bold">{new Date(notif.timestamp).toLocaleDateString()}</p>
                            </div>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 mb-3">
                            <p className="text-xs text-slate-600 leading-relaxed italic">{notif.body.split('. ').pop()}</p>
                        </div>
                        {notif.meta?.fileName && (
                            <div className="grid grid-cols-2 gap-2">
                                <button 
                                    onClick={() => handleOpenFile(notif)}
                                    className="p-3 bg-purple-600 text-white rounded-xl text-[10px] font-black uppercase flex items-center justify-center space-x-2 active:scale-95 transition-all shadow-md"
                                >
                                    <Eye className="w-4 h-4" />
                                    <span>Ouvrir</span>
                                </button>
                                <button 
                                    onClick={() => handleDownloadFile(notif)}
                                    className="p-3 bg-white text-purple-700 border border-purple-200 rounded-xl text-[10px] font-black uppercase flex items-center justify-center space-x-2 active:scale-95 transition-all"
                                >
                                    <Download className="w-4 h-4" />
                                    <span>Charger</span>
                                </button>
                            </div>
                        )}
                    </div>
                ))}
                {coursesReceived.length === 0 && (
                    <div className="text-center py-20 flex flex-col items-center">
                        <FolderOpen className="w-10 h-10 text-slate-100 mb-2" />
                        <p className="text-xs text-slate-300 font-bold uppercase tracking-widest">Aucun support partagé</p>
                    </div>
                )}
            </div>
        )}

        {activeTab === 'REVISION' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="bg-white p-6 rounded-[40px] shadow-sm border border-purple-100 text-center">
              <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-[28px] flex items-center justify-center mx-auto mb-4 border border-purple-100">
                <Lightbulb className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black text-gray-800 mb-1">Aide aux Révisions IA</h3>
              <p className="text-[10px] text-gray-400 font-medium mb-6">Demandez un résumé sur n'importe quel sujet.</p>
              
              <div className="space-y-3">
                  <input 
                    type="text" 
                    placeholder="Sujet: ex. Newton, Germinal..." 
                    className="w-full p-4 bg-gray-50 rounded-2xl outline-none text-xs font-bold border border-transparent focus:border-purple-300 transition-all text-center text-slate-900" 
                    value={revisionTopic} 
                    onChange={e => setRevisionTopic(e.target.value)} 
                  />
                  <div className="grid grid-cols-2 gap-2">
                    {['Maths', 'Philo', 'SVT', 'H-Géo'].map(s => (
                      <button key={s} onClick={() => handleRevision(s)} disabled={loadingIA} className="py-3 bg-purple-50 text-purple-700 font-black rounded-xl text-[9px] uppercase border border-purple-100 active:scale-95 transition-all">
                        {s}
                      </button>
                    ))}
                  </div>
              </div>
            </div>

            {loadingIA && (
                <div className="bg-white p-10 rounded-[40px] shadow-sm text-center flex flex-col items-center">
                    <Loader2 className="w-8 h-8 text-purple-600 animate-spin mb-2" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">L'IA prépare ta fiche...</p>
                </div>
            )}

            {revisionResult && (
              <div className="bg-white p-6 rounded-[40px] shadow-xl border border-purple-100 animate-fadeIn">
                <div className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap font-bold border-l-4 border-purple-200 pl-4">{revisionResult}</div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'GRADES' && (
          <div className="space-y-3 animate-fadeIn">
             <div className="bg-white p-6 rounded-[40px] text-center mb-6 shadow-sm border border-purple-100">
                <p className="text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Récapitulatif des notes</p>
                <div className="divide-y divide-slate-50 mt-4">
                    {gradeNotifications.length > 0 ? gradeNotifications.map(notif => (
                        <div key={notif.id} className="py-4 flex justify-between items-center px-2">
                            <div className="text-left">
                                <p className="text-[11px] font-black text-slate-800">{notif.meta?.subject}</p>
                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">Séquence {notif.meta?.sequence}</p>
                            </div>
                            <div className={`text-lg font-black ${notif.meta!.grade >= 10 ? 'text-emerald-500' : 'text-red-500'}`}>
                                {notif.meta?.grade}/20
                            </div>
                        </div>
                    )) : (
                        <div className="py-10 text-slate-300 italic text-xs">Aucune note reçue pour l'instant.</div>
                    )}
                </div>
             </div>
          </div>
        )}

        {activeTab === 'SCHEDULE' && (
          <div className="space-y-4 animate-fadeIn">
            <h3 className="font-black text-gray-400 text-[10px] uppercase tracking-widest px-2">Mon Emploi du Temps</h3>
            <div className="space-y-3">
              {['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'].map(day => {
                const dayItems = SCHEDULE.filter(i => i.day === day && i.classId === me.classId);
                if (dayItems.length === 0) return null;
                return (
                  <div key={day} className="space-y-2">
                    <h4 className="text-[10px] font-black text-purple-600 uppercase ml-2">{day}</h4>
                    {dayItems.map(item => (
                      <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm border border-purple-100 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center text-purple-600 text-[10px] font-black">
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

        {activeTab === 'CHAT' && (
          <div className="flex flex-col h-full animate-fadeIn">
            <div className="bg-white p-6 rounded-[40px] shadow-sm border border-purple-100 mb-4 text-center flex flex-col items-center">
              <MessageSquare className="w-10 h-10 text-purple-200 mb-2" />
              <h3 className="text-sm font-black text-slate-800">Messagerie Directe</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Contacte tes professeurs</p>
            </div>
            
            <div className="flex-1 bg-white rounded-[40px] shadow-sm border border-purple-100 p-4 flex flex-col min-h-[300px]">
              <div className="flex-1 overflow-y-auto space-y-3 mb-4 p-2 no-scrollbar">
                {messages.length === 0 ? (
                  <div className="text-center py-10 text-slate-300 italic text-xs flex flex-col items-center">
                    <Lock className="w-8 h-8 mb-2 opacity-20" />
                    Aucun message. Démarre la conversation !
                  </div>
                ) : (
                  messages.map(m => (
                    <div key={m.id} className={`flex ${m.senderId === user.uniqueId ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] p-3 rounded-2xl text-[11px] font-bold ${m.senderId === user.uniqueId ? 'bg-purple-600 text-white rounded-tr-none' : 'bg-slate-100 text-slate-800 rounded-tl-none'}`}>
                        <p className="mb-1">{m.content}</p>
                        <p className={`text-[8px] opacity-50 ${m.senderId === user.uniqueId ? 'text-white text-right' : 'text-slate-400'}`}>
                          {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <input 
                  type="text" 
                  placeholder="Écris un message..." 
                  className="flex-1 p-4 bg-slate-50 rounded-2xl outline-none text-xs font-bold border border-transparent focus:border-purple-300 transition-all text-slate-900"
                  value={chatMessage}
                  onChange={e => setChatMessage(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && handleSendChatMessage()}
                />
                <button 
                  onClick={handleSendChatMessage}
                  className="w-12 h-12 bg-purple-600 text-white rounded-2xl flex items-center justify-center active:scale-90 transition-all shadow-lg"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
