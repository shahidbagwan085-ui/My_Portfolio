Summary of UI updates (2025-12-25)

🎯 Goals applied (expanded)
- Chosen accent: **Purple** (`--accent: #6A00F4`) with supporting cyan for gradients.
- Animated gradient background (slow, elegant movement) instead of flat color.
- Glassmorphism cards: blur + transparency on sections and badges.
- Consistent rounded corners (`--radius`) everywhere: cards, buttons, inputs.
- Increased section spacing and larger, bold headings with supporting copy.
- Emphasized important words via color and glow in headings and CTAs.
- Pill-shaped buttons with subtle hover scale and color shift.
- Skill badges with icons (emoji) — animated pop-in and hover lift.
- Hero visual (decorative SVG blob mockup) with a floating animation.
- Reveal animations for headings, fade+slide for sections, hover lift for project cards.
- Smooth scrolling and active nav highlight.
- Theme toggle (dark / neon) implemented and persisted in localStorage.
- Project card tilt on hover (subtle) — respects `prefers-reduced-motion` and touch devices.

Files changed
- `index.html` — added hero design: glassy gradient card with gradient headline (tagline: "Design with purpose. Code with precision." / "Where aesthetics meet algorithms."), **reduced headline size (~50%)** for improved balance, code badge, chips, neon separator, and text reveal; responsive hero images (prefers `images/` variants but falls back to `img/shahidb.jpeg` if present), accessible mobile hamburger nav, CTA mailto + tracking hooks, hidden UTM field in contact form, and JSON-LD structured data for projects
- `index.html` — **Contact section redesigned**: replaced the message form (now optionally kept for progressive enhancement) with a glassy contact panel containing three info cards (Email, LinkedIn, Phone), prominent CTAs (Email Me / View LinkedIn), UTM hidden field retained, and improved responsive layout and accessible links.
- `style.css` — tokens updated, gradient animation, glass styles, reveal/floating animations, badge styles
- `script.js` — added theme toggle persistence, project tilt, maintained IntersectionObserver behaviours
- `UI-CHANGES.md` — this changelog

Testing tips
1. Open `index.html` in the browser.
2. Notice the animated gradient background (subtle) and floating hero visual.
3. Click nav links to confirm smooth scroll and active nav underline.
4. Scroll to trigger reveal animations; confirm headings reveal and badges pop in.
5. Hover project cards (desktop): subtle lift + tilt; on touch devices tilt is disabled.
6. Click the moon/bolt button in the top-right to toggle the neon theme (persists).
7. Try 'Reduce motion' in system preferences — animations should stop.
8. Verify the new Contact panel: 3 info cards, copyable/clickable Email/Phone links, and CTA buttons open the mail client / LinkedIn in a new tab.
9. Updated contact details to Shahid's LinkedIn (https://in.linkedin.com/in/shahid-bagwan-54851332a), email (shahidfarukbagwan@gmail.com), and phone (+91 7276776558) as provided.

Next steps / options
- Add a hamburger nav for mobile and enhanced keyboard navigation.
- Replace emoji skill icons with inline SVGs or an icon set for a more polished look.
- Add parallax layers and cursor particle hover effects (next-level ideas).

If you'd like, I can: add a small theme switch UI with icons + local preview, replace the skill emojis with SVG badges, or add a mobile menu and keyboard focus improvements next. 🔧