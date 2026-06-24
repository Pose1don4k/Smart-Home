import { useState, useEffect } from 'react';

const IP = '127.0.0.1';

function App() {
  const [data, setData] = useState({ moisture: 0, valve_position: 0, power: 'OFF' });

  const fetchData = async () => {
    try {
      const res = await fetch(`http://${IP}:1880/api/data`);
      const json = await res.json();
      setData(json);
    } catch (e) { console.error("OFFLINE"); }
  };

  const sendCmd = async (type, value) => {
    try {
      await fetch(`http://${IP}:1880/api/cmd`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, value })
      });
      fetchData();
    } catch (e) {}
  };

  useEffect(() => {
    fetchData();
    const timer = setInterval(fetchData, 1000);
    return () => clearInterval(timer);
  }, []);

  // Цветовая логика
  const isAlarm = data.moisture >= 80;
  const isWarning = data.moisture > 30 && data.moisture < 80;
  
  const statusColor = isAlarm ? 'bg-red-600' : (isWarning ? 'bg-orange-500' : 'bg-sky-600');
  const textColor = isAlarm ? 'text-red-600' : (isWarning ? 'text-orange-600' : 'text-sky-600');

  // Параметры Gauge
  const moistureValue = Math.min(100, Math.max(0, data.moisture));
  const radius = 90;
  const circumference = radius * Math.PI;
  const offset = circumference * (1 - moistureValue / 100);

  return (
    <div className="h-screen flex flex-col bg-slate-50 font-sans overflow-hidden">
      
      {/* Цветная динамическая шапка */}
      <div className={`${statusColor} h-20 flex items-center px-6 shadow-lg shrink-0 transition-colors duration-500`}>
        <div className="flex flex-col">
          <h1 className="text-white font-black text-xl tracking-tight uppercase leading-none">Neptun Smart</h1>
        </div>
      </div>

      <div className="flex-1 flex flex-col p-4 gap-4">
        
        {/* Индикатор - Мониторинг */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-6 flex flex-col items-center">
          <h2 className={`${textColor} font-black text-xs uppercase tracking-[0.2em] mb-4 transition-colors`}>Уровень влажности</h2>
          
          <div className="relative">
            <svg width="220" height="120" viewBox="0 0 200 110">
              <path d="M 10 100 A 90 90 0 0 1 190 100" fill="none" stroke="#f1f5f9" strokeWidth="20" strokeLinecap="round" />
              <path
                d="M 10 100 A 90 90 0 0 1 190 100"
                fill="none"
                stroke="currentColor"
                strokeWidth="20"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                className={`${textColor} transition-all duration-1000 ease-out`}
              />
              <text x="100" y="85" textAnchor="middle" className="text-5xl font-black fill-slate-800">{Math.round(moistureValue)}</text>
              <text x="100" y="105" textAnchor="middle" className="text-[10px] font-black fill-slate-400 uppercase tracking-widest">%</text>
            </svg>
          </div>
        </div>

        {/* Панель управления */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-6 flex-1 flex flex-col">
          <h2 className="text-slate-400 font-black text-xs uppercase tracking-[0.2em] mb-6">Управление</h2>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <button onClick={() => sendCmd('power', 'ON')} className="bg-sky-500 text-white h-14 rounded-2xl font-black text-[10px] active:scale-95 transition-all shadow-lg shadow-sky-200 uppercase tracking-widest">Power ON</button>
            <button onClick={() => sendCmd('power', 'OFF')} className="bg-slate-800 text-white h-14 rounded-2xl font-black text-[10px] active:scale-95 transition-all uppercase tracking-widest">Power OFF</button>
            
            <button onClick={() => sendCmd('control', 'OPEN')} className="bg-emerald-500 text-white h-14 rounded-2xl font-black text-[10px] active:scale-95 transition-all shadow-lg shadow-emerald-200 uppercase tracking-widest">Open Valve</button>
            <button onClick={() => sendCmd('control', 'CLOSE')} className="bg-rose-500 text-white h-14 rounded-2xl font-black text-[10px] active:scale-95 transition-all shadow-lg shadow-rose-200 uppercase tracking-widest text-center">Close Valve</button>
          </div>

          {/* Статус-панель */}
          <div className="mt-auto space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Связь:</span>
              <span className={`text-[10px] font-black uppercase ${data.power === 'ON' ? 'text-emerald-500' : 'text-rose-500'}`}>
                {data.power === 'ON' ? 'Active' : 'Offline'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Кран:</span>
              <span className={`text-[10px] font-black uppercase ${data.valve_position === 1 ? 'text-rose-500' : 'text-emerald-500'}`}>
                 {data.valve_position === 1 ? 'Open' : 'Safe'}
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default App;