import { Loaded } from 'jazz-tools';

import {
  ListOfProjects,
  Project,
} from '../schema';

import { BaseHookProps } from './types';

type UseProjectProps = BaseHookProps;
export function useProject({ profile, triggerSyncIndicator }: UseProjectProps) {
  const ensureProjectsList = (): Loaded<typeof ListOfProjects> | undefined => {
    if (!profile.projects) {
      const profileOwner = profile._owner;
      profile.projects = ListOfProjects.create([], { owner: profileOwner });
    }
    return profile.projects;
  };

  const addProject = (
    projectData: {
      title: string;
      year: string;
      client?: string;
      link?: string;
      description?: string;
    }
  ): Loaded<typeof Project> | undefined => {
    const projectsList = ensureProjectsList();
    if (!projectsList) return undefined;

    const listOwner = projectsList._owner;
    if (!listOwner) {
      console.error(
        'Cannot create a new project instance: projectsList._owner is undefined.',
      );
      return undefined;
    }
    const newProject = Project.create(
      {
        title: projectData.title,
        year: projectData.year,
        client: projectData.client,
        link: projectData.link,
        description: projectData.description,
      },
      { owner: listOwner },
    );
    projectsList.push(newProject);
    triggerSyncIndicator(profile);
    return newProject;
  };

  const updateProject = (
    projectToUpdate: Loaded<typeof Project>,
    projectData: {
      title: string;
      year: string;
      client?: string;
      link?: string;
      description?: string;
    }
  ) => {
    if (!projectToUpdate) {
      console.error('Project instance not provided for update.');
      return;
    }

    let changed = false;

    if (
      projectData.title !== undefined &&
      projectToUpdate.title !== projectData.title
    ) {
      projectToUpdate.title = projectData.title;
      changed = true;
    }

    if (
      projectData.year !== undefined &&
      projectToUpdate.year !== projectData.year
    ) {
      projectToUpdate.year = projectData.year;
      changed = true;
    }

    if (projectData.hasOwnProperty('client')) {
      if (projectToUpdate.client !== projectData.client) {
        projectToUpdate.client = projectData.client;
        changed = true;
      }
    }

    if (projectData.hasOwnProperty('link')) {
      if (projectToUpdate.link !== projectData.link) {
        projectToUpdate.link = projectData.link;
        changed = true;
      }
    }

    if (projectData.hasOwnProperty('description')) {
      if (projectToUpdate.description !== projectData.description) {
        projectToUpdate.description = projectData.description;
        changed = true;
      }
    }

    if (changed) {
      triggerSyncIndicator(profile);
    }
  };

  const deleteProject = (projectId: string) => {
    const projectsList = profile.projects;
    if (!projectsList) {
      console.warn('No projects list to delete from.');
      return;
    }
    const projectIndex = projectsList.findIndex(
      (p: any) => p && p.id === projectId,
    );

    if (projectIndex !== -1) {
      projectsList.splice(projectIndex, 1);
      triggerSyncIndicator(profile);
    } else {
      console.error(`Project with id ${projectId} not found for deletion.`);
    }
  };

  return {
    addProject,
    updateProject,
    deleteProject,
    // getProjectById: (projectId: string) => profile.projects?.find(p => p.id === projectId)
  };
}
