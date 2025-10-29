import { Loaded } from 'jazz-tools';

import { logger } from '#/lib/utils/logger';
import { ListOfProjects, Project } from '../schema';
import { BaseHookProps } from './types';

type UseProjectProps = BaseHookProps;
export function useProject({ profile, triggerSyncIndicator }: UseProjectProps) {
  const ensureProjectsList = (): Loaded<typeof ListOfProjects> | undefined => {
    if (!profile.projects) {
      const profileOwner = profile.$jazz.owner;
      const newProjectsList = ListOfProjects.create([], { owner: profileOwner }); // store the created list in a variable
      profile.$jazz.set("projects", newProjectsList); // set it on the profile
      return newProjectsList; // return the variable
    }
    return profile.projects;
  };

  const addProject = async (projectData: {
    title: string;
    year?: string;
    client?: string;
    link?: string;
    description?: string;
  }): Promise<Loaded<typeof Project> | undefined> => {
    const projectsList = ensureProjectsList();
    if (!projectsList) return undefined;

    const listOwner = projectsList.$jazz.owner;
    if (!listOwner) {
      logger.error(
        'Cannot create a new project instance: projectsList.$jazz.owner is undefined.',
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
    projectsList.$jazz.push(newProject);
    await triggerSyncIndicator(profile);
    return newProject;
  };

  const updateProject = async (
    projectToUpdate: Loaded<typeof Project>,
    projectData: {
      title: string;
      year?: string;
      client?: string;
      link?: string;
      description?: string;
    },
  ) => {
    if (!projectToUpdate) {
      logger.error('Project instance not provided for update.');
      return;
    }

    let changed = false;

    if (
      projectData.title !== undefined &&
      projectToUpdate.title !== projectData.title
    ) {
      projectToUpdate.$jazz.set("title", projectData.title);
      changed = true;
    }

    if (
      projectData.year !== undefined &&
      projectToUpdate.year !== projectData.year
    ) {
      projectToUpdate.$jazz.set("year", projectData.year);
      changed = true;
    }

    if (projectData.hasOwnProperty('client')) {
      if (projectToUpdate.client !== projectData.client) {
        projectToUpdate.$jazz.set("client", projectData.client);
        changed = true;
      }
    }

    if (projectData.hasOwnProperty('link')) {
      if (projectToUpdate.link !== projectData.link) {
        projectToUpdate.$jazz.set("link", projectData.link);
        changed = true;
      }
    }

    if (projectData.hasOwnProperty('description')) {
      if (projectToUpdate.description !== projectData.description) {
        projectToUpdate.$jazz.set("description", projectData.description);
        changed = true;
      }
    }

    if (changed) {
      await triggerSyncIndicator(profile);
    }
  };

  const deleteProject = async (projectId: string) => {
    const projectsList = profile.projects;
    if (!projectsList) {
      logger.warn('No projects list to delete from.');
      return;
    }
    const projectIndex = projectsList.findIndex(
      (p: any) => p && p.$jazz.id === projectId,
    );

    if (projectIndex !== -1) {
      projectsList.$jazz.splice(projectIndex, 1);
      await triggerSyncIndicator(profile);
    } else {
      logger.error(`Project with id ${projectId} not found for deletion.`);
    }
  };

  return {
    addProject,
    updateProject,
    deleteProject,
    // getProjectById: (projectId: string) => profile.projects?.find(p => p.$jazz.id === projectId)
  };
}
