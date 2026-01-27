import { Loaded } from "jazz-tools";

import { logger } from "#/lib/utils/logger";

import { ListOfSpeaking, Speaking } from "../schema";

import { BaseHookProps } from "./types";

type UseSpeakingProps = BaseHookProps;

export function useSpeaking({ profile, triggerSyncIndicator }: UseSpeakingProps) {
  const ensureSpeakingList = (): Loaded<typeof ListOfSpeaking> | undefined => {
    if (!profile.$isLoaded) {
      logger.error("Profile is not loaded");
      return undefined;
    }

    if (profile.speaking?.$isLoaded) {
      return profile.speaking;
    }

    // Create new list if it doesn't exist
    const profileOwner = profile.$jazz.owner;
    if (!profileOwner?.$isLoaded) {
      logger.error("Cannot create speaking list: profile owner is not loaded");
      return undefined;
    }

    const newSpeakingList = ListOfSpeaking.create([], { owner: profileOwner });
    profile.$jazz.set("speaking", newSpeakingList);
    return newSpeakingList;
  };

  const addSpeaking = async (speakingData: {
    title: string;
    year?: string;
    event?: string;
    location?: string;
    url?: string;
    description?: string;
  }): Promise<Loaded<typeof Speaking> | undefined> => {
    const speakingList = ensureSpeakingList();
    if (!speakingList) return undefined;

    const listOwner = speakingList.$jazz.owner;
    if (!listOwner?.$isLoaded) {
      logger.error("Cannot create speaking: list owner is not loaded");
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
    speakingList.$jazz.push(newSpeaking);
    await triggerSyncIndicator(profile);
    return newSpeaking;
  };

  const updateSpeaking = async (
    speakingToUpdate: Loaded<typeof Speaking>,
    speakingData: {
      title: string;
      year?: string;
      event?: string;
      location?: string;
      url?: string;
      description?: string;
    },
  ) => {
    if (!speakingToUpdate.$isLoaded) {
      logger.error("Speaking instance not provided for update.");
      return;
    }

    let changed = false;

    if (speakingData.title !== undefined && speakingToUpdate.title !== speakingData.title) {
      speakingToUpdate.$jazz.set("title", speakingData.title);
      changed = true;
    }

    if (speakingData.year !== undefined && speakingToUpdate.$jazz.set("year", speakingData.year)) {
      speakingToUpdate.$jazz.set("year", speakingData.year);
      changed = true;
    }

    if (speakingData.hasOwnProperty("event")) {
      if (speakingToUpdate.event !== speakingData.event) {
        speakingToUpdate.$jazz.set("event", speakingData.event);
        changed = true;
      }
    }

    if (speakingData.hasOwnProperty("location")) {
      if (speakingToUpdate.location !== speakingData.location) {
        speakingToUpdate.$jazz.set("location", speakingData.location);
        changed = true;
      }
    }

    if (speakingData.hasOwnProperty("url")) {
      if (speakingToUpdate.url !== speakingData.url) {
        speakingToUpdate.$jazz.set("url", speakingData.url);
        changed = true;
      }
    }

    if (speakingData.hasOwnProperty("description")) {
      if (speakingToUpdate.description !== speakingData.description) {
        speakingToUpdate.$jazz.set("description", speakingData.description);
        changed = true;
      }
    }

    if (changed) {
      await triggerSyncIndicator(profile);
    }
  };

  const deleteSpeaking = async (speakingId: string) => {
    if (!profile.$isLoaded) {
      logger.error("Profile is not loaded");
      return;
    }
    const speakingList = profile.speaking;
    if (!speakingList?.$isLoaded) {
      logger.warn("No speaking list to delete from or not loaded.");
      return;
    }
    const speakingIndex = speakingList.findIndex(
      (s: any) => s && s.$isLoaded && s.$jazz.id === speakingId,
    );

    if (speakingIndex !== -1) {
      speakingList.$jazz.splice(speakingIndex, 1);
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
