import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ProjectList from './pages/ProjectList';
import RunDetail from './pages/RunDetail';
import RulesConfig from './pages/RulesConfig';
import Settings from './pages/Settings';
import OllamaModels from './pages/OllamaModels';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<ProjectList />} />
          <Route
            path="/projects/:projectId/runs/:runId"
            element={<RunDetail />}
          />
          <Route path="/rules" element={<RulesConfig />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/ollama" element={<OllamaModels />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
