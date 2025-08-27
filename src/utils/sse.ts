/**
 * Server-Sent Events (SSE) Utility Functions
 * 
 * This file provides reusable utilities for creating SSE streams in Next.js API routes.
 * SSE allows the server to push real-time updates to the client over a single HTTP connection.
 * 
 * What SSE is:
 * - A one-way communication channel from server to client
 * - Perfect for streaming progress updates, live data, or real-time notifications
 * - Built on standard HTTP, works through firewalls and proxies
 * 
 * How it works:
 * 1. Client makes a request to an SSE endpoint
 * 2. Server responds with a special content-type and keeps connection open
 * 3. Server can send events at any time until connection closes
 * 4. Each event has a type and data (usually JSON)
 * 
 * Files that use this:
 * - /src/app/api/company-research/route.ts (company deep dive research)
 * - Could be used by any API route that needs real-time updates
 * 
 * To modify:
 * - Add new event types: Just use sendEvent with a new event name
 * - Change data format: Modify the JSON.stringify in sendEvent
 * - Add reconnection logic: Implement EventSource retry on client side
 */

import { logger } from "@/utils/logger";

/**
 * Creates an SSE stream with helper functions
 * 
 * @returns {Object} An object containing:
 *   - stream: The ReadableStream to return in the HTTP response
 *   - sendEvent: Function to send events to the client
 *   - closeStream: Function to close the stream gracefully
 */
export function createSSEStream() {
  // TextEncoder converts strings to Uint8Array (bytes) for streaming
  const encoder = new TextEncoder();
  
  // This will hold our stream controller once the stream starts
  let streamController: ReadableStreamDefaultController | null = null;
  
  // Track if the stream is still active
  let isStreamActive = true;

  /**
   * The ReadableStream is the core of SSE
   * It's created with a start function that runs when the stream begins
   */
  const stream = new ReadableStream({
    start(controller) {
      // Save the controller so we can use it to send data later
      streamController = controller;
      
      // Send an initial connection event to confirm the stream is working
      // This is optional but helps with debugging
      sendEvent("connected", { 
        timestamp: new Date().toISOString(),
        message: "SSE stream connected successfully" 
      });
    },
    
    // Called when the client disconnects or we close the stream
    cancel() {
      logger.log("SSE stream cancelled by client");
      isStreamActive = false;
    }
  });

  /**
   * Sends an event to the client
   * 
   * SSE Format:
   * event: eventName\n
   * data: JSON data\n
   * \n
   * 
   * The double newline at the end is crucial - it signals the end of the event
   * 
   * @param eventName - The type of event (e.g., "progress", "message", "error")
   * @param data - The data to send (will be JSON stringified)
   * @returns Whether the event was successfully queued for delivery
   */
  function sendEvent(eventName: string, data: any): boolean {
    // Check if we can still send data
    if (!streamController || !isStreamActive) {
      // Silently ignore attempts to write after the stream has closed
      return false;
    }

    try {
      // Format the SSE event according to the specification
      // Each field is on its own line, fields are separated by colons
      const formattedEvent = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;

      // Convert the string to bytes and send it through the stream
      streamController.enqueue(encoder.encode(formattedEvent));

      // Log for debugging (remove in production for performance)
      logger.log(`SSE event sent: ${eventName}`, data);
      return true;
    } catch (error) {
      console.error(`Error sending SSE event "${eventName}":`, error);
      // Don't throw here - we don't want one failed event to break the stream
      return false;
    }
  }

  /**
   * Closes the SSE stream gracefully
   * Always call this when your processing is complete
   */
  function closeStream() {
    if (streamController && isStreamActive) {
      try {
        // Send a final event to notify the client we're closing intentionally
        sendEvent("close", { 
          timestamp: new Date().toISOString(),
          message: "Stream closed by server" 
        });
        
        // Close the stream controller
        streamController.close();
        isStreamActive = false;
        logger.log("SSE stream closed successfully");
      } catch (error) {
        console.error("Error closing SSE stream:", error);
      }
    }
  }

  // Return the stream and helper functions
  return {
    stream,
    sendEvent,
    closeStream
  };
}

/**
 * Helper function to create SSE response headers
 * These headers tell the browser this is an SSE stream
 * 
 * @returns Standard headers for SSE responses
 */
export function getSSEHeaders(): HeadersInit {
  return {
    // This content-type is what makes it an SSE stream
    "Content-Type": "text/event-stream; charset=utf-8",
    
    // Prevent caching of the stream
    "Cache-Control": "no-cache, no-transform",
    
    // Keep the connection alive
    "Connection": "keep-alive",
    
    // Disable nginx buffering for real-time updates
    "X-Accel-Buffering": "no",
    
    // Allow cross-origin requests (adjust as needed for security)
    "Access-Control-Allow-Origin": "*",
  };
}

/**
 * Utility to format SSE events manually (for advanced use cases)
 * 
 * @param eventName - The event type
 * @param data - The event data
 * @param id - Optional event ID for reconnection support
 * @returns Formatted SSE event string
 */
export function formatSSEEvent(eventName: string, data: any, id?: string): string {
  let event = "";
  
  // Add event ID if provided (helps with reconnection)
  if (id) {
    event += `id: ${id}\n`;
  }
  
  // Add event type
  event += `event: ${eventName}\n`;
  
  // Add data (SSE supports multiple data lines, but we use JSON for simplicity)
  event += `data: ${JSON.stringify(data)}\n`;
  
  // End with double newline
  event += "\n";
  
  return event;
}

/**
 * Type definitions for better TypeScript support
 */
export interface SSEEvent<T = any> {
  event: string;
  data: T;
  id?: string;
}

export type SSEEventHandler = (eventName: string, data: any) => void;