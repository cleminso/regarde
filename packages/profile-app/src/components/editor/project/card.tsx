import { Loaded } from 'jazz-tools';
import { ArrowUpRight } from 'lucide-react';

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
        <div className="flex flex-col w-22.5 flex-shrink-0">
          <span className="text-sm font-sans text-muted-foreground">
            {project.year || 'N/A'}
          </span>
        </div>
        <div className="flex flex-col flex-grow gap-2 ">
          <div>
            {project.link ? (
              <a
                href={project.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-md font-sans text-foreground hover:underline hover:underline-offset-4 inline-flex items-center group"
              >
                {displayTitle}
                <ArrowUpRight className="h-4 w-4 ml-1 opacity-70 group-hover:opacity-100" />
              </a>
            ) : (
              <h3 className="text-md font-sans">{displayTitle}</h3>
            )}
          </div>
          {project.description && (
            <p className="text-sm text-muted-foreground whitespace-pre-line">
              {project.description}
            </p>
          )}
        </div>
      </div>

      <div className="pl-30">
        <EditorCardActions item={project} onEdit={onEdit} onDelete={onDelete} />
      </div>
    </div>
  );
}
