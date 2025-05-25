import { Button } from '../ui/button';
import { editorSections, SectionType } from './shared.ts';
import { SyncStateBadge } from './syncState';

type EditorSidebarProps = {
  activeSection: SectionType;
  onSectionChange: (section: SectionType) => void;
  syncState: 'saved' | 'syncing';
};

export function EditorSidebar({
  activeSection,
  onSectionChange,
  syncState,
}: EditorSidebarProps) {
  const baseButton = 'w-full text-sm justify-start px-6 text-left';
  const activeButton =
    'border-l-2 border-border bg-background text-sm  text-foreground hover:bg-background hover:text-foreground';
  const inactiveButton =
    'text-sm text-muted-foreground hover:text-foreground hover:bg-background cursor-pointer';

  return (
    <div className="w-[25%] flex flex-col pt-6 border-r border-border">
      <div className="flex items-center justify-between px-6 pb-3">
        <h2 className="text-lg font-sans">Profile</h2>
        <SyncStateBadge syncState={syncState} />
      </div>
      <div className="space-y-1">
        <Button
          variant="ghost"
          onClick={() => onSectionChange(editorSections.general)}
          className={`${baseButton} ${
            activeSection === editorSections.general
              ? activeButton
              : inactiveButton
          }`}
        >
          General
        </Button>
        <Button
          variant="ghost"
          onClick={() => onSectionChange(editorSections.contact)}
          className={`${baseButton} ${
            activeSection === editorSections.contact
              ? activeButton
              : inactiveButton
          }`}
        >
          Contact
        </Button>
        <Button
          variant="ghost"
          onClick={() => onSectionChange(editorSections.project)}
          className={`${baseButton} ${
            activeSection === editorSections.project
              ? activeButton
              : inactiveButton
          }`}
        >
          Project
        </Button>
        <Button
          variant="ghost"
          onClick={() => onSectionChange(editorSections.workExp)}
          className={`${baseButton} ${
            activeSection === editorSections.workExp
              ? activeButton
              : inactiveButton
          }`}
        >
          Work Experience
        </Button>
      </div>
    </div>
  );
}
