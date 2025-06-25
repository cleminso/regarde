import { Loaded } from 'jazz-tools';

import { ListOfSideProject, OnboardingProfile, SideProject } from '../schema';

type UseSideProjectProps = {
  profile: Loaded<typeof OnboardingProfile>;
  triggerSyncIndicator: () => void;
};

export function useSideProject({
  profile,
  triggerSyncIndicator,
}: UseSideProjectProps) {
  const ensureSideProjectList = ():
    | Loaded<typeof ListOfSideProject>
    | undefined => {
    if (!profile.sideProject) {
      const profileOwner = profile._owner;
      if (!profileOwner) {
        console.error(
          'Cannot initialize side projects list: profile._owner is undefined.',
        );
        return undefined;
      }
      profile.sideProject = ListOfSideProject.create([], {
        owner: profileOwner,
      });
    }
    return profile.sideProject;
  };

  const addSideProject = (
    sideProjectData: SideProject,
  ): Loaded<typeof SideProject> | undefined => {
    const sideProjectList = ensureSideProjectList();
    if (!sideProjectList) return undefined;

    const listOwner = sideProjectList._owner;
    if (!listOwner) {
      console.error(
        'Cannot create a new side project instance: sideProjectList._owner is undefined.',
      );
      return undefined;
    }

    const newSideProject = SideProject.create(
      {
        title: sideProjectData.title,
        year: sideProjectData.year,
        client: sideProjectData.client,
        url: sideProjectData.url,
        description: sideProjectData.description,
      },
      { owner: listOwner },
    );
    sideProjectList.push(newSideProject);
    triggerSyncIndicator();
    return newSideProject;
  };

  const updateSideProject = (
    sideProjectToUpdate: Loaded<typeof SideProject>,
    sideProjectData: SideProject,
  ) => {
    if (!sideProjectToUpdate) {
      console.error('Side project instance not provided for update.');
      return;
    }

    let changed = false;

    if (
      sideProjectData.title !== undefined &&
      sideProjectToUpdate.title !== sideProjectData.title
    ) {
      sideProjectToUpdate.title = sideProjectData.title;
      changed = true;
    }

    if (
      sideProjectData.year !== undefined &&
      sideProjectToUpdate.year !== sideProjectData.year
    ) {
      sideProjectToUpdate.year = sideProjectData.year;
      changed = true;
    }

    if (sideProjectData.hasOwnProperty('client')) {
      if (sideProjectToUpdate.client !== sideProjectData.client) {
        sideProjectToUpdate.client = sideProjectData.client;
        changed = true;
      }
    }

    if (sideProjectData.hasOwnProperty('url')) {
      if (sideProjectToUpdate.url !== sideProjectData.url) {
        sideProjectToUpdate.url = sideProjectData.url;
        changed = true;
      }
    }

    if (sideProjectData.hasOwnProperty('description')) {
      if (sideProjectToUpdate.description !== sideProjectData.description) {
        sideProjectToUpdate.description = sideProjectData.description;
        changed = true;
      }
    }

    if (changed) {
      triggerSyncIndicator();
    }
  };

  const deleteSideProject = (sideProjectId: string) => {
    const sideProjectList = profile.sideProject;
    if (!sideProjectList) {
      console.warn('No side projects list to delete from.');
      return;
    }
    const sideProjectIndex = sideProjectList.findIndex(
      (s: any) => s && s.id === sideProjectId,
    );

    if (sideProjectIndex !== -1) {
      sideProjectList.splice(sideProjectIndex, 1);
      triggerSyncIndicator();
    } else {
      console.error(
        `Side project with id ${sideProjectId} not found for deletion.`,
      );
    }
  };

  return {
    addSideProject,
    updateSideProject,
    deleteSideProject,
  };
}
