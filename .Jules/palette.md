## 2024-06-23 - Added missing ARIA labels to icon-only buttons
**Learning:** Found multiple instances where interactive icon-only elements (like close modals, notifications, and trash buttons) lacked an `aria-label`, preventing proper screen reader interaction.
**Action:** Always verify that interactive elements containing only icons or SVGs have descriptive `aria-label`s for accessibility compliance.
