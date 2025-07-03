import logosquare from './graphics/logosquare.png'; /* eslint-disable-line */ /* @import-ignore logo only used in index.html */
import FileUploader from './components/fileUploader'; /* eslint-disable-line */ /* @import-ignore */
import React, { useState, useCallback } from 'react';

function App() {
  const [selectedFiles, setSelectedFiles] = useState([]);

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

    return (
    <div className="App" style={{ backgroundColor: 'black' , minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <header className="App-header">
        {/* Make sure logosquare is imported if you're using it */}
        <img src={logosquare} className="App-logo" alt="logo" style={{ width: '200px', marginBottom: '20px' }} />
        {/* I've commented out the logo for now, as I don't have the file. */}
        {/* Uncomment and adjust path if you have it. */}
        <p style={{ color: 'white' }}>
          Upload <code>your file</code> to encrypt.
        </p>
      </header>

      {/* --- ADDED: FileUploader Component --- */}
      <div style={{ maxWidth: '600px', margin: '20px auto' }}> {/* Optional: Add a container for better centering/spacing */}
        <FileUploader onFilesSelected={handleFilesSelected} />
      </div>

      {/* --- ADDED: Display Selected Files (with basic styling) --- */}
      {selectedFiles.length > 0 && ( /* Only show if there are files */
        <div className="file-list" style={{ maxWidth: '600px', margin: '0 auto 20px auto', border: '1px solid #ddd', borderRadius: '8px', padding: '15px', backgroundColor: '#f9f9f9', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <h3>Selected Files:</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {selectedFiles.map((file, index) => (
              <li
                key={file.name + file.size + index} // Use a more robust key
                className="file-item"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 0',
                  borderBottom: '1px dotted #eee',
                  fontSize: '0.95em'
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
                    color: '#dc3545', // Red for delete
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

      {/* You can add your encryption options and buttons here, similar to the previous example */}
      <div style={{ maxWidth: '600px', margin: '20px auto', padding: '20px', border: '1px solid #eee', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h2 style={{color: 'white'}}>Encryption Options</h2>
        <label htmlFor="password" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: 'red' }}>
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
            fontSize: '1em'
          }}
          placeholder="Enter your secret password"
        />

        <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
          <button
            style={{
              padding: '12px 25px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '1.1em'
            }}
          >
            Encrypt Files
          </button>
          <button
            style={{
              padding: '12px 25px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '1.1em'
            }}
          >
            Decrypt Files
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
