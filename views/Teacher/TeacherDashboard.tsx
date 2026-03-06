
import React, { useState, useRef } from 'react';
import { 
  LogOut, 
  PlusCircle, 
  UploadCloud, 
  FileCheck, 
  MessageSquare, 
  Send, 
  UserPlus 
} from 'lucide-react';
import { User, PushNotification, Student, Message } from '../../types';
import { STUDENTS, CLASSES, SCHEDULE } from '../../mockData';

interface Props {
  user: User;
  onLogout: () => void;
  onSendNotification: (notif: Omit<PushNotification, 'id' | 'timestamp'>) => void;
  students?: Student[];
  messages?: Message[];
  onSendMessage?: (msg: Omit<Message, 'id' | 'timestamp'>) => void;
}

const TeacherDashboard: React.FC<Props> = ({ user, onLogout, onSendNotification, students = STUDENTS, messages = [], onSendMessage }) => {
  const [activeTab, setActiveTab] = useState<'GRADES' | 'PARTAGE' | 'LISTE' | 'SCHEDULE' | 'CHAT'>('GRADES');
  const [selectedClassId, setSelectedClassId] = useState<string>(user.classes?.[0] || CLASSES[0].id);
  const [showEntry, setShowEntry] = useState(false);
  const [evalMeta, setEvalMeta] = useState({ title: '', coeff: 2, sequence: 1 });
  const [studentGrades, setStudentGrades] = useState<Record<string, string>>({});
  
  const [courseData, setCourseData] = useState({ title: '', content: '' });
  const [attachedFile, setAttachedFile] = useState<{name: string, data: string} | null>(null);
  const [sending, setSending] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [selectedChatRecipient, setSelectedChatRecipient] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
 
  const teacherClasses = CLASSES.filter(c => user.classes?.includes(c.id));
  const currentStudents = students.filter(s => s.classId === selectedClassId);

  const handleGradeChange = (matricule: string, val: string) => {
    setStudentGrades(prev => ({ ...prev, [matricule]: val }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // Limite de 2Mo pour le prototype
        alert("Fichier trop volumineux (max 2Mo pour le prototype).");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachedFile({
          name: file.name,
          data: reader.result as string
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveNotes = () => {
    if (!evalMeta.title) {
        alert("Donnez un titre à l'évaluation.");
        return;
    }

    const studentsToNotify = currentStudents.filter(s => studentGrades[s.matricule]);
    
    studentsToNotify.forEach(student => {
      const grade = parseFloat(studentGrades[student.matricule]);
      onSendNotification({
        recipientId: student.matricule,
        title: `NOTE DISPONIBLE : ${user.subject}`,
        body: `Note de ${grade}/20 reçue en ${user.subject} (Séquence ${evalMeta.sequence} - ${evalMeta.title}).`,
        type: 'GRADE',
        meta: {
            sequence: evalMeta.sequence,
            grade: grade,
            subject: user.subject || 'Matière'
        }
      });
    });

    alert(`${studentsToNotify.length} notes envoyées.`);
    setShowEntry(false);
    setStudentGrades({});
  };

  const handleSendCourse = () => {
    if (!courseData.title) {
      alert("Veuillez donner un titre au support.");
      return;
    }

    setSending(true);
    
    // Utilisation d'un court délai pour laisser l'UI respirer avant l'opération lourde
    setTimeout(() => {
      try {
        // Envoi d'UNE SEULE notification destinée à la CLASSE entière
        // Au lieu de boucler sur chaque élève, ce qui sature le localStorage
        onSendNotification({
          recipientId: selectedClassId, // Utilise l'ID de la classe comme destinataire
          title: `SUPPORT DE COURS : ${courseData.title}`,
          body: `${user.name} a partagé un nouveau support en ${user.subject}. ${courseData.content}`,
          type: 'COURSE',
          meta: {
            subject: user.subject,
            fileName: attachedFile?.name,
            fileData: attachedFile?.data
          }
        });

        alert(`Support "${courseData.title}" envoyé avec succès à toute la classe.`);
        
        // Reset des états proprement
        setCourseData({ title: '', content: '' });
        setAttachedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } catch (err) {
        console.error(err);
        alert("Erreur lors de l'envoi. Le fichier est peut-être trop lourd.");
      } finally {
        setSending(false);
      }
    }, 100);
  };

  const handleSendChatMessage = () => {
    if (!chatMessage.trim() || !onSendMessage || !selectedChatRecipient) return;
    onSendMessage({
      senderId: user.uniqueId,
      senderName: user.name,
      recipientId: selectedChatRecipient,
      content: chatMessage
    });
    setChatMessage('');
  };

  return (
    <div className="flex flex-col h-full bg-emerald-50">
      <div className="bg-emerald-800 p-6 text-white rounded-b-[40px] shadow-xl z-10 sticky top-0">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-xl font-black tracking-tight">Portail Enseignant</h1>
            <p className="text-emerald-200 text-[10px] font-bold uppercase tracking-widest">{user.name} • {user.subject}</p>
          </div>
          <button onClick={onLogout} className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center active:scale-95 transition-all">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex space-x-1 bg-emerald-950/30 p-1 rounded-xl mb-4">
          <button onClick={() => setActiveTab('GRADES')} className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all ${activeTab === 'GRADES' ? 'bg-white text-emerald-900 shadow-sm' : 'text-emerald-100'}`}>NOTES</button>
          <button onClick={() => setActiveTab('LISTE')} className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all ${activeTab === 'LISTE' ? 'bg-white text-emerald-900 shadow-sm' : 'text-emerald-100'}`}>EFFECTIF</button>
          <button onClick={() => setActiveTab('PARTAGE')} className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all ${activeTab === 'PARTAGE' ? 'bg-white text-emerald-900 shadow-sm' : 'text-emerald-100'}`}>PARTAGE</button>
          <button onClick={() => setActiveTab('SCHEDULE')} className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all ${activeTab === 'SCHEDULE' ? 'bg-white text-emerald-900 shadow-sm' : 'text-emerald-100'}`}>EMPLOI</button>
          <button onClick={() => setActiveTab('CHAT')} className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all ${activeTab === 'CHAT' ? 'bg-white text-emerald-900 shadow-sm' : 'text-emerald-100'}`}>CHAT</button>
        </div>

        <div className="flex space-x-2 overflow-x-auto no-scrollbar pb-1">
          {teacherClasses.map(c => (
            <button key={c.id} onClick={() => setSelectedClassId(c.id)} className={`px-4 py-2 rounded-xl text-[9px] font-black border transition-all whitespace-nowrap ${selectedClassId === c.id ? 'bg-white text-emerald-900 shadow-md' : 'bg-transparent text-emerald-100 border-emerald-700'}`}>{c.name}</button>
          ))}
        </div>
      </div>

      <div className="p-4 flex-1 overflow-y-auto no-scrollbar pb-20">
        {activeTab === 'GRADES' && (
          !showEntry ? (
            <div className="animate-fadeIn py-4">
              <button onClick={() => setShowEntry(true)} className="w-full py-12 bg-white border-2 border-dashed border-emerald-200 rounded-[40px] flex flex-col items-center justify-center text-emerald-600 transition-all active:scale-95 shadow-sm">
                <PlusCircle className="w-10 h-10 mb-3" />
                <span className="font-black text-xs uppercase tracking-widest">Nouvelle Évaluation</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4 animate-fadeIn">
              <div className="grid grid-cols-2 gap-3">
                 <div className="space-y-1">
                    <label className="text-[9px] font-black text-emerald-600 uppercase ml-2">Séquence</label>
                    <select 
                        className="w-full p-4 bg-white rounded-2xl outline-none text-sm font-bold border border-emerald-100 text-slate-900"
                        value={evalMeta.sequence}
                        onChange={e => setEvalMeta({...evalMeta, sequence: parseInt(e.target.value)})}
                    >
                        {[1, 2, 3, 4, 5, 6].map(s => <option key={s} value={s}>Séquence {s}</option>)}
                    </select>
                 </div>
                 <div className="space-y-1">
                    <label className="text-[9px] font-black text-emerald-600 uppercase ml-2">Titre Éval.</label>
                    <input 
                        type="text" 
                        placeholder="Ex: Devoir 1" 
                        className="w-full p-4 bg-white rounded-2xl outline-none text-sm font-bold border border-emerald-100 text-slate-900" 
                        value={evalMeta.title} 
                        onChange={e => setEvalMeta({...evalMeta, title: e.target.value})} 
                    />
                 </div>
              </div>

              <div className="bg-white rounded-[32px] shadow-sm overflow-hidden border border-emerald-100 divide-y divide-gray-50">
                {currentStudents.map(s => (
                  <div key={s.id} className="p-4 flex items-center justify-between">
                    <div>
                        <span className="text-xs font-black text-slate-700 block">{s.name}</span>
                        <span className="text-[9px] text-slate-400 font-bold uppercase">{s.matricule}</span>
                    </div>
                    <input 
                      type="number" 
                      placeholder="--" 
                      min="0" max="20"
                      className="w-16 p-3 bg-gray-50 border border-slate-100 rounded-xl text-center font-black text-slate-900 outline-none focus:border-emerald-300" 
                      value={studentGrades[s.matricule] || ''}
                      onChange={e => handleGradeChange(s.matricule, e.target.value)}
                    />
                  </div>
                ))}
              </div>
              
              <div className="flex space-x-3 mt-4">
                <button onClick={() => setShowEntry(false)} className="flex-1 py-4 bg-gray-100 text-gray-600 font-black rounded-2xl text-[10px] uppercase">Annuler</button>
                <button onClick={handleSaveNotes} className="flex-[2] py-4 bg-emerald-600 text-white font-black rounded-2xl text-[10px] uppercase shadow-lg">Partager les notes</button>
              </div>
            </div>
          )
        )}

        {activeTab === 'LISTE' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="bg-white rounded-[32px] shadow-sm border border-emerald-100 overflow-hidden divide-y divide-gray-50">
               {currentStudents.map((s) => (
                <div key={s.id} className="p-4 flex items-center space-x-3">
                   <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-700 text-xs font-black">{s.name.charAt(0)}</div>
                   <div>
                     <p className="text-xs font-black text-gray-800">{s.name}</p>
                     <p className="text-[9px] text-gray-400 font-bold uppercase">{s.matricule}</p>
                   </div>
                </div>
               ))}
            </div>
          </div>
        )}

        {activeTab === 'PARTAGE' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-white p-6 rounded-[32px] shadow-sm border border-emerald-100 space-y-4">
               <h3 className="text-sm font-black text-gray-800 uppercase text-center mb-4 tracking-widest">Envoi de support de cours</h3>
               
               <div className="space-y-1">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Titre du cours</label>
                 <input 
                  type="text" 
                  placeholder="Ex: Les polynômes" 
                  className="w-full p-4 bg-slate-50 rounded-2xl outline-none text-sm font-bold border border-slate-100 focus:border-emerald-300 transition-all text-slate-900" 
                  value={courseData.title} 
                  onChange={e => setCourseData({...courseData, title: e.target.value})} 
                 />
               </div>

               <div className="space-y-1">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Description</label>
                 <textarea 
                  placeholder="Instructions pour les élèves..." 
                  className="w-full p-4 bg-slate-50 rounded-2xl outline-none text-sm font-bold h-24 resize-none border border-slate-100 focus:border-emerald-300 transition-all text-slate-900" 
                  value={courseData.content} 
                  onChange={e => setCourseData({...courseData, content: e.target.value})} 
                 />
               </div>

               <div className="space-y-1">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Pièce Jointe (Max 2Mo)</label>
                 <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full p-4 bg-emerald-50 border-2 border-dashed border-emerald-200 rounded-2xl text-center cursor-pointer transition-all hover:bg-emerald-100/50 flex flex-col items-center"
                 >
                    {attachedFile ? <FileCheck className="w-8 h-8 text-emerald-600 mb-2" /> : <UploadCloud className="w-8 h-8 text-emerald-400 mb-2" />}
                    <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">
                        {attachedFile ? attachedFile.name : 'PDF, Word, Images...'}
                    </p>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        onChange={handleFileChange}
                        accept=".pdf,.doc,.docx,.jpg,.png"
                    />
                 </div>
               </div>
               
               <button 
                onClick={handleSendCourse} 
                disabled={sending || !courseData.title} 
                className={`w-full py-4 rounded-2xl text-white font-black uppercase text-xs tracking-widest shadow-xl transition-all active:scale-95 ${sending || !courseData.title ? 'bg-slate-300 shadow-none' : 'bg-emerald-600 shadow-emerald-100'}`}
               >
                 {sending ? 'Diffusion...' : 'Partager avec la classe'}
               </button>
            </div>
          </div>
        )}

        {activeTab === 'SCHEDULE' && (
          <div className="space-y-4 animate-fadeIn">
            <h3 className="font-black text-gray-400 text-[10px] uppercase tracking-widest px-2">Mon Emploi du Temps</h3>
            <div className="space-y-3">
              {['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'].map(day => {
                const dayItems = SCHEDULE.filter(i => i.day === day && i.teacherName.includes(user.name.split(' ').pop() || ''));
                if (dayItems.length === 0) return null;
                return (
                  <div key={day} className="space-y-2">
                    <h4 className="text-[10px] font-black text-emerald-600 uppercase ml-2">{day}</h4>
                    {dayItems.map(item => (
                      <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm border border-emerald-100 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600 text-[10px] font-black">
                            {item.startTime.split(':')[0]}h
                          </div>
                          <div>
                            <p className="text-xs font-black text-slate-800">{item.subject}</p>
                            <p className="text-[8px] text-slate-400 font-bold uppercase">{CLASSES.find(c => c.id === item.classId)?.name} • {item.room}</p>
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
          <div className="flex flex-col h-full animate-fadeIn space-y-4">
            <div className="bg-white p-6 rounded-[40px] shadow-sm border border-emerald-100 text-center flex flex-col items-center">
              <MessageSquare className="w-10 h-10 text-emerald-200 mb-2" />
              <h3 className="text-sm font-black text-slate-800">Messagerie Directe</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Échange avec tes élèves et parents</p>
            </div>

            <div className="flex space-x-2 overflow-x-auto no-scrollbar pb-2">
              {currentStudents.map(s => (
                <button 
                  key={s.id} 
                  onClick={() => setSelectedChatRecipient(s.matricule)}
                  className={`whitespace-nowrap px-4 py-2 rounded-xl text-[9px] font-black transition-all ${selectedChatRecipient === s.matricule ? 'bg-emerald-600 text-white shadow-md' : 'bg-white text-emerald-600 border border-emerald-100'}`}
                >
                  {s.name}
                </button>
              ))}
            </div>
            
            <div className="flex-1 bg-white rounded-[40px] shadow-sm border border-emerald-100 p-4 flex flex-col min-h-[300px]">
              {!selectedChatRecipient ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-300 italic text-xs">
                  <UserPlus className="w-10 h-10 mb-4 opacity-10" />
                  Sélectionne un élève pour discuter.
                </div>
              ) : (
                <>
                  <div className="flex-1 overflow-y-auto space-y-3 mb-4 p-2 no-scrollbar">
                    {messages.filter(m => m.senderId === selectedChatRecipient || m.recipientId === selectedChatRecipient).length === 0 ? (
                      <div className="text-center py-10 text-slate-300 italic text-xs">
                        Aucun message avec cet élève.
                      </div>
                    ) : (
                      messages.filter(m => m.senderId === selectedChatRecipient || m.recipientId === selectedChatRecipient).map(m => (
                        <div key={m.id} className={`flex ${m.senderId === user.uniqueId ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] p-3 rounded-2xl text-[11px] font-bold ${m.senderId === user.uniqueId ? 'bg-emerald-600 text-white rounded-tr-none' : 'bg-slate-100 text-slate-800 rounded-tl-none'}`}>
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
                      className="flex-1 p-4 bg-slate-50 rounded-2xl outline-none text-xs font-bold border border-transparent focus:border-emerald-300 transition-all text-slate-900"
                      value={chatMessage}
                      onChange={e => setChatMessage(e.target.value)}
                      onKeyPress={e => e.key === 'Enter' && handleSendChatMessage()}
                    />
                    <button 
                      onClick={handleSendChatMessage}
                      className="w-12 h-12 bg-emerald-600 text-white rounded-2xl flex items-center justify-center active:scale-90 transition-all shadow-lg"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherDashboard;
