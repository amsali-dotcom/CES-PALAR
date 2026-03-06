
import React, { useState } from 'react';
import { LogOut } from 'lucide-react';
import { User, PushNotification, Student } from '../../types';
import { STUDENTS, CLASSES } from '../../mockData';

interface Props {
  user: User;
  onLogout: () => void;
  onSendNotification: (notif: Omit<PushNotification, 'id' | 'timestamp'>) => void;
  students?: Student[];
}

const CPEDashboard: React.FC<Props> = ({ user, onLogout, onSendNotification, students = STUDENTS }) => {
  const [activeTab, setActiveTab] = useState<'ENTRY' | 'ALERTS' | 'STUDENTS'>('ENTRY');
  const [selectedClassId, setSelectedClassId] = useState<string>(CLASSES[0].id);
  const [absences, setAbsences] = useState<Record<string, 'P' | 'A' | 'R'>>({});
  
  const dailyAbsences = 14;
  const dailyLates = 8;
  const currentStudents = students.filter(s => s.classId === selectedClassId);

  const handleSave = () => {
    const absentStudents = currentStudents.filter(s => absences[s.id] === 'A');
    absentStudents.forEach(student => {
      onSendNotification({
        recipientId: student.matricule,
        title: "ALERTE ABSENCE",
        body: `Votre enfant ${student.name} a été marqué absent lors de l'appel de ce jour.`,
        type: 'ABSENCE'
      });
    });
    alert(`${absentStudents.length} notifications d'absence envoyées aux parents.`);
  };

  const [alerts, setAlerts] = useState([
    { id: 1, name: "Konan Axel", class: "2nde A", msg: "Dépassement de seuil : 5 absences", type: "CRITICAL", treated: false },
    { id: 2, name: "Diarra Moussa", class: "1ère C", msg: "3 retards cette semaine", type: "WARNING", treated: false },
  ]);

  return (
    <div className="flex flex-col h-full bg-indigo-50">
      <div className="bg-indigo-900 p-6 text-white rounded-b-3xl shadow-xl z-10 sticky top-0">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Vigilance NÉO</h1>
            <p className="text-indigo-200 text-[10px] font-bold uppercase tracking-widest">Surveillant: {user.name}</p>
          </div>
          <button onClick={onLogout} className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center active:scale-95 transition-all">
            <LogOut className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-md">
            <p className="text-[10px] text-indigo-200 font-bold uppercase">Absents du jour</p>
            <p className="text-xl font-black">{dailyAbsences}</p>
          </div>
          <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-md">
            <p className="text-[10px] text-indigo-200 font-bold uppercase">Retards du jour</p>
            <p className="text-xl font-black">{dailyLates}</p>
          </div>
        </div>

        <div className="flex bg-indigo-950/40 p-1 rounded-xl">
          <button onClick={() => setActiveTab('ENTRY')} className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all ${activeTab === 'ENTRY' ? 'bg-white text-indigo-900 shadow-sm' : 'text-indigo-100'}`}>Saisie Appel</button>
          <button onClick={() => setActiveTab('ALERTS')} className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all ${activeTab === 'ALERTS' ? 'bg-white text-indigo-900 shadow-sm' : 'text-indigo-100'}`}>Alertes</button>
          <button onClick={() => setActiveTab('STUDENTS')} className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all ${activeTab === 'STUDENTS' ? 'bg-white text-indigo-900 shadow-sm' : 'text-indigo-100'}`}>Élèves</button>
        </div>
      </div>

      <div className="p-4 flex-1 overflow-y-auto no-scrollbar">
        {activeTab === 'ENTRY' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex space-x-2 overflow-x-auto no-scrollbar pb-2">
              {CLASSES.map(c => (
                <button key={c.id} onClick={() => setSelectedClassId(c.id)} className={`whitespace-nowrap px-4 py-2 rounded-xl text-[10px] font-black transition-all ${selectedClassId === c.id ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-indigo-600 border border-indigo-100'}`}>{c.name}</button>
              ))}
            </div>

            <div className="bg-white rounded-[32px] shadow-sm p-6 border border-indigo-100">
              <div className="space-y-4">
                {currentStudents.map(student => (
                  <div key={student.id} className="flex items-center justify-between">
                    <span className="text-xs font-black text-gray-700 truncate mr-2">{student.name}</span>
                    <div className="flex bg-gray-50 rounded-xl p-1 border border-gray-100">
                      {(['P', 'A', 'R'] as const).map(s => (
                        <button key={s} onClick={() => setAbsences({...absences, [student.id]: s})} className={`w-8 h-8 text-[10px] font-black rounded-lg transition-all ${absences[student.id] === s ? (s === 'P' ? 'bg-green-500 text-white shadow-sm' : s === 'A' ? 'bg-red-500 text-white shadow-sm' : 'bg-yellow-500 text-white shadow-sm') : 'text-gray-400'}`}>{s}</button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={handleSave} className="w-full mt-6 py-4 bg-indigo-600 text-white font-black uppercase text-xs tracking-widest rounded-2xl shadow-xl shadow-indigo-100 active:scale-95 transition-all">Valider l'appel</button>
            </div>
          </div>
        )}

        {activeTab === 'ALERTS' && (
          <div className="space-y-4 animate-fadeIn">
            {alerts.filter(a => !a.treated).map(alert => (
              <div key={alert.id} className={`p-5 rounded-3xl bg-white shadow-sm border-l-4 ${alert.type === 'CRITICAL' ? 'border-red-500' : 'border-yellow-500'}`}>
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-black text-gray-800 text-sm">{alert.name}</h4>
                  <span className={`text-[8px] px-2 py-1 rounded-full font-black text-white ${alert.type === 'CRITICAL' ? 'bg-red-500' : 'bg-yellow-500'}`}>{alert.type}</span>
                </div>
                <p className="text-xs text-gray-500 mb-4 font-medium">{alert.msg}</p>
                <div className="flex space-x-2">
                  <button className="flex-1 py-3 bg-indigo-50 text-indigo-600 text-[9px] font-black uppercase tracking-widest rounded-xl border border-indigo-100">Contacter</button>
                  <button onClick={() => setAlerts(alerts.map(a => a.id === alert.id ? {...a, treated: true} : a))} className="flex-1 py-3 bg-green-50 text-green-600 text-[9px] font-black uppercase tracking-widest rounded-xl border border-green-100">Traiter</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'STUDENTS' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex space-x-2 overflow-x-auto no-scrollbar pb-2">
              {CLASSES.map(c => (
                <button key={c.id} onClick={() => setSelectedClassId(c.id)} className={`whitespace-nowrap px-4 py-2 rounded-xl text-[10px] font-black transition-all ${selectedClassId === c.id ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-indigo-600 border border-indigo-100'}`}>{c.name}</button>
              ))}
            </div>
            
            <div className="bg-white rounded-[32px] shadow-sm border border-indigo-100 overflow-hidden">
               <div className="p-4 bg-indigo-50/50 flex justify-between items-center">
                  <span className="text-[10px] font-black text-indigo-700 uppercase">Effectif {CLASSES.find(c => c.id === selectedClassId)?.name}</span>
                  <span className="text-[10px] font-black text-indigo-400">{currentStudents.length} Élèves</span>
               </div>
               <div className="divide-y divide-gray-50">
                  {currentStudents.map(s => (
                    <div key={s.id} className="p-4 flex items-center space-x-4">
                       <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 text-sm font-black">
                         {s.name.split(' ').pop()?.charAt(0)}
                       </div>
                       <div>
                         <p className="text-xs font-black text-gray-800">{s.name}</p>
                         <p className="text-[9px] text-gray-400 font-bold uppercase">{s.matricule}</p>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CPEDashboard;
