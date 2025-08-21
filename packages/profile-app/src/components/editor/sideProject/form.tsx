import { Loaded } from 'jazz-tools';
import { useEffect, useState } from 'react';

import { TriggerSyncIndicator } from '#/lib/hook/types';
import { useSideProject } from '#/lib/hook/useSideProject';
import { JazzAppProfile, SideProject } from '#/lib/schema';
import { getValidUrl } from '#/lib/utils';
import { Input, Label, Textarea } from '../../ui/index';
import { EditorFooter } from '../layout/footer';
import { SectionHeader } from '../layout/header';
import { SelectorDate } from '../selectorDate';

type SideProjectEditProps = {
  profile: Loaded<typeof JazzAppProfile>;
  triggerSyncIndicator: TriggerSyncIndicator;
  onDoneEditing: () => void;
  sideProjectToEdit?: Loaded<typeof SideProject>;
};

export function SideProjectEdit({
  profile,
  triggerSyncIndicator,
  onDoneEditing,
  sideProjectToEdit,
}: SideProjectEditProps) {
  const { addSideProject, updateSideProject } = useSideProject({
    profile,
    triggerSyncIndicator,
  });

  const currentYear = new Date().getFullYear().toString();

  const [title, setTitle] = useState('');
  const [year, setYear] = useState(currentYear);
  const [client, setClient] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (sideProjectToEdit) {
      setTitle(sideProjectToEdit.title || '');
      setYear(sideProjectToEdit.year || currentYear);
      setClient(sideProjectToEdit.client || '');
      setUrl(sideProjectToEdit.url || '');
      setDescription(sideProjectToEdit.description || '');
    } else {
      setTitle('');
      setYear(currentYear);
      setClient('');
      setUrl('');
      setDescription('');
    }
  }, [sideProjectToEdit, currentYear]);

  const handleSaveAndClose = () => {
    if (!title.trim() || !year.trim()) {
      alert('Project Name and Year are required.');
      return;
    }

    const sideProjectData = {
      title: title.trim(),
      year: year.trim(),
      client: client.trim() || undefined,
      url: getValidUrl(url.trim()),
      description: description.trim() || undefined,
    };

    if (sideProjectToEdit) {
      updateSideProject(sideProjectToEdit, sideProjectData);
    } else {
      addSideProject(sideProjectData);
    }
    onDoneEditing();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1">
        <SectionHeader
          title="Side Project"
          description="Showcase your personal project and experiment."
        />

        <div className="space-y-6">
          <section>
            <div className="flex flex-row gap-4">
              <div className="flex flex-col gap-2 w-full">
                <Label htmlFor="side-project-title">
                  Title<sup>*</sup>
                </Label>
                <Input
                  type="text"
                  id="side-project-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="My Fun Side Project"
                />
              </div>

              <div className="flex flex-col gap-2 w-full">
                <Label htmlFor="side-project-year">
                  Year<sup>*</sup>
                </Label>
                <SelectorDate
                  id="side-project-year"
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
            <div className="flex flex-row gap-4">
              <div className="flex flex-col gap-2 w-full">
                <Label htmlFor="side-project-client">Company or client</Label>
                <Input
                  type="text"
                  id="side-project-client"
                  value={client}
                  onChange={(e) => setClient(e.target.value)}
                  placeholder="Acme Inc."
                />
              </div>

              <div className="flex flex-col gap-2 w-full">
                <Label htmlFor="side-project-url">Link to project</Label>
                <Input
                  type="text"
                  id="side-project-url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                />
              </div>
            </div>
          </section>

          <section>
            <div className="flex flex-col gap-2 w-full">
              <Label htmlFor="side-project-description">Description</Label>
              <Textarea
                id="side-project-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add some details"
                className="min-h-[180px] resize-none"
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
