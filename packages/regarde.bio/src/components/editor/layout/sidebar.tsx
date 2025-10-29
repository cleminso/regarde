import { ChevronUpIcon } from 'lucide-react';
import { useState } from 'react';

import { cn } from '#/lib/utils/utils.ts';
import { Button } from '../../ui/button.tsx';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '../../ui/drawer.tsx';
import { editorSections, SectionType } from '../shared/index.ts';
import { SyncStateBadge } from '../shared/syncState.tsx';

type EditorSidebarProps = {
  activeSection: SectionType;
  onSectionChange: (section: SectionType) => void;
  syncState: 'saved' | 'syncing' | 'error';
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
        'w-full justify-start px-4 lg:px-6 text-sm font-medium',
        isActive
          ? 'bg-secondary text-foreground border-border hover:bg-secondary hover:text-foreground cursor-pointer'
          : 'text-foreground hover:bg-secondary hover:text-foreground cursor-pointer',
      )}
    >
      {children}
    </Button>
  );
}

const sections = [
  { key: editorSections.general, name: 'General' },
  { key: editorSections.contact, name: 'Contact' },
  { key: editorSections.project, name: 'Projects' },
  { key: editorSections.workExp, name: 'Work Experience' },
  { key: editorSections.writing, name: 'Writing' },
  { key: editorSections.education, name: 'Education' },
  { key: editorSections.certification, name: 'Certifications' },
  { key: editorSections.speaking, name: 'Speaking' },
  { key: editorSections.award, name: 'Awards' },
  { key: editorSections.volunteering, name: 'Volunteering' },
  { key: editorSections.sideProject, name: 'Side Projects' },
  { key: editorSections.nowPage, name: 'Now Page' },
];

export function EditorSidebar({
  activeSection,
  onSectionChange,
  syncState,
}: EditorSidebarProps) {
  const [open, setOpen] = useState(false);

  const handleSectionChange = (section: SectionType) => {
    onSectionChange(section);
    setOpen(false);
  };

  return (
    <>
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-sidebar border-t border-sidebar-border">
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerTrigger asChild>
            <button className="w-full p-4 flex items-center justify-between hover:bg-sidebar-accent transition-colors">
              <div className="flex flex-col items-start">
                <span className="text-xs text-muted-foreground">Section</span>
                <span className="text-sm font-medium text-foreground">
                  {sections.find((s) => s.key === activeSection)?.name ||
                    'Profile'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <SyncStateBadge syncState={syncState} />
                <ChevronUpIcon className="h-5 w-5 text-muted-foreground" />
              </div>
            </button>
          </DrawerTrigger>

          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle className="font-mono text-foreground">
                Profile Sections
              </DrawerTitle>
            </DrawerHeader>

            <div className="grid grid-cols-2 gap-2 p-4 pb-8">
              {sections.map(({ key, name }) => (
                <SidebarButton
                  key={key}
                  isActive={activeSection === key}
                  onClick={() => handleSectionChange(key)}
                >
                  {name}
                </SidebarButton>
              ))}
            </div>
          </DrawerContent>
        </Drawer>
      </div>

      <div className="hidden lg:flex lg:w-[25%] flex-col bg-sidebar pt-6 border-r border-sidebar-border">
        <div className="flex items-center justify-between px-6 pb-3">
          <h2 className="text-lg font-sans">Profile</h2>
          <SyncStateBadge syncState={syncState} />
        </div>

        <div className="overflow-y-auto">
          {sections.map(({ key, name }) => (
            <SidebarButton
              key={key}
              isActive={activeSection === key}
              onClick={() => onSectionChange(key)}
            >
              {name}
            </SidebarButton>
          ))}
        </div>
      </div>
    </>
  );
}
