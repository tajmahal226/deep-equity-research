"use client";
import Link from "next/link";

/**
 * 404 Not Found page component.
 *
 * @returns The 404 error page.
 */
function NotFound() {
  return (
    <div>
      <h2>404 Not Found</h2>
      <p>There is nothing here...</p>
      <Link href="/">Return Home</Link>
    </div>
  );
}

export default NotFound;
