from flask import Flask, jsonify, request
from flask_cors import CORS
from datetime import datetime, timedelta
# Remove SIMULATION_DATE from this import
from appointment_service import service 

app = Flask(__name__)
CORS(app)

@app.route('/config', methods=['GET'])
def get_config():
    """
    Returns the current date in IST (GMT+5:30).
    """
    utc_now = datetime.utcnow()
    ist_now = utc_now + timedelta(hours=5, minutes=30)
    ist_date_str = ist_now.strftime('%Y-%m-%d')
    
    return jsonify({
        "current_date": ist_date_str,
        "theme": "light"
    })

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

if __name__ == '__main__':
    app.run(debug=True)