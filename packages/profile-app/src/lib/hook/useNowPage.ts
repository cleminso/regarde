import {
  NowPage,
  type CleanLoadedJazzAppProfile,
} from '@onboarding.jazz/shared-schemas';
import { useCallback } from 'react';

type UseNowPageProps = {
  profile: CleanLoadedJazzAppProfile;
  triggerSyncIndicator: () => void;
};

export function useNowPage({ profile, triggerSyncIndicator }: UseNowPageProps) {
  const nowPage = profile.nowPage;
  const hasNowPage = Boolean(nowPage);

  const updateNowPage = useCallback(
    (data: { title?: string; location?: string; description: string }) => {
      const profileOwner = profile._owner;
      if (!profileOwner) return;

      if (!profile.nowPage) {
        profile.nowPage = NowPage.create(
          {
            title: data.title,
            location: data.location,
            description: data.description,
            lastUpdated: Date.now(),
          },
          { owner: profileOwner },
        );
      } else {
        profile.nowPage.title = data.title;
        profile.nowPage.location = data.location;
        profile.nowPage.description = data.description;
        profile.nowPage.lastUpdated = Date.now();
      }

      triggerSyncIndicator();
    },
    [profile, triggerSyncIndicator],
  );

  return {
    nowPage,
    hasNowPage,
    updateNowPage,
  };
}
