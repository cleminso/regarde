import { Loaded } from 'jazz-tools';
import { useEffect, useState } from 'react';

import { TriggerSyncIndicator } from '#/lib/hook/types';
import { useProject } from '#/lib/hook/useProject';
import { JazzAppProfile, Project } from '#/lib/schema';
import { getValidUrl } from '#/lib/utils/utils';
import { Input, Textarea } from '../../../ui/index';
import { EditorFooter } from '../../layout/footer';
import { SectionHeader } from '../../layout/header';
import { SelectorDate } from '../../shared/selectorDate';

type ProjectEditProps = {
  profile: Loaded<typeof JazzAppProfile>;
  triggerSyncIndicator: TriggerSyncIndicator;
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

  const currentYear = new Date().getFullYear().toString();

  const [title, setTitle] = useState('');
  const [year, setYear] = useState(currentYear);
  const [client, setClient] = useState('');
  const [link, setLink] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (projectToEdit) {
      setTitle(projectToEdit.title || '');
      setYear(projectToEdit.year || currentYear);
      setClient(projectToEdit.client || '');
      setLink(projectToEdit.link || '');
      setDescription(projectToEdit.description || '');
    } else {
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
      link: getValidUrl(link.trim()),
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
    <div className="flex flex-col h-full lg:h-full">
      <div className="flex-1 lg:flex-1 mobile-form-bottom lg:pb-0">
        <SectionHeader
          title="Project"
          description="Showcase your project and contribution."
        />

        <div className="space-y-6">
          <section>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex flex-col gap-2 w-full">
                <label className="text-sm font-sans block text-foreground">
                  Title<sup>*</sup>
                </label>
                <Input
                  type="text"
                  id="project-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="My Great Project"
                />
              </div>

              <div className="flex flex-col gap-2 w-full">
                <label className="text-sm font-sans block text-foreground">
                  Year<sup>*</sup>
                </label>
                <SelectorDate
                  id="project-year"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  placeholderOption={{
                    value: 'ongoing',
                    label: 'Ongoing',
                  }}
                  buttonDisplayValue={
                    year === 'ongoing' ? 'Ongoing' : year || currentYear
                  }
                />
              </div>
            </div>
          </section>

          <section>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex flex-col gap-2 w-full">
                <label className="text-sm font-sans block text-foreground">
                  Company or client
                </label>
                <Input
                  type="text"
                  id="project-client"
                  value={client}
                  onChange={(e) => setClient(e.target.value)}
                  placeholder="Acme Inc."
                />
              </div>

              <div className="flex flex-col gap-2 w-full">
                <label className="text-sm font-sans block text-foreground">
                  Link to project
                </label>
                <Input
                  type="text"
                  id="project-link"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="https://example.com"
                />
              </div>
            </div>
          </section>

          <section className="flex flex-col flex-1">
            <div className="flex flex-col gap-2 w-full h-full">
              <label className="text-sm font-sans block text-foreground">
                Description
              </label>
              <Textarea
                id="project-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add some details"
                className="flex-1 min-h-[270px] resize-none"
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
