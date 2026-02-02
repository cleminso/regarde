import { Loaded } from "jazz-tools";
import { useEffect, useState } from "react";

import { TriggerSyncIndicator } from "#/lib/hook/types";
import { useEducation } from "#/lib/hook/useEducation";
import { Education, RegardeProfile } from "#/lib/schema";
import { getValidUrl } from "#/lib/utils/utils";

import { Input, Textarea } from "../../../ui/index";
import { EditorFooter } from "../../layout/footer";
import { SectionHeader } from "../../layout/header";
import { SelectorDate } from "../../shared/selectorDate";

type EducationEditProps = {
  profile: Loaded<typeof RegardeProfile>;
  triggerSyncIndicator: TriggerSyncIndicator;
  onDoneEditing: () => void;
  educationToEdit?: Loaded<typeof Education>;
};

export function EducationEdit({
  profile,
  triggerSyncIndicator,
  onDoneEditing,
  educationToEdit,
}: EducationEditProps) {
  const { addEducation, updateEducation } = useEducation({
    profile,
    triggerSyncIndicator,
  });

  const currentYear = new Date().getFullYear().toString();

  const [degree, setDegree] = useState("");
  const [institution, setInstitution] = useState("");
  const [location, setLocation] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [fromDate, setFromDate] = useState(currentYear);
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    if (educationToEdit) {
      setDegree(educationToEdit.degree || "");
      setInstitution(educationToEdit.institution || "");
      setLocation(educationToEdit.location || "");
      setUrl(educationToEdit.url || "");
      setDescription(educationToEdit.description || "");
      setFromDate(educationToEdit.from || currentYear);
      setToDate(educationToEdit.to || "");
    } else {
      setDegree("");
      setInstitution("");
      setLocation("");
      setUrl("");
      setDescription("");
      setFromDate(currentYear);
      setToDate("");
    }
  }, [educationToEdit, currentYear]);

  const handleSaveAndClose = () => {
    if (!degree.trim()) {
      const shouldContinue = confirm(
        "Adding your degree helps visitors understand your educational background. Would you like to save anyway?",
      );
      if (!shouldContinue) return;
    }

    const educationData = {
      degree: degree.trim(),
      institution: institution.trim() || undefined,
      location: location.trim() || undefined,
      url: getValidUrl(url.trim()),
      description: description.trim() || undefined,
      from: fromDate.trim() || undefined,
      to: toDate.trim() || undefined,
    };

    if (educationToEdit) {
      updateEducation(educationToEdit, educationData);
    } else {
      addEducation(educationData);
    }
    onDoneEditing();
  };

  return (
    <div className="flex h-full flex-col lg:h-full">
      <div className="mobile-form-bottom flex-1 lg:flex-1 lg:pb-0">
        <SectionHeader
          title="Education"
          description="Showcase your academic background and achievements."
        />

        <div className="space-y-6">
          <section>
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="flex w-full flex-col gap-2">
                <label className="text-foreground block font-sans text-sm">
                  Degree<sup>*</sup>
                </label>
                <Input
                  type="text"
                  id="education-degree"
                  value={degree}
                  onChange={(e) => setDegree(e.target.value)}
                  placeholder="Bachelor of Science in Computer Science, MBA"
                />
              </div>

              <div className="flex w-full flex-col gap-2">
                <label className="text-foreground block font-sans text-sm">Institution</label>
                <Input
                  type="text"
                  id="education-institution"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  placeholder="University of Dream"
                />
              </div>
            </div>
          </section>

          <section>
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="flex w-full flex-col gap-2">
                <label className="text-foreground block font-sans text-sm">From</label>
                <SelectorDate
                  id="education-from-date"
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
                  id="education-to-date"
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
                  id="education-location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="City, State/Province, Country"
                />
              </div>

              <div className="flex w-full flex-col gap-2">
                <label className="text-foreground block font-sans text-sm">URL</label>
                <Input
                  type="text"
                  id="education-url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="university.edu"
                />
              </div>
            </div>
          </section>

          <section>
            <div className="flex w-full flex-col gap-2">
              <label className="text-foreground block font-sans text-sm">Description</label>
              <Textarea
                id="education-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add notable achievements, something that makes your degree memorable."
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
