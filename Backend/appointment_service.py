import json
import os
from datetime import datetime, timedelta

DATA_FILE = 'appointments.json'
# --- CONFIGURATION ---
# Set this to whatever "Today" is for your testing scenario.
SIMULATION_DATE = '2025-12-15' 

class AppointmentService:
    def __init__(self):
        self.load_data()

    def load_data(self):
        if os.path.exists(DATA_FILE):
            with open(DATA_FILE, 'r') as f:
                self.appointments = json.load(f)
        else:
            self.appointments = [] 

        # --- SANITIZATION LOGIC ---
        # Use SIMULATION_DATE instead of datetime.now()
        data_changed = False
        for appt in self.appointments:
            # If date is earlier than our simulated today
            if appt['date'] < SIMULATION_DATE:
                if appt['status'] in ['Scheduled', 'Upcoming', 'Confirmed']:
                    appt['status'] = 'Completed'
                    data_changed = True
        
        if data_changed:
            self.save_data()

    def save_data(self):
        with open(DATA_FILE, 'w') as f:
            json.dump(self.appointments, f, indent=4)

    # ... [Keep parse_time_range and check_availability exactly as before] ...
    
    # 1. Update/Verify parse_time_range to handle errors visibly
    def parse_time_range(self, date_str, time_str, duration_str):
        try:
            if not date_str or not time_str:
                print("DEBUG: Missing date or time")
                return None, None
                
            # Clean duration string (remove ' min')
            duration_minutes = int(duration_str.lower().replace(' min', '').strip())
            
            # Combine Date and Time
            start_dt = datetime.strptime(f"{date_str} {time_str}", "%Y-%m-%d %I:%M %p")
            end_dt = start_dt + timedelta(minutes=duration_minutes)
            
            return start_dt, end_dt
        except ValueError as e:
            print(f"DEBUG: Time parsing error for '{date_str} {time_str}': {e}")
            return None, None

    # 2. Updated check_availability with better conflict resolution
    def check_availability(self, doctor_name, date, time, duration):
        """Checks if doctor is free. Returns (True, None) or (False, Suggested_Time)"""
        
        # Parse the requested slot
        new_start, new_end = self.parse_time_range(date, time, duration)
        
        if not new_start:
            # This is likely where your error was coming from
            return False, "Invalid Date/Time Format"

        # Filter for relevant existing appointments
        doctor_appts = [
            a for a in self.appointments 
            if a['doctorName'] == doctor_name 
            and a['date'] == date
            and a['status'] not in ['Cancelled', 'Denied']
        ]

        # Check for conflicts
        conflicts = []
        for appt in doctor_appts:
            existing_start, existing_end = self.parse_time_range(appt['date'], appt['time'], appt['duration'])
            
            if existing_start and existing_end:
                # Overlap Logic: (StartA < EndB) and (EndA > StartB)
                if new_start < existing_end and new_end > existing_start:
                    conflicts.append(existing_end)

        if conflicts:
            # Sort conflicts to find the latest end time (to avoid double booking loop)
            conflicts.sort()
            latest_conflict_end = conflicts[-1]
            
            # Suggest the time immediately after the latest conflict
            suggested_time = latest_conflict_end.strftime("%I:%M %p")
            return False, suggested_time

        return True, None

    def get_appointments(self, date=None, status=None, search=None):
        self.load_data()
        filtered = self.appointments
        if date: filtered = [a for a in filtered if a['date'] == date]
        if status and status != 'All': filtered = [a for a in filtered if a['status'].lower() == status.lower()]
        if search: filtered = [a for a in filtered if search.lower() in a['name'].lower()]
        return filtered
        
    # def update_appointment_status(self, id, status):
    #     self.load_data()
    #     for appt in self.appointments:
    #         if appt['id'] == str(id):
    #             appt['status'] = status
    #             self.save_data()
    #             return appt
    #     return None

    def update_appointment_status(self, id, new_status):
        """
        Updates the status of an appointment (e.g., 'Scheduled' -> 'Confirmed').
        """
        # Iterate through mock data to find the appointment
        for appt in self.appointments:
            if str(appt['id']) == str(id): # Ensure ID types match
                appt['status'] = new_status
                
                # ==============================================================================
                # AWS ARCHITECTURE INTEGRATION NOTES
                # ==============================================================================
                
                # 1. AURORA TRANSACTIONAL WRITE
                # This is where the actual ACID transaction would occur.
                # In a real AWS environment (using RDS Proxy + Aurora Serverless):
                # ------------------------------------------------------------------
                # with connection.cursor() as cursor:
                #     cursor.execute("UPDATE appointments SET status = %s WHERE id = %s", (new_status, id))
                #     connection.commit()
                
                # 2. APPSYNC SUBSCRIPTION TRIGGER
                # Once the DB write is confirmed, this return value acts as the "Mutation Response".
                # AppSync monitors this response. If you have defined a Subscription in your GraphQL Schema 
                # like `subscription { onUpdateAppointmentStatus(id: ID!) }`, AppSync detects this 
                # change and pushes the new data via WebSockets to all connected React clients.
                # ------------------------------------------------------------------
                
                return True, appt
                
        return False, None

    def add_appointment(self, data):
        self.load_data()
        is_available, suggested_time = self.check_availability(
            data['doctorName'], data['date'], data['time'], data['duration']
        )
        if not is_available:
            return {"error": "Conflict", "suggested_time": suggested_time}

        current_ids = [int(a['id']) for a in self.appointments if a['id'].isdigit()]
        new_id = str(max(current_ids) + 1) if current_ids else "1"
        data['id'] = new_id
        self.appointments.append(data)
        self.save_data()
        return data

service = AppointmentService()