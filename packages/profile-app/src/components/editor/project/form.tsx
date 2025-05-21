import { Loaded } from 'jazz-tools';

import { useProject } from '../../../lib/hook/useProject.ts';
import { OnboardingProfile } from '../../../lib/schema.ts';
import { Input, Textarea } from '../../ui/index.ts';
import { SectionHeader } from '../header.tsx';

type ProjectEditProps = {
  profile: Loaded<typeof OnboardingProfile>;
  triggerSyncIndicator: () => void;
  onDoneEditing: () => void;
};

export function ProjectEdit({
  profile,
  triggerSyncIndicator,
  onDoneEditing,
}: ProjectEditProps) {
  const { project, updateProjectField } = useProject({
    profile,
    triggerSyncIndicator,
  });

  if (!project) {
    return (
      <div className="space-y-4 w-full">
        <SectionHeader
          title="Projects"
          onActionClick={onDoneEditing}
          actionText="Add"
        />
        <div>Loading project data or encountered an issue...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full">
      <SectionHeader
        title="Projects"
        description="Showcase your projects and contributions."
        onActionClick={onDoneEditing}
        actionText="I'm done!"
      />
      <section>
        <div className="space-y-1 flex flex-row gap-4">
          <div className="flex flex-col gap-1 w-full">
            <label
              htmlFor="project-name"
              className="block text-sm font-medium text-foreground"
            >
              Name°
            </label>
            <Input
              type="text"
              id="project-title"
              value={project.title || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                updateProjectField('title', e.target.value)
              }
              placeholder="My wonderful project"
              className="w-full placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>

          <div className="flex flex-col gap-1 w-full">
            <label
              htmlFor="project-year"
              className="block text-sm font-medium text-foreground"
            >
              Year°
            </label>
            <Input
              type="text"
              id="project-year"
              value={project.year || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                updateProjectField('year', e.target.value)
              }
              placeholder="Ongoing"
              className="w-full placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
        </div>
      </section>

      <section>
        <div className="space-y-1 flex flex-row gap-4">
          <div className="flex flex-col gap-1 w-full">
            <label
              htmlFor="project-client"
              className="block text-sm font-medium text-foreground"
            >
              Company or client
            </label>
            <Input
              type="text"
              id="project-client"
              value={project.client || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                updateProjectField('client', e.target.value)
              }
              placeholder="Super client"
              className="w-full placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>

          <div className="flex flex-col gap-1 w-full">
            <label
              htmlFor="project-link"
              className="block text-sm font-medium text-foreground"
            >
              Link to project
            </label>
            <Input
              type="text"
              id="project-link"
              value={project.link || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                updateProjectField('link', e.target.value)
              }
              placeholder="https://example.com"
              className="w-full placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
        </div>
      </section>

      <section>
        <div className="space-y-1 flex flex-row gap-4">
          <div className="flex flex-col gap-1 w-full">
            <label
              htmlFor="project-description"
              className="block text-sm font-medium text-foreground "
            >
              Description
            </label>
            <Textarea
              id="project-description"
              value={project.description || ''}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                updateProjectField('description', e.target.value)
              }
              placeholder="Add some details"
              className="w-full placeholder:text-muted-foreground min-h-[300px] resize-none focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
