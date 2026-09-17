# UI_SPEC — Allan Dantas Photography Portfolio

## 1. Source and scope

This document specifies the MVP/v1 interface using only the consolidated decisions in **Criar portfólio fotográfico**, conversation `6aa44389-2cbc-83e9-b3a6-2aaed8096360`, and the current request. Companion documents: [PRD.md](PRD.md) and [TECHNICAL_SPEC.md](TECHNICAL_SPEC.md).

Final decisions supersede earlier experiments: dark theme, Syne only, a header without its own background color, a compact footer, and the Home CTA beside the slogan. The older documentation explicitly discarded in the conversation is not reused as an independent requirement source.

This specification is written in English. The website remains in Brazilian Portuguese, so approved brand copy and interface labels are retained in Portuguese.

## 2. Identity and visual direction

| Element | Definition |
|---|---|
| Brand | Allan Dantas |
| Signature | `✳· ALLAN DANTAS` |
| Slogan | **Cada clique, uma história!** |
| Attributes | Authentic, Young, Calm, Playful — Autêntico, Jovem, Calmo, Divertido |
| Style | Light/friendly + minimalist + cinematic |
| Influences | Indie magazine, analog photography, analog poster, and cultural design |
| Primary focus | Real photographs curated and presented as stories |

The result should feel personal and authored, with negative space, editorial rhythm, and occasional color accents. Avoid corporate styling, generic luxury-wedding aesthetics, and unnecessary decoration.

### 2.1 Logo and symbol

- Use `✳·` together with `ALLAN DANTAS` in the header; the combination links to Home.
- The symbol suggests light, a click, or an instant without drawing a camera or shutter.
- Set the name in uppercase with letter spacing; keep it readable and on one line on small screens.
- Avoid repeating a large brand signature in the footer or adding the symbol to every block.
- The symbol concept is selected, but final vector proportions were not completed in the conversation. Do not assume an unavailable final logo asset exists.

### 2.2 Consolidated palette

| Color | Hex | Role |
|---|---|---|
| Ink black | `#181715` | Main dark background. |
| Paper white | `#F3F0E8` | Text and light interface elements. |
| Electric blue | `#3157D5` | Symbol and identity accents. |
| Tomato red | `#E84B3C` | Occasional interactions, including navigation hover. |
| Butter yellow | `#F4DC85` | Text selection and restrained accents. |

Header and footer share the main background. Do not restore the rejected pink/yellow header experiment. A light/dark theme switch is not part of v1. Photographs provide most of the color; every block should not display the entire palette.

### 2.3 Typography

- **Syne** is the sole consolidated family, with a sans-serif fallback.
- Create hierarchy through weight, size, spacing, and line breaks rather than reintroducing Lora or another serif.
- The slogan can occupy two lines: `Cada clique,` / `uma história!`.
- The second line has greater scale, while both remain in Syne.
- The slogan acts as a signature below the photograph, not a competitor to the main image.
- Use fluid sizing and responsive adjustments rather than oversized text that breaks on laptops or phones.
- Menus, captions, and metadata are compact but must remain readable.

## 3. Composition principles

1. Place photographs directly on the page, without rounded cards, shadows, or decorative frames.
2. Use varied scales, vertical and horizontal images, intentional asymmetry, and generous breathing room.
3. Avoid turning the portfolio into a uniform catalog grid.
4. Keep project titles, categories, and links visible; hover must not be the only discovery mechanism.
5. Keep transitions subtle and secondary to the photography.
6. Do not use an automatic/generic carousel as the primary presentation. V1 uses a featured photograph and galleries in the page flow.
7. Components, image proportions, and saved ordering determine layout. There is no Admin layout selector.
8. Use Tailwind CSS for layout/responsiveness, with dedicated CSS only where the composition requires it.

## 4. Shared public layout

### 4.1 Header

Desktop: brand on the left; **PORTFÓLIO · SOBRE · CONTATO** on the right. No separate colored strip, oversized background block, or Admin/Login link.

Identify the active navigation item. The brand returns to Home. Links support keyboard navigation and visible focus.

Mobile: preserve a compact brand-and-menu arrangement, adjusting spacing and typography without splitting `ALLAN DANTAS` across lines. The final discussion favored the same row after the tall, stacked header proved cramped. A hamburger menu was not established as a v1 requirement.

### 4.2 Footer

Use the same footer across the main public pages:

| Desktop position | Content |
|---|---|
| Left | Simple Instagram, WhatsApp, and email icons linked to configured channels. |
| Center | João Pessoa — PB, confirmed in the conversation. |
| Right | Discreet copyright identifying Allan Dantas and including “Todos os direitos reservados”. |

Use a fine top divider and compact height. On mobile, stack and center the groups. Do not repeat a second large logo or place the location beside the Home slogan.

Do not hard-code an illustrative copyright year. Copyright text comes from settings. Icons require accessible names; missing contact values must not become fictional links.

## 5. Public pages

### 5.1 Home — `/`

Consolidated sequence:

```text
Header
Featured photograph
Slogan                         Explorar portfólio ↗
Compact footer
```

- Lead with a large photograph and compositionally consistent margins.
- Place the two-line slogan below the image.
- Place **Explorar portfólio ↗** beside the slogan on desktop, styled as an editorial link rather than a large generic button.
- Reflow slogan and CTA into a natural reading sequence on mobile.
- Keep location in the footer.
- Do not add service, testimonial, statistics, or lengthy introduction sections as approved Home requirements.
- The final hero photograph requires a real selection; placeholders are not launch content.

### 5.2 Portfolio — `/portfolio`

Opening title: **TRABALHOS**.

Supporting copy: **Uma seleção de histórias que passaram pela minha câmera.**

Use an irregular composition with editorial numbering, differently sized covers, and visible metadata below the images. The approved rhythm combines a large image, an offset vertical, another vertical, a wide horizontal, and a large closing image. The component must also support the managed catalog without depending on exactly five hard-coded projects.

Each entry includes:

- A number corresponding to editorial order.
- A linked cover and project title.
- Category and year only when supplied.
- A short description when available, without invented factual content.

The discussed selection included Summit Paraíba, Renovação de Votos — Jossenia & Anderson, Ensaio Cleyton, Tamasia Hamburgueria, and Bat Baraka. These establish the composition/curation reference; they do not confirm every project year, cover, or final file. Display a date range only when supported by real catalog data, rather than copying the mockup's illustrative years.

Approved closing CTA: a discreet symbol, **Quer contar a sua história?**, and **ENTRAR EM CONTATO ↗**. Reuse the Home footer.

### 5.3 Project — `/portfolio/[slug]`

- Show title, category, and optional year/description.
- Present that project's selected photographs in the administrator's saved order.
- Vary scale/orientation editorially while preserving proportions and preferably the full photographic composition.
- Covers may use a different crop; avoid indiscriminate destructive gallery crops.
- Provide a clear return to the portfolio.
- Render only eligible photos from a published, non-trashed project.
- Do not offer original downloads or require a lightbox.
- Missing/unavailable projects must not expose private information or produce empty public project pages.

### 5.4 About — `/sobre`

Introduce Allan Dantas as a photographer using a portrait/presentation photograph, text about his approach, and a contact path. Preserve the shared identity, negative space, and importance of photography.

Final copy and photograph are still to be supplied/selected. Do not invent age, career history, education, experience duration, awards, clients, or personal details. A detailed page wireframe was not finalized; follow the common visual language without treating new sections as previously approved.

### 5.5 Contact — `/contato`

Combine public channels with a simple inquiry form. Instagram, WhatsApp, and email use configured values. When supplied, email should also be readable and copyable.

| Field | Behavior |
|---|---|
| Nome | Required. |
| WhatsApp / celular | Required; readable Brazilian formatting and validation. This is not a generic contact field. |
| Mensagem | Required free text describing an inquiry, event, or request. |

Provide a clear submission action and field-level validation. Success confirms receipt and asks the visitor to await contact, without an invented response deadline. No signup or required client email field.

### 5.6 404

Maintain the brand, explain that the page was not found, and provide a clear return to Home/the portfolio. Final wording and detailed composition were not established; a new elaborate themed experience is not required.

## 6. Responsive behavior and accessibility

- Desktop: retain irregular composition, negative space, and contrast between image scales.
- Tablet: reduce spacing/offsets without collisions among covers, titles, and metadata.
- Mobile: arrange projects in one column, retaining modest width/alignment variation where practical; do not merely shrink desktop.
- Keep the header usable on narrow screens; stack and center footer groups.
- Do not distort images; assess cover crops with real photographs.
- Specifically check widths of 375, 390, 430, and 768 px, desktop, and small screens below 400 px, as discussed during responsive revisions.
- Breakpoint variants must actually exist in the chosen configuration; prototype class names alone do not ensure responsive behavior.
- Support keyboard navigation, visible focus, form labels, accessible icon names, and contextual alternative text.
- Keep project information and links available on devices without hover.
- Prefer readable text and contrast over reproducing excessively small prototype metadata.

Exact spacing and final breakpoint values remain implementation calibration, not additional product features.

## 7. Admin language and navigation

Admin retains brand/palette but prioritizes practical operation. Do not reproduce public editorial asymmetry in management screens or turn the panel into a photo editor, file-drive product, or full CRM.

Defined navigation:

```text
✳· ALLAN DANTAS
Dashboard
Projetos
Mensagens
Lixeira
Configurações

Ver site ↗
Sair
```

### 7.1 Login — `/admin` entry

Show the brand, **ÁREA ADMINISTRATIVA**, E-mail/Senha fields, and **ENTRAR**. No account creation, social login, or public navigation reference.

Without a valid session: login. With an authorized session: Dashboard. Invalid credentials: error feedback. After logout, administrative routes require authentication again.

### 7.2 Dashboard

- Published-project count.
- Draft count.
- New-inquiry count.
- Recent inquiries and recent projects with statuses.
- **+ NOVO PROJETO** action.

Use real counts, names, and dates. Do not insert fixed demonstration numbers or decorative charts.

### 7.3 Projects

Provide a practical list with cover, title, category, photo count, status, and edit/continue action. Filters: **Todos | Publicados | Rascunhos | Inativos**. Support drag ordering of projects.

Creation flow:

```text
Novo projeto → Informações → Salvar rascunho
→ Adicionar fotos → Organizar → Escolher capa
→ Pré-visualizar → Publicar
```

Fields: required title/category, optional year/description, unique slug suggested from the title. Category is text in v1: do not add category-management screens.

Preview remains private. Publication without a cover/photo explains the missing prerequisites. Deactivation removes the project from publication without deleting it.

### 7.4 Project photos

- Drag area and **SELECIONAR ARQUIVOS** button.
- Communicate **JPEG/WebP · até 25 MB por arquivo · máximo inicial de 20 fotos por projeto**.
- Recommend approximately 15 photos while allowing fewer.
- Thumbnails with order, cover indication, and actions to choose cover, edit alternative text, and move to Trash.
- Drag-and-drop reordering.
- Automatic processing; do not make Allan manually configure dimensions, metadata, or watermark composition per upload.
- Do not advertise PNG support: it was removed from the final upload decision.

Defined per-file states:

| State | Presentation |
|---|---|
| Aguardando | Selected and waiting for upload. |
| Enviando | Individual progress, including percentage when available. |
| Processando | Received and being prepared for web delivery. |
| Pronta | Processing and persistence completed. |
| Erro | Identify the affected file and offer retry. |

A failure must not erase successful files. Resumable upload supports recovery from interruption. Upload completion and a photo being ready are distinct states.

### 7.5 Inquiries

List sender identity, message excerpt, received time, and status. Detail view contains name, date/time, formatted mobile number, complete message, **ABRIR WHATSAPP ↗**, and a status control.

| Internal value | Interface label |
|---|---|
| `NEW` | NOVA |
| `VIEWED` | VISUALIZADA |
| `IN_CONTACT` | EM CONTATO |
| `FINISHED` | FINALIZADA |

The discussed flow marks New as Viewed when opened; Admin controls In contact and Finished. Use the actual normalized mobile number in the WhatsApp link. Do not send messages automatically or add chat, inquiry deletion, or inquiry Trash in v1.

### 7.6 Trash

Visually separate **Projetos** and **Fotos**. Show identification/thumbnail, origin when applicable, and deletion time. Actions: **RESTAURAR** and **EXCLUIR DEFINITIVAMENTE**.

Permanent deletion requires explicit confirmation and a cancel option. Automatic cleanup and a global empty-Trash action are not v1 requirements.

### 7.7 Settings

| Group | Fields |
|---|---|
| Identity and contact | Name, Instagram handle, Instagram URL, WhatsApp, email, location. |
| Copyright | Copyright text and watermark text. |

Action: **SALVAR ALTERAÇÕES**. Edit the existing global record. Do not include passwords, keys, environment variables, or administrator management.

## 8. States and unresolved details

Functionally established states include invalid login, authorized/unauthorized access, validation errors, successful inquiry submission, publication blocked by missing photo/cover, per-file progress/errors, project/inquiry statuses, and permanent-deletion confirmation.

Loading, failure, and absence of content must be represented where encountered. However, the exact copy/layout of empty states, global loading, and general errors was not finalized. These remain implementation details, not a reason to add notifications, automation, or new features.

Also unresolved: the interaction for removing a published project's cover, restoring photos beyond limits, exact responsive Admin navigation, and final error copy. Do not portray these as already approved UI decisions.

## 9. Watermark and photographic presentation

- Signature: **✳· ALLAN DANTAS**.
- Embed it in the generated web version, small, with a border margin and discreet opacity.
- Scale proportionally for both horizontal and vertical images.
- Calibrate compression quality, margin, opacity, and exact size using real photographs.
- Keep the watermark subordinate to the photograph.
- Drag/context-menu restrictions are deterrents; the interface must not claim absolute copy protection.

## 10. Content and visual acceptance review

Confirmed information: **Allan Dantas**, **João Pessoa — PB**, **@allan.pht**, and the slogan/signature above. Alternative Instagram handles were explored but no replacement was finalized. Do not invent WhatsApp, email, biography, portrait, or project dates.

Before accepting the interface, verify:

- Photography remains the focus, with consistent Syne, palette, and dark theme.
- Header has no separate colored background; the compact footer is shared.
- Home CTA sits beside the slogan on desktop and reflows clearly on mobile.
- Portfolio is editorial and irregular, without rounded cards, shadows, or a generic carousel.
- Project galleries preserve order/proportions and offer a return path.
- Contact contains no fake links and requires a mobile number, with submission feedback.
- Admin supports the agreed v1 screens/actions and flow feedback.
- Production content contains no illustrative years, invented personal information, or placeholders.
- No interface controls imply that deferred features are already part of v1.
