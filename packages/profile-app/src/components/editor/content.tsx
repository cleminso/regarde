import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useEditProfile } from '../../lib/hook/useEditProfile.ts';
import { EditorLayout } from './layout.tsx';
import { ContactEdit, GeneralEdit, ProjectEdit } from './sections';
import { editorSections, SectionType } from './shared.ts';
import { EditorSidebar } from './sidebar.tsx';

export function ProfileEditor() {
  const { profile, isLoading, syncState, triggerSyncIndicator } =
    useEditProfile();
  const [activeSection, setActiveSection] = useState<SectionType>(
    editorSections.general,
  );

  const navigate = useNavigate();

  const handleCloseEditor = () => {
    navigate('/profile');
  };

  if (isLoading) {
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
                profile={profile!}
                triggerSyncIndicator={triggerSyncIndicator}
                onCloseEditor={handleCloseEditor}
              />
            )}

            {activeSection === 'contact' && (
              <ContactEdit
                profile={profile!}
                triggerSyncIndicator={triggerSyncIndicator}
                onCloseEditor={handleCloseEditor}
              />
            )}
            {activeSection === 'project' && (
              <ProjectEdit
                profile={profile!}
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
