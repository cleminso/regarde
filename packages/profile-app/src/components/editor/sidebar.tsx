import { Button } from '../ui/button';
import { SectionType } from './shared.ts';
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
  const baseButton = 'w-full justify-start px-6 text-left';
  const activeButton =
    'border-l-2 border-border bg-background text-foreground hover:bg-background hover:text-foreground';
  const inactiveButton =
    'text-muted-foreground hover:text-foreground hover:bg-background cursor-pointer';

  return (
    <div className="w-[25%] flex flex-col pt-6 border-r border-border">
      <div className="flex items-center justify-between px-6 pb-3">
        <h2 className="text-xl font-medium">Profile</h2>
        <SyncStateBadge syncState={syncState} />
      </div>
      <div className="space-y-1">
        <Button
          variant="ghost"
          onClick={() => onSectionChange('general')}
          className={`${baseButton} ${
            activeSection === 'general' ? activeButton : inactiveButton
          }`}
        >
          General
        </Button>
        <Button
          variant="ghost"
          onClick={() => onSectionChange('contact')}
          className={`${baseButton} ${
            activeSection === 'contact' ? activeButton : inactiveButton
          }`}
        >
          Contact
        </Button>
        <Button
          variant="ghost"
          onClick={() => onSectionChange('project')}
          className={`${baseButton} ${
            activeSection === 'project' ? activeButton : inactiveButton
          }`}
        >
          Project
        </Button>
      </div>
    </div>
  );
}
