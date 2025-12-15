from flask import Flask, jsonify, request
from flask_cors import CORS
from appointment_service import service
import time
from appointment_service import service, SIMULATION_DATE
# Adding Simulation date to deal with time travel issue

app = Flask(__name__)
CORS(app)

@app.route('/appointments', methods=['GET'])
def get_appointments():
    # Capture all filters
    date = request.args.get('date')
    status = request.args.get('status')
    search = request.args.get('search') # New!
    
    # Simulate network latency (Optional, makes it feel real)
    # time.sleep(0.5) 
    
    data = service.get_appointments(date, status, search)
    return jsonify(data)

@app.route('/appointments/<id>/status', methods=['PATCH'])
def update_status(id):
    data = request.json
    new_status = data.get('status')
    
    if not new_status:
        return jsonify({"error": "Missing status"}), 400
        
    success, updated_appt = service.update_appointment_status(id, new_status)
    
    if success:
        return jsonify(updated_appt), 200
    else:
        return jsonify({"error": "Appointment not found"}), 404

# NEW: Create Appointment Endpoint
@app.route('/appointments', methods=['POST'])
def create_appointment():
    data = request.json
    
    # Basic Validation
    required = ['name', 'date', 'time', 'doctorName', 'mode']
    if not all(k in data for k in required):
        return jsonify({"error": "Missing fields"}), 400
    
    # Defaults
    if 'duration' not in data: data['duration'] = "30 min"

    result = service.add_appointment(data)
    
    # Check if result was an error/conflict
    if "error" in result and result["error"] == "Conflict":
        return jsonify({
            "message": "Doctor is busy at this time.",
            "suggested_time": result["suggested_time"]
        }), 409  # 409 Conflict Status Code
        
    return jsonify(result), 201

@app.route('/config', methods=['GET'])
def get_config():
    """Returns the server's simulated date"""
    return jsonify({
        "current_date": SIMULATION_DATE,
        "is_simulation": True
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)