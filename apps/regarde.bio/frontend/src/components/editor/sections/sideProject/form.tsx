import { Loaded } from "jazz-tools";
import { useEffect, useState } from "react";

import { TriggerSyncIndicator } from "#/lib/hook/types";
import { useSideProject } from "#/lib/hook/useSideProject";
import { RegardeProfile, SideProject } from "#/lib/schema";
import { getValidUrl } from "#/lib/utils/utils";

import { Input, Textarea } from "../../../ui/index";
import { EditorFooter } from "../../layout/footer";
import { SectionHeader } from "../../layout/header";
import { SelectorDate } from "../../shared/selectorDate";

type SideProjectEditProps = {
  profile: Loaded<typeof RegardeProfile>;
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

  const [title, setTitle] = useState("");
  const [year, setYear] = useState(currentYear);
  const [client, setClient] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (sideProjectToEdit) {
      setTitle(sideProjectToEdit.title || "");
      setYear(sideProjectToEdit.year || currentYear);
      setClient(sideProjectToEdit.client || "");
      setUrl(sideProjectToEdit.url || "");
      setDescription(sideProjectToEdit.description || "");
    } else {
      setTitle("");
      setYear(currentYear);
      setClient("");
      setUrl("");
      setDescription("");
    }
  }, [sideProjectToEdit, currentYear]);

  const handleSaveAndClose = () => {
    if (!title.trim()) {
      const shouldContinue = confirm(
        "Adding a project title helps visitors understand what you built. Would you like to save anyway?",
      );
      if (!shouldContinue) return;
    }

    const sideProjectData = {
      title: title.trim(),
      year: year.trim() || undefined,
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
    <div className="flex h-full flex-col lg:h-full">
      <div className="mobile-form-bottom flex-1 lg:flex-1 lg:pb-0">
        <SectionHeader
          title="Side Project"
          description="Showcase your personal project and experiment."
        />

        <div className="space-y-6">
          <section>
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="flex w-full flex-col gap-2">
                <label className="text-foreground block font-sans text-sm">
                  Title<sup>*</sup>
                </label>
                <Input
                  type="text"
                  id="side-project-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="My Fun Side Project"
                />
              </div>

              <div className="flex w-full flex-col gap-2">
                <label className="text-foreground block font-sans text-sm">Year</label>
                <SelectorDate
                  id="side-project-year"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  placeholderOption={{
                    value: "",
                    label: "Select Year",
                    disabled: true,
                  }}
                  buttonDisplayValue={year || currentYear}
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
                  id="side-project-client"
                  value={client}
                  onChange={(e) => setClient(e.target.value)}
                  placeholder="Acme Inc."
                />
              </div>

              <div className="flex w-full flex-col gap-2">
                <label className="text-foreground block font-sans text-sm">Link to project</label>
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
            <div className="flex w-full flex-col gap-2">
              <label className="text-foreground block font-sans text-sm">Description</label>
              <Textarea
                id="side-project-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add some details"
                className="min-h-[270px] resize-none"
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
