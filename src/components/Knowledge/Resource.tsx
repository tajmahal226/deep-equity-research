"use client";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import Content from "./Content";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useKnowledgeStore } from "@/store/knowledge";

type Props = {
  /** The ID of the resource to display. */
  id: string;
  /** Whether the dialog is open. */
  open: boolean;
  /** Callback triggered when the dialog is closed. */
  onClose: () => void;
};

/**
 * Formats a timestamp into a human-readable string.
 * @param timestamp - The timestamp to format.
 * @returns The formatted date string.
 */
function formatDate(timestamp: number) {
  return dayjs(timestamp).format("YYYY-MM-DD HH:mm");
}

/**
 * KnowledgeInfor component.
 * Displays information about the knowledge resource (e.g., creation date, type).
 *
 * @param props - The component props.
 * @returns The knowledge info text or null.
 */
function KnowledgeInfor({ id }: { id: string }) {
  const { t } = useTranslation();
  const knowledge = useMemo(() => {
    const { knowledges } = useKnowledgeStore.getState();
    const detail = knowledges.find((item) => item.id === id);
    return detail;
  }, [id]);
  if (knowledge) {
    const createdAt = formatDate(knowledge.createdAt);
    if (knowledge.type === "file" && knowledge.fileMeta) {
      return t("knowledge.fileInfor", { createdAt });
    } else if (knowledge.type === "url" && knowledge.url) {
      return t("knowledge.urlInfor", { createdAt });
    } else {
      return t("knowledge.createInfor", { createdAt });
    }
  }
  return null;
}

/**
 * Resource component.
 * A dialog for viewing and editing a specific knowledge resource.
 *
 * @param props - The component props.
 * @returns The resource dialog component.
 */
function Resource({ id, open, onClose }: Props) {
  const { t } = useTranslation();
  function handleClose(open: boolean) {
    if (!open) onClose();
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-lg:max-w-screen-sm max-w-screen-md gap-2">
        <DialogHeader>
          <DialogTitle>{t("knowledge.resource")}</DialogTitle>
          <DialogDescription>
            <KnowledgeInfor id={id} />
          </DialogDescription>
        </DialogHeader>
        <Content
          id={id}
          editClassName="magicdown-editor h-72 overflow-y-auto"
          onSubmit={() => onClose()}
        ></Content>
      </DialogContent>
    </Dialog>
  );
}

export default Resource;
