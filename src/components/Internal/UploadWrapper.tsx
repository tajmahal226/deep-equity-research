"use client";
import { useRef, type ReactNode } from "react";

type Props = {
  /** The content that triggers the file upload on click. */
  children: ReactNode;
  /** The accepted file types string. */
  accept?: string;
  /** Callback triggered when files are selected. */
  onChange: (files: FileList | null) => void;
};

/**
 * UploadWrapper component.
 * Wraps children with a hidden file input, triggering a file selection dialog when clicked.
 *
 * @param props - The component props.
 * @returns The upload wrapper component.
 */
function UploadWrapper({ children, accept, onChange }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleClick() {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple
        hidden
        onChange={(ev) => onChange(ev.target.files)}
      />
      <div onClick={() => handleClick()}>{children}</div>
    </>
  );
}

export default UploadWrapper;
