## 2024-05-24 - Missing Focus and ARIA Labels
**Learning:** Found that some icon-only buttons (like delete and notifications) were missing accessible names, and there were no explicit `focus-visible` styles for interactive elements, which degrades keyboard accessibility.
**Action:** Added `aria-label` attributes to icon-only buttons and implemented a global `:focus-visible` rule in the main stylesheet (`index.css`) to ensure consistent focus indicators across the application.
