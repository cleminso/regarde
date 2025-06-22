import { Loaded } from 'jazz-tools';
import { useState } from 'react';
import { useNavigate } from 'react-router';

import { useEditProfile } from '../../lib/hook/useEditProfile.ts';
import { Project, WorkExp } from '../../lib/schema.ts';
import { createNicknameUrl } from '../../lib/utils.ts';
import {
  ContactEdit,
  EditorLayout,
  EditorSidebar,
  GeneralEdit,
  ProjectEdit,
  ProjectView,
  WorkExpEdit,
  WorkExpView,
} from './index.tsx';
import { editorSections, SectionType } from './shared.ts';

export function ProfileEditor() {
  const { profile, accountId, isLoading, syncState, triggerSyncIndicator } =
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
  const [workExpSectionViewMode, setWorkExpViewMode] = useState<
    'view' | 'form'
  >('view');
  const [workExpToEdit, setWorkExpToEdit] = useState<
    Loaded<typeof WorkExp> | undefined
  >(undefined);

  const navigate = useNavigate();

  const handleCloseEditor = () => {
    if (profile?.nickname) {
      navigate(createNicknameUrl(profile.nickname));
    } else {
      navigate('/profile');
    }
  };

  const handleSectionChange = (section: SectionType) => {
    if (
      activeSection === editorSections.project &&
      section !== editorSections.project
    ) {
      setProjectView('view');
      setProjectToEdit(undefined);
    }
    if (
      activeSection === editorSections.workExp &&
      section !== editorSections.workExp
    ) {
      setWorkExpViewMode('view');
      setWorkExpToEdit(undefined);
    }
    setActiveSection(section);
  };

  const handleEditProject = (project: Loaded<typeof Project>) => {
    setProjectToEdit(project);
    setProjectView('form');
  };

  const handleEditWorkExp = (workExp: Loaded<typeof WorkExp>) => {
    setWorkExpToEdit(workExp);
    setWorkExpViewMode('form');
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
            {activeSection === editorSections.general && (
              <GeneralEdit
                profile={profile!}
                triggerSyncIndicator={triggerSyncIndicator}
                onCloseEditor={handleCloseEditor}
                accountId={accountId!}
              />
            )}

            {activeSection === editorSections.contact && (
              <ContactEdit
                profile={profile!}
                triggerSyncIndicator={triggerSyncIndicator}
                onCloseEditor={handleCloseEditor}
              />
            )}
            {activeSection === editorSections.project &&
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
                  onClose={handleCloseEditor}
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
            {activeSection === editorSections.workExp &&
              (workExpSectionViewMode === 'view' ? (
                <WorkExpView
                  profile={profile!}
                  triggerSyncIndicator={triggerSyncIndicator}
                  workExperiences={profile?.workExp ?? undefined}
                  onAddWorkExp={() => {
                    setWorkExpToEdit(undefined);
                    setWorkExpViewMode('form');
                  }}
                  onEditWorkExp={handleEditWorkExp}
                  onClose={handleCloseEditor}
                />
              ) : (
                <WorkExpEdit
                  profile={profile!}
                  triggerSyncIndicator={triggerSyncIndicator}
                  onDoneEditing={() => {
                    setWorkExpViewMode('view');
                    setWorkExpToEdit(undefined);
                  }}
                  workExpToEdit={workExpToEdit}
                />
              ))}
          </>
        </div>
      }
    />
  );
}
