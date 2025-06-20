import { Loaded } from 'jazz-tools';
import { useEffect, useState } from 'react';

import { useProject } from '../../../lib/hook/useProject.ts';
import { OnboardingProfile, Project } from '../../../lib/schema.ts';
import { Input, Textarea } from '../../ui/index.ts';
import { EditorFooter } from '../layout/footer';
import { SectionHeader } from '../layout/header.tsx';
import { SelectorDate } from '../selectorDate.tsx';

type ProjectEditProps = {
  profile: Loaded<typeof OnboardingProfile>;
  triggerSyncIndicator: () => void;
  onDoneEditing: () => void;
  projectToEdit?: Loaded<typeof Project>;
};

export function ProjectEdit({
  profile,
  triggerSyncIndicator,
  onDoneEditing,
  projectToEdit,
}: ProjectEditProps) {
  const { addProject, updateProject } = useProject({
    profile,
    triggerSyncIndicator,
  });

  // Get current year as default
  const currentYear = new Date().getFullYear().toString();

  const [title, setTitle] = useState('');
  const [year, setYear] = useState(currentYear); // Set current year as default
  const [client, setClient] = useState('');
  const [link, setLink] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (projectToEdit) {
      setTitle(projectToEdit.title || '');
      setYear(projectToEdit.year || currentYear); // Use current year as fallback
      setClient(projectToEdit.client || '');
      setLink(projectToEdit.link || '');
      setDescription(projectToEdit.description || '');
    } else {
      // When adding new project, reset to defaults with current year
      setTitle('');
      setYear(currentYear);
      setClient('');
      setLink('');
      setDescription('');
    }
  }, [projectToEdit, currentYear]);

  const handleSaveAndClose = () => {
    if (!title.trim() || !year.trim()) {
      alert('Project Name and Year are required.');
      return;
    }

    const projectData = {
      title: title.trim(),
      year: year.trim(),
      client: client.trim() || undefined,
      link: link.trim() || undefined,
      description: description.trim() || undefined,
    };

    if (projectToEdit) {
      updateProject(projectToEdit, projectData);
    } else {
      addProject(projectData);
    }
    onDoneEditing();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1">
        <SectionHeader
          title="Projects"
          description="Showcase your projects and contributions."
        />

        <div className="space-y-4">
          <section>
            <div className="space-y-1 flex flex-row gap-4">
              <div className="flex flex-col gap-1 w-full">
                <label
                  htmlFor="project-title"
                  className="block text-xs font-sans text-foreground"
                >
                  Title<sup>*</sup>
                </label>
                <Input
                  type="text"
                  id="project-title"
                  value={title}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setTitle(e.target.value)
                  }
                  placeholder="My Great Project"
                  className="w-full text-sm font-sans placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>

              <div className="flex flex-col gap-1 w-full">
                <label
                  htmlFor="project-year"
                  className="block text-xs font-sans text-foreground"
                >
                  Year<sup>*</sup>
                </label>
                <SelectorDate
                  id="project-year"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  placeholderOption={{
                    value: '',
                    label: 'Select Year',
                    disabled: true,
                  }}
                  buttonDisplayValue={year || currentYear}
                />
              </div>
            </div>
          </section>

          <section>
            <div className="space-y-1 flex flex-row gap-4">
              <div className="flex flex-col gap-1 w-full">
                <label
                  htmlFor="project-client"
                  className="block text-xs font-sans text-foreground"
                >
                  Company or client
                </label>
                <Input
                  type="text"
                  id="project-client"
                  value={client}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setClient(e.target.value)
                  }
                  placeholder="Acme Inc."
                  className="w-full text-sm font-sans placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>

              <div className="flex flex-col gap-1 w-full">
                <label
                  htmlFor="project-link"
                  className="block text-xs font-sans text-foreground"
                >
                  Link to project
                </label>
                <Input
                  type="text"
                  id="project-link"
                  value={link}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setLink(e.target.value)
                  }
                  placeholder="https://example.com"
                  className="w-full text-sm font-sans placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
            </div>
          </section>

          <section>
            <div className="flex flex-col gap-1 w-full">
              <label
                htmlFor="project-description"
                className="block text-xs font-sans text-foreground"
              >
                Description
              </label>
              <Textarea
                id="project-description"
                value={description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setDescription(e.target.value)
                }
                placeholder="Add some details"
                className="w-full text-sm placeholder:text-muted-foreground min-h-[200px] resize-none focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
          </section>
        </div>
      </div>

      <EditorFooter
        primaryAction={{
          text: 'Save',
          onClick: handleSaveAndClose,
        }}
        secondaryAction={{
          text: 'Cancel',
          onClick: onDoneEditing,
        }}
      />
    </div>
  );
}
