import { Loaded } from "jazz-tools";
import { useEffect, useState } from "react";

import { TriggerSyncIndicator } from "#/lib/hook/types";
import { useSpeaking } from "#/lib/hook/useSpeaking";
import { RegardeProfile, Speaking } from "#/lib/schema";
import { getValidUrl } from "#/lib/utils/utils";

import { Input, Textarea } from "../../../ui/index";
import { EditorFooter } from "../../layout/footer";
import { SectionHeader } from "../../layout/header";
import { SelectorDate } from "../../shared/selectorDate";

type SpeakingEditProps = {
  profile: Loaded<typeof RegardeProfile>;
  triggerSyncIndicator: TriggerSyncIndicator;

  onDoneEditing: () => void;
  speakingToEdit?: Loaded<typeof Speaking>;
};

export function SpeakingEdit({
  profile,
  triggerSyncIndicator,
  onDoneEditing,
  speakingToEdit,
}: SpeakingEditProps) {
  const { addSpeaking, updateSpeaking } = useSpeaking({
    profile,
    triggerSyncIndicator,
  });

  const currentYear = new Date().getFullYear().toString();

  const [title, setTitle] = useState("");
  const [year, setYear] = useState(currentYear);
  const [event, setEvent] = useState("");
  const [location, setLocation] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (speakingToEdit) {
      setTitle(speakingToEdit.title || "");
      setYear(speakingToEdit.year || currentYear);
      setEvent(speakingToEdit.event || "");
      setLocation(speakingToEdit.location || "");
      setUrl(speakingToEdit.url || "");
      setDescription(speakingToEdit.description || "");
    } else {
      setTitle("");
      setYear(currentYear);
      setEvent("");
      setLocation("");
      setUrl("");
      setDescription("");
    }
  }, [speakingToEdit, currentYear]);

  const handleSaveAndClose = () => {
    if (!title.trim()) {
      const shouldContinue = confirm(
        "Adding a talk title helps visitors understand your speaking topic. Would you like to save anyway?",
      );
      if (!shouldContinue) return;
    }

    const speakingData = {
      title: title.trim(),
      year: year.trim() || undefined,
      event: event.trim() || undefined,
      location: location.trim() || undefined,
      url: getValidUrl(url.trim()),
      description: description.trim() || undefined,
    };

    if (speakingToEdit) {
      updateSpeaking(speakingToEdit, speakingData);
    } else {
      addSpeaking(speakingData);
    }
    onDoneEditing();
  };

  return (
    <div className="flex h-full flex-col lg:h-full">
      <div className="mobile-form-bottom flex-1 lg:flex-1 lg:pb-0">
        <SectionHeader
          title="Speaking"
          description="Share your speaking engagements and presentations."
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
                  id="speaking-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="My great talk"
                />
              </div>

              <div className="flex w-full flex-col gap-2">
                <label className="text-foreground block font-sans text-sm">Year</label>
                <SelectorDate
                  id="speaking-year"
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
                <label className="text-foreground block font-sans text-sm">Event</label>
                <Input
                  type="text"
                  id="speaking-event"
                  value={event}
                  onChange={(e) => setEvent(e.target.value)}
                  placeholder="Apple Conference 2025"
                />
              </div>

              <div className="flex w-full flex-col gap-2">
                <label className="text-foreground block font-sans text-sm">Location</label>
                <Input
                  type="text"
                  id="speaking-location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Where it happened?"
                />
              </div>
            </div>
          </section>

          <section>
            <div className="flex w-full flex-col gap-2">
              <label className="text-foreground block font-sans text-sm">URL</label>
              <Input
                type="text"
                id="speaking-url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/my-talk"
              />
            </div>
          </section>

          <section>
            <div className="flex w-full flex-col gap-2">
              <label className="text-foreground block font-sans text-sm">Description</label>
              <Textarea
                id="speaking-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add some details about your presentation"
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
