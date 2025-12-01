import { saveAs } from "file-saver";

/**
 * Triggers a file download in the browser.
 *
 * @param content - The content of the file.
 * @param filename - The name of the file to download.
 * @param fileType - The MIME type of the file.
 */
export function downloadFile(
  content: string,
  filename: string,
  fileType: string
) {
  // Prepending a BOM sequence at the beginning of the text file to encoded as UTF-8.
  // const BOM = new Uint8Array([0xef, 0xbb, 0xbf]);
  const file = new File([content], filename, { type: fileType });
  saveAs(file);
}

/**
 * Formats a byte size into a human-readable string (e.g., "1.5 MB").
 *
 * @param size - The size in bytes.
 * @param pointLength - Number of decimal places (default: 2).
 * @param units - Optional array of unit strings.
 * @returns The formatted string.
 */
export function formatSize(
  size: number,
  pointLength = 2,
  units?: string[]
): string {
  if (typeof size === "undefined") return "0";
  if (typeof units === "undefined")
    units = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  let unit;
  while ((unit = units.shift() as string) && size >= 1024) size = size / 1024;
  return (
    (unit === units[0]
      ? size
      : size
          .toFixed(pointLength === undefined ? 2 : pointLength)
          .replace(".00", "")) +
    " " +
    unit
  );
}

/**
 * Calculates the byte size of a UTF-8 string.
 *
 * @param str - The input string.
 * @returns The size in bytes.
 */
export function getTextByteSize(str: string): number {
  return new TextEncoder().encode(str).length;
}
