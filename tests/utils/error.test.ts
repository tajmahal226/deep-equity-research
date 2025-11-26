import { describe, it, expect, vi } from "vitest";
import { handleError, AppError } from "@/utils/error";
import toast from "react-hot-toast";

vi.mock("react-hot-toast");

describe("handleError", () => {
  it("should show a toast with the error message for AppError", () => {
    const error = new AppError("This is an app error.");
    handleError(error);
    expect(toast.error).toHaveBeenCalledWith("This is an app error.");
  });

  it("should show a toast with the error message for Error", () => {
    const error = new Error("This is a generic error.");
    handleError(error);
    expect(toast.error).toHaveBeenCalledWith("This is a generic error.");
  });

  it("should show a toast with a default message for unknown errors", () => {
    const error = "This is an unknown error.";
    handleError(error);
    expect(toast.error).toHaveBeenCalledWith("An unknown error occurred.");
  });
});
