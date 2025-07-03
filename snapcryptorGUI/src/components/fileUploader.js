// src/components/FileUploader.jsx
import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

function FileUploader({ onFilesSelected }) {
  // useCallback memoizes the onDrop function to prevent unnecessary re-renders
  const onDrop = useCallback((acceptedFiles) => {
    // This function is called when files are dropped or selected
    // acceptedFiles is an array of File objects
    onFilesSelected(acceptedFiles); // Pass the files up to the parent component
  }, [onFilesSelected]); // Dependency array: recreate if onFilesSelected changes

  // useDropzone hook provides props for the root element and the input element
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <div
      {...getRootProps()} // Apply props to the div for drag-and-drop functionality
      style={{
        border: '2px dashed #ccc',
        borderRadius: '8px',
        padding: '30px',
        textAlign: 'center',
        cursor: 'pointer',
        backgroundColor: isDragActive ? '#e0f7fa' : '#f9f9f9', // Change background on drag
        transition: 'background-color 0.2s ease-in-out',
        marginBottom: '20px',
      }}
    >
      <input {...getInputProps()} /> {/* Apply props to the hidden file input */}
      {isDragActive ? (
        <p style={{ margin: 0, color: '#007bff' }}>Drop the files here ...</p>
      ) : (
        <p style={{ margin: 0, color: '#333' }}>
          Drag 'n' drop some files here, or click to select files
        </p>
      )}
      <em style={{ fontSize: '0.9em', color: '#666' }}>
        (Only files are accepted for now)
      </em>
    </div>
  );
}

export default FileUploader;