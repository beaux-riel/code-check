import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ProjectList from './pages/ProjectList';
import RunDetail from './pages/RunDetail';
import RulesConfig from './pages/RulesConfig';

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
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
