# backend/app.py
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import uuid
import json
import base64
from cryptography.fernet import Fernet, InvalidToken # <-- CORRECTED IMPORT HERE
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.backends import default_backend


app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# --- Helper function for Key Derivation ---
def derive_key(password: str, salt: bytes) -> bytes:
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32, # AES-256 requires a 32-byte key
        salt=salt,
        iterations=100000, # Number of iterations (higher is more secure, but slower)
        backend=default_backend()
    )
    key = base64.urlsafe_b64encode(kdf.derive(password.encode()))
    return key

# --- Helper function for Encryption ---
def encrypt_data(data: bytes, password: str) -> tuple[bytes, bytes]:
    salt = os.urandom(16) # Generate a random salt
    key = derive_key(password, salt)
    f = Fernet(key)
    encrypted_token = f.encrypt(data) # Fernet token contains IV and ciphertext

    return encrypted_token, salt

# --- Helper function for Decryption ---
def decrypt_data(encrypted_token: bytes, password: str, salt: bytes) -> bytes:
    key = derive_key(password, salt)
    f = Fernet(key)
    decrypted_data = f.decrypt(encrypted_token) # Fernet handles IV/nonce and authentication
    return decrypted_data

@app.route('/')
def index():
    return "Python Backend is running!"

@app.route('/encrypt', methods=['POST'])
def encrypt_file():
    if 'password' not in request.form:
        return jsonify({'message': 'Password not provided'}), 400

    password = request.form['password']
    files = request.files

    if not files:
        return jsonify({'message': 'No files uploaded'}), 400

    processed_files_info = []

    for key, file in files.items():
        if file.filename == '':
            continue

        original_filename = file.filename
        safe_filename_base = str(uuid.uuid4())
        original_filepath = os.path.join(app.config['UPLOAD_FOLDER'], safe_filename_base + "_temp_original_" + original_filename)

        try:
            file.save(original_filepath)
            print(f"File '{original_filename}' saved to '{original_filepath}'")

            ### ENCRYPTION LOGIC START (with metadata embedding) ###
            with open(original_filepath, 'rb') as f_in:
                original_data = f_in.read()

            encrypted_token, salt = encrypt_data(original_data, password)

            metadata = {
                'filename': original_filename,
                'salt': base64.b64encode(salt).decode('utf-8'),
                'encryption_version': 'fernet-v1'
            }
            metadata_json = json.dumps(metadata).encode('utf-8')
            metadata_len_bytes = len(metadata_json).to_bytes(4, 'big')

            encrypted_output_filename = f"{os.path.splitext(original_filename)[0]}_encrypted.enc"
            encrypted_filepath = os.path.join(app.config['UPLOAD_FOLDER'], encrypted_output_filename)

            with open(encrypted_filepath, 'wb') as f_out:
                f_out.write(metadata_len_bytes)
                f_out.write(metadata_json)
                f_out.write(encrypted_token)

            print(f"File '{original_filename}' encrypted to '{encrypted_filepath}'")
            ### ENCRYPTION LOGIC END ###

            os.remove(original_filepath)

            processed_files_info.append({
                'original_name': original_filename,
                'processed_name': os.path.basename(encrypted_filepath),
                'download_url': f'/download/{os.path.basename(encrypted_filepath)}'
            })

        except Exception as e:
            if os.path.exists(original_filepath):
                os.remove(original_filepath)
            return jsonify({'message': f'Failed to encrypt file {original_filename}: {str(e)}'}), 500

    return jsonify({
        'message': 'Files encrypted successfully!',
        'files': processed_files_info
    }), 200

@app.route('/decrypt', methods=['POST'])
def decrypt_file():
    if 'password' not in request.form:
        return jsonify({'message': 'Password not provided'}), 400
    if not request.files:
        return jsonify({'message': 'No files uploaded'}), 400

    password = request.form['password']
    files = request.files

    processed_files_info = []

    for key, file in files.items():
        if file.filename == '':
            continue

        original_input_filename = file.filename
        safe_filename_base = str(uuid.uuid4())
        input_filepath = os.path.join(app.config['UPLOAD_FOLDER'], safe_filename_base + "_temp_input_" + original_input_filename)

        try:
            file.save(input_filepath)
            print(f"File '{original_input_filename}' saved to '{input_filepath}' for decryption")

            ### DECRYPTION LOGIC START (with metadata extraction) ###
            with open(input_filepath, 'rb') as f_in:
                metadata_len_bytes = f_in.read(4)
                if len(metadata_len_bytes) < 4:
                    raise ValueError("File is too short to contain metadata length.")
                metadata_len = int.from_bytes(metadata_len_bytes, 'big')

                metadata_json_bytes = f_in.read(metadata_len)
                if len(metadata_json_bytes) < metadata_len:
                    raise ValueError("File is too short to contain full metadata.")
                metadata = json.loads(metadata_json_bytes.decode('utf-8'))

                original_filename = metadata.get('filename', 'decrypted_file')
                salt = base64.b64decode(metadata.get('salt'))

                encrypted_token = f_in.read()

            if not salt or not encrypted_token:
                raise ValueError("Missing essential data (salt or encrypted token) in file.")

            decrypted_data = decrypt_data(encrypted_token, password, salt)

            decrypted_output_filename = original_filename
            decrypted_filepath = os.path.join(app.config['UPLOAD_FOLDER'], decrypted_output_filename)

            with open(decrypted_filepath, 'wb') as f_out:
                f_out.write(decrypted_data)

            print(f"File '{original_input_filename}' decrypted to '{decrypted_filepath}' (original name: {original_filename})")
            ### DECRYPTION LOGIC END ###

            os.remove(input_filepath)

            processed_files_info.append({
                'original_name': original_input_filename,
                'processed_name': os.path.basename(decrypted_filepath),
                'download_url': f'/download/{os.path.basename(decrypted_filepath)}'
            })

        except InvalidToken: # <-- THIS IS THE EXCEPTION Fernet RAISES for bad key/data
            if os.path.exists(input_filepath): os.remove(input_filepath)
            return jsonify({'message': 'Decryption failed: Incorrect password or corrupted file.'}), 400
        except (ValueError, json.JSONDecodeError, KeyError) as e:
            if os.path.exists(input_filepath): os.remove(input_filepath)
            return jsonify({'message': f'Decryption failed: Invalid file format or metadata missing. ({str(e)})'}), 400
        except Exception as e:
            if os.path.exists(input_filepath): os.remove(input_filepath)
            return jsonify({'message': f'Failed to decrypt file {original_input_filename}: {str(e)}'}), 500

    return jsonify({
        'message': 'Files decrypted successfully!',
        'files': processed_files_info
    }), 200

@app.route('/download/<filename>', methods=['GET'])
def download_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename, as_attachment=True)


if __name__ == '__main__':
    app.run(debug=True, port=5000)

### END OF FILE ###