import { Loaded } from "jazz-tools";
import { useEffect, useState } from "react";

import { TriggerSyncIndicator } from "#/lib/hook/types";
import { useProject } from "#/lib/hook/useProject";
import { Project, RegardeProfile } from "#/lib/schema";
import { getValidUrl } from "#/lib/utils/utils";

import { Input, Textarea } from "../../../ui/index";
import { EditorFooter } from "../../layout/footer";
import { SectionHeader } from "../../layout/header";
import { SelectorDate } from "../../shared/selectorDate";

type ProjectEditProps = {
  profile: Loaded<typeof RegardeProfile>;
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

  const [title, setTitle] = useState("");
  const [year, setYear] = useState(currentYear);
  const [client, setClient] = useState("");
  const [link, setLink] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (projectToEdit) {
      setTitle(projectToEdit.title || "");
      setYear(projectToEdit.year || currentYear);
      setClient(projectToEdit.client || "");
      setLink(projectToEdit.link || "");
      setDescription(projectToEdit.description || "");
    } else {
      setTitle("");
      setYear(currentYear);
      setClient("");
      setLink("");
      setDescription("");
    }
  }, [projectToEdit, currentYear]);

  const handleSaveAndClose = () => {
    if (!title.trim()) {
      const shouldContinue = confirm(
        "Adding a project title helps visitors understand what you built. Would you like to save anyway?",
      );
      if (!shouldContinue) return;
    }

    const projectData = {
      title: title.trim(),
      year: year.trim() || undefined,
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
    <div className="flex h-full flex-col lg:h-full">
      <div className="mobile-form-bottom flex-1 lg:flex-1 lg:pb-0">
        <SectionHeader title="Project" description="Showcase your project and contribution." />

        <div className="space-y-6">
          <section>
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="flex w-full flex-col gap-2">
                <label className="text-foreground block font-sans text-sm">
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

              <div className="flex w-full flex-col gap-2">
                <label className="text-foreground block font-sans text-sm">Year</label>
                <SelectorDate
                  id="project-year"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  placeholderOption={{
                    value: "ongoing",
                    label: "Ongoing",
                  }}
                  buttonDisplayValue={year === "ongoing" ? "Ongoing" : year || currentYear}
                />
              </div>
            </div>
          </section>

          <section>
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="flex w-full flex-col gap-2">
                <label className="text-foreground block font-sans text-sm">Company or client</label>
                <Input
                  type="text"
                  id="project-client"
                  value={client}
                  onChange={(e) => setClient(e.target.value)}
                  placeholder="Acme Inc."
                />
              </div>

              <div className="flex w-full flex-col gap-2">
                <label className="text-foreground block font-sans text-sm">Link to project</label>
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

          <section className="flex flex-1 flex-col">
            <div className="flex h-full w-full flex-col gap-2">
              <label className="text-foreground block font-sans text-sm">Description</label>
              <Textarea
                id="project-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add some details"
                className="min-h-[270px] flex-1 resize-none"
              />
            </div>
          </section>
        </div>
      </div>

      <EditorFooter
        primaryAction={{
          text: "Save",
          onClick: handleSaveAndClose,
        }}
        secondaryAction={{
          text: "Cancel",
          onClick: onDoneEditing,
        }}
      />
    </div>
  );
}
