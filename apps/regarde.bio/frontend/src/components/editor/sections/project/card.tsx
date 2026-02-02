import { Loaded } from "jazz-tools";
import { ArrowUpRight } from "lucide-react";

import { Button } from "#/components/ui/button";
import { Project } from "#/lib/schema";

import { EditorCardActions } from "../../shared/cardActions";

type ProjectCardProps = {
  project: Loaded<typeof Project>;
  onEdit: (project: Loaded<typeof Project>) => void;
  onDelete: (project: Loaded<typeof Project>) => void;
};

export function ProjectCard({ project, onEdit, onDelete }: ProjectCardProps) {
  const displayTitle = project.client
    ? `${project.title || "Untitled Project"} @${project.client}`
    : project.title || "Untitled Project";

  return (
    <div className="border-border flex flex-col gap-4 border-b pb-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-sm">
            {project.year === "ongoing" ? "Ongoing" : project.year || "Year missing"}
          </span>
        </div>
        <div className="flex flex-col gap-2">
          <div>
            {project.link ? (
              <Button
                variant="link-title"
                size="title"
                asChild
                className="group -mx-1 inline-flex items-center justify-start overflow-hidden"
              >
                <a
                  href={project.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex max-w-full min-w-0 items-center gap-1"
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
                className="-mx-1 cursor-default justify-start overflow-hidden"
              >
                <span className="truncate">{displayTitle}</span>
              </Button>
            )}
          </div>
          {project.description && (
            <p className="text-muted-foreground text-sm whitespace-pre-line">
              {project.description}
            </p>
          )}
          <div className="mt-2">
            <EditorCardActions item={project} onEdit={onEdit} onDelete={onDelete} />
          </div>
        </div>
      </div>
    </div>
  );
}
