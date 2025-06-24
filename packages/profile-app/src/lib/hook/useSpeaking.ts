import { Loaded } from 'jazz-tools';

import { ListOfSpeaking, OnboardingProfile, Speaking } from '../schema';

type UseSpeakingProps = {
  profile: Loaded<typeof OnboardingProfile>;
  triggerSyncIndicator: () => void;
};

export function useSpeaking({
  profile,
  triggerSyncIndicator,
}: UseSpeakingProps) {
  const ensureSpeakingList = (): Loaded<typeof ListOfSpeaking> | undefined => {
    if (!profile.speaking) {
      const profileOwner = profile._owner;
      if (!profileOwner) {
        console.error(
          'Cannot initialize speaking list: profile._owner is undefined.',
        );
        return undefined;
      }

      profile.speaking = ListOfSpeaking.create([], { owner: profileOwner });
    }
    return profile.speaking;
  };

  const addSpeaking = (
    speakingData: Speaking,
  ): Loaded<typeof Speaking> | undefined => {
    const speakingList = ensureSpeakingList();
    if (!speakingList) return undefined;

    const listOwner = speakingList._owner;
    if (!listOwner) {
      console.error(
        'Cannot create a new speaking instance: speakingList._owner is undefined.',
      );
      return undefined;
    }
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
    triggerSyncIndicator();
    return newSpeaking;
  };

  const updateSpeaking = (
    speakingToUpdate: Loaded<typeof Speaking>,
    speakingData: Speaking,
  ) => {
    if (!speakingToUpdate) {
      console.error('Speaking instance not provided for update.');
      return;
    }

    let changed = false;
    for (const key in speakingData) {
      if (Object.prototype.hasOwnProperty.call(speakingData, key)) {
        const field = key as keyof Speaking;
        const currentValue =
          speakingToUpdate[field as keyof Loaded<typeof Speaking>];
        const newValue = speakingData[field];

        if (field === 'title') {
          if (typeof newValue === 'string' && currentValue !== newValue) {
            speakingToUpdate[field] = newValue;
            changed = true;
          }
        } else if (field === 'year') {
          if (newValue instanceof Date && currentValue !== newValue) {
            speakingToUpdate[field] = newValue;
            changed = true;
          }
        } else {
          if (currentValue !== newValue) {
            speakingToUpdate[
              field as 'event' | 'location' | 'url' | 'description'
            ] = newValue as string | undefined;
            changed = true;
          }
        }
      }
    }

    if (changed) {
      triggerSyncIndicator();
    }
  };

  const deleteSpeaking = (speakingId: string) => {
    const speakingList = profile.speaking;
    if (!speakingList) {
      console.warn('No speaking list to delete from.');
      return;
    }
    const speakingIndex = speakingList.findIndex(
      (s: any) => s && s.id === speakingId,
    );

    if (speakingIndex !== -1) {
      speakingList.splice(speakingIndex, 1);
      triggerSyncIndicator();
    } else {
      console.error(`Speaking with id ${speakingId} not found for deletion.`);
    }
  };

  return {
    addSpeaking,
    updateSpeaking,
    deleteSpeaking,
  };
}
