# SSE Utility

The `createSSEStream` helper provides a convenient way to stream server-sent events.

* `sendEvent` now returns `true` when data is queued successfully and `false` after the stream is closed, avoiding runtime warnings.
* Attempts to emit events once the stream has ended are silently ignored.

