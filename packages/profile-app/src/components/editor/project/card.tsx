import { Loaded } from 'jazz-tools';
import { ArrowUpRight } from 'lucide-react';

import { Button } from '#/components/ui/button';
import { Project } from '#/lib/schema';
import { EditorCardActions } from '../cardActions';

type ProjectCardProps = {
  project: Loaded<typeof Project>;
  onEdit: (project: Loaded<typeof Project>) => void;
  onDelete: (project: Loaded<typeof Project>) => void;
};

export function ProjectCard({ project, onEdit, onDelete }: ProjectCardProps) {
  const displayTitle = project.client
    ? `${project.title || 'Untitled Project'} @${project.client}`
    : project.title || 'Untitled Project';

  return (
    <div className="flex flex-col border-b border-border pb-4 gap-4">
      <div className="flex flex-row gap-10">
        <div className="flex flex-col w-21.5 flex-shrink-0">
          <span className="text-sm text-muted-foreground">
            {project.year || 'N/A'}
          </span>
        </div>
        <div className="flex flex-col flex-grow gap-2">
          <div>
            {project.link ? (
              <Button
                variant="link-title"
                size="title"
                asChild
                className="inline-flex items-center group"
              >
                <a
                  href={project.link}
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
                className="cursor-default"
              >
                {displayTitle}
              </Button>
            )}
          </div>
          {project.description && (
            <p className="text-sm text-muted-foreground whitespace-pre-line">
              {project.description}
            </p>
          )}
          <div className="mt-2">
            <EditorCardActions
              item={project}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
