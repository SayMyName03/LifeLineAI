import React, { useEffect, useState, useRef } from 'react';
import { BadgeCheck, Clock, AlertTriangle } from 'lucide-react';
// @ts-ignore - will require installation of socket.io-client
import { io } from 'socket.io-client';

interface AlertItem {
  _id: string;
  priority?: string;
  status: string;
  vitalsSummary?: string;
  symptomsSummary?: string;
  etaSeconds?: number;
  createdAt: string;
}

const statusColors: Record<string,string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  acknowledged: 'bg-blue-100 text-blue-800',
  arrived: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-200 text-gray-700'
};

const HospitalDashboard: React.FC = () => {
  const [alerts,setAlerts] = useState<AlertItem[]>([]);
  const [socketConnected,setSocketConnected] = useState(false);
  const [loading,setLoading] = useState(true);
  const socketRef = useRef<any>(null);

  useEffect(() => {
    // initial load
    fetch('http://localhost:5001/api/alerts/incoming',{ credentials: 'include'}).then(r=>{
      if(!r.ok) throw new Error('Failed to load');
      return r.json();
    }).then(data=>{
      setAlerts(data);
      setLoading(false);
    }).catch(()=> setLoading(false));

    const s = io('http://localhost:5001',{ withCredentials: true });
    socketRef.current = s;
    s.on('connect', ()=> setSocketConnected(true));
    fetch('http://localhost:5001/auth/me',{credentials:'include'}).then(r=>r.json()).then(me=>{
      if(me.user && me.user.hospitalId){
        s.emit('joinHospitalRoom', me.user.hospitalId);
      }
    });
    s.on('alert:new', (payload:any)=>{
      setAlerts(prev=> [payload.alert, ...prev]);
    });
    s.on('alert:update', (payload:any)=>{
      setAlerts(prev=> prev.map(a=> a._id === payload.alert._id ? payload.alert : a));
    });

    return () => { if(socketRef.current) socketRef.current.disconnect(); };
  },[]);

  const updateStatus = async (id:string,status:string) => {
    await fetch(`http://localhost:5001/api/alerts/${id}/status`, {
      method:'PATCH',
      headers:{'Content-Type':'application/json'},
      credentials:'include',
      body: JSON.stringify({ status })
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-medical-50 to-blue-50 dark:from-gray-900 dark:to-slate-900 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-6 text-medical-800 dark:text-medical-100 flex items-center gap-3">Hospital Dashboard <BadgeCheck className="w-6 h-6 text-emergency-500" /></h1>
        <div className="mb-4 text-sm text-gray-600 dark:text-gray-300 flex gap-4 items-center">
          <span className={socketConnected ? 'text-green-600' : 'text-red-600'}>Realtime: {socketConnected ? 'Connected' : 'Disconnected'}</span>
          <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> Updated {new Date().toLocaleTimeString()}</span>
        </div>
        {loading && <div className="text-gray-500">Loading alerts...</div>}
        {!loading && alerts.length === 0 && <div className="text-gray-500 flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-yellow-500" /> No incoming alerts.</div>}
        <div className="grid md:grid-cols-2 gap-6 mt-4">
          {alerts.map(alert => (
            <div key={alert._id} className="bg-white dark:bg-gray-800 rounded-xl shadow p-5 border border-gray-100 dark:border-gray-700">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h2 className="font-semibold text-medical-800 dark:text-medical-100">Alert #{alert._id.slice(-6)}</h2>
                  <p className="text-xs text-gray-500">{new Date(alert.createdAt).toLocaleString()}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[alert.status] || 'bg-gray-200'}`}>{alert.status}</span>
              </div>
              {alert.priority && <p className="text-sm mb-1"><strong>Priority:</strong> {alert.priority}</p>}
              {alert.vitalsSummary && <p className="text-sm mb-1"><strong>Vitals:</strong> {alert.vitalsSummary}</p>}
              {alert.symptomsSummary && <p className="text-sm mb-1"><strong>Symptoms:</strong> {alert.symptomsSummary}</p>}
              {alert.etaSeconds && <p className="text-sm mb-3"><strong>ETA:</strong> ~{Math.round(alert.etaSeconds/60)} min</p>}
              <div className="flex gap-2 mt-2">
                {alert.status === 'pending' && <button onClick={()=>updateStatus(alert._id,'acknowledged')} className="px-3 py-1 text-xs rounded bg-blue-600 text-white hover:bg-blue-700">Acknowledge</button>}
                {alert.status !== 'arrived' && <button onClick={()=>updateStatus(alert._id,'arrived')} className="px-3 py-1 text-xs rounded bg-green-600 text-white hover:bg-green-700">Mark Arrived</button>}
                {alert.status !== 'cancelled' && <button onClick={()=>updateStatus(alert._id,'cancelled')} className="px-3 py-1 text-xs rounded bg-gray-400 text-white hover:bg-gray-500">Cancel</button>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HospitalDashboard;
