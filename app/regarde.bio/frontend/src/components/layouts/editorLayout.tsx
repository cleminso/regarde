import React from 'react';

import { Card } from '../ui/index.ts';

type EditorLayoutProps = {
  sidebar: React.ReactNode;
  mainContent: React.ReactNode;
};

export function EditorLayout({ sidebar, mainContent }: EditorLayoutProps) {
  return (
    <div className="min-h-screen lg:flex lg:items-center lg:justify-center lg:p-4">
      <Card className="bg-background lg:border-border flex h-screen w-full flex-col border-0 p-0 shadow-none lg:h-[700px] lg:w-[840px] lg:overflow-hidden lg:rounded-xl lg:border">
        <div className="flex h-full flex-col lg:flex-row">
          {sidebar}
          {mainContent}
        </div>
      </Card>
    </div>
  );
}
