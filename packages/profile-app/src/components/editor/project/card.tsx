import { Loaded } from 'jazz-tools';

import { Button } from '#/components/ui';
import { Project } from '#/lib/schema';

type ProjectCardProps = {
  project: Loaded<typeof Project>;
  onEdit: (project: Loaded<typeof Project>) => void;
  onDelete: (project: Loaded<typeof Project>) => void;
};

export function ProjectCard({ project, onEdit, onDelete }: ProjectCardProps) {
  return (
    <div className="flex flex-row border border-border rounded-lg p-4 gap-4">
      <div className="flex flex-col w-[10%]">
        <span className="text-sm font-medium text-muted-foreground">
          {project.year || 'N/A'}
        </span>
      </div>
      <div className="flex flex-col flex-grow gap-2">
        <div>
          {project.link ? (
            <a
              href={project.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-lg font-semibold text-primary hover:underline"
            >
              {project.title || 'Untitled Project'}
            </a>
          ) : (
            <h3 className="text-lg font-semibold">
              {project.title || 'Untitled Project'}
            </h3>
          )}
        </div>
        {project.description && (
          <p className="text-sm text-muted-foreground">{project.description}</p>
        )}
        <div className="flex flex-row gap-2 mt-2">
          <Button variant="outline" size="sm" onClick={() => onEdit(project)}>
            Edit
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete(project)}
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}
