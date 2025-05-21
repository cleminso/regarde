import { Loaded } from 'jazz-tools';

import { ListOfProjects, OnboardingProfile, Project } from '../schema';

type UseProjectProps = {
  profile: Loaded<typeof OnboardingProfile>;
  triggerSyncIndicator: () => void;
};

type ProjectField = keyof Pick<
  Loaded<typeof Project>,
  'title' | 'year' | 'client' | 'link' | 'description'
>;

export function useProject({ profile, triggerSyncIndicator }: UseProjectProps) {
  const getOrCreateFirstProject = (): Loaded<typeof Project> | undefined => {
    if (!profile) return undefined;

    let projectsList = profile.projects;
    if (!projectsList) {
      const profileOwner = profile._owner;
      if (!profileOwner) {
        console.error(
          'Cannot create ListOfProjects: profile._owner is undefined.',
        );
        return undefined;
      }
      projectsList = ListOfProjects.create([], { owner: profileOwner });
      profile.projects = projectsList;
    }

    let firstProject = projectsList[0];
    if (!firstProject) {
      const listOwner = projectsList._owner;
      if (!listOwner) {
        console.error(
          'Cannot create Project: projectsList._owner is undefined.',
        );
        return undefined;
      }
      firstProject = Project.create(
        {
          title: '',
          year: '',
        },
        { owner: listOwner },
      );
      projectsList.push(firstProject);
    }
    return firstProject;
  };

  const project = getOrCreateFirstProject();

  const updateProjectField = (field: ProjectField, value: string) => {
    if (!project) {
      console.error(
        "Attempted to update a project that doesn't exist or couldn't be created.",
      );
      return;
    }

    if (field === 'client' || field === 'link' || field === 'description') {
      project[field] = value || undefined;
    } else {
      project[field] = value;
    }

    triggerSyncIndicator();
  };

  return { project, updateProjectField };
}
