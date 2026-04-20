```markdown
# Design System Specification
 
## 1. Overview & Creative North Star: "The Precision Ledger"
This design system is engineered for the high-stakes environment of enterprise resource management. Moving beyond the "generic SaaS" aesthetic, our Creative North Star is **The Precision Ledger**. 
 
The system treats data density not as a challenge to be hidden, but as a feature to be celebrated through architectural clarity. By utilizing a "Dark Shell" (Navigation) and a "Light Workspace" (Content), we create a mental model of focus: the shell represents the stable environment, while the workspace represents the active, evolving data. We break the rigid, boxed-in feel of enterprise software by using **Tonal Layering** and **Intentional Asymmetry**, ensuring that even the most complex Bill of Materials (BOM) feels like a curated editorial spread rather than a cluttered spreadsheet.
 
---
 
## 2. Color & Surface Architecture
The palette is rooted in a high-contrast relationship between industrial neutrals and a singular, authoritative Red.
 
### The "No-Line" Rule
To achieve a premium, custom feel, designers are prohibited from using standard 1px solid borders for sectioning. Structural definition must be achieved through:
1.  **Background Shifts:** Distinguish a header from a body by moving from `surface-container-low` (#F2F4F7) to `surface-container-lowest` (#FFFFFF).
2.  **Tonal Transitions:** Use subtle shifts in the neutral scale to imply boundaries without "caging" the data.
 
### Surface Hierarchy (The Layering Principle)
Treat the UI as a physical stack of materials.
*   **Level 0 (Base):** `surface` (#F7F9FC) – The foundation of the workspace.
*   **Level 1 (Sections):** `surface-container-low` (#F2F4F7) – Used for grouping large functional areas.
*   **Level 2 (Cards/Data Units):** `surface-container-lowest` (#FFFFFF) – High-priority data entry and viewing areas.
*   **Level 3 (Popovers/Modals):** `surface-bright` with a soft `surface-tint` overlay.
 
### Signature Textures & Glassmorphism
The "Dark Shell" (Sidebar/Navigation) should utilize `surface-container-highest` at 80% opacity with a `20px backdrop-blur`. This "frosted glass" effect over a dark `1A1D23` background prevents the sidebar from feeling heavy or disconnected, allowing subtle hints of the workspace to bleed through the edges.
 
---
 
## 3. Typography: Editorial Authority
Typography is the primary tool for navigating density. We utilize a high-contrast scale where micro-labels command as much authority as display metrics.
 
*   **Metric Display (`display-sm`):** 18px, 600 weight. Use these for high-level KPIs. They should sit "naked" on the surface without boxes to emphasize their importance.
*   **Section Headers:** 11px, 700 weight, All-Caps. **Mandatory:** Apply `0.08em` letter-spacing. This creates an "archival" look common in high-end financial reports.
*   **Micro-Labels (`label-sm`):** 10px, 700 weight, All-Caps. Use `secondary` (#8A93A8) to ensure they guide the eye without competing with the data.
*   **Body Copy:** 12-13px. Focus on the `inter` typeface for its superior X-height and readability in dense tables.
 
---
 
## 4. Elevation & Depth: Tonal Stacking
Traditional drop shadows are largely replaced by **Ambient Elevation**.
 
*   **Layering over Shadow:** Instead of a shadow, place a `#FFFFFF` card on a `#F2F4F7` background. The 1% shift in value is enough for the human eye to perceive depth in an enterprise context.
*   **The "Ghost Border" Fallback:** If a container requires an explicit boundary for accessibility, use a "Ghost Border": `outline-variant` (#E7BDB7) at **15% opacity**. It should be felt, not seen.
*   **Ambient Shadows:** For floating elements (Modals/Dropdowns), use a multi-layered shadow: `0px 4px 20px rgba(25, 28, 30, 0.06)`. The shadow color is derived from `on-surface`, ensuring it looks like natural light hitting the surface.
 
---
 
## 5. Components
 
### Buttons: High-Impact Action
*   **Primary:** `primary` (#BC0004) background with `on-primary` (#FFFFFF) text. Use a 4px radius. For a premium touch, apply a subtle 10% vertical gradient from top to bottom to give the button a "milled" look.
*   **Secondary/Ghost:** No background. Use `primary` text and a `Ghost Border`.
 
### The Enterprise Table (High-Density)
*   **Row Style:** Alternating backgrounds using `surface` (#F7F9FC) and `surface-container-lowest` (#FFFFFF).
*   **No Dividers:** Remove all horizontal and vertical lines. Use 8px of vertical padding to create "white-space gutters" that guide the eye naturally.
*   **Hover State:** Use `surface-container-high` (#E6E8EB) to highlight the active row.
 
### Status Chips
Chips should not be "bubbles." Use a square 2px radius and a desaturated version of the status color (e.g., `error-container`) with high-contrast text (`on-error-container`). This maintains the professional, "industrial" aesthetic.
 
### Input Fields
Inputs must be "flat." Use `surface-container-low` as the background with a 1px `Ghost Border` that transitions to a 2px `primary` bottom-border only upon focus. This reduces visual noise in forms with 20+ fields.
 
---
 
## 6. Do's and Don'ts
 
### Do:
*   **Embrace White Space:** Even in high-density layouts, use the 4px base unit to create "breathing pockets" around critical action groups.
*   **Use Intentional Asymmetry:** In a dashboard, let a primary metric take up 65% of the width, with secondary metadata taking up 35%. Avoid 50/50 splits which feel like a template.
*   **Color as Signal:** Reserve the Fortinet Red (`#EE3124`) strictly for primary actions and critical errors. If everything is red, nothing is important.
 
### Don't:
*   **Don't use 100% Black:** For the Dark Shell, use the specified `1A1D23`. Pure black feels "unfished" and creates eye strain against the white workspace.
*   **Don't use Divider Lines:** If you feel the need to add a line, try adding 8px of space or a subtle background color shift first. Lines clutter the "Precision Ledger" feel.
*   **Don't Round Corners Excessively:** Stick to the `sm` (2px) and `DEFAULT` (4px) scales. Round "pill" shapes contradict the professional, enterprise-grade personality of this system.
 
---
**Director's Final Note:** This design system is about the *authority of information*. Every pixel should feel like it was placed with a caliper. Accuracy is our aesthetic.```
