import { Loaded } from 'jazz-tools';

import { Award, ListOfAward, OnboardingProfile } from '../schema';

type UseAwardProps = {
  profile: Loaded<typeof OnboardingProfile>;
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
    for (const key in awardData) {
      if (Object.prototype.hasOwnProperty.call(awardData, key)) {
        const field = key as keyof Award;
        const currentValue = awardToUpdate[field as keyof Loaded<typeof Award>];
        const newValue = awardData[field];

        if (field === 'title' || field === 'presenter') {
          if (typeof newValue === 'string' && currentValue !== newValue) {
            awardToUpdate[field as 'title' | 'presenter'] = newValue;
            changed = true;
          }
        } else if (field === 'year') {
          if (newValue !== currentValue) {
            awardToUpdate.year = newValue as Date;
            changed = true;
          }
        } else {
          if (currentValue !== newValue) {
            awardToUpdate[field as 'url' | 'description'] = newValue as
              | string
              | undefined;
            changed = true;
          }
        }
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
