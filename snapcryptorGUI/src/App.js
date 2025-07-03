// src/App.js
import React, { useState, useCallback } from 'react';
import FileUploader from './components/fileUploader';
import logosquare from './graphics/logosquare.png'; // Assuming this path is correct for your logo

// No need for eslint-disable-line comments or @import-ignore for imports if they are used.
// If logosquare is ONLY used in index.html, you can remove its import from App.js.
// Given you have an <img> tag for it here, it should be imported.

function App() {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [password, setPassword] = useState(''); // State for password input
  const [message, setMessage] = useState(''); // State for user feedback messages
  const [isLoading, setIsLoading] = useState(false); // State for loading indicator

  const handleFilesSelected = useCallback((files) => {
    setSelectedFiles(prevFiles => {
      const existingFileNames = new Set(prevFiles.map(file => file.name));
      const newUniqueFiles = files.filter(file => !existingFileNames.has(file.name));
      return [...prevFiles, ...newUniqueFiles];
    });
  }, []);

  const removeFile = useCallback((fileName) => {
    setSelectedFiles(prevFiles => prevFiles.filter(file => file.name !== fileName));
  }, []);

  // --- NEW: handleOperation (Encrypt/Decrypt) function ---
  const handleOperation = async (operationType) => {
    if (selectedFiles.length === 0) {
      setMessage('Please select files first.');
      return;
    }
    if (!password) {
      setMessage('Please enter a password.');
      return;
    }

    setIsLoading(true);
    setMessage(`${operationType === 'encrypt' ? 'Encrypting' : 'Decrypting'} files...`);

    const formData = new FormData();
    formData.append('password', password); // Append the password

    // Append each selected file to the FormData
    selectedFiles.forEach((file, index) => {
      formData.append(`file${index}`, file);
    });

    // --- Backend URL ---
    // Make sure your Python backend is running on this port (e.g., Flask's default 5000)
    const backendUrl = `http://127.0.0.1:5000/${operationType}`;

    try {
      const response = await fetch(backendUrl, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Operation failed with status: ${response.status}`);
      }

      const result = await response.json();

      setMessage(result.message || `${operationType === 'encrypt' ? 'Encryption' : 'Decryption'} successful!`);

      // If the backend sends back a URL to the processed file, you can initiate download
      if (result.files && result.files.length > 0) {
          // Assuming the backend sends an array of files, and each has a download_url
          result.files.forEach(fileInfo => {
              if (fileInfo.download_url) {
                  const link = document.createElement('a');
                  link.href = `http://127.0.0.1:5000${fileInfo.download_url}`; // Prepend backend URL
                  link.download = fileInfo.processed_name || 'processed_file';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
              }
          });
      }


      // Optionally clear selected files after successful operation
      setSelectedFiles([]);
      setPassword('');

    } catch (error) {
      console.error('Error during operation:', error);
      setMessage(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  // --- END: handleOperation function ---

  return (
    <div className="App" style={{ backgroundColor: 'black' , minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <header className="App-header" style={{ marginBottom: '20px' }}>
        <img src={logosquare} className="App-logo" alt="logo" style={{ width: '200px', marginBottom: '20px' }} />
        <p style={{ color: 'white' }}>
          Upload <code>your file</code> to encrypt.
        </p>
      </header>

      {/* FileUploader Component */}
      <div style={{ maxWidth: '600px', width: '100%', margin: '20px auto' }}>
        <FileUploader onFilesSelected={handleFilesSelected} />
      </div>

      {/* Display Selected Files */}
      {selectedFiles.length > 0 && (
        <div className="file-list" style={{ maxWidth: '600px', width: '100%', margin: '0 auto 20px auto', border: '1px solid #ddd', borderRadius: '8px', padding: '15px', backgroundColor: '#f9f9f9', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <h3 style={{ color: '#333' }}>Selected Files:</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {selectedFiles.map((file, index) => (
              <li
                key={file.name + file.size + index}
                className="file-item"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 0',
                  borderBottom: '1px dotted #eee',
                  fontSize: '0.95em',
                  color: '#555'
                }}
              >
                <span>
                  {file.name} ({ (file.size / 1024 / 1024).toFixed(2) } MB)
                </span>
                <button
                  onClick={() => removeFile(file.name)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#dc3545',
                    cursor: 'pointer',
                    fontSize: '1em',
                    marginLeft: '10px'
                  }}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Encryption Options */}
      <div style={{ maxWidth: '600px', width: '100%', margin: '20px auto', padding: '20px', border: '1px solid #eee', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', backgroundColor: '#333' }}>
        <h2 style={{color: 'white'}}>Encryption Options</h2>
        <label htmlFor="password" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: 'orange' }}> {/* Changed color for visibility */}
          Password:
        </label>
        <input
          type="password"
          id="password"
          style={{
            width: 'calc(100% - 20px)',
            padding: '10px',
            marginBottom: '20px',
            borderRadius: '4px',
            border: '1px solid #ddd',
            fontSize: '1em',
            backgroundColor: '#444', // Darker input background
            color: 'white', // White text in input
          }}
          placeholder="Enter your secret password"
          value={password} // --- CONNECTED TO STATE ---
          onChange={(e) => setPassword(e.target.value)} // --- UPDATES STATE ---
          disabled={isLoading} // --- DISABLED WHEN LOADING ---
        />

        <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
          <button
            onClick={() => handleOperation('encrypt')} // --- CONNECTED TO HANDLER ---
            disabled={selectedFiles.length === 0 || !password || isLoading} // --- DISABLED LOGIC ---
            style={{
              padding: '12px 25px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '1.1em',
              opacity: (selectedFiles.length === 0 || !password || isLoading) ? 0.6 : 1, // Visual feedback for disabled
              transition: 'opacity 0.3s ease',
            }}
          >
            {isLoading && message.includes('Encrypting') ? 'Encrypting...' : 'Encrypt Files'} {/* Conditional text */}
          </button>
          <button
            onClick={() => handleOperation('decrypt')} // --- CONNECTED TO HANDLER ---
            disabled={selectedFiles.length === 0 || !password || isLoading} // --- DISABLED LOGIC ---
            style={{
              padding: '12px 25px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '1.1em',
              opacity: (selectedFiles.length === 0 || !password || isLoading) ? 0.6 : 1, // Visual feedback for disabled
              transition: 'opacity 0.3s ease',
            }}
          >
            {isLoading && message.includes('Decrypting') ? 'Decrypting...' : 'Decrypt Files'} {/* Conditional text */}
          </button>
        </div>

        {/* Message/Feedback Area */}
        {message && (
          <p style={{
            marginTop: '20px',
            padding: '10px',
            borderRadius: '5px',
            backgroundColor: isLoading ? '#e0f7fa' : (message.startsWith('Error') ? '#ffebee' : '#e8f5e9'),
            color: message.startsWith('Error') ? '#c62828' : '#2e7d32',
            border: `1px solid ${message.startsWith('Error') ? '#ef9a9a' : '#a5d6a7'}`,
            textAlign: 'center'
          }}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}

export default App;