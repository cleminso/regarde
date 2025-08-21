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
