## 2024-05-23 - [Accessible Tag Removal]
**Learning:** Interactive elements like "remove tag" icons are often implemented as clickable `div`s or `svg`s, which excludes keyboard and screen reader users. They must be button elements with appropriate `aria-label`s.
**Action:** Always wrap interactive icons in `<button>` elements, provide `aria-label`s (e.g., "Remove [Tag Name]"), and ensure focus visibility.
