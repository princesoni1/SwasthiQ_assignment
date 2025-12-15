import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  User, 
  Plus,
  ChevronLeft,
  ChevronRight,
  X,
  Menu,
  Users,
  MessageSquare,
  PieChart,
  Settings,
  Layout, 
  List
} from 'lucide-react';

// --- SUB-COMPONENT: RIGHT PANEL (Now defined OUTSIDE to fix focus bug) ---
const RightPanel = ({ isOpen, onClose, formData, setFormData, onSubmit, selectedDate }) => {
  return (
    <div className={`fixed inset-y-0 right-0 w-96 bg-white shadow-2xl transform transition-transform duration-300 z-50 flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      
      {/* Header */}
      <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
        <h3 className="font-semibold text-gray-700">New Appointment</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        
        {/* Title / Reason */}
        <div>
           <input 
             type="text" 
             placeholder="Add Title (e.g. General Checkup)"
             className="w-full text-lg font-medium border-b-2 border-gray-200 focus:border-blue-500 outline-none pb-2 placeholder-gray-400"
             value={formData.title} 
             onChange={e => setFormData({...formData, title: e.target.value})}
           />
        </div>

        {/* Date & Time */}
        <div className="space-y-4">
           <div className="flex items-center gap-4 text-gray-600">
             <Clock size={18} />
             <div className="flex-1 grid grid-cols-2 gap-2">
                <input 
                  type="date" 
                  value={formData.date || selectedDate} 
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => setFormData({...formData, date: e.target.value})} 
                  className="text-sm border rounded p-1.5 bg-gray-50 outline-none focus:ring-1 focus:ring-blue-500"
                />
                <input 
                  type="time" 
                  value={formData.time} 
                  onChange={e => setFormData({...formData, time: e.target.value})}
                  className="text-sm border rounded p-1.5 bg-gray-50 outline-none focus:ring-1 focus:ring-blue-500"
                />
             </div>
           </div>
           
           {/* Duration */}
           <div className="flex items-center gap-4 text-gray-600">
             <div className="w-[18px]"></div>
             <select 
                className="text-sm border rounded p-1.5 bg-gray-50 w-full outline-none focus:ring-1 focus:ring-blue-500"
                value={formData.duration} 
                onChange={e => setFormData({...formData, duration: e.target.value})}
             >
                <option>15 min</option>
                <option>30 min</option>
                <option>45 min</option>
                <option>60 min</option>
             </select>
           </div>
        </div>

        <hr className="border-gray-100" />

        {/* Patient Details */}
        <div className="space-y-4">
            <div className="flex items-center gap-4 text-gray-600">
                <User size={18} />
                <input 
                  type="text" 
                  placeholder="Add patient name" 
                  className="w-full text-sm outline-none border-b border-transparent focus:border-gray-200 py-1"
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                />
            </div>
            
            {/* Phone (Now Functional with validation) */}
            <div className="flex items-center gap-4 text-gray-400">
                <span className="w-[18px] text-center">📞</span>
                <input 
                  type="tel" 
                  placeholder="Add phone number" 
                  className="w-full text-sm outline-none border-b border-transparent focus:border-gray-200 py-1" 
                  value={formData.phone}
                  onChange={e => {
                    const value = e.target.value.replace(/[^\d\s\-\(\)]/g, '');
                    setFormData({...formData, phone: value});
                  }}
                  pattern="[\d\s\-\(\)]+"
                  title="Please enter numbers only"
                />
            </div>

            {/* Email (Now Functional with validation) */}
            <div className="flex items-center gap-4 text-gray-400">
                <span className="w-[18px] text-center">✉️</span>
                <input 
                  type="email" 
                  placeholder="Add email address" 
                  className="w-full text-sm outline-none border-b border-transparent focus:border-gray-200 py-1" 
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  pattern="[^\s@]+@[^\s@]+\.[^\s@]+"
                  title="Please enter a valid email address"
                />
            </div>
        </div>

        <hr className="border-gray-100" />

        {/* Doctor Selection */}
        <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold">DR</div>
            <div className="flex-1">
                <label className="text-xs text-gray-500 block">Doctor</label>
                <select 
                    className="w-full bg-transparent font-medium text-sm outline-none cursor-pointer"
                    value={formData.doctorName} 
                    onChange={e => setFormData({...formData, doctorName: e.target.value})}
                >
                    <option>Dr. Rajesh Kumar</option>
                    <option>Dr. Priya Sharma</option>
                </select>
            </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t flex justify-end gap-2 bg-gray-50">
        <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
        <button onClick={onSubmit} className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm">
            Save
        </button>
      </div>
    </div>
  );
};


// --- MAIN DASHBOARD COMPONENT ---
const AppointmentDashboard = () => {
  // --- STATE ---
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); 
  const [selectedDate, setSelectedDate] = useState(''); 
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  
  // Added phone & email to state
  const [newAppt, setNewAppt] = useState({
    name: '', 
    title: '',
    time: '09:00', 
    date: '',      
    duration: '30 min', 
    doctorName: 'Dr. Rajesh Kumar', 
    phone: '',
    email: '',
    mode: 'In-Person' // Default mode to prevent backend errors
  });

  // --- API CALLS ---
  const fetchConfig = async () => {
    try {
      const response = await fetch('http://127.0.0.1:5000/config');
      const data = await response.json();
      if (data.current_date) {
        setSelectedDate(data.current_date);
        setCurrentMonth(new Date(data.current_date));
        setNewAppt(prev => ({...prev, date: data.current_date}));
      }
    } catch (err) {
      console.error("Config fetch failed");
      const today = new Date().toISOString().split('T')[0];
      setSelectedDate(today);
      setNewAppt(prev => ({...prev, date: today}));
    }
  };

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://127.0.0.1:5000/appointments`);
      const data = await response.json();
      setAppointments(data);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  const createAppointment = async () => {
    // Validation
    if (!newAppt.name && !newAppt.title) {
      alert("Please enter a patient name or appointment title");
      return;
    }

    if (newAppt.phone && !/^\d+$/.test(newAppt.phone.replace(/[\s\-\(\)]/g, ''))) {
      alert("Please enter a valid phone number (numbers only)");
      return;
    }

    if (newAppt.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newAppt.email)) {
      alert("Please enter a valid email address");
      return;
    }

    try {
      const [hours, minutes] = newAppt.time.split(':');
      const hours12 = hours % 12 || 12;
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const formattedTime = `${String(hours12).padStart(2, '0')}:${minutes} ${ampm}`;

      const finalDate = newAppt.date || selectedDate;

      const payload = { 
        ...newAppt, 
        name: newAppt.name || newAppt.title || 'New Patient',
        time: formattedTime, 
        date: finalDate,  
        status: 'Scheduled',
        mode: 'In-Person' // FIX: Ensure mode is sent to backend
      };

      const response = await fetch('http://127.0.0.1:5000/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok && response.status !== 409) {
        throw new Error('Failed to create appointment');
      }

      const result = await response.json();

      if (response.status === 409) {
        const useSuggestion = window.confirm(
          `⚠️ Doctor is busy!\nEarliest slot: ${result.suggested_time}.\nBook for ${result.suggested_time}?`
        );
        if (useSuggestion) {
            const [timeStr, period] = result.suggested_time.split(' ');
            let [h, m] = timeStr.split(':');
            h = parseInt(h);
            if (period === 'PM' && h !== 12) h += 12;
            if (period === 'AM' && h === 12) h = 0;
            const newTimeStr = `${String(h).padStart(2, '0')}:${m}`;
            setNewAppt({ ...newAppt, time: newTimeStr, date: finalDate });
        }
        return; 
      }

      // Success case
      setIsPanelOpen(false); 
      await fetchAppointments();
      setNewAppt({ 
          name: '', title: '', time: '09:00', date: selectedDate, 
          duration: '30 min', doctorName: 'Dr. Rajesh Kumar', phone: '', email: '',
          mode: 'In-Person' // Reset mode as well
      });
      alert("Appointment created successfully!");
    } catch (err) {
      console.error("Error creating appointment:", err);
      alert("Failed to create appointment. Please try again.");
    }
  };

  useEffect(() => {
    fetchConfig().then(() => fetchAppointments());
  }, []);

  // --- HELPER FUNCTIONS ---
  const changeDate = (days) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + days);
    const newDateStr = current.toISOString().split('T')[0];
    setSelectedDate(newDateStr);
    setCurrentMonth(new Date(newDateStr)); 
    setNewAppt(prev => ({...prev, date: newDateStr}));
  };

  const changeMonth = (offset) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + offset);
    setCurrentMonth(newMonth);
  };

  const handleMiniCalendarClick = (day) => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const offset = newDate.getTimezoneOffset();
    const correctedDate = new Date(newDate.getTime() - (offset*60*1000));
    const newDateStr = correctedDate.toISOString().split('T')[0];
    setSelectedDate(newDateStr);
    setNewAppt(prev => ({...prev, date: newDateStr}));
  };

  const getDaysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  // Grid Math
  const getPositionFromTime = (timeStr) => {
    const startHour = 7; 
    const pxPerHour = 80; 
    const [t, period] = timeStr.split(' ');
    let [h, m] = t.split(':').map(Number);
    if (period === 'PM' && h !== 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    return ((h + (m / 60)) - startHour) * pxPerHour;
  };

  const getHeightFromDuration = (durationStr) => {
    return (parseInt(durationStr.replace(' min', '')) / 60) * 80;
  };

  const timeSlots = Array.from({ length: 12 }, (_, i) => i + 7);

  const getFilteredAppointments = () => {
    if (!selectedDate) return appointments;
    return appointments.filter(a => a.date === selectedDate);
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-900 overflow-hidden relative">
      
      {/* SIDEBAR */}
      <aside className={`md:flex w-64 bg-white border-r border-gray-200 flex-col z-10 h-full ${isSidebarOpen ? 'fixed inset-y-0 left-0 shadow-xl' : 'hidden'}`}>
        <div className="p-6 flex items-center gap-2 text-indigo-600 font-bold text-xl">
           <Calendar className="w-6 h-6" /> MediCare
        </div>
        
        <nav className="flex-1 px-4 space-y-1">
             <button className="w-full flex items-center gap-3 px-3 py-2 text-indigo-600 bg-indigo-50 rounded-lg font-medium text-sm">
                <Calendar size={18}/> Calendar
             </button>
             <button onClick={() => alert("Patients Module coming soon!")} className="w-full flex items-center gap-3 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg font-medium text-sm transition-colors">
                <Users size={18}/> Patients
             </button>
             <button onClick={() => alert("Messages Module coming soon!")} className="w-full flex items-center gap-3 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg font-medium text-sm transition-colors">
                <MessageSquare size={18}/> Messages
             </button>
             <button onClick={() => alert("Analytics Module coming soon!")} className="w-full flex items-center gap-3 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg font-medium text-sm transition-colors">
                <PieChart size={18}/> Analytics
             </button>
             <div className="mt-8 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">System</div>
             <button onClick={() => alert("Settings Module coming soon!")} className="w-full flex items-center gap-3 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg font-medium text-sm transition-colors">
                <Settings size={18}/> Settings
             </button>
        </nav>

        {/* Mini Calendar Widget */}
        <div className="p-4">
            <div className="bg-gray-50 rounded-xl p-3 border">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-gray-700">{currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
                    <div className="flex gap-1">
                        <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-gray-200 rounded text-gray-500"><ChevronLeft size={12}/></button>
                        <button onClick={() => changeMonth(1)} className="p-1 hover:bg-gray-200 rounded text-gray-500"><ChevronRight size={12}/></button>
                    </div>
                </div>
                <div className="grid grid-cols-7 gap-1 text-[10px] text-center">
                    {['S','M','T','W','T','F','S'].map(d => <span key={d} className="text-gray-400 font-semibold">{d}</span>)}
                    {[...Array(getFirstDayOfMonth(currentMonth))].map((_, i) => <div key={`empty-${i}`} className="p-1"></div>)}
                    {[...Array(getDaysInMonth(currentMonth))].map((_, i) => {
                         const d = i + 1;
                         const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth()+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
                         return (
                            <button key={d} onClick={() => handleMiniCalendarClick(d)}
                                className={`p-1 rounded-full hover:bg-blue-100 ${selectedDate === dateStr ? 'bg-blue-600 text-white font-bold' : 'text-gray-700'}`}>
                                {d}
                            </button>
                         );
                    })}
                </div>
            </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col h-full relative w-full overflow-hidden">
        
        <header className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center gap-4">
             <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="md:hidden p-2"><Menu/></button>
             <h2 className="text-xl font-bold text-gray-800">Calendar</h2>
             
             <div className="flex items-center bg-gray-100 rounded-lg p-1 ml-4">
                <button onClick={() => changeDate(-1)} className="p-1 hover:bg-white rounded shadow-sm cursor-pointer"><ChevronLeft size={16}/></button>
                <span className="px-3 text-sm font-medium">{selectedDate}</span>
                <button onClick={() => changeDate(1)} className="p-1 hover:bg-white rounded shadow-sm cursor-pointer"><ChevronRight size={16}/></button>
             </div>
          </div>

          <div className="flex items-center gap-3">
             <div className="flex bg-gray-100 rounded-lg p-1">
                 <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded ${viewMode==='grid' ? 'bg-white shadow-sm' : 'text-gray-500'}`}><Layout size={18}/></button>
                 <button onClick={() => setViewMode('list')} className={`p-1.5 rounded ${viewMode==='list' ? 'bg-white shadow-sm' : 'text-gray-500'}`}><List size={18}/></button>
             </div>
             <button onClick={() => setIsPanelOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-blue-700">
                <Plus size={16} /> Create
             </button>
          </div>
        </header>

        {/* CONTENT AREA */}
        <div className="flex-1 overflow-y-auto bg-white relative">
            
            {/* --- GRID VIEW --- */}
            {viewMode === 'grid' && (
                <div className="flex min-w-[600px] min-h-full relative">
                    <div className="w-16 border-r border-gray-100 flex-shrink-0 bg-white z-20 sticky left-0 h-auto">
                        {timeSlots.map(hour => (
                            <div key={hour} className="absolute right-2 text-xs text-gray-400 font-medium"
                                style={{ top: `${(hour - 7) * 80}px`, transform: 'translateY(-50%)' }}>
                                {hour > 12 ? hour - 12 : hour} {hour >= 12 ? 'PM' : 'AM'}
                            </div>
                        ))}
                    </div>

                    <div className="flex-1 relative bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-gray-50/30">
                        {timeSlots.map(hour => (
                            <div key={hour} className="h-20 border-b border-gray-100 w-full box-border"></div>
                        ))}

                        {getFilteredAppointments().map((appt, idx) => {
                             const top = getPositionFromTime(appt.time);
                             const height = getHeightFromDuration(appt.duration);
                             const isSmall = parseInt(appt.duration.replace(' min', '')) <= 20;
                             const colors = ['bg-blue-500 border-blue-600 text-white', 'bg-orange-400 border-orange-500 text-white', 'bg-purple-500 border-purple-600 text-white'];

                             if (top < 0) return null; 

                             return (
                                <div key={appt.id} 
                                     className={`absolute left-4 right-4 rounded md:rounded-lg shadow-sm border-l-4 opacity-90 hover:opacity-100 transition-all cursor-pointer z-10 ${colors[idx % 3]} overflow-hidden`}
                                     style={{ top: `${top}px`, height: `${height}px` }}>
                                    <div className="h-full flex flex-col justify-center px-2">
                                        {isSmall ? (
                                            <div className="flex items-center text-xs leading-none w-full">
                                                <span className="font-bold truncate mr-1">{appt.name}</span>
                                                <span className="hidden md:inline opacity-90 whitespace-nowrap text-[10px]">• {appt.time}</span>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="font-bold text-xs md:text-sm truncate leading-tight">{appt.name}</div>
                                                <div className="opacity-90 text-[10px] md:text-xs truncate mt-0.5">{appt.time} - {appt.duration}</div>
                                            </>
                                        )}
                                    </div>
                                </div>
                             );
                        })}
                    </div>
                </div>
            )}

            {/* --- LIST VIEW --- */}
            {viewMode === 'list' && (
                <div className="p-8 space-y-4">
                    {getFilteredAppointments().map(appt => (
                        <div key={appt.id} className="bg-white border rounded-xl p-4 flex justify-between items-center shadow-sm">
                            <div>
                                <h3 className="font-bold text-lg">{appt.name}</h3>
                                <div className="text-gray-500 text-sm flex gap-2">
                                    <span>{appt.time}</span> • <span>{appt.doctorName}</span>
                                </div>
                            </div>
                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">{appt.status}</span>
                        </div>
                    ))}
                    {getFilteredAppointments().length === 0 && <div className="text-center text-gray-400 mt-20">No appointments for this day.</div>}
                </div>
            )}
        </div>
      </main>

      {/* RENDER THE SUB-COMPONENT HERE, passing all necessary props */}
      <RightPanel 
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        formData={newAppt}
        setFormData={setNewAppt}
        onSubmit={createAppointment}
        selectedDate={selectedDate}
      />
      
      {isPanelOpen && <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setIsPanelOpen(false)}></div>}
    </div>
  );
};

export default AppointmentDashboard;