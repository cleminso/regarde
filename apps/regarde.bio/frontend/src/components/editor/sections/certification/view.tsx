import { Loaded } from "jazz-tools";
import { useState } from "react";

import { Button, DestructiveConfirmationDialog } from "#/components/ui";
import { TriggerSyncIndicator } from "#/lib/hook/types";
import { useCertification } from "#/lib/hook/useCertification";
import { Certification, ListOfCertification, RegardeProfile } from "#/lib/schema";

import { EditorFooter } from "../../index";
import { SectionHeader } from "../../layout/header";

import { CertificationCard } from "./card";

type CertificationViewProps = {
  profile: Loaded<typeof RegardeProfile>;
  triggerSyncIndicator: TriggerSyncIndicator;
  certifications: Loaded<typeof ListOfCertification> | undefined;
  onAddCertification: () => void;
  onEditCertification: (certification: Loaded<typeof Certification>) => void;
  onClose?: () => void;
};

export function CertificationView({
  profile,
  triggerSyncIndicator,
  certifications,
  onAddCertification,
  onEditCertification,
  onClose,
}: CertificationViewProps) {
  const { deleteCertification } = useCertification({
    profile,
    triggerSyncIndicator,
  });

  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    certification: Loaded<typeof Certification> | null;
  }>({
    isOpen: false,
    certification: null,
  });

  const handleDeleteCertification = (certification: Loaded<typeof Certification>) => {
    setDeleteConfirmation({
      isOpen: true,
      certification,
    });
  };

  const confirmDelete = () => {
    if (deleteConfirmation.certification?.$isLoaded) {
      deleteCertification(deleteConfirmation.certification.$jazz.id);
    }
    setDeleteConfirmation({ isOpen: false, certification: null });
  };

  const cancelDelete = () => {
    setDeleteConfirmation({ isOpen: false, certification: null });
  };

  const handleClose = () => {
    onClose?.();
  };

  const getCertificationDisplayName = (certification: Loaded<typeof Certification>) => {
    const name = certification.name || "Untitled Certification";
    const organization = certification.organization || "Unknown Organization";
    return `${name} from ${organization}`;
  };

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0">
        <SectionHeader
          title="Certifications"
          description="Showcase your professional certifications and credentials."
          onActionClick={onAddCertification}
          actionText="Add Certification"
        />
      </div>

      <div className="flex-1 overflow-x-hidden overflow-y-auto">
        {(!certifications || certifications.length === 0) && (
          <div className="flex flex-col items-center py-20">
            <Button variant="ghost" size="sm" onClick={onAddCertification}>
              Add certifications you've earned
            </Button>
          </div>
        )}

        {certifications && certifications.length > 0 && (
          <div className="space-y-6 pb-4">
            {certifications
              .filter(
                (certification): certification is Loaded<typeof Certification> =>
                  certification?.$isLoaded === true,
              )
              .map((certification) => (
                <CertificationCard
                  key={certification.$jazz.id}
                  certification={certification}
                  onEdit={onEditCertification}
                  onDelete={handleDeleteCertification}
                />
              ))}
          </div>
        )}
      </div>

      <div className="shrink-0">
        <EditorFooter
          primaryAction={{
            text: "Done",
            onClick: handleClose,
          }}
        />
      </div>

      <DestructiveConfirmationDialog
        open={deleteConfirmation.isOpen}
        onOpenChange={(open) => !open && cancelDelete()}
        title="Delete Certification"
        description={
          deleteConfirmation.certification ? (
            <>
              Please confirm you'd like to delete{" "}
              <strong>{getCertificationDisplayName(deleteConfirmation.certification)}</strong>
              ?
              <br />
              <br />
              This action cannot be undone.
            </>
          ) : null
        }
        onConfirm={confirmDelete}
        confirmButtonText="Delete"
      />
    </div>
  );
}
