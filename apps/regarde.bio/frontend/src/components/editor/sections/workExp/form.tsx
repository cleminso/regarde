import type { RegardeProfile, WorkExp } from "#/lib/schema";
import { Loaded } from "jazz-tools";
import { useEffect, useState } from "react";

import { TriggerSyncIndicator } from "#/lib/hook/types";
import { useWorkExp } from "#/lib/hook/useWorkExp";
import { getValidUrl } from "#/lib/utils/utils";

import { Input, Textarea } from "../../../ui/index";
import { EditorFooter } from "../../layout/footer";
import { SectionHeader } from "../../layout/header";
import { SelectorDate } from "../../shared/selectorDate";

type WorkExpEditProps = {
  profile: Loaded<typeof RegardeProfile>;
  triggerSyncIndicator: TriggerSyncIndicator;
  onDoneEditing: () => void;
  workExpToEdit?: Loaded<typeof WorkExp>;
};

export function WorkExpEdit({
  profile,
  triggerSyncIndicator,
  onDoneEditing,
  workExpToEdit,
}: WorkExpEditProps) {
  const { addWorkExp, updateWorkExp } = useWorkExp({
    profile,
    triggerSyncIndicator,
  });

  const currentYear = new Date().getFullYear().toString();

  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [location, setLocation] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [fromDate, setFromDate] = useState(currentYear);
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    if (workExpToEdit) {
      setTitle(workExpToEdit.title || "");
      setCompany(workExpToEdit.company || "");
      setLocation(workExpToEdit.location || "");
      setUrl(workExpToEdit.url || "");
      setDescription(workExpToEdit.description || "");
      setFromDate(workExpToEdit.from || currentYear);
      setToDate(workExpToEdit.to || "");
    } else {
      setTitle("");
      setCompany("");
      setLocation("");
      setUrl("");
      setDescription("");
      setFromDate(currentYear);
      setToDate("");
    }
  }, [workExpToEdit, currentYear]);

  const handleSaveAndClose = () => {
    if (!title.trim()) {
      const shouldContinue = confirm(
        "Adding a job title helps visitors understand your role. Would you like to save anyway?",
      );
      if (!shouldContinue) return;
    }

    const workExpData = {
      title: title.trim(),
      company: company.trim() || undefined,
      location: location.trim() || undefined,
      url: getValidUrl(url.trim()),
      description: description.trim() || undefined,
      from: fromDate.trim() || undefined,
      to: toDate.trim() || undefined,
    };

    if (workExpToEdit) {
      updateWorkExp(workExpToEdit, workExpData);
    } else {
      addWorkExp(workExpData);
    }
    onDoneEditing();
  };

  return (
    <div className="flex h-full flex-col lg:h-full">
      <div className="mobile-form-bottom flex-1 lg:flex-1 lg:pb-0">
        <SectionHeader
          title="Work Experience"
          description="Detail your professional roles and responsibilities."
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
                  id="work-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Senior Software Engineer, Product Designer"
                />
              </div>

              <div className="flex w-full flex-col gap-2">
                <label className="text-foreground block font-sans text-sm">Company</label>
                <Input
                  type="text"
                  id="work-company"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Google, Microsoft, Startup Inc."
                />
              </div>
            </div>
          </section>

          <section>
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="flex w-full flex-col gap-2">
                <label className="text-foreground block font-sans text-sm">From</label>
                <SelectorDate
                  id="work-from-date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  placeholderOption={{
                    value: "",
                    label: "Select Year",
                    disabled: true,
                  }}
                  buttonDisplayValue={fromDate || currentYear}
                />
              </div>

              <div className="flex w-full flex-col gap-2">
                <label className="text-foreground block font-sans text-sm">To</label>
                <SelectorDate
                  id="work-to-date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  placeholderOption={{ value: "", label: "Now" }}
                  buttonDisplayValue={toDate || "Now"}
                />
              </div>
            </div>
          </section>

          <section>
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="flex w-full flex-col gap-2">
                <label className="text-foreground block font-sans text-sm">Location</label>
                <Input
                  type="text"
                  id="work-location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., San Francisco, CA or Remote"
                />
              </div>

              <div className="flex w-full flex-col gap-2">
                <label className="text-foreground block font-sans text-sm">URL</label>
                <Input
                  type="text"
                  id="work-url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="company.com"
                />
              </div>
            </div>
          </section>

          <section>
            <div className="flex w-full flex-col gap-2">
              <label className="text-foreground block font-sans text-sm">Description</label>
              <Textarea
                id="work-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Share your key responsibilities, achievements, and impact. What did you build or improve?"
                className="min-h-[180px] resize-none"
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
