import { Loaded } from 'jazz-tools';
import { ArrowUpRight } from 'lucide-react';

import { Button } from '#/components/ui/button';
import { SideProject } from '#/lib/schema';
import { EditorCardActions } from '../cardActions';

type SideProjectCardProps = {
  sideProject: Loaded<typeof SideProject>;
  onEdit: (sideProject: Loaded<typeof SideProject>) => void;
  onDelete: (sideProject: Loaded<typeof SideProject>) => void;
};

export function SideProjectCard({
  sideProject,
  onEdit,
  onDelete,
}: SideProjectCardProps) {
  const displayTitle = sideProject.client
    ? `${sideProject.title || 'Untitled Side Project'} @${sideProject.client}`
    : sideProject.title || 'Untitled Side Project';

  return (
    <div className="flex flex-col border-b border-border pb-4 gap-4">
      <div className="flex flex-row gap-10">
        <div className="flex flex-col w-21.5 flex-shrink-0">
          <span className="text-sm text-secondary-foreground">
            {sideProject.year || 'Year missing'}
          </span>
        </div>
        <div className="flex flex-col flex-grow gap-2">
          <div>
            {sideProject.url ? (
              <Button
                variant="link-title"
                size="title"
                asChild
                className="inline-flex items-center group -mx-1"
              >
                <a
                  href={sideProject.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {displayTitle}
                  <ArrowUpRight className="h-4 w-4 ml-1 opacity-70 group-hover:opacity-100" />
                </a>
              </Button>
            ) : (
              <Button
                variant="link-title"
                size="title"
                disabled
                className="cursor-default -mx-1"
              >
                {displayTitle}
              </Button>
            )}
          </div>
          {sideProject.description && (
            <p className="text-sm text-secondary-foreground whitespace-pre-line">
              {sideProject.description}
            </p>
          )}
          <div className="mt-2">
            <EditorCardActions
              item={sideProject}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
