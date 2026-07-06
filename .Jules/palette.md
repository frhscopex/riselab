## 2024-05-15 - Missing ARIA labels on icon-only buttons
**Learning:** Found a recurring pattern across the application where icon-only buttons (like notifications, delete, and close modals) were missing `aria-label`s, making them inaccessible to screen readers.
**Action:** Consistently added descriptive `aria-label`s to all icon-only buttons in both static HTML (`index.html`, `dashboard.html`) and dynamic template strings (`dashboard.js`) to ensure screen reader compatibility.
