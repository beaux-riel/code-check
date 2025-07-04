import { useState, useEffect } from 'react';
import { Project } from '../types';
import { apiService } from '../services/api';

export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const projectsData = await apiService.getProjects();
      setProjects(projectsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const createProject = async (
    project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    try {
      const newProject = await apiService.createProject(project);
      setProjects((prev) => [...prev, newProject]);
      return newProject;
    } catch (err) {
      throw new Error(
        err instanceof Error ? err.message : 'Failed to create project'
      );
    }
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    try {
      const updatedProject = await apiService.updateProject(id, updates);
      setProjects((prev) =>
        prev.map((p) => (p.id === id ? updatedProject : p))
      );
      return updatedProject;
    } catch (err) {
      throw new Error(
        err instanceof Error ? err.message : 'Failed to update project'
      );
    }
  };

  const deleteProject = async (id: string) => {
    try {
      await apiService.deleteProject(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      throw new Error(
        err instanceof Error ? err.message : 'Failed to delete project'
      );
    }
  };

  return {
    projects,
    loading,
    error,
    refetch: fetchProjects,
    createProject,
    updateProject,
    deleteProject,
  };
};
