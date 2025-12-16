import json
import os
from datetime import datetime, timedelta

DATA_FILE = 'appointments.json'

class AppointmentService:
    def __init__(self):
        self.appointments = []
        self.load_data()
        print(f"✅ SERVICE STARTED: Loaded {len(self.appointments)} appointments.")
        
        # RUN CLEANUP
        self.cleanup_past_appointments()

    def load_data(self):
        if os.path.exists(DATA_FILE):
            try:
                with open(DATA_FILE, 'r') as f:
                    self.appointments = json.load(f)
            except (json.JSONDecodeError, IOError):
                self.appointments = []
                print("⚠️ Error reading appointments.json. Starting empty.")
        else:
            self.appointments = [] 

    def save_data(self):
        try:
            with open(DATA_FILE, 'w') as f:
                json.dump(self.appointments, f, indent=4)
        except IOError as e:
            print(f"❌ Error saving data: {e}")

    def cleanup_past_appointments(self):
        """
        Cancels appointments strictly BEFORE today.
        Does NOT touch today's or future appointments.
        """
        # 1. Get Today's Date in IST (YYYY-MM-DD)
        utc_now = datetime.utcnow()
        ist_now = utc_now + timedelta(hours=5, minutes=30)
        today_str = ist_now.strftime('%Y-%m-%d')
        
        print(f"📅 SYSTEM DATE (IST): {today_str}")
        
        data_changed = False
        count_cancelled = 0

        for appt in self.appointments:
            appt_date = appt.get('date', '')
            
            # Skip invalid records
            if not appt_date: continue

            # LOGIC: Only cancel if date is STRICTLY LESS than today
            if appt_date < today_str:
                if appt.get('status') not in ['Completed', 'Cancelled', 'Denied']:
                    appt['status'] = 'Cancelled'
                    data_changed = True
                    count_cancelled += 1
        
        if data_changed:
            self.save_data()
            print(f"🔄 CLEANUP: Auto-cancelled {count_cancelled} past appointments.")
        else:
            print("✅ CLEANUP: No past appointments needed cancelling.")

    # --- HELPERS ---

    def parse_time_range(self, date_str, time_str, duration_str):
        try:
            if not date_str or not time_str: return None, None
            duration_minutes = int(str(duration_str).lower().replace(' min', '').strip())
            start_dt = datetime.strptime(f"{date_str} {time_str}", "%Y-%m-%d %I:%M %p")
            end_dt = start_dt + timedelta(minutes=duration_minutes)
            return start_dt, end_dt
        except ValueError:
            return None, None

    def check_availability(self, doctor_name, date, time, duration):
        new_start, new_end = self.parse_time_range(date, time, duration)
        if not new_start: return False, "Invalid Format"

        doctor_appts = [a for a in self.appointments if a['doctorName'] == doctor_name and a['date'] == date and a['status'] not in ['Cancelled']]
        
        conflicts = []
        for appt in doctor_appts:
            estart, eend = self.parse_time_range(appt['date'], appt['time'], appt['duration'])
            if estart and eend and new_start < eend and new_end > estart:
                conflicts.append(eend)

        if conflicts:
            conflicts.sort()
            return False, conflicts[-1].strftime("%I:%M %p")

        return True, None

    # --- API METHODS ---

    def get_appointments(self, date=None, status=None, search=None):
        # RELOAD DATA to ensure we aren't serving stale cache
        self.load_data()
        
        filtered = self.appointments
        
        # DEBUG LOG: See what the backend actually sees
        # print(f"DEBUG: Total records: {len(filtered)}. Filtering for Date: {date}")

        if date: 
            filtered = [a for a in filtered if a.get('date') == date]
        
        if status and status != 'All': 
            filtered = [a for a in filtered if a.get('status', '').lower() == status.lower()]
            
        if search: 
            filtered = [a for a in filtered if search.lower() in a.get('name', '').lower()]
            
        return filtered

    def get_unique_doctors(self):
        self.load_data()
        doctors = {appt['doctorName'] for appt in self.appointments if 'doctorName' in appt}
        return sorted(list(doctors))

    def update_appointment_status(self, id, new_status):
        self.load_data()
        for appt in self.appointments:
            if str(appt.get('id')) == str(id):
                appt['status'] = new_status
                self.save_data()
                return True, appt
        return False, None
    
    def add_appointment(self, data):
        self.load_data()
        is_available, suggested = self.check_availability(data['doctorName'], data['date'], data['time'], data['duration'])
        if not is_available: return {"error": "Conflict", "suggested_time": suggested}

        current_ids = [int(a['id']) for a in self.appointments if str(a['id']).isdigit()]
        new_id = str(max(current_ids) + 1) if current_ids else "1"
        data['id'] = new_id
        self.appointments.append(data)
        self.save_data()
        return data

service = AppointmentService()