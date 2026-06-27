## 2023-10-27 - Dynamically Generated HTML Elements Need ARIA Labels
**Learning:** When adding ARIA labels to a project, it's easy to miss dynamically generated HTML strings in JavaScript files (e.g., `dashboard.js`). These elements are just as critical for accessibility as those in static HTML files.
**Action:** Always search JavaScript files for dynamically generated HTML strings containing icon-only buttons or other interactive elements, to ensure they also receive appropriate ARIA labels.
