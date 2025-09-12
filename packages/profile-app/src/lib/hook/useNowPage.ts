import { NowPage } from '@onboarding.jazz/shared-schemas';
import { useCallback } from 'react';

import { BaseHookProps } from './types';

type UseNowPageProps = BaseHookProps;

export function useNowPage({ profile, triggerSyncIndicator }: UseNowPageProps) {
  const nowPage = profile.nowPage;
  const hasNowPage = Boolean(nowPage);

  const updateNowPage = useCallback(
    async (data: {
      title?: string;
      location?: string;
      description: string;
    }) => {
      const profileOwner = profile.$jazz.owner;
      if (!profileOwner) return;

      if (!profile.nowPage) {
        profile.$jazz.set("nowPage", NowPage.create(
          {
            title: data.title,
            location: data.location,
            description: data.description,
            lastUpdated: Date.now(),
          },
          { owner: profileOwner },
        ));
      } else {
        profile.nowPage.$jazz.set("title", data.title);
        profile.nowPage.$jazz.set("location", data.location);
        profile.nowPage.$jazz.set("description", data.description);
        profile.nowPage.$jazz.set("lastUpdated", Date.now());
      }

      await triggerSyncIndicator(profile);
    },
    [profile, triggerSyncIndicator],
  );

  return {
    nowPage,
    hasNowPage,
    updateNowPage,
  };
}
