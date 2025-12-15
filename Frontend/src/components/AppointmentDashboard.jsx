import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  Video, 
  MapPin, 
  MoreVertical, 
  Search,
  Filter,
  Plus,
  ChevronLeft,
  ChevronRight,
  X,
  Menu,       // New: For Mobile Menu
  Users,      // New: Sidebar Icon
  MessageSquare, // New: Sidebar Icon
  PieChart,   // New: Sidebar Icon
  Settings,   // New: Sidebar Icon
  LogOut      // New: Sidebar Icon
} from 'lucide-react';

const AppointmentDashboard = () => {
  // --- STATE ---
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter States
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // UI States (NEW)
  const [isSidebarOpen, setSidebarOpen] = useState(false); // Mobile sidebar toggle
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAppt, setNewAppt] = useState({
    name: '', 
    time: '09:00', // Changed from '09:00 AM' to '09:00' for <input type="time">
    date: '',      // Will be filled when modal opens
    duration: '30 min', 
    doctorName: 'Dr. Rajesh Kumar', 
    mode: 'In-Person', 
    reason: ''
  });

  // --- API CALLS (Same as before) ---
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

  const updateStatus = async (id, newStatus) => {
    try {
      const response = await fetch(`http://127.0.0.1:5000/appointments/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (response.ok) fetchAppointments();
    } catch (err) {
      alert("Failed to update status");
    }
  };

  const createAppointment = async (e) => {
    e.preventDefault();
    try {
      // 1. Format Time (HH:MM -> 02:30 PM)
      const [hours, minutes] = newAppt.time.split(':');
      const hours12 = hours % 12 || 12;
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const formattedTime = `${String(hours12).padStart(2, '0')}:${minutes} ${ampm}`;

      // 2. Prepare Payload (FIXED DATE LOGIC HERE)
      // Use the user's selected date, or fallback to the current dashboard date
      const finalDate = newAppt.date || selectedDate;

      const payload = { 
        ...newAppt, 
        time: formattedTime, 
        date: finalDate,  // <--- This was the bug!
        status: 'Scheduled' 
      };

      const response = await fetch('http://127.0.0.1:5000/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      // --- CONFLICT HANDLING (Improved) ---
      if (response.status === 409) {
        const useSuggestion = window.confirm(
          `⚠️ Doctor is busy at that time!\n\nEarliest available slot is: ${result.suggested_time}.\n\nDo you want to book for ${result.suggested_time} instead?`
        );
        
        if (useSuggestion) {
            // Convert "02:30 PM" back to "14:30" for the input field
            const [timeStr, period] = result.suggested_time.split(' ');
            let [h, m] = timeStr.split(':');
            h = parseInt(h);
            
            if (period === 'PM' && h !== 12) h += 12;
            if (period === 'AM' && h === 12) h = 0;
            
            // Format as HH:MM string (padded)
            const newTimeStr = `${String(h).padStart(2, '0')}:${m}`;
            
            setNewAppt({ ...newAppt, time: newTimeStr, date: finalDate });
        }
        return; 
      }

      if (response.ok) {
        setIsModalOpen(false);
        fetchAppointments();
        // Reset form but keep the current date context
        setNewAppt({ 
            name: '', 
            time: '09:00', 
            date: '', // Reset to empty so it falls back to selectedDate next time
            duration: '30 min', 
            doctorName: 'Dr. Rajesh Kumar', 
            mode: 'In-Person', 
            reason: '' 
        });
      }
    } catch (err) {
      console.error(err);
      alert("Failed to create appointment");
    }
  };
  // --- NEW: Fetch Config on Load for Simulated Date ---
  // 1. Function to get the simulation date from backend
    const fetchConfig = async () => {
      try {
        const response = await fetch('http://127.0.0.1:5000/config');
        const data = await response.json();
        
        if (data.current_date) {
          console.log("📅 Syncing with Server Date:", data.current_date);
          
          // Update the selected date to the simulation date
          setSelectedDate(data.current_date);
          
          // Update the calendar view to that month
          setCurrentMonth(new Date(data.current_date));
        }
      } catch (err) {
        console.error("⚠️ Config fetch failed, defaulting to local time");
      }
    };

    // 2. Updated useEffect: Runs once on page load
    useEffect(() => {
      // We fetch config first (to set the date), THEN fetch the data
      fetchConfig().then(() => {
        fetchAppointments();
      });
    }, []);

  // useEffect(() => {
  //   fetchAppointments();
  // }, []);

  // --- FILTER LOGIC (Same as before) ---
  const getFilteredAppointments = () => {
    let filtered = appointments;

    if (searchQuery) {
      filtered = filtered.filter(a => 
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.doctorName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    const todayStr = new Date().toISOString().split('T')[0];
    
    if (activeTab === 'Today') {
      filtered = filtered.filter(a => a.date === todayStr);
    } else if (activeTab === 'Upcoming') {
      filtered = filtered.filter(a => a.date > todayStr);
    } else if (activeTab === 'Past') {
      filtered = filtered.filter(a => a.date < todayStr);
    } else {
      if (selectedDate && activeTab === 'All') {
        filtered = filtered.filter(a => a.date === selectedDate);
      }
    }
    return filtered;
  };

  // --- CALENDAR HELPERS ---
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  };

  const changeMonth = (offset) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1));
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-purple-100 text-purple-800 border-purple-200';
    }
  };

  // --- NEW: SIDEBAR COMPONENT (To reuse in Mobile/Desktop) ---
  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6">
        <h1 className="text-xl font-bold flex items-center gap-2 text-indigo-600">
          <CalendarIcon className="w-6 h-6" />
          MediCare
        </h1>
      </div>

      {/* Navigation Links (Visual Only) */}
      {/* Navigation Links */}
      <nav className="flex-1 px-4 space-y-1">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">Main</div>
        
        {/* Active Tab (Schedule) */}
        <button className="w-full flex items-center gap-3 px-3 py-2 text-indigo-600 bg-indigo-50 rounded-lg font-medium transition-colors">
          <CalendarIcon size={18} /> Schedule
        </button>

        {/* Inactive Tabs (Placeholders) */}
        {/* We use a simple onclick to show they are recognized but not built yet */}
        <button onClick={() => alert("Patients module coming soon!")} className="w-full flex items-center gap-3 px-3 py-2 text-gray-600 hover:bg-gray-50 hover:text-indigo-600 rounded-lg font-medium transition-colors">
          <Users size={18} /> Patients
        </button>
        
        <button onClick={() => alert("Messages module coming soon!")} className="w-full flex items-center gap-3 px-3 py-2 text-gray-600 hover:bg-gray-50 hover:text-indigo-600 rounded-lg font-medium transition-colors">
          <MessageSquare size={18} /> Messages
          <span className="ml-auto bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">3</span>
        </button>
        
        <button onClick={() => alert("Analytics module coming soon!")} className="w-full flex items-center gap-3 px-3 py-2 text-gray-600 hover:bg-gray-50 hover:text-indigo-600 rounded-lg font-medium transition-colors">
          <PieChart size={18} /> Analytics
        </button>

        <div className="mt-8 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">System</div>
        
        <button onClick={() => alert("Settings module coming soon!")} className="w-full flex items-center gap-3 px-3 py-2 text-gray-600 hover:bg-gray-50 hover:text-indigo-600 rounded-lg font-medium transition-colors">
          <Settings size={18} /> Settings
        </button>
      </nav>

      {/* Calendar Widget */}
      <div className="p-4">
        <div className="bg-gray-50 border rounded-xl p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-sm">
              {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h3>
            <div className="flex gap-1">
              <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-gray-200 rounded"><ChevronLeft size={14} /></button>
              <button onClick={() => changeMonth(1)} className="p-1 hover:bg-gray-200 rounded"><ChevronRight size={14} /></button>
            </div>
          </div>
          
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] mb-2 text-gray-400 font-bold">
            {['S','M','T','W','T','F','S'].map(d => <span key={d}>{d}</span>)}
          </div>
          
          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {getDaysInMonth(currentMonth).map((day, idx) => {
              if (!day) return <span key={idx}></span>;
              const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth()+1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isSelected = selectedDate === dateStr;
              return (
                <button
                  key={idx}
                  onClick={() => { setSelectedDate(dateStr); setActiveTab('All'); if(window.innerWidth < 768) setSidebarOpen(false); }}
                  className={`p-1.5 rounded-full hover:bg-indigo-100 transition-colors ${
                    isSelected ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm' : ''
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-gray-100">
        <button 
          onClick={() => { setIsModalOpen(true); setSidebarOpen(false); }}
          className="w-full bg-indigo-600 text-white py-2.5 rounded-lg flex items-center justify-center gap-2 hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 text-sm font-medium"
        >
          <Plus size={16} /> New Appointment
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-900 overflow-hidden relative">
      
      {/* DESKTOP SIDEBAR (Hidden on Mobile) */}
      <aside className="hidden md:flex w-64 bg-white border-r border-gray-200 flex-col z-10 h-full">
        <SidebarContent />
      </aside>

      {/* MOBILE SIDEBAR OVERLAY */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setSidebarOpen(false)}>
           <div className="w-64 bg-white h-full shadow-2xl animate-in slide-in-from-left duration-200" onClick={e => e.stopPropagation()}>
             <SidebarContent />
           </div>
        </div>
      )}

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col h-full relative w-full">
        
        {/* Header */}
        <header className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-4 md:px-8 flex-shrink-0">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Toggle */}
            <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
              <Menu size={24} />
            </button>
            <h2 className="text-lg md:text-xl font-semibold text-gray-800 truncate">Appointments</h2>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Search..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border rounded-full text-sm w-48 lg:w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
              />
            </div>
             {/* Mobile Search Icon (Simplified) */}
             <button className="md:hidden p-2 text-gray-600"><Search size={20}/></button>

            <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold border border-indigo-200">
              DR
            </div>
          </div>
        </header>

        {/* Filters */}
        <div className="p-4 md:p-8 pb-4 flex-shrink-0">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex bg-gray-200 p-1 rounded-lg self-start overflow-x-auto max-w-full">
              {['All', 'Upcoming', 'Today', 'Past'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 md:px-6 py-1.5 md:py-2 text-sm font-medium rounded-md transition-all whitespace-nowrap ${
                    activeTab === tab 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="text-sm text-gray-500 hidden md:block">
              Showing: <span className="font-semibold text-gray-800">{activeTab === 'All' ? selectedDate : activeTab}</span>
            </div>
          </div>
        </div>

        {/* Scrollable List */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 pt-2">
          {loading ? (
             <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-2"></div>
                Loading...
             </div>
          ) : getFilteredAppointments().length === 0 ? (
             <div className="flex flex-col items-center justify-center h-64 text-gray-400 bg-white rounded-xl border border-dashed border-gray-300 mx-auto max-w-lg">
                <CalendarIcon className="w-12 h-12 mb-2 opacity-20" />
                No appointments found.
             </div>
          ) : (
            <div className="space-y-4 pb-20">
              {getFilteredAppointments().map((appt) => (
                <div key={appt.id} className="bg-white border border-gray-200 rounded-xl p-4 md:p-5 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between group gap-4">
                  
                  {/* Left: Info */}
                  <div className="flex gap-4 md:gap-6 items-start">
                    <div className="flex flex-col items-center min-w-[60px] md:min-w-[80px] pt-1">
                      <span className="text-lg md:text-xl font-bold text-gray-900 whitespace-nowrap">{appt.time}</span>
                      <span className="text-[10px] md:text-xs font-medium text-gray-400 bg-gray-50 px-2 py-0.5 rounded">{appt.duration}</span>
                    </div>
                    
                    <div className="w-px bg-gray-100 h-12 self-center hidden md:block"></div>

                    <div>
                      <h3 className="font-bold text-base md:text-lg text-gray-900 group-hover:text-indigo-600 transition-colors">{appt.name}</h3>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs md:text-sm text-gray-500 mt-1">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" /> {appt.doctorName}
                        </span>
                        <span className="flex items-center gap-1">
                          {appt.mode === 'Video Call' ? <Video className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                          {appt.mode}
                        </span>
                        <span className="text-gray-400 text-xs border-l pl-3 ml-1 hidden sm:inline-block">{appt.date}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center justify-end gap-3 w-full md:w-auto mt-2 md:mt-0 border-t md:border-t-0 pt-3 md:pt-0 border-gray-50">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(appt.status)}`}>
                      {appt.status}
                    </span>
                    
                    {appt.status !== 'Cancelled' && appt.status !== 'Completed' && (
                      <button 
                        onClick={() => updateStatus(appt.id, 'Cancelled')}
                        className="text-xs font-medium text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg border border-transparent hover:border-red-100 transition-all ml-auto md:ml-0"
                      >
                        Cancel
                      </button>
                    )}
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* --- NEW APPOINTMENT MODAL (Centered & Responsive) --- */}
      {/* --- NEW APPOINTMENT MODAL --- */}
      {isModalOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-lg text-gray-800">New Appointment</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
            </div>
            
            <form onSubmit={createAppointment} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Patient Name</label>
                <input required type="text" className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none" 
                  value={newAppt.name} onChange={e => setNewAppt({...newAppt, name: e.target.value})} placeholder="e.g. John Doe"/>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* 1. FLEXIBLE DATE PICKER */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input 
                    type="date" 
                    required
                    className="w-full border rounded-lg p-2.5 outline-none bg-white focus:ring-2 focus:ring-indigo-500"
                    value={newAppt.date || selectedDate} // Default to currently viewed date
                    onChange={e => setNewAppt({...newAppt, date: e.target.value})}
                  />
                </div>

                {/* 2. FLEXIBLE TIME PICKER */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                  <input 
                    type="time"
                    required
                    className="w-full border rounded-lg p-2.5 outline-none bg-white focus:ring-2 focus:ring-indigo-500"
                    value={newAppt.time}
                    // Initialize or update time
                    onChange={e => setNewAppt({...newAppt, time: e.target.value})}
                  />
                </div>
              </div>

              {/* DURATION (Optional but good to have visible) */}
              <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                 <select className="w-full border rounded-lg p-2.5 outline-none bg-white text-sm"
                     value={newAppt.duration} onChange={e => setNewAppt({...newAppt, duration: e.target.value})}>
                    <option>15 min</option>
                    <option>30 min</option>
                    <option>45 min</option>
                    <option>60 min</option>
                 </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Doctor</label>
                <select className="w-full border rounded-lg p-2.5 outline-none bg-white"
                   value={newAppt.doctorName} onChange={e => setNewAppt({...newAppt, doctorName: e.target.value})}>
                  <option>Dr. Rajesh Kumar</option>
                  <option>Dr. Priya Sharma</option>
                  <option>Dr. Anjali Gupta</option>
                </select>
              </div>

              <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Mode</label>
                 <div className="flex gap-4 mt-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="mode" checked={newAppt.mode === 'In-Person'} 
                             onChange={() => setNewAppt({...newAppt, mode: 'In-Person'})} />
                      <span className="text-sm">In-Person</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="mode" checked={newAppt.mode === 'Video Call'} 
                             onChange={() => setNewAppt({...newAppt, mode: 'Video Call'})} />
                      <span className="text-sm">Video Call</span>
                    </label>
                 </div>
              </div>

              <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition mt-2">
                Confirm Booking
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AppointmentDashboard;