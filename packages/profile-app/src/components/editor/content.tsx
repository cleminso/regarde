import { Loaded } from 'jazz-tools';
import { useState } from 'react';
import { useNavigate } from 'react-router';

import { useEditProfile } from '../../lib/hook/useEditProfile.ts';
import {
  Award,
  Certification,
  Education,
  Project,
  SideProject,
  Speaking,
  Volunteering,
  WorkExp,
  Writing,
} from '../../lib/schema.ts';
import { createNicknameUrl } from '../../lib/utils.ts';
import {
  AwardEdit,
  AwardView,
  CertificationEdit,
  CertificationView,
  ContactEdit,
  EditorLayout,
  EditorSidebar,
  EducationEdit,
  EducationView,
  GeneralEdit,
  NowPageView,
  ProjectEdit,
  ProjectView,
  SideProjectEdit,
  SideProjectView,
  SpeakingEdit,
  SpeakingView,
  VolunteeringEdit,
  VolunteeringView,
  WorkExpEdit,
  WorkExpView,
  WritingEdit,
  WritingView,
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
  const [sideProjectSectionViewMode, setSideProjectViewMode] = useState<
    'view' | 'form'
  >('view');
  const [sideProjectToEdit, setSideProjectToEdit] = useState<
    Loaded<typeof SideProject> | undefined
  >(undefined);
  const [workExpSectionViewMode, setWorkExpViewMode] = useState<
    'view' | 'form'
  >('view');
  const [workExpToEdit, setWorkExpToEdit] = useState<
    Loaded<typeof WorkExp> | undefined
  >(undefined);
  const [writingSectionViewMode, setWritingViewMode] = useState<
    'view' | 'form'
  >('view');
  const [writingToEdit, setWritingToEdit] = useState<
    Loaded<typeof Writing> | undefined
  >(undefined);
  const [educationSectionViewMode, setEducationViewMode] = useState<
    'view' | 'form'
  >('view');
  const [educationToEdit, setEducationToEdit] = useState<
    Loaded<typeof Education> | undefined
  >(undefined);
  const [certificationSectionViewMode, setCertificationViewMode] = useState<
    'view' | 'form'
  >('view');
  const [certificationToEdit, setCertificationToEdit] = useState<
    Loaded<typeof Certification> | undefined
  >(undefined);
  const [speakingSectionViewMode, setSpeakingViewMode] = useState<
    'view' | 'form'
  >('view');
  const [speakingToEdit, setSpeakingToEdit] = useState<
    Loaded<typeof Speaking> | undefined
  >(undefined);
  const [awardSectionViewMode, setAwardViewMode] = useState<'view' | 'form'>(
    'view',
  );
  const [awardToEdit, setAwardToEdit] = useState<
    Loaded<typeof Award> | undefined
  >(undefined);
  const [volunteeringSectionViewMode, setVolunteeringViewMode] = useState<
    'view' | 'form'
  >('view');
  const [volunteeringToEdit, setVolunteeringToEdit] = useState<
    Loaded<typeof Volunteering> | undefined
  >(undefined);

  const navigate = useNavigate();

  const handleCloseEditor = () => {
    if (profile?.userHandle?.nickname) {
      navigate(createNicknameUrl(profile.userHandle.nickname));
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
      activeSection === editorSections.sideProject &&
      section !== editorSections.sideProject
    ) {
      setSideProjectViewMode('view');
      setSideProjectToEdit(undefined);
    }
    if (
      activeSection === editorSections.workExp &&
      section !== editorSections.workExp
    ) {
      setWorkExpViewMode('view');
      setWorkExpToEdit(undefined);
    }
    if (
      activeSection === editorSections.writing &&
      section !== editorSections.writing
    ) {
      setWritingViewMode('view');
      setWritingToEdit(undefined);
    }
    if (
      activeSection === editorSections.education &&
      section !== editorSections.education
    ) {
      setEducationViewMode('view');
      setEducationToEdit(undefined);
    }
    if (
      activeSection === editorSections.certification &&
      section !== editorSections.certification
    ) {
      setCertificationViewMode('view');
      setCertificationToEdit(undefined);
    }
    if (
      activeSection === editorSections.speaking &&
      section !== editorSections.speaking
    ) {
      setSpeakingViewMode('view');
      setSpeakingToEdit(undefined);
    }
    if (
      activeSection === editorSections.award &&
      section !== editorSections.award
    ) {
      setAwardViewMode('view');
      setAwardToEdit(undefined);
    }
    if (
      activeSection === editorSections.volunteering &&
      section !== editorSections.volunteering
    ) {
      setVolunteeringViewMode('view');
      setVolunteeringToEdit(undefined);
    }
    setActiveSection(section);
  };

  const handleEditProject = (project: Loaded<typeof Project>) => {
    setProjectToEdit(project);
    setProjectView('form');
  };

  const handleEditSideProject = (sideProject: Loaded<typeof SideProject>) => {
    setSideProjectToEdit(sideProject);
    setSideProjectViewMode('form');
  };

  const handleEditWorkExp = (workExp: Loaded<typeof WorkExp>) => {
    setWorkExpToEdit(workExp);
    setWorkExpViewMode('form');
  };

  const handleEditWriting = (writing: Loaded<typeof Writing>) => {
    setWritingToEdit(writing);
    setWritingViewMode('form');
  };

  const handleEditEducation = (education: Loaded<typeof Education>) => {
    setEducationToEdit(education);
    setEducationViewMode('form');
  };

  const handleEditCertification = (
    certification: Loaded<typeof Certification>,
  ) => {
    setCertificationToEdit(certification);
    setCertificationViewMode('form');
  };

  const handleEditSpeaking = (speaking: Loaded<typeof Speaking>) => {
    setSpeakingToEdit(speaking);
    setSpeakingViewMode('form');
  };

  const handleEditAward = (award: Loaded<typeof Award>) => {
    setAwardToEdit(award);
    setAwardViewMode('form');
  };

  const handleEditVolunteering = (
    volunteering: Loaded<typeof Volunteering>,
  ) => {
    setVolunteeringToEdit(volunteering);
    setVolunteeringViewMode('form');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4 min-h-[600px]">
        <div className="w-[840px] h-[600px] flex items-center justify-center p-6 border-0 shadow-none bg-card text-card-foreground rounded-xl"></div>
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
        <div className="w-[75%] flex flex-col p-6 overflow-y-auto overflow-x-hidden">
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
            {activeSection === editorSections.sideProject &&
              (sideProjectSectionViewMode === 'view' ? (
                <SideProjectView
                  profile={profile!}
                  triggerSyncIndicator={triggerSyncIndicator}
                  sideProjects={profile?.sideProject ?? undefined}
                  onAddSideProject={() => {
                    setSideProjectToEdit(undefined);
                    setSideProjectViewMode('form');
                  }}
                  onEditSideProject={handleEditSideProject}
                  onClose={handleCloseEditor}
                />
              ) : (
                <SideProjectEdit
                  profile={profile!}
                  triggerSyncIndicator={triggerSyncIndicator}
                  onDoneEditing={() => {
                    setSideProjectViewMode('view');
                    setSideProjectToEdit(undefined);
                  }}
                  sideProjectToEdit={sideProjectToEdit}
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
            {activeSection === editorSections.writing &&
              (writingSectionViewMode === 'view' ? (
                <WritingView
                  profile={profile!}
                  triggerSyncIndicator={triggerSyncIndicator}
                  writing={profile?.writing ?? undefined}
                  onAddWriting={() => {
                    setWritingToEdit(undefined);
                    setWritingViewMode('form');
                  }}
                  onEditWriting={handleEditWriting}
                  onClose={handleCloseEditor}
                />
              ) : (
                <WritingEdit
                  profile={profile!}
                  triggerSyncIndicator={triggerSyncIndicator}
                  onDoneEditing={() => {
                    setWritingViewMode('view');
                    setWritingToEdit(undefined);
                  }}
                  writingToEdit={writingToEdit}
                />
              ))}
            {activeSection === editorSections.education &&
              (educationSectionViewMode === 'view' ? (
                <EducationView
                  profile={profile!}
                  triggerSyncIndicator={triggerSyncIndicator}
                  education={profile?.education ?? undefined}
                  onAddEducation={() => {
                    setEducationToEdit(undefined);
                    setEducationViewMode('form');
                  }}
                  onEditEducation={handleEditEducation}
                  onClose={handleCloseEditor}
                />
              ) : (
                <EducationEdit
                  profile={profile!}
                  triggerSyncIndicator={triggerSyncIndicator}
                  onDoneEditing={() => {
                    setEducationViewMode('view');
                    setEducationToEdit(undefined);
                  }}
                  educationToEdit={educationToEdit}
                />
              ))}
            {activeSection === editorSections.certification &&
              (certificationSectionViewMode === 'view' ? (
                <CertificationView
                  profile={profile!}
                  triggerSyncIndicator={triggerSyncIndicator}
                  certifications={profile?.certification ?? undefined}
                  onAddCertification={() => {
                    setCertificationToEdit(undefined);
                    setCertificationViewMode('form');
                  }}
                  onEditCertification={handleEditCertification}
                  onClose={handleCloseEditor}
                />
              ) : (
                <CertificationEdit
                  profile={profile!}
                  triggerSyncIndicator={triggerSyncIndicator}
                  onDoneEditing={() => {
                    setCertificationViewMode('view');
                    setCertificationToEdit(undefined);
                  }}
                  certificationToEdit={certificationToEdit}
                />
              ))}
            {activeSection === editorSections.speaking &&
              (speakingSectionViewMode === 'view' ? (
                <SpeakingView
                  profile={profile!}
                  triggerSyncIndicator={triggerSyncIndicator}
                  speaking={profile?.speaking ?? undefined}
                  onAddSpeaking={() => {
                    setSpeakingToEdit(undefined);
                    setSpeakingViewMode('form');
                  }}
                  onEditSpeaking={handleEditSpeaking}
                  onClose={handleCloseEditor}
                />
              ) : (
                <SpeakingEdit
                  profile={profile!}
                  triggerSyncIndicator={triggerSyncIndicator}
                  onDoneEditing={() => {
                    setSpeakingViewMode('view');
                    setSpeakingToEdit(undefined);
                  }}
                  speakingToEdit={speakingToEdit}
                />
              ))}
            {activeSection === editorSections.award &&
              (awardSectionViewMode === 'view' ? (
                <AwardView
                  profile={profile!}
                  triggerSyncIndicator={triggerSyncIndicator}
                  awards={profile?.award ?? undefined}
                  onAddAward={() => {
                    setAwardToEdit(undefined);
                    setAwardViewMode('form');
                  }}
                  onEditAward={handleEditAward}
                  onClose={handleCloseEditor}
                />
              ) : (
                <AwardEdit
                  profile={profile!}
                  triggerSyncIndicator={triggerSyncIndicator}
                  onDoneEditing={() => {
                    setAwardViewMode('view');
                    setAwardToEdit(undefined);
                  }}
                  awardToEdit={awardToEdit}
                />
              ))}
            {activeSection === editorSections.volunteering &&
              (volunteeringSectionViewMode === 'view' ? (
                <VolunteeringView
                  profile={profile!}
                  triggerSyncIndicator={triggerSyncIndicator}
                  volunteering={profile?.volunteering ?? undefined}
                  onAddVolunteering={() => {
                    setVolunteeringToEdit(undefined);
                    setVolunteeringViewMode('form');
                  }}
                  onEditVolunteering={handleEditVolunteering}
                  onClose={handleCloseEditor}
                />
              ) : (
                <VolunteeringEdit
                  profile={profile!}
                  triggerSyncIndicator={triggerSyncIndicator}
                  onDoneEditing={() => {
                    setVolunteeringViewMode('view');
                    setVolunteeringToEdit(undefined);
                  }}
                  volunteeringToEdit={volunteeringToEdit}
                />
              ))}
            {activeSection === editorSections.nowPage && (
              <NowPageView
                profile={profile!}
                triggerSyncIndicator={triggerSyncIndicator}
                onClose={handleCloseEditor}
              />
            )}
          </>
        </div>
      }
    />
  );
}
