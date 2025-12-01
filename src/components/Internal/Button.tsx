"use client";
import { forwardRef, type ForwardedRef } from "react";
import {
  Button as OriginalButton,
  type ButtonProps,
} from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { omit } from "radash";

interface Props extends ButtonProps {
  /** The side to display the tooltip. */
  side?: "top" | "right" | "bottom" | "left";
  /** The offset for the tooltip. */
  sideoffset?: number;
}

/**
 * ButtonWithTooltip component.
 * Renders a button that displays a tooltip when hovered, if a title is provided.
 *
 * @param props - The component props.
 * @param forwardedRef - The forwarded ref for the button element.
 * @returns The button component with optional tooltip.
 */
function ButtonWithTooltip(
  props: Props,
  forwardedRef: ForwardedRef<HTMLButtonElement>
) {
  if (props.title) {
    const { side = "top", sideoffset = 0 } = props;
    return (
      <TooltipProvider>
        <Tooltip delayDuration={100}>
          <TooltipTrigger asChild>
            <OriginalButton ref={forwardedRef} {...omit(props, ["title"])} />
          </TooltipTrigger>
          <TooltipContent
            side={side}
            sideOffset={sideoffset}
            className="max-md:hidden"
          >
            <p>{props.title}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  } else {
    return <OriginalButton {...props} />;
  }
}

/**
 * Button component with tooltip support.
 */
const Button = forwardRef(ButtonWithTooltip);
Button.displayName = "ButtonWithTooltip";

export { Button };
