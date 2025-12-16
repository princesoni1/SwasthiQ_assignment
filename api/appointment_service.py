from flask import Flask, jsonify, request
from flask_cors import CORS
import json
import os
from datetime import datetime, timedelta

# --- CONFIGURATION ---
DATA_FILE = 'appointments.json'
# Note: On Vercel, the file system is read-only. 
# Writing to JSON works locally but won't persist on Vercel. 
# For this assignment, we keep the logic as requested.

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend communication

# --- LOGIC CLASS (From your appointment_service.py) ---
class AppointmentService:
    def __init__(self):
        self.appointments = []
        self.load_data()
        print(f"✅ SERVICE STARTED: Loaded {len(self.appointments)} appointments.")
        self.cleanup_past_appointments()

    def load_data(self):
        # Check if file exists; if not, use empty list
        if os.path.exists(DATA_FILE):
            try:
                with open(DATA_FILE, 'r') as f:
                    self.appointments = json.load(f)
            except (json.JSONDecodeError, IOError):
                self.appointments = []
                print("⚠️ Error reading appointments.json. Starting empty.")
        else:
            # Fallback mock data if file doesn't exist (Helps Vercel start)
            self.appointments = [
                {"id": "1", "patientName": "John Doe", "doctorName": "Dr. Smith", "date": "2025-02-20", "time": "10:00 AM", "duration": "30 min", "type": "Consultation", "status": "Confirmed"},
                {"id": "2", "patientName": "Jane Roe", "doctorName": "Dr. Jones", "date": "2025-02-21", "time": "11:00 AM", "duration": "30 min", "type": "Follow-up", "status": "Pending"}
            ]

    def save_data(self):
        try:
            with open(DATA_FILE, 'w') as f:
                json.dump(self.appointments, f, indent=4)
        except IOError as e:
            print(f"❌ Error saving data (Expected on Vercel Read-Only): {e}")

    def cleanup_past_appointments(self):
        utc_now = datetime.utcnow()
        ist_now = utc_now + timedelta(hours=5, minutes=30)
        today_str = ist_now.strftime('%Y-%m-%d')
        
        data_changed = False
        for appt in self.appointments:
            appt_date = appt.get('date', '')
            if not appt_date: continue
            if appt_date < today_str and appt.get('status') not in ['Completed', 'Cancelled', 'Denied']:
                appt['status'] = 'Cancelled'
                data_changed = True
        
        if data_changed:
            self.save_data()

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
        
        doctor_appts = [a for a in self.appointments if a['doctorName'] == doctor_name and a['date'] == date and a['status'] != 'Cancelled']
        
        conflicts = []
        for appt in doctor_appts:
            estart, eend = self.parse_time_range(appt['date'], appt['time'], appt['duration'])
            if estart and eend and new_start < eend and new_end > estart:
                conflicts.append(eend)

        if conflicts:
            conflicts.sort()
            return False, conflicts[-1].strftime("%I:%M %p")
        return True, None

    def get_appointments(self, date=None, status=None, search=None):
        # self.load_data() # Disabled reload to prevent Vercel read errors
        filtered = self.appointments
        if date: filtered = [a for a in filtered if a.get('date') == date]
        if status and status != 'All': filtered = [a for a in filtered if a.get('status', '').lower() == status.lower()]
        if search: filtered = [a for a in filtered if search.lower() in a.get('name', '').lower()]
        return filtered

    def get_unique_doctors(self):
        doctors = {appt['doctorName'] for appt in self.appointments if 'doctorName' in appt}
        return sorted(list(doctors))

    def update_appointment_status(self, id, new_status):
        for appt in self.appointments:
            if str(appt.get('id')) == str(id):
                appt['status'] = new_status
                self.save_data()
                return True, appt
        return False, None
    
    def add_appointment(self, data):
        is_available, suggested = self.check_availability(data['doctorName'], data['date'], data['time'], data['duration'])
        if not is_available: return {"error": "Conflict", "suggested_time": suggested}

        current_ids = [int(a['id']) for a in self.appointments if str(a['id']).isdigit()]
        new_id = str(max(current_ids) + 1) if current_ids else "1"
        data['id'] = new_id
        self.appointments.append(data)
        self.save_data()
        return data

# Initialize Service
service = AppointmentService()

# --- FLASK ROUTES (From your app.py) ---

@app.route('/', methods=['GET'])
def home():
    return "Appointment System API is Running!"

@app.route('/config', methods=['GET'])
def get_config():
    utc_now = datetime.utcnow()
    ist_now = utc_now + timedelta(hours=5, minutes=30)
    ist_date_str = ist_now.strftime('%Y-%m-%d')
    return jsonify({"current_date": ist_date_str, "theme": "light"})

@app.route('/doctors', methods=['GET'])
def get_doctors():
    try:
        doctors = service.get_unique_doctors()
        return jsonify(doctors), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/appointments', methods=['GET'])
def get_appointments():
    date = request.args.get('date')
    status = request.args.get('status')
    search = request.args.get('search')
    data = service.get_appointments(date, status, search)
    return jsonify(data)

@app.route('/appointments', methods=['POST'])
def create_appointment():
    data = request.json
    result = service.add_appointment(data)
    if "error" in result:
        return jsonify(result), 409
    return jsonify(result), 201

@app.route('/appointments/<id>/status', methods=['PATCH'])
def update_status(id):
    data = request.json
    new_status = data.get('status')
    success, appt = service.update_appointment_status(id, new_status)
    if success:
        return jsonify(appt), 200
    return jsonify({"error": "Appointment not found"}), 404

# Vercel entry point
if __name__ == '__main__':
    app.run(debug=True)