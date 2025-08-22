"use client";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FileText, Copy, Plus, Trash2, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { usePreFilledPromptsStore } from "@/store/preFilledPrompts";

interface PreFilledPromptsProps {
  open: boolean;
  onClose: () => void;
}

function PreFilledPrompts({ open, onClose }: PreFilledPromptsProps) {
  const { t } = useTranslation();
  const { prompts, addPrompt, removePrompt, updatePrompt } = usePreFilledPromptsStore();
  const [showAddNew, setShowAddNew] = useState(false);
  const [newPromptTitle, setNewPromptTitle] = useState("");
  const [newPromptContent, setNewPromptContent] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");

  const handleCopy = async (content: string, id: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAddPrompt = () => {
    if (newPromptTitle && newPromptContent) {
      addPrompt({
        title: newPromptTitle,
        content: newPromptContent,
        category: "Custom",
        tags: [],
        usageCount: 0,
        isTemplate: false,
      });
      setNewPromptTitle("");
      setNewPromptContent("");
      setShowAddNew(false);
    }
  };

  const handleStartEdit = (id: string, content: string) => {
    setEditingId(id);
    setEditingContent(content);
  };

  const handleSaveEdit = (id: string) => {
    updatePrompt(id, { content: editingContent });
    setEditingId(null);
    setEditingContent("");
  };

  const handleClose = (open: boolean) => {
    if (!open) onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {t("preFilledPrompts.title", "Pre-Filled Questions")}
          </DialogTitle>
          <DialogDescription>
            {t("preFilledPrompts.description", "Select a pre-filled prompt, copy it, and paste it into the research box. Edit as needed (e.g., replace [company] with actual company name and URL).")}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-4">
            {prompts.map((prompt) => (
              <div key={prompt.id} className="border rounded-lg p-4 space-y-2">
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-lg">{prompt.title}</h3>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopy(prompt.content, prompt.id)}
                    >
                      {copiedId === prompt.id ? (
                        <>
                          <Check className="w-4 h-4 mr-1" />
                          {t("research.common.copied", "Copied")}
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-1" />
                          {t("research.common.copy", "Copy")}
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removePrompt(prompt.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                {editingId === prompt.id ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editingContent}
                      onChange={(e) => setEditingContent(e.target.value)}
                      rows={10}
                      className="font-mono text-sm"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleSaveEdit(prompt.id)}
                      >
                        {t("research.common.save", "Save")}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingId(null)}
                      >
                        {t("setting.cancel", "Cancel")}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div 
                    className="text-sm text-muted-foreground whitespace-pre-wrap font-mono cursor-pointer hover:bg-muted/50 p-2 rounded"
                    onClick={() => handleStartEdit(prompt.id, prompt.content)}
                  >
                    {prompt.content.length > 500 
                      ? prompt.content.substring(0, 500) + "..." 
                      : prompt.content}
                  </div>
                )}
              </div>
            ))}

            {showAddNew ? (
              <div className="border rounded-lg p-4 space-y-2">
                <Input
                  placeholder={t("preFilledPrompts.promptTitle", "Prompt Title")}
                  value={newPromptTitle}
                  onChange={(e) => setNewPromptTitle(e.target.value)}
                />
                <Textarea
                  placeholder={t("preFilledPrompts.promptContent", "Prompt Content")}
                  value={newPromptContent}
                  onChange={(e) => setNewPromptContent(e.target.value)}
                  rows={10}
                  className="font-mono text-sm"
                />
                <div className="flex gap-2">
                  <Button onClick={handleAddPrompt}>
                    {t("knowledge.add", "Add")}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAddNew(false);
                      setNewPromptTitle("");
                      setNewPromptContent("");
                    }}
                  >
                    {t("setting.cancel", "Cancel")}
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowAddNew(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                {t("preFilledPrompts.addNew", "Add New Prompt")}
              </Button>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

export default PreFilledPrompts;