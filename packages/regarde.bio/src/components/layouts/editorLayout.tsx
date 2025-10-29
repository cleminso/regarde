import React from 'react';

import { Card } from '../ui/index.ts';

type EditorLayoutProps = {
  sidebar: React.ReactNode;
  mainContent: React.ReactNode;
};

export function EditorLayout({ sidebar, mainContent }: EditorLayoutProps) {
  return (
    <div className="min-h-screen lg:flex lg:items-center lg:justify-center lg:p-4">
      <Card className="w-full h-screen lg:w-[840px] lg:h-[700px] bg-background flex flex-col lg:overflow-hidden p-0 border-0 lg:border lg:border-border shadow-none lg:rounded-xl">
        <div className="flex flex-col lg:flex-row h-full">
          {sidebar}
          {mainContent}
        </div>
      </Card>
    </div>
  );
}
