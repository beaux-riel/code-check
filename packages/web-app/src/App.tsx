import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import Layout from './components/Layout';
import ProjectList from './pages/ProjectList';
import ProjectDetail from './pages/ProjectDetail';
import ProjectSettings from './pages/ProjectSettings';
import RunDetail from './pages/RunDetail';
import RulesConfig from './pages/RulesConfig';
import Settings from './pages/Settings';
import DebugTest from './pages/DebugTest';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          {/* Debug route for testing */}
          <Route path="/debug" element={<DebugTest />} />

          {/* Main routes */}
          <Route path="/" element={<ProjectList />} />
          <Route path="/projects" element={<ProjectList />} />
          <Route path="/dashboard" element={<Navigate to="/" replace />} />

          {/* Project detail routes */}
          <Route path="/projects/:projectId" element={<ProjectDetail />} />
          <Route
            path="/projects/:projectId/settings"
            element={<ProjectSettings />}
          />
          <Route
            path="/projects/:projectId/runs/:runId"
            element={<RunDetail />}
          />

          {/* Other pages */}
          <Route path="/rules" element={<RulesConfig />} />
          <Route path="/settings" element={<Settings />} />

          {/* Catch-all route for unknown paths */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
