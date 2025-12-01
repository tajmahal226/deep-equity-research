"use client";
import { File, BookText, Link } from "lucide-react";
import { cn } from "@/utils/style";

type Props = {
  /** Optional class name for the icon. */
  className?: string;
  /** The type of resource to determine the icon. */
  type: string;
};

/**
 * ResourceIcon component.
 * Renders an icon based on the resource type (knowledge, url, or file).
 *
 * @param props - The component props.
 * @returns The resource icon component.
 */
function ResourceIcon({ className, type }: Props) {
  if (type === "knowledge") {
    return <BookText className={className} />;
  } else if (type === "url") {
    return <Link className={cn("scale-90", className)} />;
  } else {
    return <File className={className} />;
  }
}

export default ResourceIcon;
