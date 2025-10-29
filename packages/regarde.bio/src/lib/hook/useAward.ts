import { Loaded } from 'jazz-tools';

import { logger } from '#/lib/utils/logger';
import { Award, ListOfAward } from '../schema';
import { BaseHookProps } from './types';

type UseAwardProps = BaseHookProps;

export function useAward({ profile, triggerSyncIndicator }: UseAwardProps) {
  const ensureAwardsList = (): Loaded<typeof ListOfAward> | undefined => {
    if (!profile.award) {
      const newAwardsList = ListOfAward.create([], { owner: profile.$jazz.owner });
      profile.$jazz.set("award", newAwardsList);
      return newAwardsList;
    }
    return profile.award;
  };

  const addAward = async (awardData: {
    title: string;
    year?: string;
    presenter?: string;
    url?: string;
    description?: string;
  }): Promise<Loaded<typeof Award> | undefined> => {
    const awardsList = ensureAwardsList();
    if (!awardsList) return undefined;

    const listOwner = awardsList.$jazz.owner;
    if (!listOwner) {
      logger.error(
        'Cannot create a new award instance: awardsList.$jazz.owner is undefined.',
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
    awardsList.$jazz.push(newAward);
    await triggerSyncIndicator(profile);
    return newAward;
  };

  const updateAward = async (
    awardToUpdate: Loaded<typeof Award>,
    awardData: {
      title: string;
      year?: string;
      presenter?: string;
      url?: string;
      description?: string;
    },
  ) => {
    if (!awardToUpdate) {
      logger.error('Award instance not provided for update.');
      return;
    }

    let changed = false;

    if (
      awardData.title !== undefined &&
      awardToUpdate.title !== awardData.title
    ) {
      awardToUpdate.$jazz.set("title", awardData.title);
      changed = true;
    }

    if (awardData.year !== undefined && awardToUpdate.year !== awardData.year) {
      awardToUpdate.$jazz.set("year", awardData.year);
      changed = true;
    }

    if (
      awardData.presenter !== undefined &&
      awardToUpdate.presenter !== awardData.presenter
    ) {
      awardToUpdate.$jazz.set("presenter", awardData.presenter);
      changed = true;
    }

    if (awardData.hasOwnProperty('url')) {
      if (awardToUpdate.url !== awardData.url) {
        awardToUpdate.$jazz.set("url", awardData.url);
        changed = true;
      }
    }

    if (awardData.hasOwnProperty('description')) {
      if (awardToUpdate.description !== awardData.description) {
        awardToUpdate.$jazz.set("description", awardData.description);
        changed = true;
      }
    }

    if (changed) {
      await triggerSyncIndicator(profile);
    }
  };

  const deleteAward = async (awardId: string) => {
    const awardsList = profile.award;
    if (!awardsList) {
      logger.warn('No award list to delete from.');
      return;
    }
    const awardIndex = awardsList.findIndex((a: any) => a && a.$jazz.id === awardId);

    if (awardIndex !== -1) {
      awardsList.$jazz.splice(awardIndex, 1);
      await triggerSyncIndicator(profile);
    } else {
      logger.error(`Award with id ${awardId} not found for deletion.`);
    }
  };

  return {
    addAward,
    updateAward,
    deleteAward,
  };
}
