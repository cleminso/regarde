import { Loaded } from 'jazz-tools';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useEditProfile } from '../../lib/hook/useEditProfile.ts';
import { Project } from '../../lib/schema.ts';
import {
  ContactEdit,
  EditorLayout,
  EditorSidebar,
  GeneralEdit,
  ProjectEdit,
  ProjectView,
} from './index.tsx';
import { editorSections, SectionType } from './shared.ts';

export function ProfileEditor() {
  const { profile, isLoading, syncState, triggerSyncIndicator } =
    useEditProfile();
  const [activeSection, setActiveSection] = useState<SectionType>(
    editorSections.general,
  );
  const [projectSectionViewMode, setProjectView] = useState<'view' | 'form'>(
    'view',
  );
  const [projectToEdit, setProjectToEdit] = useState<
    Loaded<typeof Project> | undefined
  >(undefined);

  const navigate = useNavigate();

  const handleCloseEditor = () => {
    navigate('/profile');
  };

  const handleSectionChange = (section: SectionType) => {
    if (activeSection === 'project' && section !== 'project') {
      setProjectView('view');
      setProjectToEdit(undefined);
    }
    setActiveSection(section);
  };

  const handleEditProject = (project: Loaded<typeof Project>) => {
    setProjectToEdit(project);
    setProjectView('form');
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
          onSectionChange={handleSectionChange}
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
            {activeSection === 'project' &&
              (projectSectionViewMode === 'view' ? (
                <ProjectView
                  profile={profile!}
                  triggerSyncIndicator={triggerSyncIndicator}
                  projects={profile?.projects ?? undefined}
                  onAddProject={() => {
                    setProjectToEdit(undefined);
                    setProjectView('form');
                  }}
                  onEditProject={handleEditProject}
                />
              ) : (
                <ProjectEdit
                  profile={profile!}
                  triggerSyncIndicator={triggerSyncIndicator}
                  onDoneEditing={() => {
                    setProjectView('view');
                    setProjectToEdit(undefined);
                  }}
                  projectToEdit={projectToEdit}
                />
              ))}
          </>
        </div>
      }
    />
  );
}
