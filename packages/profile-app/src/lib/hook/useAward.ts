import { Loaded } from 'jazz-tools';

import { Award, ListOfAward, type CleanLoadedJazzAppProfile } from '../schema';

type UseAwardProps = {
  profile: CleanLoadedJazzAppProfile;
  triggerSyncIndicator: () => void;
};

export function useAward({ profile, triggerSyncIndicator }: UseAwardProps) {
  const ensureAwardsList = (): Loaded<typeof ListOfAward> | undefined => {
    if (!profile.award) {
      const profileOwner = profile._owner;
      if (!profileOwner) {
        console.error(
          'Cannot initialize award list: profile._owner is undefined.',
        );
        return undefined;
      }

      profile.award = ListOfAward.create([], { owner: profileOwner });
    }
    return profile.award;
  };

  const addAward = (awardData: Award): Loaded<typeof Award> | undefined => {
    const awardsList = ensureAwardsList();
    if (!awardsList) return undefined;

    const listOwner = awardsList._owner;
    if (!listOwner) {
      console.error(
        'Cannot create a new award instance: awardsList._owner is undefined.',
      );
      return undefined;
    }
    const newAward = Award.create(
      {
        title: awardData.title,
        year: awardData.year,
        presenter: awardData.presenter,
        url: awardData.url,
        description: awardData.description,
      },
      { owner: listOwner },
    );
    awardsList.push(newAward);
    triggerSyncIndicator();
    return newAward;
  };

  const updateAward = (
    awardToUpdate: Loaded<typeof Award>,
    awardData: Award,
  ) => {
    if (!awardToUpdate) {
      console.error('Award instance not provided for update.');
      return;
    }

    let changed = false;

    if (
      awardData.title !== undefined &&
      awardToUpdate.title !== awardData.title
    ) {
      awardToUpdate.title = awardData.title;
      changed = true;
    }

    if (awardData.year !== undefined && awardToUpdate.year !== awardData.year) {
      awardToUpdate.year = awardData.year;
      changed = true;
    }

    if (
      awardData.presenter !== undefined &&
      awardToUpdate.presenter !== awardData.presenter
    ) {
      awardToUpdate.presenter = awardData.presenter;
      changed = true;
    }

    if (awardData.hasOwnProperty('url')) {
      if (awardToUpdate.url !== awardData.url) {
        awardToUpdate.url = awardData.url;
        changed = true;
      }
    }

    if (awardData.hasOwnProperty('description')) {
      if (awardToUpdate.description !== awardData.description) {
        awardToUpdate.description = awardData.description;
        changed = true;
      }
    }

    if (changed) {
      triggerSyncIndicator();
    }
  };

  const deleteAward = (awardId: string) => {
    const awardsList = profile.award;
    if (!awardsList) {
      console.warn('No award list to delete from.');
      return;
    }
    const awardIndex = awardsList.findIndex((a: any) => a && a.id === awardId);

    if (awardIndex !== -1) {
      awardsList.splice(awardIndex, 1);
      triggerSyncIndicator();
    } else {
      console.error(`Award with id ${awardId} not found for deletion.`);
    }
  };

  return {
    addAward,
    updateAward,
    deleteAward,
  };
}
