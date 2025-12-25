"use client";
import dynamic from "next/dynamic";
import { memo, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  LoaderCircle,
  CircleCheck,
  TextSearch,
  Download,
  Trash,
  RotateCcw,
  NotebookText,
} from "lucide-react";
import { Button } from "@/components/Internal/Button";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { useTaskStore } from "@/store/task";
import { downloadFile } from "@/utils/file";
import { addQuoteBeforeAllLines } from "@/utils/text";

const MagicDown = dynamic(() => import("@/components/MagicDown"));
const MagicDownView = dynamic(() => import("@/components/MagicDown/View"));
const Lightbox = dynamic(() => import("@/components/Internal/Lightbox"));

function TaskState({ state }: { state: SearchTask["state"] }) {
  if (state === "completed") {
    return <CircleCheck className="h-5 w-5" />;
  } else if (state === "processing") {
    return <LoaderCircle className="animate-spin h-5 w-5" />;
  } else {
    return <TextSearch className="h-5 w-5" />;
  }
}

interface TaskItemProps {
  item: SearchTask;
  onRetry: (query: string, researchGoal: string) => void;
  onRemove: (query: string) => void;
  onAddToKnowledgeBase: (item: SearchTask) => void;
  getSearchResultContent: (item: SearchTask) => string;
}

const TaskItem = memo(
  ({
    item,
    onRetry,
    onRemove,
    onAddToKnowledgeBase,
    getSearchResultContent,
  }: TaskItemProps) => {
    const { t } = useTranslation();
    const updateTask = useTaskStore((state) => state.updateTask);

    const handleLearningChange = useCallback(
      (value: string) => {
        updateTask(item.query, { learning: value });
      },
      [item.query, updateTask]
    );

    const handleRetry = useCallback(() => {
      onRetry(item.query, item.researchGoal);
    }, [item.query, item.researchGoal, onRetry]);

    const handleRemove = useCallback(() => {
      onRemove(item.query);
    }, [item.query, onRemove]);

    const handleAddToKnowledgeBase = useCallback(() => {
      onAddToKnowledgeBase(item);
    }, [item, onAddToKnowledgeBase]);

    const handleExport = useCallback(() => {
      downloadFile(
        getSearchResultContent(item),
        `${item.query}.md`,
        "text/markdown;charset=utf-8"
      );
    }, [item, getSearchResultContent]);

    const tools = useMemo(
      () => (
        <>
          <div className="px-1">
            <Separator className="dark:bg-slate-700" />
          </div>
          <Button
            className="float-menu-button"
            type="button"
            size="icon"
            variant="ghost"
            title={t("research.common.restudy")}
            side="left"
            sideoffset={8}
            onClick={handleRetry}
          >
            <RotateCcw />
          </Button>
          <Button
            className="float-menu-button"
            type="button"
            size="icon"
            variant="ghost"
            title={t("research.common.delete")}
            side="left"
            sideoffset={8}
            onClick={handleRemove}
          >
            <Trash />
          </Button>
          <div className="px-1">
            <Separator className="dark:bg-slate-700" />
          </div>
          <Button
            className="float-menu-button"
            type="button"
            size="icon"
            variant="ghost"
            title={t("research.common.addToKnowledgeBase")}
            side="left"
            sideoffset={8}
            onClick={handleAddToKnowledgeBase}
          >
            <NotebookText />
          </Button>
          <Button
            className="float-menu-button"
            type="button"
            size="icon"
            variant="ghost"
            title={t("research.common.export")}
            side="left"
            sideoffset={8}
            onClick={handleExport}
          >
            <Download />
          </Button>
        </>
      ),
      [t, handleRetry, handleRemove, handleAddToKnowledgeBase, handleExport]
    );

    return (
      <AccordionItem value={item.query}>
        <AccordionTrigger>
          <div className="flex">
            <TaskState state={item.state} />
            <span className="ml-1">{item.query}</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="prose prose-slate dark:prose-invert max-w-full min-h-20">
          <MagicDownView>
            {addQuoteBeforeAllLines(item.researchGoal)}
          </MagicDownView>
          <Separator className="mb-4" />
          <MagicDown
            value={item.learning}
            onChange={handleLearningChange}
            tools={tools}
          />
          {item.images?.length > 0 ? (
            <>
              <hr className="my-6" />
              <h4>{t("research.searchResult.relatedImages")}</h4>
              <Lightbox data={item.images}></Lightbox>
            </>
          ) : null}
          {item.sources?.length > 0 ? (
            <>
              <hr className="my-6" />
              <h4>{t("research.common.sources")}</h4>
              <ol>
                {item.sources.map((source, idx) => {
                  return (
                    <li className="ml-2" key={idx}>
                      <a href={source.url} target="_blank">
                        {source.title || source.url}
                      </a>
                    </li>
                  );
                })}
              </ol>
            </>
          ) : null}
        </AccordionContent>
      </AccordionItem>
    );
  }
);

TaskItem.displayName = "TaskItem";

export default TaskItem;
