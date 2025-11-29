import { describe, expect, it, beforeEach, vi } from "vitest";

if (typeof File === "undefined") {
  class TestFile extends Blob {
    name: string;
    lastModified: number;

    constructor(parts: BlobPart[], name: string, options?: FilePropertyBag) {
      super(parts, options);
      this.name = name;
      this.lastModified = options?.lastModified ?? Date.now();
    }
  }

  (globalThis as any).File = TestFile;
}

import { extractFiles } from "@/utils/parser/officeParser";

vi.mock("@zip.js/zip.js", () => {
  const closeMock = vi.fn();
  let mockEntries: any[] = [];

  class MockBlobWriter {
    blob: Blob | null = null;

    async getData(): Promise<Blob> {
      if (!this.blob) {
        throw new Error("No blob data");
      }
      return this.blob;
    }
  }

  class MockBlobReader {
    constructor(public file: File) {}
  }

  class MockZipReader {
    constructor(public reader: unknown) {}

    async getEntries(): Promise<any[]> {
      return mockEntries;
    }

    async close(): Promise<void> {
      closeMock();
    }
  }

  return {
    ZipReader: MockZipReader,
    BlobReader: MockBlobReader,
    BlobWriter: MockBlobWriter,
    __setMockEntries(entries: any[]) {
      mockEntries = entries;
    },
    __getCloseMock() {
      return closeMock;
    },
  };
});

describe("extractFiles", () => {
  const file = new File(["stub"], "sample.docx", {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });

  beforeEach(async () => {
    const zipModule = await import("@zip.js/zip.js");
    (zipModule as any).__setMockEntries([]);
    (zipModule as any).__getCloseMock().mockClear();
  });

  it("extracts files that match the filter and expose data readers", async () => {
    const zipModule = await import("@zip.js/zip.js");
    const blob = new Blob(["<xml />"], { type: "text/xml" });

    (zipModule as any).__setMockEntries([
      {
        filename: "word/document.xml",
        directory: false,
        async getData(writer: any) {
          writer.blob = blob;
          return blob;
        },
      },
      {
        filename: "word/ignored.txt",
        directory: false,
        async getData(writer: any) {
          writer.blob = new Blob(["skip"]);
          return writer.blob;
        },
      },
    ]);

    const result = await extractFiles(file, (name) => name.endsWith(".xml"));

    expect(result).toEqual([
      {
        filename: "word/document.xml",
        data: blob,
      },
    ]);
    expect((zipModule as any).__getCloseMock()).toHaveBeenCalledTimes(1);
  });

  it("skips directory entries and ones without getData", async () => {
    const zipModule = await import("@zip.js/zip.js");
    const blob = new Blob(["slide"], { type: "text/xml" });

    (zipModule as any).__setMockEntries([
      {
        filename: "ppt/slides/slide1.xml",
        directory: false,
        async getData(writer: any) {
          writer.blob = blob;
          return blob;
        },
      },
      {
        filename: "ppt/slides/_rels",
        directory: true,
        async getData(writer: any) {
          writer.blob = new Blob(["dir"]);
          return writer.blob;
        },
      },
      {
        filename: "ppt/slides/slide2.xml",
        directory: false,
      },
    ]);

    const result = await extractFiles(file, () => true);

    expect(result).toEqual([
      {
        filename: "ppt/slides/slide1.xml",
        data: blob,
      },
    ]);
    expect((zipModule as any).__getCloseMock()).toHaveBeenCalledTimes(1);
  });

  it("falls back to the writer for async generator signatures", async () => {
    const zipModule = await import("@zip.js/zip.js");
    const blob = new Blob(["sheet"], { type: "text/xml" });

    (zipModule as any).__setMockEntries([
      {
        filename: "xl/worksheets/sheet1.xml",
        directory: false,
        async getData(writer: any) {
          writer.blob = blob;
          return undefined;
        },
      },
    ]);

    const result = await extractFiles(file, () => true);

    expect(result).toEqual([
      {
        filename: "xl/worksheets/sheet1.xml",
        data: blob,
      },
    ]);
    expect((zipModule as any).__getCloseMock()).toHaveBeenCalledTimes(1);
  });
});
