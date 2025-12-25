"use client";
import dynamic from "next/dynamic";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/Internal/Button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Accordion } from "@/components/ui/accordion";
import { Textarea } from "@/components/ui/textarea";
import useAccurateTimer from "@/hooks/useAccurateTimer";
import useDeepResearch from "@/hooks/useDeepResearch";
import useKnowledge from "@/hooks/useKnowledge";
import { useTaskStore } from "@/store/task";
import { useKnowledgeStore } from "@/store/knowledge";
import { addQuoteBeforeAllLines } from "@/utils/text";

const TaskItem = dynamic(() => import("./TaskItem"));

const formSchema = z.object({
  suggestion: z.string().optional(),
});

function SearchResult() {
  const { t } = useTranslation();
  const taskStore = useTaskStore();
  const { status, runSearchTask, reviewSearchResult } = useDeepResearch();
  const { generateId } = useKnowledge();
  const {
    formattedTime,
    start: accurateTimerStart,
    stop: accurateTimerStop,
  } = useAccurateTimer();
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const unfinishedTasks = useMemo(() => {
    return taskStore.tasks.filter((item) => item.state !== "completed");
  }, [taskStore.tasks]);
  const taskFinished = useMemo(() => {
    return taskStore.tasks.length > 0 && unfinishedTasks.length === 0;
  }, [taskStore.tasks, unfinishedTasks]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      suggestion: taskStore.suggestion,
    },
  });

  const getSearchResultContent = useCallback(
    (item: SearchTask) => {
      return [
        `## ${item.query}`,
        addQuoteBeforeAllLines(item.researchGoal),
        "---",
        item.learning,
        item.images?.length > 0
          ? `#### ${t("research.searchResult.relatedImages")}\n\n${item.images
              .map(
                (source) =>
                  `![${source.description || source.url}](${source.url})`
              )
              .join("\n")}`
          : "",
        item.sources?.length > 0
          ? `#### ${t("research.common.sources")}\n\n${item.sources
              .map(
                (source, idx) =>
                  `${idx + 1}. [${source.title || source.url}][${idx + 1}]`
              )
              .join("\n")}`
          : "",
      ].join("\n\n");
    },
    [t]
  );

  async function handleSubmit(values: z.infer<typeof formSchema>) {
    const { setSuggestion } = useTaskStore.getState();
    try {
      accurateTimerStart();
      setIsThinking(true);
      if (unfinishedTasks.length > 0) {
        await runSearchTask(unfinishedTasks);
      } else {
        if (values.suggestion) setSuggestion(values.suggestion);
        await reviewSearchResult();
        // Clear previous research suggestions
        setSuggestion("");
      }
    } finally {
      setIsThinking(false);
      accurateTimerStop();
    }
  }

  const addToKnowledgeBase = useCallback(
    (item: SearchTask) => {
      const { save } = useKnowledgeStore.getState();
      const currentTime = Date.now();
      save({
        id: generateId("knowledge"),
        title: item.query,
        content: getSearchResultContent(item),
        type: "knowledge",
        createdAt: currentTime,
        updatedAt: currentTime,
      });
      toast.message(t("research.common.addToKnowledgeBaseTip"));
    },
    [generateId, getSearchResultContent, t]
  );

  const handleRetry = useCallback(
    async (query: string, researchGoal: string) => {
      const { updateTask } = useTaskStore.getState();
      const newTask: SearchTask = {
        query,
        researchGoal,
        learning: "",
        sources: [],
        images: [],
        state: "unprocessed",
      };
      updateTask(query, newTask);
      await runSearchTask([newTask]);
    },
    [runSearchTask]
  );

  const handleRemove = useCallback((query: string) => {
    const { removeTask } = useTaskStore.getState();
    removeTask(query);
  }, []);

  useEffect(() => {
    form.setValue("suggestion", taskStore.suggestion);
  }, [taskStore.suggestion, form]);

  return (
    <section className="p-4 border rounded-md mt-4 print:hidden">
      <h3 className="font-semibold text-lg border-b mb-2 leading-10">
        {t("research.searchResult.title")}
      </h3>
      {taskStore.tasks.length === 0 ? (
        <div>{t("research.searchResult.emptyTip")}</div>
      ) : (
        <div>
          <Accordion className="mb-4" type="multiple">
            {taskStore.tasks.map((item) => {
              return (
                <TaskItem
                  key={item.query}
                  item={item}
                  onRetry={handleRetry}
                  onRemove={handleRemove}
                  onAddToKnowledgeBase={addToKnowledgeBase}
                  getSearchResultContent={getSearchResultContent}
                />
              );
            })}
          </Accordion>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)}>
              <FormField
                control={form.control}
                name="suggestion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="mb-2 font-semibold">
                      {t("research.searchResult.suggestionLabel")}
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        placeholder={t(
                          "research.searchResult.suggestionPlaceholder"
                        )}
                        disabled={isThinking}
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <Button
                className="w-full mt-4"
                type="submit"
                variant="default"
                disabled={isThinking}
              >
                {isThinking ? (
                  <>
                    <LoaderCircle className="animate-spin" />
                    <span>{status}</span>
                    <small className="font-mono">{formattedTime}</small>
                  </>
                ) : taskFinished ? (
                  t("research.common.indepthResearch")
                ) : (
                  t("research.common.continueResearch")
                )}
              </Button>
            </form>
          </Form>
        </div>
      )}
    </section>
  );
}

export default SearchResult;
