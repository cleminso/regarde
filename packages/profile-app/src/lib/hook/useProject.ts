import { Loaded, z } from 'jazz-tools';

import { ListOfProjects, OnboardingProfile, Project } from '../schema';

type ProjectCreationData = z.input<typeof Project>;
type ProjectUpdateData = Partial<ProjectCreationData>;

type UseProjectProps = {
  profile: Loaded<typeof OnboardingProfile>;
  triggerSyncIndicator: () => void;
};
export function useProject({ profile, triggerSyncIndicator }: UseProjectProps) {
  const ensureProjectsList = (): Loaded<typeof ListOfProjects> | undefined => {
    if (!profile.projects) {
      const profileOwner = profile._owner;
      if (!profileOwner) {
        console.error(
          'Cannot initialize projects list: profile._owner is undefined.',
        );
        return undefined;
      }

      profile.projects = ListOfProjects.create([], { owner: profileOwner });
    }
    return profile.projects;
  };

  const addProject = (
    projectData: ProjectCreationData,
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
    triggerSyncIndicator();
    return newProject;
  };

  const updateProject = (
    projectToUpdate: Loaded<typeof Project>,
    projectData: ProjectUpdateData,
  ) => {
    if (!projectToUpdate) {
      console.error('Project instance not provided for update.');
      return;
    }

    let changed = false;
    for (const key in projectData) {
      if (Object.prototype.hasOwnProperty.call(projectData, key)) {
        const field = key as keyof ProjectUpdateData;
        const currentValue =
          projectToUpdate[field as keyof Loaded<typeof Project>];
        const newValue = projectData[field];

        if (field === 'title' || field === 'year') {
          if (typeof newValue === 'string' && currentValue !== newValue) {
            projectToUpdate[field as 'title' | 'year'] = newValue;
            changed = true;
          }
        } else {
          if (currentValue !== newValue) {
            projectToUpdate[field as 'client' | 'link' | 'description'] =
              newValue as string | undefined;
            changed = true;
          }
        }
      }
    }

    if (changed) {
      triggerSyncIndicator();
    }
  };

  const deleteProject = (projectId: string) => {
    const projectsList = profile.projects;
    if (!projectsList) {
      console.warn('No projects list to delete from.');
      return;
    }
    const projectIndex = projectsList.findIndex((p) => p && p.id === projectId);

    if (projectIndex !== -1) {
      projectsList.splice(projectIndex, 1);
      triggerSyncIndicator();
    } else {
      console.error(`Project with id ${projectId} not found for deletion.`);
    }
  };

  return {
    addProject,
    updateProject,
    deleteProject,
    // getProjectById: (projectId: string) => profile.projects?.find(p => p.id === projectId) // Optional helper
  };
}
