import React from 'react';

import { Card } from '../../ui/index.ts';

type EditorLayoutProps = {
  sidebar: React.ReactNode;
  mainContent: React.ReactNode;
};

export function EditorLayout({ sidebar, mainContent }: EditorLayoutProps) {
  return (
    <div className="flex items-center justify-center p-4">
      <Card className="w-[840px] h-[700px] flex flex-col overflow-hidden p-0 border-0 shadow-none">
        <div className="flex flex-row h-full">
          {sidebar}
          {mainContent}
        </div>
      </Card>
    </div>
  );
}
