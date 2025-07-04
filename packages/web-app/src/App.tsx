import React from 'react';
import { CodeCheckEngine } from '@code-check/core-engine';
import { formatOutput } from '@code-check/shared';

function App() {
  const [result, setResult] = React.useState<string>('');

  const handleAnalyze = () => {
    const engine = new CodeCheckEngine();
    const analysis = engine.analyze('sample code');
    setResult(formatOutput(analysis));
  };

  return (
    <div className="App">
      <h1>Code Check Web App</h1>
      <button onClick={handleAnalyze}>Analyze Code</button>
      {result && <p>{result}</p>}
    </div>
  );
}

export default App;
