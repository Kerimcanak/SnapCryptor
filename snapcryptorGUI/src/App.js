import logosquare from './graphics/logosquare.png'; /* eslint-disable-line */ /* @import-ignore logo only used in index.html */
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logosquare} className="App-logo" alt="logo" />
        <p>
          Upload <code>your file</code> to encrypt.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
