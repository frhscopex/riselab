## 2026-07-07 - [Missing ARIA Labels on Icon-Only Buttons]
**Learning:** Found several icon-only buttons (like notifications, delete, and modal close buttons) missing `aria-label` attributes, which creates an accessibility gap for screen reader users as they have no accessible name.
**Action:** Applied `aria-label` to these elements (e.g. notifications bell, delete api key, and close modal). Future components should always enforce having an accessible label when no textual content exists in a button.
