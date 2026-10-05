You are a senior product engineer, senior frontend architect, and senior UX designer.

Your task is to build a polished, working, reusable white-label custom PC builder prototype for computer retailers.

This is a SALES VALIDATION PROTOTYPE, not a production ecommerce platform.

The primary objective is to create one codebase that can be reused across multiple computer retailers by changing a single brand configuration.

Target retailers currently include:

- BYOS Computer Store
- Satnam Computers
- Jai Computech
- Microcenter India
- Computer Garage 360
- IT Fixer

Do not hardcode any of these retailer names inside generic UI components.

================================================== 0. EXECUTION PRINCIPLES
==================================================

Optimize for:

1. correctness
2. reusable architecture
3. polished UX
4. working interactions
5. low implementation complexity
6. effective token usage

Do not over-explain your work.

Do not generate long architectural essays before coding.

Do not repeatedly restate requirements.

Inspect the repository first.

If the repository already contains relevant code:

- preserve good existing patterns
- refactor only when necessary
- do not rewrite working code without reason

If the repository is empty:

- scaffold the application

Make implementation decisions autonomously when requirements are clear.

Do not ask clarification questions unless absolutely blocking.

Prefer simple, deterministic implementations over unnecessary abstraction.

Do not introduce dependencies unless they materially improve the prototype.

Before finishing:

- run typecheck
- run build
- fix all errors
- verify key flows manually from code

==================================================

1. # PRODUCT GOAL

The product should solve this customer problem:

"I want a custom PC, but I do not know which components I need or whether they are compatible."

The experience should guide the customer through:

use case
→ budget
→ recommendation
→ customization
→ compatibility validation
→ price
→ quotation / WhatsApp enquiry

The website should convert unstructured Instagram and WhatsApp enquiries into structured PC build leads.

Typical questions the product should reduce:

"What PC can I get for ₹1 lakh?"

"Will this GPU work with this PSU?"

"Can you build me a PC for editing?"

"Can you quote this configuration?"

The prototype must demonstrate this value within roughly 30 seconds.

================================================== 2. TECHNOLOGY
==================================================

Use:

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Lucide React
- Zustand for builder state
- LocalStorage for persistence

Use Framer Motion only if already available or if subtle animation materially improves UX.

Do not add a backend.

Do not use:

- Supabase
- Firebase
- authentication
- payment gateway
- server APIs
- generative AI APIs
- database
- CMS

All prototype data should be local TypeScript data.

The app must run with:

npm install
npm run dev

and build with:

npm run build

================================================== 3. WHITE-LABEL ARCHITECTURE
==================================================

This is a critical requirement.

Create:

src/config/brands.ts
src/config/brand.ts

Define a strongly typed BrandConfig.

Suggested shape:

type BrandConfig = {
id: string
name: string
shortName: string
tagline?: string
logo?: string

theme: {
primary: string
primaryHover: string
primarySoft: string
}

contact: {
phone?: string
whatsapp?: string
email?: string
instagram?: string
address?: string
}

hero: {
eyebrow?: string
title: string
description: string
}

trustPoints: string[]

services?: string[]

locations?: {
name: string
address: string
}[]
}

Create config entries for:

byos
satnam
jaicomputech
microcenter
computergarage360
itfixer

Do not fabricate unknown factual details.

For unknown values use:

- neutral prototype copy
- empty optional fields
- clearly editable placeholders

The active brand should resolve from:

1. ?brand= URL override
2. VITE_ACTIVE_BRAND
3. fallback to "byos"

Example:

const ACTIVE_BRAND =
searchParams.get("brand") ||
import.meta.env.VITE_ACTIVE_BRAND ||
"byos"

Create:

useBrand()

Generic components must consume branding only through brand configuration.

No business-specific name, phone, Instagram handle or address should be hardcoded in generic components.

================================================== 4. BRAND SWITCHING
==================================================

These URLs should work:

/?brand=byos
/?brand=satnam
/?brand=jaicomputech
/?brand=microcenter
/?brand=computergarage360
/?brand=itfixer

Changing the brand should update:

- name
- logo/wordmark
- accent color
- contact methods
- WhatsApp
- Instagram
- location
- hero copy
- trust copy

without editing React components.

Create a development-only route:

/demo

It should provide a simple brand switcher.

Do not expose it prominently in customer navigation.

================================================== 5. BRANDING SYSTEM
==================================================

Use semantic CSS variables.

Global neutral palette:

--background: #F7F7F5
--surface: #FFFFFF
--surface-muted: #F1F1EF
--text: #101114
--text-secondary: #686B73
--border: #E3E4E7

Builder palette:

--builder-background: #0B0C0F
--builder-surface: #121318
--builder-surface-raised: #181A20
--builder-border: #272A31
--builder-text: #F7F7F8
--builder-text-secondary: #989CA6

Semantic states:

--success: #22C55E
--warning: #F59E0B
--danger: #EF4444

Brand variables:

--brand-primary
--brand-primary-hover
--brand-primary-soft

Brand accents should occupy less than roughly 10% of the interface.

Use brand color for:

- primary CTAs
- selected states
- active navigation
- links
- small highlights

Do not tint large page areas with the brand color.

================================================== 6. VISUAL DIRECTION
==================================================

Use these design references as inspiration only:

- Dribbble: PC Builder Website
- Dribbble: Donanım v1

Do not copy either design.

Create an original interface that combines:

premium hardware website

- editorial product presentation
- professional PC configurator

Avoid:

- generic SaaS dashboard styling
- excessive rounded cards
- excessive gradients
- RGB gaming aesthetic
- cyberpunk styling
- glassmorphism everywhere
- dense traditional ecommerce
- giant discount labels
- excessive shadows
- icon grids everywhere

The experience should have two intentional visual modes.

MARKETING PAGES:
bright
editorial
spacious
premium

BUILDER:
dark
technical
compact
focused

================================================== 7. TYPOGRAPHY
==================================================

Use Geist, Inter, or equivalent.

Marketing:

Hero:
64–72px desktop
48–56px tablet
38–42px mobile

Section headings:
30–40px

Body:
15–17px

Builder:

Page title:
24–30px

Component names:
15–17px

Specs:
12–14px

Prices:
17–20px

Use strong hierarchy.

Avoid oversized headings that break usability.

================================================== 8. ROUTES
==================================================

Implement:

/
/builder
/builds
/builds/:slug
/components
/why-us
/support
/demo

Use client-side routing.

No page reload between internal routes.

Browser back/forward must work.

================================================== 9. HEADER
==================================================

Marketing header:

Left:
brand logo or wordmark

Navigation:
Build a PC
Ready Builds
Components
Why Us
Support

Right:
Talk to an Expert
Start Build

Start Build is the primary CTA.

Sticky header.

Mobile:
logo
menu
Start Build

Builder route should use a different compact application header.

Builder header:

Left:
brand logo

Center / title:
Build a PC

Right:
Save
Share
Expert Help

Do not show the full marketing navigation inside the builder workspace.

================================================== 10. HOMEPAGE
==================================================

Route:

/

The homepage must sell the custom-PC experience, not just components.

---

## HERO

Use bright editorial styling.

Suggested copy structure:

Eyebrow:
CUSTOM PC BUILDING

Heading:
Build the machine
you actually need.

Supporting text:

Tell us what you use your PC for and your budget. We'll help you create a balanced, compatible build without making you decode hundreds of components.

Primary CTA:
Build My PC

Secondary CTA:
Explore Ready Builds

Trust line:

Compatibility checked
Expert assembled
Stress tested
Genuine components

Right-side visual:

Create a premium PC/product composition using local placeholders or simple visual blocks.

Do not depend on external copyrighted assets.

Include small technical callouts such as:

Ryzen 7
RTX 5070
32GB DDR5
1440p Ready

Also show:

Estimated build
₹1,42,990

Keep visual hierarchy clean.

Do not put every piece of information inside cards.

================================================== 11. USE-CASE SECTION
==================================================

Title:

Start with what matters.

Options:

Gaming
Video Editing
3D & Rendering
Streaming
AI / Machine Learning
Office / Productivity

Each option includes:

icon
title
one-line description

Clicking should route to:

/builder?useCase=gaming

etc.

================================================== 12. BUDGET SECTION
==================================================

Show:

Under ₹60K
₹60K – ₹1L
₹1L – ₹1.5L
₹1.5L – ₹2.5L
₹2.5L+

Provide short performance guidance.

Example:

₹60K – ₹1L
1080p gaming
Everyday creation

₹1L – ₹1.5L
High-refresh 1080p
Strong 1440p

₹1.5L – ₹2.5L
High-end 1440p
4K capable
Creator workloads

Click should open builder with budget context.

================================================== 13. FEATURED BUILD
==================================================

Do not immediately use a generic four-column card grid.

First create one large featured-build section.

Use dark full-width treatment.

Left:
build positioning

Center:
large PC visual

Right:
key specs

Example:

Vortex 1440

Ryzen 7 9700X
RTX 5070
32GB DDR5
1TB NVMe

1440p Gaming
Streaming
Editing

₹1,42,990

CTA:
Customize Build

Below this, show smaller ready-build cards.

================================================== 14. READY BUILDS
==================================================

Create local data for at least:

Starter
Performance
Creator
AI / Workstation

Example builds:

Apex 1080

Ryzen 5
RTX 5060
16GB DDR5
1TB NVMe

₹82,990

Vortex 1440

Ryzen 7
RTX 5070
32GB DDR5
1TB NVMe

₹1,42,990

Studio Pro

Ryzen 9
RTX 5070 Ti
64GB DDR5
2TB NVMe

₹2,19,990

Pricing is prototype data.

Clearly structure it for later replacement.

Each build should support:

View Build
Customize

Customize should open builder preloaded with those components.

================================================== 15. WHY BUILD WITH US
==================================================

Use a restrained premium layout.

Possible value points:

Compatibility checked

Balanced configurations

Expert assembly

Stress tested

Genuine components

Upgrade friendly

Prefer brandConfig.trustPoints for brand-specific content.

Do not fabricate:

years in business
customer counts
certifications
review counts

================================================== 16. BUILDER ENTRY FLOW
==================================================

Route:

/builder

The builder is the core experience.

If no build context exists, show a short setup flow.

Question 1:

What will you use your PC for?

Gaming
Editing
Streaming
AI / ML
3D Rendering
Office

Question 2:

What's your budget?

Use:

slider

- quick presets

₹50K
₹75K
₹1L
₹1.25L
₹1.5L
₹2L
₹3L+

For gaming optionally ask:

1080p
1440p
4K

and optionally:

60 FPS
144 FPS+
Maximum Performance

Final actions:

Build it for me

I'll choose the parts

"Build it for me" should run deterministic recommendation logic.

================================================== 17. BUILDER LAYOUT
==================================================

Desktop target:

category nav

- component workspace
- sticky build summary

Preferred proportions:

220px
flexible
320px

For narrower desktop/tablet:

component workspace

- 320px summary

Builder background:

#0B0C0F

The builder should feel more compact than the marketing site.

Do not make it look like an Excel table.

================================================== 18. CATEGORY NAV
==================================================

Categories:

CPU
GPU
Motherboard
Memory
Storage
Cooling
Power Supply
Case

Optional:

Additional Storage
Case Fans
Operating System
Wi-Fi

Each nav item should display:

icon
category name
selected part if available
status

Example:

✓ CPU
Ryzen 7 9700X

! PSU
Select PSU

Keep this compact.

================================================== 19. COMPONENT DATA MODEL
==================================================

Create enough realistic local prototype data to make the configurator meaningful.

Target approximately:

8 CPUs
8 motherboards
8 GPUs
6 RAM kits
6 SSDs
6 PSUs
6 cases
6 coolers

Use brands such as:

AMD
Intel
NVIDIA
ASUS
MSI
Gigabyte
Corsair
Kingston
G.Skill
Crucial
Samsung
Cooler Master
DeepCool
NZXT
Lian Li

No retailer scraping.

Prices and stock are local sample data.

Suggested structures:

CPU:
id
brand
name
price
socket
cores
threads
tdp
memoryType
tags

Motherboard:
id
brand
name
price
socket
memoryType
formFactor
wifi
tags

GPU:
id
brand
name
price
recommendedPsu
lengthMm
vramGb
performanceTier
tags

RAM:
id
brand
name
price
memoryType
capacityGb
speed
kit

SSD:
id
brand
name
price
capacityGb
interface

PSU:
id
brand
name
price
wattage
efficiency

Case:
id
brand
name
price
supportedFormFactors
maxGpuLengthMm
maxCoolerHeightMm

Cooler:
id
brand
name
price
supportedSockets
heightMm
type

================================================== 20. COMPONENT WORKSPACE
==================================================

Show current category title.

Example:

Processors

Include:

search
filters
sort

Keep filtering simple and useful.

CPU filters:

AMD
Intel

Socket

Price

Sort:

Recommended
Price Low–High
Price High–Low

Component card should show:

product image placeholder
brand
name
important specs
price
compatibility status
Select

Example:

AMD Ryzen 7 9700X

8 cores / 16 threads
AM5
65W

₹31,990

Recommended

[Select]

Do not show excessive specs.

Selected card should receive:

brand accent border
subtle tinted background
check icon

================================================== 21. PRODUCT CARD VISUALS
==================================================

Builder cards should use:

dark outer card
light or raised image area
compact text
clear price
minimal borders

Do not fill selected cards with strong accent color.

Use accent only as an edge/highlight.

================================================== 22. COMPATIBILITY ENGINE
==================================================

Create pure deterministic compatibility logic.

Required checks:

CPU ↔ motherboard socket

Motherboard ↔ RAM type

Motherboard ↔ case form factor

GPU ↔ case max GPU length

Cooler ↔ CPU socket

Cooler ↔ case max cooler height

Estimated power ↔ PSU wattage

Create pure functions:

checkCpuMotherboardCompatibility()

checkMemoryCompatibility()

checkCaseCompatibility()

checkCoolerCompatibility()

estimatePower()

checkPsuCompatibility()

validateBuild()

Return structured results.

Suggested format:

type CompatibilityIssue = {
severity: "error" | "warning"
code: string
title: string
message: string
category?: ComponentCategory
}

Do not bury compatibility logic inside React components.

================================================== 23. COMPATIBILITY UX
==================================================

Success:

small green indicator
All selected components are compatible

Warning example:

This motherboard supports DDR5 memory, but the selected kit is DDR4.

CTA:
View Compatible RAM

Another:

Selected GPU length exceeds this case's maximum supported GPU length.

Another:

Estimated system draw is 540W. A 650W or greater PSU is recommended.

Do not use large warning banners unless needed.

================================================== 24. POWER ESTIMATION
==================================================

Use a simple transparent heuristic.

Example:

CPU TDP

- GPU estimated board power
- base system allowance
- headroom

Do not claim engineering-grade power analysis.

Return:

estimatedPower
recommendedPsuWattage

Example:

Estimated system power:
485W

Recommended PSU:
650W+

================================================== 25. RECOMMENDATION ENGINE
==================================================

Create deterministic recommendation logic.

Pure function:

recommendBuild({
budget,
useCase,
resolution?
})

Use practical heuristics.

Gaming:
prioritize GPU

Editing:
balance CPU / GPU / RAM

Streaming:
gaming balance + CPU/RAM headroom

AI / ML:
prioritize NVIDIA GPU VRAM

3D:
prioritize GPU + CPU

Office:
prioritize value / CPU / efficient platform

Always return a compatible build when possible.

Do not fake AI.

If budget is too low, return a useful state instead of invalid parts.

================================================== 26. BUILD SUMMARY
==================================================

Desktop:
sticky right panel

Header:

YOUR BUILD

Build ID:
PC-7F42

Show compact rows:

CPU
Ryzen 7 9700X
₹31,990

GPU
RTX 5070
₹59,990

RAM
32GB DDR5
₹9,990

etc.

Then:

Estimated power
485W

Recommended PSU
650W+

Compatibility
✓ All components compatible

Total

₹1,42,990

Primary CTA:

Get This Build

Secondary:

Save
Share

================================================== 27. BUILD ID
==================================================

Generate a short reference such as:

PC-7F42

Persist it with the build.

Use it in:

summary
WhatsApp message
quote request
saved build

Do not regenerate on every render.

================================================== 28. PERFORMANCE SUITABILITY
==================================================

Create a heuristic suitability panel.

Example:

1080p gaming
Excellent

1440p gaming
Excellent

4K gaming
Very Good

Video editing
Excellent

Streaming
Excellent

Label clearly:

Estimated workload suitability

Do not present fabricated FPS values or benchmark claims.

================================================== 29. GET THIS BUILD
==================================================

Click:

Get This Build

Open a polished drawer or modal.

Title:

Your PC is ready.

Show:

build reference
configuration summary
estimated total

Options:

Request quotation
Order via WhatsApp
Talk to an expert

Fields:

Name
Phone
Email optional
City

Primary action:

Send Build Request

No backend submission is needed.

Prototype should show successful lead state.

================================================== 30. WHATSAPP
==================================================

This is a core conversion path.

If brand.contact.whatsapp exists:

show:

Order via WhatsApp
WhatsApp an Expert

Generate:

https://wa.me/{number}?text={encodedMessage}

Message format:

Hi {brandName},

I'm interested in this PC build.

Build reference: PC-7F42

CPU: AMD Ryzen 7 9700X
GPU: NVIDIA RTX 5070
Motherboard: ...
RAM: ...
Storage: ...
PSU: ...
Case: ...

Estimated total: ₹1,42,990

Usage: Gaming
Target: 1440p

Can you confirm availability and final quotation?

Use configured WhatsApp number only.

If no number exists:
hide WhatsApp actions.

================================================== 31. SAVE AND SHARE
==================================================

Save build to LocalStorage.

Persist:

selected parts
build ID
use case
budget
resolution
timestamp

Implement:

Save Build
Copy Build
Share Build

Copy Build should generate clean text suitable for:

WhatsApp
Discord
email

Share Build should serialize enough state into a URL or compact query parameter.

Keep serialization simple.

Functions:

serializeBuild()

deserializeBuild()

================================================== 32. READY BUILDS PAGE
==================================================

Route:

/builds

Heading:

Ready-to-go PCs.
Built and balanced by experts.

Filters:

Use case
Budget
CPU platform
GPU class
Resolution

Cards should emphasize:

use case
key specs
performance class
price

Avoid discount-heavy ecommerce visuals.

Actions:

View Build
Customize

Customize preloads builder.

================================================== 33. BUILD DETAIL
==================================================

Route:

/builds/:slug

Show:

build visual
name
price
primary use cases

Key configuration:

CPU
GPU
RAM
Storage
Motherboard
PSU
Cooling
Case

Also show:

Estimated workload suitability
Why this configuration works
Upgrade options

Actions:

Customize this Build
Get Quote

================================================== 34. COMPONENTS PAGE
==================================================

Route:

/components

This page is secondary.

Categories:

Processors
Graphics Cards
Motherboards
Memory
Storage
Power Supplies
Cases
Cooling

Keep it clean.

Do not let this page dominate the product.

This website is builder-first.

================================================== 35. ALREADY HAVE A BUILD
==================================================

Add CTA:

Already have a configuration?

Get a quote

Open a modal with:

Paste your PC configuration

Placeholder:

Ryzen 7 9700X
RTX 5070
32GB DDR5
1TB NVMe

CTA:

Request Quote

Also show:

Upload Screenshot

This interaction can be mocked.

No OCR implementation required.

================================================== 36. EXPERT HELP
==================================================

Create a floating help control:

Need help choosing?

Open a compact drawer/modal.

Ask for:

budget
games/software
resolution
whether monitor/peripherals are needed

Actions:

WhatsApp an Expert
Request Callback

Use brand configuration.

Do not implement a fake chatbot.

================================================== 37. WHY US PAGE
==================================================

Route:

/why-us

Explain:

Why custom PCs
How components are selected
Compatibility validation
Assembly
Cable management
Stress testing
Quality control
Warranty
Upgrade guidance
Support

Use configured brand-specific trust points where available.

Do not invent factual claims.

================================================== 38. SUPPORT PAGE
==================================================

Route:

/support

Sections:

Build Consultation
Existing PC Upgrade
Troubleshooting
Warranty Help
Component Advice

Display configured contact options:

WhatsApp
Phone
Instagram
Email
Visit Store

Hide missing contact methods.

If locations exist:
display them.

If none:
hide the location section.

================================================== 39. MOBILE BUILDER
==================================================

Do not squeeze the desktop sidebar into mobile.

Mobile builder should be:

single-column

with sticky bottom bar:

₹1,42,990
Review Build

Review Build opens a bottom sheet containing:

selected parts
compatibility
total
Get This Build

Component filters should use sheets/drawers.

Target width:

390px

================================================== 40. RESPONSIVE BREAKPOINTS
==================================================

Verify:

1440px
1280px
1024px
768px
390px

Ensure:

no overflow
no clipped modals
no unusable sticky panels
no tiny touch targets

================================================== 41. MICROINTERACTIONS
==================================================

Keep animations subtle.

Examples:

drawer open
component selection
price update
compatibility success
toast
modal
hover

Typical duration:

150–250ms

Respect reduced motion.

Avoid decorative animation.

================================================== 42. ACCESSIBILITY
==================================================

Implement:

semantic HTML
keyboard navigation
visible focus states
button elements
labels
ARIA where needed
good contrast
reduced motion support

Do not create div-based fake buttons.

================================================== 43. STATE MANAGEMENT
==================================================

Use Zustand for builder state.

Suggested store state:

buildId
useCase
budget
resolution
selectedComponents
savedAt

Suggested actions:

setUseCase
setBudget
setResolution
selectComponent
removeComponent
loadBuild
resetBuild
saveBuild

Derived logic should remain outside the store where possible.

================================================== 44. DOMAIN STRUCTURE
==================================================

Use a structure similar to:

src/
app/
components/
layout/
ui/
builder/
products/
config/
brand.ts
brands.ts
data/
components.ts
builds.ts
domain/
compatibility.ts
recommendation.ts
power.ts
pricing.ts
build-serialization.ts
hooks/
pages/
HomePage.tsx
BuilderPage.tsx
BuildsPage.tsx
BuildDetailPage.tsx
ComponentsPage.tsx
WhyUsPage.tsx
SupportPage.tsx
DemoPage.tsx
store/
builderStore.ts
types/
utils/

Keep domain logic framework-independent.

================================================== 45. REQUIRED PURE FUNCTIONS
==================================================

Implement:

checkCpuMotherboardCompatibility()

checkMemoryCompatibility()

checkCaseCompatibility()

checkCoolerCompatibility()

estimatePower()

checkPsuCompatibility()

validateBuild()

recommendBuild()

calculateBuildTotal()

serializeBuild()

deserializeBuild()

Keep functions deterministic and testable.

================================================== 46. FUTURE-READY INTERFACES
==================================================

Do not implement real integrations yet.

Create lightweight interfaces only where useful:

InventoryProvider
PricingProvider
LeadProvider
RecommendationProvider
QuotationProvider

Example:

interface PricingProvider {
getPrice(componentId: string): Promise<number>
}

Local providers can satisfy them.

Do not create unnecessary dependency injection frameworks.

================================================== 47. LOADING / EMPTY / ERROR STATES
==================================================

Create intentional states for:

empty search
no compatible products
budget too low
invalid shared build
missing brand
saved confirmation
copied confirmation
compatibility warning

Use subtle toast feedback.

Avoid fake loading delays.

================================================== 48. FALLBACK LOGO
==================================================

If no logo exists:

render a clean text wordmark using:

brand.shortName

The prototype must look presentable without brand image assets.

================================================== 49. ADDING A NEW BRAND
==================================================

Create:

BRANDING.md

Adding a new retailer should require only:

1. copy one BrandConfig entry
2. update name/contact/theme/copy
3. add optional logo
4. set:

VITE_ACTIVE_BRAND=mybrand

No generic component edits should be needed.

Document query override too:

?brand=mybrand

================================================== 50. README
==================================================

Create a concise, useful README covering:

setup
run
build
architecture
brand switching
builder data
compatibility rules
recommendation logic
sample pricing disclaimer
demo routes

Do not write an excessively long README.

================================================== 51. TESTING
==================================================

Add focused tests for business logic if test tooling already exists.

If no test tooling exists, add the smallest reasonable setup only if it can be done cleanly.

Prioritize tests for:

CPU / motherboard compatibility
RAM compatibility
case compatibility
cooler compatibility
PSU compatibility
recommendBuild
calculateBuildTotal
serialization

Do not create a large testing framework for UI snapshots.

================================================== 52. IMPLEMENTATION ORDER
==================================================

Follow this order unless repository structure requires adjustment:

1. inspect repository
2. scaffold/fix base app
3. configure routes
4. implement brand system
5. implement theme variables
6. define types
7. add component/build data
8. implement domain logic
9. implement Zustand builder store
10. build marketing layout/home
11. build builder onboarding
12. build component workspace
13. build compatibility UX
14. build summary/quote/WhatsApp
15. build ready-build pages
16. build remaining support pages
17. mobile polish
18. accessibility pass
19. build/typecheck/tests
20. fix issues

Do not jump into visual polish before core builder logic works.

================================================== 53. TOKEN EFFICIENCY
==================================================

Keep communication concise while working.

Do not print full file contents unless needed.

When modifying existing files:
prefer patches or targeted edits.

Do not repeatedly summarize unchanged requirements.

Do not create large amounts of placeholder code.

Do not introduce abstractions unless used in at least two meaningful places.

Prefer one clear implementation over several alternatives.

When a decision is low-risk:
choose one and proceed.

================================================== 54. ACCURACY RULES
==================================================

Do not fabricate:

retailer statistics
prices claimed as live
stock
warranties
store locations
customer counts
benchmarks
FPS numbers
certifications
business history

Prototype pricing must be clearly treated as sample data.

Performance labels should be heuristic only.

Use wording such as:

Estimated workload suitability

Do not imply benchmark accuracy.

Compatibility checks should be based only on modeled properties.

Do not claim exhaustive PC hardware validation.

================================================== 55. DO NOT IMPLEMENT
==================================================

Do not add:

authentication
checkout
payments
real order placement
user accounts
admin panel
inventory syncing
ERP integration
Shopify
WooCommerce
Supabase
AI APIs
PDF quotation generation
real screenshot OCR
real benchmark APIs
real stock checking

This prototype exists to validate retailer interest.

================================================== 56. ACCEPTANCE CRITERIA
==================================================

Before finishing verify all of the following:

[ ] app installs

[ ] npm run build succeeds

[ ] TypeScript has no errors

[ ] routes work

[ ] client-side navigation has no reloads

[ ] browser back/forward works

[ ] marketing and builder layouts are visually distinct

[ ] brand config controls all retailer-specific content

[ ] no retailer name is hardcoded inside generic components

[ ] VITE_ACTIVE_BRAND works

[ ] ?brand= override works

[ ] fallback wordmark works

[ ] /demo brand switcher works

[ ] builder onboarding works

[ ] use-case selection works

[ ] budget selection works

[ ] recommendations work

[ ] selected parts can be changed

[ ] compatibility validation works

[ ] warnings are actionable

[ ] power estimate works

[ ] total recalculates

[ ] build ID persists

[ ] builder state survives refresh

[ ] Save Build works

[ ] Copy Build works

[ ] Share Build works

[ ] ready build → customize works

[ ] Get This Build flow works

[ ] WhatsApp message is generated from brand config

[ ] missing WhatsApp hides CTA

[ ] mobile builder works

[ ] mobile review sheet works

[ ] no layout overflow

[ ] no console errors

[ ] no broken route

[ ] no fake retailer claims

[ ] README exists

[ ] BRANDING.md exists

================================================== 57. FINAL PRODUCT STANDARD
==================================================

Do not deliver a static landing page with a fake configurator.

The PC builder must genuinely work.

The final prototype should be polished enough that I can send a retailer a personalized link such as:

?brand=byos

or

?brand=jaicomputech

and say:

"I redesigned how customers could configure and enquire about custom PCs from your store."

Within 30 seconds the retailer should understand:

1. customer chooses use case
2. customer enters budget
3. site recommends a PC
4. customer customizes parts
5. site checks compatibility
6. customer sees estimated price
7. customer sends the full build through WhatsApp
8. retailer receives a structured sales enquiry instead of an unstructured chat

Prioritize:

1. builder usability
2. white-label architecture
3. structured lead conversion
4. compatibility correctness
5. polished UX
6. maintainable code

over unnecessary features.

Begin by inspecting the repository.

Implement the complete working prototype.

Do not stop after scaffolding or static screens.

Finish by running validation commands and fixing all issues found.

================================================== 58. PRODUCT IMAGE DIRECTION
==================================================

All PC and hardware imagery must look like photorealistic commercial studio product photography.

Use realistic brushed/powder-coated metal, tempered glass and plastic textures; believable screws, vents, ports, component proportions and cable routing; controlled reflections, subtle surface imperfections, natural 50–85mm photographic perspective and realistic depth of field.

Light with a large softbox key from one side, softer fill and subtle rim. Use neutral studio backdrops, soft contact shadows and physically supported products. Interior lighting must be restrained white or muted RGB.

For the homepage, show a physically assembled black/graphite custom desktop tower in three-quarter perspective. Its tempered-glass side should reveal a plausible motherboard, GPU, AIO, RAM and PSU cabling. Keep the whole case and its grounded contact shadow visible.

Do not use illustration, cartoon, anime, stylized 3D, low-poly/game assets, concept art, exaggerated/glossy CGI, synthetic reflections, plastic-looking metal, neon/cyberpunk lighting, fantasy hardware, impossible geometry or floating sci-fi components. UI navigation icons may remain icons; they must not substitute for product imagery.

Keep assets local and optimized for the web. Generated representative imagery must not be presented as verified manufacturer photographs of exact product SKUs. Support replacing it with retailer-supplied product photos.

================================================== 59. IMAGE TEXT / LABEL ACCURACY
==================================================

Generated hardware images must contain NO readable branding, labels, model numbers, stickers, specification text, serial numbers, badges, component names, logos or pseudo-text. Keep all visible product surfaces unbranded and free of readable text, including PCB markings and molded lettering.

Do not ask the image model to render hardware names or specifications such as RTX 5070, Ryzen 7, DDR5, ASUS, MSI, Gigabyte or Corsair. Describe physical hardware, materials, proportions, cooling and cables only. Never bake specification text into generated imagery.

Treat each image only as the visual product photograph. Render specification labels in React using actual build/catalog data and semantic HTML/CSS overlays, clean typography, leader lines and subtle markers around the product image. Make the callouts responsive and keep text readable without covering the product.

CPU, GPU, Memory and Cooling labels must reflect the configured parts. For example, display 240mm AIO only when the configured cooler is actually a 240mm liquid cooler; do not invent specifications to match a representative image.
