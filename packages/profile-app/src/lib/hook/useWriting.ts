import { Loaded } from 'jazz-tools';

import { logger } from '#/lib/utils/logger';
import { ListOfWriting, Writing } from '../schema';
import { BaseHookProps } from './types';

type UseWritingProps = BaseHookProps;

export function useWriting({ profile, triggerSyncIndicator }: UseWritingProps) {
  const ensureWritingList = (): Loaded<typeof ListOfWriting> | undefined => {
    if (!profile.writing) {
      const profileOwner = profile._owner;
      profile.writing = ListOfWriting.create([], { owner: profileOwner });
    }
    return profile.writing;
  };

  const addWriting = async (writingData: {
    title: string;
    year?: string;
    publisher?: string;
    url?: string;
    description?: string;
  }): Promise<Loaded<typeof Writing> | undefined> => {
    const writingList = ensureWritingList();
    if (!writingList) return undefined;

    const listOwner = writingList._owner;

    const newWriting = Writing.create(
      {
        title: writingData.title,
        year: writingData.year,
        publisher: writingData.publisher,
        url: writingData.url,
        description: writingData.description,
      },
      { owner: listOwner },
    );
    writingList.push(newWriting);
    await triggerSyncIndicator(profile);
    return newWriting;
  };

  const updateWriting = async (
    writingToUpdate: Loaded<typeof Writing>,
    writingData: {
      title: string;
      year?: string;
      publisher?: string;
      url?: string;
      description?: string;
    },
  ) => {
    if (!writingToUpdate) {
      logger.error('Writing instance not provided for update.');
      return;
    }

    let changed = false;

    if (
      writingData.title !== undefined &&
      writingToUpdate.title !== writingData.title
    ) {
      writingToUpdate.title = writingData.title;
      changed = true;
    }

    if (
      writingData.year !== undefined &&
      writingToUpdate.year !== writingData.year
    ) {
      writingToUpdate.year = writingData.year;
      changed = true;
    }

    if (writingData.hasOwnProperty('publisher')) {
      if (writingToUpdate.publisher !== writingData.publisher) {
        writingToUpdate.publisher = writingData.publisher;
        changed = true;
      }
    }

    if (writingData.hasOwnProperty('url')) {
      if (writingToUpdate.url !== writingData.url) {
        writingToUpdate.url = writingData.url;
        changed = true;
      }
    }

    if (writingData.hasOwnProperty('description')) {
      if (writingToUpdate.description !== writingData.description) {
        writingToUpdate.description = writingData.description;
        changed = true;
      }
    }

    if (changed) {
      await triggerSyncIndicator(profile);
    }
  };

  const deleteWriting = async (writingId: string) => {
    const writingList = profile.writing;
    if (!writingList) {
      logger.warn('No writing list to delete from.');
      return;
    }
    const writingIndex = writingList.findIndex(
      (w: any) => w && w.id === writingId,
    );

    if (writingIndex !== -1) {
      writingList.splice(writingIndex, 1);
      await triggerSyncIndicator(profile);
    } else {
      logger.error(`Writing with id ${writingId} not found for deletion.`);
    }
  };

  return {
    addWriting,
    updateWriting,
    deleteWriting,
  };
}
