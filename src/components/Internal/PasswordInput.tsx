"use client";
import {
  useState,
  forwardRef,
  type ForwardedRef,
  type ComponentProps,
} from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input as OriginalInput } from "@/components/ui/input";
import { cn } from "@/utils/style";

type Props = ComponentProps<"input">;

/**
 * PasswordInput component.
 * An input field with a toggle to show/hide the password.
 *
 * @param props - The component props.
 * @param forwardedRef - The forwarded ref for the input element.
 * @returns The password input component.
 */
function PasswordInput(
  { className, type, ...props }: Props,
  forwardedRef: ForwardedRef<HTMLInputElement>
) {
  const [showPassword, setShowPassword] = useState<boolean>(false);

  return (
    <div className={cn("relative", className)}>
      <OriginalInput
        ref={forwardedRef}
        {...props}
        className="pr-9 w-full text-sm"
        type={showPassword ? type : "password"}
      />
      <div className="absolute top-0.5 right-1 w-8 h-8 text-gray-500 cursor-pointer flex justify-center items-center">
        {showPassword ? (
          <EyeOff
            className="w-5 h-5 scale-90"
            onClick={() => setShowPassword(false)}
          />
        ) : (
          <Eye
            className="w-5 h-5 scale-90"
            onClick={() => setShowPassword(true)}
          />
        )}
      </div>
    </div>
  );
}

/**
 * Password component that forwards the ref.
 */
const Password = forwardRef(PasswordInput);
Password.displayName = "PasswordInput";

export { Password };
