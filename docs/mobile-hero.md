# Mobile homepage hero

At **768px and below**, `MobilePcHero` is an editorial hero in normal document flow. At **769px and above**, the existing desktop scroll-driven 3D hero remains unchanged. The builder remains interactive on mobile.

The hero reuses `public/assets/hero-pc/assembled/pc.webp`: a 1600 x 1600 transparent assembled-PC photograph, **202,726 bytes**. Explicit dimensions and a reserved visual area prevent layout shifts. The image is eager/high priority because it is above the fold; there is no WebGL, canvas, video, frame player or loading screen.

The example summary uses the existing Vortex 1440 catalog configuration, pricing helper and compatibility checks. It does not read or overwrite the visitor's builder draft. Pricing is labeled illustrative and the image is a representative marketing visual.

Start Building opens `/builder`; See how it works opens `/how-it-works`; Explore 3D Preview opens `/builder?view=3d`. Mobile homepage demo actions also go to builder 3D, with no homepage demo prefetch. Desktop behavior is preserved.

Only the image has a one-time 420ms CSS entrance. Reduced motion disables it. There are no scroll listeners or timers in the mobile hero.

The previous offline frame-render script and its outputs are unused by the application. They are not requested by the mobile hero.
