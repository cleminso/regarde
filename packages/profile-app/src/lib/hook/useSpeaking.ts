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
