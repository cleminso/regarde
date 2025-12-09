import { Loaded } from 'jazz-tools';
import { ArrowUpRight } from 'lucide-react';

import { Button } from '#/components/ui/button';
import { SideProject } from '#/lib/schema';
import { EditorCardActions } from '../../shared/cardActions';

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
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {sideProject.year || 'Year missing'}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <div>
            {sideProject.url ? (
              <Button
                variant="link-title"
                size="title"
                asChild
                className="inline-flex items-center group -mx-1 justify-start overflow-hidden"
              >
                <a
                  href={sideProject.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-w-0 flex items-center gap-1 max-w-full"
                >
                  <span className="truncate">{displayTitle}</span>
                  <ArrowUpRight className="h-4 w-4 shrink-0 group-hover:opacity-100" />
                </a>
              </Button>
            ) : (
              <Button
                variant="link-title"
                size="title"
                disabled
                className="cursor-default justify-start overflow-hidden -mx-1"
              >
                <span className="truncate">{displayTitle}</span>
              </Button>
            )}
          </div>
          {sideProject.description && (
            <p className="text-sm text-muted-foreground whitespace-pre-line">
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
