# backend/app.py
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import uuid # For generating unique filenames

app = Flask(__name__)
CORS(app) # Enable CORS for all routes (important for React communication)

# Define a directory to save uploaded/processed files
# It's good practice to create a dedicated folder for this, e.g., 'uploads'
UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER) # Create the folder if it doesn't exist

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

@app.route('/')
def index():
    return "Python Backend is running!"

@app.route('/encrypt', methods=['POST'])
def encrypt_file():
    if 'password' not in request.form:
        return jsonify({'message': 'Password not provided'}), 400

    password = request.form['password']
    files = request.files # This is a MultiDict containing all uploaded files

    if not files:
        return jsonify({'message': 'No files uploaded'}), 400

    processed_files_info = []

    # Iterate over all uploaded files
    for key, file in files.items():
        if file.filename == '':
            continue # Skip if no filename

        original_filename = file.filename
        # Sanitize filename and create a unique one for saving
        # This is CRUCIAL to prevent path traversal attacks
        safe_filename = str(uuid.uuid4()) + "_" + original_filename
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], safe_filename)

        try:
            file.save(filepath) # Save the uploaded file temporarily
            print(f"File '{original_filename}' saved to '{filepath}'")

            # --- Placeholder for Encryption Logic ---
            # In a real scenario, you would read 'filepath', encrypt its contents
            # using 'password', and save the encrypted content to a new file.
            encrypted_filepath = filepath + ".encrypted" # Example output path
            # For now, let's just simulate processing by copying
            import shutil
            shutil.copy(filepath, encrypted_filepath)
            print(f"File '{original_filename}' encrypted (simulated) to '{encrypted_filepath}'")
            # --- End Placeholder ---

            processed_files_info.append({
                'original_name': original_filename,
                'processed_name': os.path.basename(encrypted_filepath),
                'download_url': f'/download/{os.path.basename(encrypted_filepath)}'
            })

        except Exception as e:
            return jsonify({'message': f'Failed to process file {original_filename}: {str(e)}'}), 500

    return jsonify({
        'message': 'Files processed (simulated) successfully!',
        'files': processed_files_info
    }), 200

@app.route('/decrypt', methods=['POST'])
def decrypt_file():
    # This route will be very similar to /encrypt
    # You'll retrieve password and files, then apply decryption logic
    # For now, it's just a placeholder.
    if 'password' not in request.form:
        return jsonify({'message': 'Password not provided'}), 400
    if not request.files:
        return jsonify({'message': 'No files uploaded'}), 400

    # Retrieve files and password
    password = request.form['password']
    files = request.files

    processed_files_info = []

    for key, file in files.items():
        if file.filename == '':
            continue

        original_filename = file.filename
        safe_filename = str(uuid.uuid4()) + "_" + original_filename
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], safe_filename)

        try:
            file.save(filepath)
            print(f"File '{original_filename}' saved to '{filepath}' for decryption")

            # --- Placeholder for Decryption Logic ---
            decrypted_filepath = filepath + ".decrypted" # Example output path
            # For now, simulate by copying
            import shutil
            shutil.copy(filepath, decrypted_filepath)
            print(f"File '{original_filename}' decrypted (simulated) to '{decrypted_filepath}'")
            # --- End Placeholder ---

            processed_files_info.append({
                'original_name': original_filename,
                'processed_name': os.path.basename(decrypted_filepath),
                'download_url': f'/download/{os.path.basename(decrypted_filepath)}'
            })

        except Exception as e:
            return jsonify({'message': f'Failed to process file {original_filename}: {str(e)}'}), 500

    return jsonify({
        'message': 'Files processed (simulated) successfully!',
        'files': processed_files_info
    }), 200

# Route to serve processed files for download
@app.route('/download/<filename>', methods=['GET'])
def download_file(filename):
    # This serves the file from the UPLOAD_FOLDER
    # It's important that this folder is secured and files are named uniquely
    # to prevent directory traversal issues.
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename, as_attachment=True)


if __name__ == '__main__':
    # Run the Flask app on localhost, port 5000
    # In a real Electron app, Electron would launch this script.
    app.run(debug=True, port=5000)