import { Loaded } from 'jazz-tools';

import { Award, ListOfAward } from '../schema';
import { BaseHookProps } from './types';

type UseAwardProps = BaseHookProps;

export function useAward({ profile, triggerSyncIndicator }: UseAwardProps) {
  const ensureAwardsList = (): Loaded<typeof ListOfAward> | undefined => {
    if (!profile.award) {
      profile.award = ListOfAward.create([], { owner: profile._owner });
    }
    return profile.award;
  };

  const addAward = (
    awardData: {
      title: string;
      year: string;
      presenter: string;
      url?: string;
      description?: string;
    }
  ): Loaded<typeof Award> | undefined => {
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
    triggerSyncIndicator(profile);
    return newAward;
  };

  const updateAward = (
    awardToUpdate: Loaded<typeof Award>,
    awardData: {
      title: string;
      year: string;
      presenter: string;
      url?: string;
      description?: string;
    }
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
      triggerSyncIndicator(profile);
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
      triggerSyncIndicator(profile);
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
