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

    const yearDate = new Date(sideProjectData.year);

    const newSideProject = SideProject.create(
      {
        title: sideProjectData.title,
        year: yearDate,
        client: sideProjectData.client,
        location: sideProjectData.location,
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
    dataToUpdate: SideProject,
  ) => {
    if (!sideProjectToUpdate) {
      console.error('Side project instance not provided for update.');
      return;
    }

    let changed = false;

    if (
      dataToUpdate.title !== undefined &&
      sideProjectToUpdate.title !== dataToUpdate.title
    ) {
      sideProjectToUpdate.title = dataToUpdate.title;
      changed = true;
    }

    if (
      dataToUpdate.year !== undefined &&
      sideProjectToUpdate.year !== dataToUpdate.year
    ) {
      sideProjectToUpdate.year = new Date(dataToUpdate.year);
      changed = true;
    }

    if (dataToUpdate.hasOwnProperty('client')) {
      if (sideProjectToUpdate.client !== dataToUpdate.client) {
        sideProjectToUpdate.client = dataToUpdate.client;
        changed = true;
      }
    }

    if (dataToUpdate.hasOwnProperty('location')) {
      if (sideProjectToUpdate.location !== dataToUpdate.location) {
        sideProjectToUpdate.location = dataToUpdate.location;
        changed = true;
      }
    }

    if (dataToUpdate.hasOwnProperty('url')) {
      if (sideProjectToUpdate.url !== dataToUpdate.url) {
        sideProjectToUpdate.url = dataToUpdate.url;
        changed = true;
      }
    }

    if (dataToUpdate.hasOwnProperty('description')) {
      if (sideProjectToUpdate.description !== dataToUpdate.description) {
        sideProjectToUpdate.description = dataToUpdate.description;
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
