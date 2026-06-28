## 2023-10-27 - Missing aria-labels on icon-only buttons
**Learning:** Found a pattern of missing `aria-label`s on icon-only buttons (modals, notifications, and trash buttons) across both static HTML files and dynamic JS templates.
**Action:** When auditing for accessibility, ensure dynamic JS templates are reviewed alongside static HTML, as they often replicate these UI elements.
