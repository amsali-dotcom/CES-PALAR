
import React, { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { User, Role, PushNotification, Student, Message } from './types';
import { STUDENTS } from './mockData';
import LoginView from './views/Auth/LoginView';
import RoleSelection from './views/Auth/RoleSelection';
import RegisterView from './views/Auth/RegisterView';
import DirectorDashboard from './views/Director/DirectorDashboard';
import CPEDashboard from './views/CPE/CPEDashboard';
import TeacherDashboard from './views/Teacher/TeacherDashboard';
import ParentDashboard from './views/Parent/ParentDashboard';
import StudentDashboard from './views/Student/StudentDashboard';

const App: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [connError, setConnError] = useState<string | null>(null);
  const [pingStatus, setPingStatus] = useState<string | null>(null);
  const socketRef = React.useRef<Socket | null>(null);
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('neo_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        localStorage.removeItem('neo_user');
      }
    }
    return null;
  });

  const [currentStep, setCurrentStep] = useState<'ROLE' | 'LOGIN' | 'REGISTER' | 'DASHBOARD'>(
    user ? 'DASHBOARD' : 'ROLE'
  );
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [notifications, setNotifications] = useState<PushNotification[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [students, setStudents] = useState<Student[]>(STUDENTS);

  // Helper for resilient fetching
  const resilientFetch = async (url: string, options?: RequestInit, retries = 3): Promise<Response> => {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url, options);
        if (response.ok) return response;
        console.warn(`Fetch attempt ${i + 1} failed for ${url}: ${response.status}`);
      } catch (err) {
        console.warn(`Fetch attempt ${i + 1} errored for ${url}:`, err);
      }
      await new Promise(res => setTimeout(res, 1000 * (i + 1)));
    }
    throw new Error(`Failed to fetch ${url} after ${retries} attempts`);
  };

  const checkConnectivity = async () => {
    try {
      setPingStatus("Vérification...");
      const res = await fetch('/api/ping');
      if (res.ok) {
        setPingStatus("Serveur OK");
      } else {
        setPingStatus(`Erreur HTTP ${res.status}`);
      }
    } catch (err) {
      console.error("Ping failed:", err);
      setPingStatus("Serveur injoignable");
    }
  };

  // Initial data fetch
  const fetchData = useCallback(async () => {
    console.log("Fetching initial data...");
    try {
      const [notifsRes, studentsRes] = await Promise.all([
        resilientFetch('/api/notifications/all'),
        resilientFetch('/api/students')
      ]);
      
      const notifsData = await notifsRes.json();
      setNotifications(notifsData);
      console.log("Notifications fetched:", notifsData.length);
      
      const studentsData = await studentsRes.json();
      setStudents(studentsData);
      console.log("Students fetched:", studentsData.length);

      if (user?.uniqueId) {
        const messagesRes = await resilientFetch(`/api/messages/${user.uniqueId}`);
        const messagesData = await messagesRes.json();
        setMessages(messagesData);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      setConnError("Erreur de chargement des données. Vérifiez votre connexion.");
    }
  }, [user?.uniqueId]);

  useEffect(() => {
    console.log("App initialized. API Key present:", !!process.env.GEMINI_API_KEY);
    const init = async () => {
      await fetchData();
    };
    init();

    // Initialize Socket.io
    if (!socketRef.current) {
      console.log(`Initializing socket connection to ${window.location.origin}...`);
      socketRef.current = io(window.location.origin, {
        path: "/api/socket.io/",
        transports: ['websocket', 'polling'], // Try websocket first
        reconnectionAttempts: 50,
        reconnectionDelay: 2000,
        reconnectionDelayMax: 10000,
        timeout: 60000,
        autoConnect: true,
      });
    }

    const socket = socketRef.current;

    const onConnect = () => {
      console.log("Socket connected:", socket.id, "Transport:", socket.io.engine.transport.name);
      setIsConnected(true);
      setConnError(null);
      if (user?.uniqueId) {
        socket.emit('join', user.uniqueId);
      }
    };

    const onDisconnect = (reason: string) => {
      console.log("Socket disconnected:", reason);
      setIsConnected(false);
      setConnError(reason);
    };

    const onConnectError = (err: unknown) => {
      const error = err as { message?: string; description?: string; context?: unknown };
      console.error("Socket connection error:", error.message, error.description, error.context);
      setIsConnected(false);
      setConnError(error.message || "Connection error");
    };

    const onNotification = (newNotif: PushNotification) => {
      setNotifications(prev => {
        if (prev.find(n => n.id === newNotif.id)) return prev;
        return [newNotif, ...prev].slice(0, 100);
      });
    };

    const onStudentsUpdated = (updatedStudents: Student[]) => {
      setStudents(updatedStudents);
    };

    const onNewMessage = (msg: Message) => {
      setMessages(prev => {
        if (prev.find(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);
    socket.on('notification', onNotification);
    socket.on('students_updated', onStudentsUpdated);
    socket.on('new_message', onNewMessage);

    // If already connected (e.g. from a previous mount if we didn't disconnect)
    if (socket.connected) {
      setTimeout(() => setIsConnected(true), 0);
      if (user?.uniqueId) {
        socket.emit('join', user.uniqueId);
      }
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
      socket.off('notification', onNotification);
      socket.off('students_updated', onStudentsUpdated);
      socket.off('new_message', onNewMessage);
    };
  }, [fetchData, user?.uniqueId]);

  const sendMessage = async (msg: Omit<Message, 'id' | 'timestamp'>) => {
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(msg)
      });
      if (response.ok) {
        const newMsg = await response.json();
        setMessages(prev => [...prev, newMsg]);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const addNotification = async (notif: Omit<PushNotification, 'id' | 'timestamp'>) => {
    console.log("Sending notification:", notif.title);
    try {
      const response = await resilientFetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notif)
      });
      
      await response.json();
      console.log("Notification sent successfully");
    } catch (error) {
      console.error("Failed to send notification:", error);
      // Fallback: if fetch fails, try to emit via socket if connected
      if (isConnected && socketRef.current) {
        console.log("Attempting fallback socket emit for notification");
        socketRef.current.emit('send_notification', notif);
      }
    }
  };

  const updateNotification = async (notifId: string, updates: Partial<PushNotification>) => {
    try {
      const response = await fetch(`/api/notifications/${notifId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      
      if (response.ok) {
        setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, ...updates } : n));
      }
    } catch (error) {
      console.error("Failed to update notification:", error);
    }
  };

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role);
    setCurrentStep('LOGIN');
  };

  const handleAuthSuccess = (userData: User) => {
    setUser(userData);
    localStorage.setItem('neo_user', JSON.stringify(userData));
    setCurrentStep('DASHBOARD');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('neo_user');
    setCurrentStep('ROLE');
  };

  const renderDashboard = () => {
    if (!user) return null;
    
    const studentsSource = students;

    const userNotifs = notifications.filter(n => {
      if (user.role === 'STUDENT') {
        const student = studentsSource.find(s => s.matricule === user.uniqueId);
        const studentClassId = student?.classId;
        return n.recipientId === user.uniqueId || (studentClassId && n.recipientId === studentClassId);
      }
      if (user.role === 'PARENT') {
        const myChildren = studentsSource.filter(s => user.childrenIds?.includes(s.matricule));
        const childrenClassIds = myChildren.map(c => c.classId);
        return n.recipientId === user.uniqueId || 
               user.childrenIds?.includes(n.recipientId) ||
               childrenClassIds.some(id => n.recipientId === id);
      }
      return n.recipientId === user.uniqueId;
    });

    switch (user.role) {
      case 'DIRECTOR': return <DirectorDashboard user={user} onLogout={handleLogout} onSendNotification={addNotification} allNotifications={notifications} students={students} />;
      case 'CPE': return <CPEDashboard user={user} onLogout={handleLogout} onSendNotification={addNotification} students={students} />;
      case 'TEACHER': return <TeacherDashboard user={user} onLogout={handleLogout} onSendNotification={addNotification} students={students} messages={messages} onSendMessage={sendMessage} />;
      case 'PARENT': return <ParentDashboard user={user} onLogout={handleLogout} notifications={userNotifs} onUpdateNotification={updateNotification} students={students} />;
      case 'STUDENT': return <StudentDashboard user={user} onLogout={handleLogout} notifications={userNotifs} students={students} messages={messages} onSendMessage={sendMessage} />;
      default: return null;
    }
  };

  return (
    <div className="mobile-container relative bg-[#050505]">
      <div className="bg-black text-emerald-400 text-[10px] font-black py-1 text-center uppercase z-[10000] relative border-b border-emerald-900/30">
        💎 NÉO v2.6.1 - ÉDITION SÉCURISÉE 💎
      </div>
      <div className="absolute bottom-1 left-1 z-[9999] opacity-10 pointer-events-none">
        <span className="text-[6px] font-bold text-slate-500">v2.6.1-dark</span>
      </div>
      {isConnected && (
        <div className="absolute top-2 right-2 z-[9999] flex items-center space-x-1 bg-white/80 backdrop-blur-md px-2 py-1 rounded-full border border-emerald-100 shadow-sm">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
          <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">
            Live Sync ({socketRef.current?.io.engine.transport.name || '...'})
          </span>
        </div>
      )}
      {!isConnected && (
        <div className="absolute top-2 right-2 z-[9999] flex flex-col items-end space-y-1">
          <div className="flex items-center space-x-1 bg-white/80 backdrop-blur-md px-2 py-1 rounded-full border border-red-100 shadow-sm">
            <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
            <span className="text-[8px] font-black text-red-600 uppercase tracking-widest">Offline</span>
          </div>
          {connError && (
            <div className="flex flex-col items-end bg-white/90 p-2 rounded-xl border border-red-100 shadow-xl max-w-[200px]">
              <span className="text-[7px] font-bold text-red-500 uppercase mb-1">Détails de l'erreur</span>
              <span className="text-[9px] text-slate-600 leading-tight mb-2">
                {connError}
              </span>
              <div className="flex flex-wrap justify-end gap-1">
                <button 
                  onClick={checkConnectivity}
                  className="text-[7px] font-black bg-emerald-50 text-emerald-600 px-2 py-1 rounded-md hover:bg-emerald-100 transition-colors"
                >
                  {pingStatus || "Tester API"}
                </button>
                <button 
                  onClick={() => {
                    setConnError("Reconnexion...");
                    socketRef.current?.connect();
                  }}
                  className="text-[7px] font-black bg-blue-50 text-blue-600 px-2 py-1 rounded-md hover:bg-blue-100 transition-colors"
                >
                  Réessayer
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      {currentStep === 'ROLE' && <RoleSelection onSelect={handleRoleSelect} />}
      {currentStep === 'LOGIN' && selectedRole && (
        <LoginView 
          role={selectedRole}
          onSuccess={handleAuthSuccess} 
          onRegister={() => setCurrentStep('REGISTER')}
          onBack={() => setCurrentStep('ROLE')} 
        />
      )}
      {currentStep === 'REGISTER' && selectedRole && (
        <RegisterView 
          role={selectedRole} 
          onSuccess={handleAuthSuccess} 
          onBack={() => setCurrentStep('LOGIN')} 
        />
      )}
      {currentStep === 'DASHBOARD' && renderDashboard()}
    </div>
  );
};

export default App;
