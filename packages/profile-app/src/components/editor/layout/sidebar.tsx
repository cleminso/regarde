import { cn } from '../../../lib/utils.ts';
import { Button } from '../../ui/button.tsx';
import { editorSections, SectionType } from '../shared.ts';
import { SyncStateBadge } from '../syncState.tsx';

type EditorSidebarProps = {
  activeSection: SectionType;
  onSectionChange: (section: SectionType) => void;
  syncState: 'saved' | 'syncing';
};

type SidebarButtonProps = {
  isActive: boolean;
  onClick: () => void;
  children: React.ReactNode;
};

function SidebarButton({ isActive, onClick, children }: SidebarButtonProps) {
  return (
    <Button
      variant="ghost"
      onClick={onClick}
      size="md"
      className={cn(
        'w-full justify-start px-6 text-sm font-medium',
        isActive
          ? 'bg-background text-foreground border-border hover:bg-background hover:text-foreground cursor-pointer'
          : 'text-foreground hover:bg-background hover:text-foreground cursor-pointer',
      )}
    >
      {children}
    </Button>
  );
}

export function EditorSidebar({
  activeSection,
  onSectionChange,
  syncState,
}: EditorSidebarProps) {
  return (
    <div className="w-[25%] flex flex-col bg-sidebar pt-6 border-r border-border">
      <div className="flex items-center justify-between px-6 pb-3">
        <h2 className="text-lg font-sans">Profile</h2>
        <SyncStateBadge syncState={syncState} />
      </div>
      <div className="">
        <SidebarButton
          isActive={activeSection === editorSections.general}
          onClick={() => onSectionChange(editorSections.general)}
        >
          General
        </SidebarButton>
        <SidebarButton
          isActive={activeSection === editorSections.contact}
          onClick={() => onSectionChange(editorSections.contact)}
        >
          Contact
        </SidebarButton>
        <SidebarButton
          isActive={activeSection === editorSections.project}
          onClick={() => onSectionChange(editorSections.project)}
        >
          Project
        </SidebarButton>
        <SidebarButton
          isActive={activeSection === editorSections.workExp}
          onClick={() => onSectionChange(editorSections.workExp)}
        >
          Work Experience
        </SidebarButton>
        <SidebarButton
          isActive={activeSection === editorSections.writing}
          onClick={() => onSectionChange(editorSections.writing)}
        >
          Writing
        </SidebarButton>
        <SidebarButton
          isActive={activeSection === editorSections.education}
          onClick={() => onSectionChange(editorSections.education)}
        >
          Education
        </SidebarButton>
        <SidebarButton
          isActive={activeSection === editorSections.certification}
          onClick={() => onSectionChange(editorSections.certification)}
        >
          Certification
        </SidebarButton>
        <SidebarButton
          isActive={activeSection === editorSections.speaking}
          onClick={() => onSectionChange(editorSections.speaking)}
        >
          Speaking
        </SidebarButton>

        <SidebarButton
          isActive={activeSection === editorSections.award}
          onClick={() => onSectionChange(editorSections.award)}
        >
          Award
        </SidebarButton>
        <SidebarButton
          isActive={activeSection === editorSections.volunteering}
          onClick={() => onSectionChange(editorSections.volunteering)}
        >
          Volunteering
        </SidebarButton>
        <SidebarButton
          isActive={activeSection === editorSections.sideProject}
          onClick={() => onSectionChange(editorSections.sideProject)}
        >
          Side Project
        </SidebarButton>
      </div>
    </div>
  );
}
