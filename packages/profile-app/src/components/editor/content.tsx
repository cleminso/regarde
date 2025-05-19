import { useAccount } from 'jazz-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { OnboardingProfile, SocialLinks } from '../../lib/schema.ts';
import { EditorLayout } from './layout.tsx';
import { ContactEdit } from './sections/contact.tsx';
import { GeneralEdit } from './sections/general.tsx';
import { EditorSidebar } from './sidebar.tsx';

export function ProfileEditor() {
  const { me } = useAccount({
    resolve: { profile: { socialLinks: true } },
  }) as { me: { profile: OnboardingProfile & { socialLinks?: SocialLinks } } };

  const [activeSection, setActiveSection] = useState<'general' | 'contact'>(
    'general',
  );

  const [syncState, setSyncState] = useState<'saved' | 'syncing'>('saved');
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);

  const navigate = useNavigate();

  const triggerSyncIndicator = () => {
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
    }
    setSyncState('syncing');
    timeoutIdRef.current = setTimeout(() => {
      setSyncState('saved');
      timeoutIdRef.current = null;
    }, 1500);
  };

  useEffect(() => {
    return () => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
    };
  }, []);

  const handleCloseEditor = () => {
    navigate('/profile');
  };

  if (!me || !me.profile) {
    return (
      <div className="flex items-center justify-center p-4 min-h-[600px]">
        <div className="w-[840px] h-[600px] flex items-center justify-center p-6 border-0 shadow-none bg-card text-card-foreground rounded-xl">
          <div>Loading profile...</div>
        </div>
      </div>
    );
  }

  return (
    <EditorLayout
      sidebar={
        <EditorSidebar
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          syncState={syncState}
        />
      }
      mainContent={
        <div className="w-[75%] flex flex-col p-6 overflow-y-auto">
          <>
            {activeSection === 'general' && (
              <GeneralEdit
                profile={me.profile}
                triggerSyncIndicator={triggerSyncIndicator}
                onCloseEditor={handleCloseEditor}
              />
            )}

            {activeSection === 'contact' && (
              <ContactEdit
                profile={me.profile}
                triggerSyncIndicator={triggerSyncIndicator}
                onCloseEditor={handleCloseEditor}
              />
            )}
          </>
        </div>
      }
    />
  );
}
