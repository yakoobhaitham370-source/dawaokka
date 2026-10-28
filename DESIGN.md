---
name: "Riaya — رعاية"
description: "Arabic-first pharmacy workspace for patient continuity and chronic care."
colors:
  purple: "#4f46e5"
  purple-hover: "#4036cb"
  teal: "#08b8b4"
  teal-stat: "#007f7f"
  teal-button: "#008e8b"
  stat-purple: "#5144e8"
  stat-indigo: "#3c329e"
  stat-dark: "#272535"
  ink: "#202234"
  muted: "#65677c"
  safety-footnote: "#5f586e"
  canvas: "#f5f6fc"
  surface: "#ffffff"
  lavender: "#eef0ff"
  secondary-surface: "#eeedff"
  secondary-hover: "#e0ddff"
  field-surface: "#f7f7fc"
  field-ink: "#29263e"
  field-border: "#e8e6f1"
  focus: "#9088ff"
  field-focus-border: "#8e81ef"
  field-focus-ring: "#e6e1ff"
  mint-surface: "#dff7ef"
  mint-ink: "#007d70"
  critical-surface: "#ffe5ea"
  critical-ink: "#ab223b"
  caution-surface: "#fff1ce"
  caution-ink: "#8a5700"
  information-surface: "#eeebff"
  information-ink: "#5b43a9"
  danger: "#b7283c"
typography:
  headline:
    fontFamily: "Cairo, sans-serif"
    fontSize: "28px"
    fontWeight: 800
    lineHeight: 1.7
  title:
    fontFamily: "Cairo, sans-serif"
    fontSize: "19px"
    fontWeight: 800
  body:
    fontFamily: "Cairo, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.9
  label:
    fontFamily: "Cairo, sans-serif"
    fontSize: "12px"
    fontWeight: 700
    lineHeight: 1.7
  metric:
    fontFamily: "Cairo, sans-serif"
    fontSize: "42px"
    fontWeight: 800
    lineHeight: 1.6
  badge:
    fontFamily: "Cairo, sans-serif"
    fontSize: "10px"
    fontWeight: 700
    lineHeight: 1.8
rounded:
  badge: "8px"
  control: "12px"
  navigation: "13px"
  notice: "14px"
  compact-panel: "16px"
  panel: "24px"
  phone-panel-token: "22px"
  pill: "25px"
  auth: "28px"
spacing:
  tight: "8px"
  small: "12px"
  medium: "18px"
  panel: "24px"
  desktop-inline: "36px"
components:
  button-primary:
    backgroundColor: "{colors.purple}"
    textColor: "{colors.surface}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "9px 19px"
  button-primary-hover:
    backgroundColor: "{colors.purple-hover}"
    textColor: "{colors.surface}"
  button-secondary:
    backgroundColor: "{colors.secondary-surface}"
    textColor: "{colors.purple}"
    rounded: "{rounded.control}"
    padding: "9px 19px"
  button-secondary-hover:
    backgroundColor: "{colors.secondary-hover}"
  button-teal:
    backgroundColor: "{colors.teal-button}"
    textColor: "{colors.surface}"
    rounded: "{rounded.control}"
    padding: "9px 19px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "#68647f"
    rounded: "{rounded.control}"
    padding: "9px 12px"
  button-danger:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.surface}"
    rounded: "{rounded.control}"
    padding: "9px 19px"
  panel:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.panel}"
    padding: "{spacing.panel}"
  input:
    backgroundColor: "{colors.field-surface}"
    textColor: "{colors.field-ink}"
    rounded: "{rounded.control}"
    padding: "12px 14px"
  nav-active:
    backgroundColor: "{colors.purple}"
    textColor: "{colors.surface}"
    rounded: "{rounded.navigation}"
    padding: "11px 15px"
  badge-unknown:
    backgroundColor: "{colors.caution-surface}"
    textColor: "{colors.caution-ink}"
    typography: "{typography.badge}"
    rounded: "{rounded.badge}"
    padding: "4px 10px"
  badge-none-known:
    backgroundColor: "{colors.mint-surface}"
    textColor: "{colors.mint-ink}"
    rounded: "{rounded.badge}"
    padding: "4px 10px"
---

# Design System: Riaya — رعاية

## Overview

**Creative North Star: "Riaya — continuous care, every day"**

Riaya is an Arabic-first operational workspace for Iraqi community pharmacists. Its established visual world follows the supplied dawaok.com mobile references: Cairo typography, confident purple, teal accents, pale lavender surroundings, rounded white working panels, pill tabs and line icons. The current surfaces use Operate mode: scanability, patient identity and clear next actions lead.

The full-screen application defaults to Arabic RTL and mirrors to English LTR through logical layout properties. Preserve the established brand and panel language when extending the recovered implementation. The frontmatter records actual stylesheet values; it does not establish a new direction.

**Key Characteristics:**

- Arabic RTL first, with mirrored English support.
- Rounded, reference-led working panels and restrained depth.
- Purple action hierarchy with teal continuity cues.
- Explicit clinical status text and icons alongside color.
- Responsive grids, stacked phone content and locally scrollable tabs.

This refresh replaces the preexisting prose-only design note. Its indigo description did not match the implemented statistic color; the frontmatter now records the CSS value. The lighter teal brand variable remains distinct from the corrected dark teal statistic background. No unrelated document drift was repaired.

Review disposition: **ship at the listed-fix scope**, with no unresolved items in that scope. Teal-statistic and safety-footnote contrast, responsive viewport fit, and the visible distinction between unknown history and documented no known allergies are resolved at that scope. Evidence: CSS and four viewport captures in `.impeccable/review/`: `desktop-viewport.png`, `mobile-viewport.png`, `mobile-patient-unknown.png`, and `mobile-allergy-inbox.png`. The design detector did not run successfully because its runtime download failed. This disposition does not establish overall clinical or production validation.

## Colors

Purple carries action hierarchy; teal supports continuity. Off-white and lavender surround white panels. Clinical badges use distinct tints with explicit labels.

### Primary

- **Riaya Purple** (`purple`): primary actions, active navigation, selected tabs and brand mark. Its hover token darkens interactive state.
- **Statistic Purple / Indigo / Dark** (`stat-purple`, `stat-indigo`, `stat-dark`): the dashboard's existing metric family.

### Secondary

- **Bright Brand Teal** (`teal`): preserved CSS brand primitive; not the corrected statistic fill.
- **Deep Statistic Teal** (`teal-stat`): corrected white-on-teal metric fill, also used for teal avatar/icon details.
- **Action Teal** (`teal-button`): dispensing action variant.
- **Mint** (`mint-surface`, `mint-ink`): documented no known allergies and affirmative operational states.

### Tertiary

- **Critical Rose** (`critical-surface`, `critical-ink`): confirmed allergies and critical severity.
- **Caution Amber** (`caution-surface`, `caution-ink`): unknown and suspected allergy history, distinguished through wording.
- **Information Lavender** (`information-surface`, `information-ink`): intolerance and informational status.
- **Danger Red** (`danger`): destructive action variant.

### Neutral

- **Ink / Muted / Safety Footnote**: main content, secondary context and clinical safety context respectively.
- **Canvas / Surface / Lavender**: off-white workspace, white panels and pale brand support.
- **Field Surface / Ink / Border**: quiet filled controls. Focus tokens provide the general outline and field-specific focus treatment.

**The Explicit History Rule.** Unknown allergy history must retain its caution treatment and explicit label. An empty record must never visually imply documented no known allergies.

## Typography

**Display and Body Font:** self-hosted Cairo, with sans-serif fallback. Cairo spans headings, numerals, labels and forms.

### Hierarchy

- **Headline:** page headings use the headline role, reducing to (23px) on phones.
- **Title:** panel headings use the title role, reducing to (17px) in compact phone panels.
- **Body:** the body role captures recurring operational paragraphs. The root does not impose a body size; component copy intentionally ranges from compact metadata to larger patient names.
- **Label:** action text uses the label role. Desktop navigation uses (13px, weight 600).
- **Metric:** desktop statistic values use the metric role, reducing to (38px) on phones.
- **Badge:** compact status labels use the badge role, supplemented by explicit status wording and icons.

Patient names typically use (15px); profile names use (24px), reducing to (21px). Fields use (14px), increasing to (16px) on phones. The clinical safety footnote remains (12px) at every width. Bidirectional isolation supports dates, numbers and identifiers; numeric emphasis uses tabular figures.

## Layout

The desktop shell has a fixed right sidebar (240px in RTL), white header (101px), and fluid main area bounded at (1660px). Main horizontal padding is (36px), with a recurring panel gap (24px). Logical inline margins and positioning mirror the shell for LTR.

The dashboard has four statistic columns and a two-column working grid (1.65fr / 1fr, secondary minimum 270px). Forms use two columns and filters use four. Profile actions and facts wrap.

- At minimum width (1500px), the sidebar grows to (260px), main padding becomes (35px 45px), and statistics gain height.
- At maximum width (1150px), the sidebar contracts to (205px), main horizontal padding becomes (22px), panels use (20px) padding and filters become two columns.
- At maximum width (850px), the sidebar hides, the shell spans the viewport, and a horizontally scrollable row of navigation pills appears. Profile actions receive a full row.
- At maximum width (620px), main horizontal padding becomes (18px). Statistic and mini-stat grids become two columns; dashboard, dispensing, alerts, analytics and settings stack. Forms become one column; filters remain two. Patient status moves below identity.
- Phone conversations place contact choices above the chat. Workspace tabs and quick replies scroll inside their containers.
- Desktop dialogs center within the viewport. Phone dialogs become full-width bottom sheets with a (94dvh) height limit and safe-area bottom padding.

Zero-minimum grid tracks, shrinkable content, wrapping and bounded overlays support viewport fit. Horizontal scrolling belongs to navigation and tab strips. Main actions and navigation targets have a minimum height of (44px), fields (46px); smaller auxiliary controls retain their implemented dimensions.

## Elevation & Depth

The system is predominantly flat. White and tinted surfaces establish hierarchy on the pale canvas; fine dividers organize records. Ordinary working panels have no decorative shadow.

The toast uses the observed shadow (`0 10px 35px #20153830`). Dialog depth comes from the translucent overlay (`#18142b7a`) and fixed stacking.

Motion stays brief: button background changes over (.18s), timeline expansion fades over (.2s ease-out), and loading icons rotate over (1s linear). The reduced-motion query disables animations and transitions.

## Shapes

Rounded rectangles define the system. Panels use the panel radius; the phone root token changes to the smaller phone-panel token. Explicit statistic cards use (23px) on desktop and (24px) on phones. Authentication uses the largest auth radius.

Controls are softly squared, badges compact and tabs pill shaped. Icon tiles and avatars use intermediate radii. Phone dialogs keep top corners rounded (23px), with a straight bottom edge.

## Components

### Buttons

Confident, compact actions. Primary buttons use purple with white text, control corners and the documented padding. Secondary uses pale purple, dispensing uses action teal, ghost provides quiet text actions, and danger uses red. Primary hover darkens purple; secondary hover deepens its pale fill, ghost hover gains pale purple, and teal/danger variants retain their own fills. Disabled controls use opacity (.46) and a not-allowed cursor.

Keyboard focus uses a visible (3px) outline with (3px) offset. Preserve observed states without introducing decorative elevation.

### Chips

Status markers combine compact text and icons. Unknown and suspected history share amber but retain different wording. Documented no known allergies is mint, confirmed allergy rose, and intolerance lavender. These informational badges differ from interactive filter pills.

### Cards / Containers

White working panels use panel radius and padding without shadows. Continuity uses a pale purple fill. Patient and record rows use light dividers; clickable patient rows have a pale hover fill. Filled metric cards use bold white values and line icons.

### Inputs / Fields

Fields use a fine border, filled surface, control corners and visible labels above. Focus changes the border and adds a pale (2px) outline. Textareas resize vertically. Validation text appears below the affected field. Search forms a quiet icon-and-input row.

### Navigation

Desktop navigation uses line icons and compact labels. Selected items fill purple; inactive items use muted ink and a pale hover. At the tablet boundary this becomes a scrollable row of white pills with purple selection. Patient workspace tabs reuse this selected-state grammar.

### Patient History and Clinical Review

Patient identity remains prominent above clinical work. The profile summary shows an explicit unknown-history badge distinct from documented no known allergies. Allergy Inbox cards combine patient identity, substance, severity and review state.

Dialogs support protected data entry and clinical review. The refill timeline starts closed. Preserve these existing interaction commitments; the scoped visual review does not validate clinical decision logic.

## Do's and Don'ts

### Do:

- **Do** preserve Cairo, Arabic RTL defaults and mirrored LTR layout.
- **Do** use the actual CSS palette and dedicated dark teal statistic token.
- **Do** keep the clinical safety footnote at its dedicated color and (12px) size.
- **Do** pair clinical color with explicit status text and icons.
- **Do** keep unknown history visually distinct from documented no known allergies.
- **Do** stack working content on phones and contain tab scrolling locally.

### Don't:

- **Don't** replace the rounded Riaya panels or purple/teal identity during refinement.
- **Don't** use bright brand teal behind the corrected white statistic text.
- **Don't** infer no known allergies from an empty record.
- **Don't** add decorative shadows to ordinary working panels.
- **Don't** treat the scoped ship disposition as overall clinical or production validation.
