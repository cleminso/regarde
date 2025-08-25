import { Loaded } from 'jazz-tools';

import { logger } from '#/lib/utils/logger';
import { ListOfSpeaking, Speaking } from '../schema';
import { BaseHookProps } from './types';

type UseSpeakingProps = BaseHookProps;

export function useSpeaking({
  profile,
  triggerSyncIndicator,
}: UseSpeakingProps) {
  const ensureSpeakingList = (): Loaded<typeof ListOfSpeaking> | undefined => {
    if (!profile.speaking) {
      const profileOwner = profile._owner;
      profile.speaking = ListOfSpeaking.create([], { owner: profileOwner });
    }
    return profile.speaking;
  };

  const addSpeaking = async (speakingData: {
    title: string;
    year: string;
    event?: string;
    location?: string;
    url?: string;
    description?: string;
  }): Promise<Loaded<typeof Speaking> | undefined> => {
    const speakingList = ensureSpeakingList();
    if (!speakingList) return undefined;

    const listOwner = speakingList._owner;

    const newSpeaking = Speaking.create(
      {
        title: speakingData.title,
        year: speakingData.year,
        event: speakingData.event,
        location: speakingData.location,
        url: speakingData.url,
        description: speakingData.description,
      },
      { owner: listOwner },
    );
    speakingList.push(newSpeaking);
    await triggerSyncIndicator(profile);
    return newSpeaking;
  };

  const updateSpeaking = async (
    speakingToUpdate: Loaded<typeof Speaking>,
    speakingData: {
      title: string;
      year: string;
      event?: string;
      location?: string;
      url?: string;
      description?: string;
    },
  ) => {
    if (!speakingToUpdate) {
      logger.error('Speaking instance not provided for update.');
      return;
    }

    let changed = false;

    if (
      speakingData.title !== undefined &&
      speakingToUpdate.title !== speakingData.title
    ) {
      speakingToUpdate.title = speakingData.title;
      changed = true;
    }

    if (
      speakingData.year !== undefined &&
      speakingToUpdate.year !== speakingData.year
    ) {
      speakingToUpdate.year = speakingData.year;
      changed = true;
    }

    if (speakingData.hasOwnProperty('event')) {
      if (speakingToUpdate.event !== speakingData.event) {
        speakingToUpdate.event = speakingData.event;
        changed = true;
      }
    }

    if (speakingData.hasOwnProperty('location')) {
      if (speakingToUpdate.location !== speakingData.location) {
        speakingToUpdate.location = speakingData.location;
        changed = true;
      }
    }

    if (speakingData.hasOwnProperty('url')) {
      if (speakingToUpdate.url !== speakingData.url) {
        speakingToUpdate.url = speakingData.url;
        changed = true;
      }
    }

    if (speakingData.hasOwnProperty('description')) {
      if (speakingToUpdate.description !== speakingData.description) {
        speakingToUpdate.description = speakingData.description;
        changed = true;
      }
    }

    if (changed) {
      await triggerSyncIndicator(profile);
    }
  };

  const deleteSpeaking = async (speakingId: string) => {
    const speakingList = profile.speaking;
    if (!speakingList) {
      logger.warn('No speaking list to delete from.');
      return;
    }
    const speakingIndex = speakingList.findIndex(
      (s: any) => s && s.id === speakingId,
    );

    if (speakingIndex !== -1) {
      speakingList.splice(speakingIndex, 1);
      await triggerSyncIndicator(profile);
    } else {
      logger.error(`Speaking with id ${speakingId} not found for deletion.`);
    }
  };

  return {
    addSpeaking,
    updateSpeaking,
    deleteSpeaking,
  };
}
