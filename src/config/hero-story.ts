type HeroStoryStage = {
  id: string; label: string; start: number; eyebrow: string; title: string; description: string;
  details?: string[]; checked?: boolean; actions?: 'intro' | 'final';
};

// Thresholds follow the existing hero: panels .06–.36, GPU/board .32–.58,
// cooling .54–.69, then the final details settle by .85. No 3D timings change.
export const heroStoryStages: readonly HeroStoryStage[] = [
  {
    id: 'build', label: 'Build', start: 0, eyebrow: 'INTERACTIVE PC BUILDING',
    title: 'Build it.\nSee it before you buy it.',
    description: 'Choose your parts, check compatibility, and explore your build in interactive 3D before taking it to a retailer.',
    actions: 'intro',
  },
  {
    id: 'open', label: 'Open', start: .16, eyebrow: "SEE WHAT'S INSIDE",
    title: 'Every build starts\nwith the right foundation.',
    description: 'Open the case and understand how the major components fit together before you commit to a configuration.',
    details: ['Case layout', 'Cooling space', 'Component clearance'],
  },
  {
    id: 'balance', label: 'Balance', start: .38, eyebrow: 'BUILT AROUND YOUR WORKLOAD',
    title: 'Balance matters more\nthan bigger numbers.',
    description: 'RigPilot helps match your CPU, GPU, memory, cooling and power around what you actually plan to do.',
    details: ['Gaming', 'Editing', 'AI', 'Streaming'],
  },
  {
    id: 'check', label: 'Check', start: .60, eyebrow: 'COMPATIBILITY CHECKED',
    title: 'Parts should work together\n— not just fit.',
    description: 'Your configuration is checked for key platform, memory, power and clearance requirements while you build.',
    details: ['Socket', 'Memory', 'PSU', 'Case clearance'], checked: true,
  },
  {
    id: 'visualize', label: 'Visualize', start: .78, eyebrow: 'YOUR BUILD, VISUALIZED',
    title: "Understand the machine\nbefore it's assembled.",
    description: 'Rotate it, inspect the parts, compare your choices and take the final build to the retailer you prefer.',
    actions: 'final',
  },
];

export const mobileHeroStoryStages: readonly HeroStoryStage[] = [
  { ...heroStoryStages[0], description: 'Choose parts, check compatibility and inspect your build in 3D before taking it to a retailer.' },
  { ...heroStoryStages[1], title: "See what's inside.", description: 'Open the case and explore how the main parts come together.', details: ['Case layout', 'Cooling space'] },
  { ...heroStoryStages[3], start: .54, title: 'Check the configuration.', description: 'Platform, memory, power and clearance checks update as you choose parts.' },
  { ...heroStoryStages[4], title: 'Understand your build.', description: 'Inspect your choices, then take the final build to your preferred retailer.' },
];

export function heroStoryIndex(progress: number, stages: readonly HeroStoryStage[]) {
  let index = 0;
  for (let i = 1; i < stages.length; i++) if (progress >= stages[i].start) index = i;
  return index;
}
