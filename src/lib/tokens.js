/* ============================ Tokens ============================ */
export const INK = "#0F1B2D";
export const INK_SOFT = "#17273D";
// Brand palette matches the Thara Services logo (red shield/wordmark).
export const BRAND = "#E31E3D";
export const BRAND_DK = "#AA172E";
export const BRAND_WASH = "#FCE8EA";
export const AMBER = "#B45309";
export const ROSE = "#BE123C";
export const inputCls =
  "w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:border-[#E31E3D]";
// Same as inputCls but without a baked-in width. Tailwind emits `.w-full` after
// every fixed-width utility (w-40, w-56, w-auto...) in the compiled stylesheet,
// so appending "w-NN" to inputCls never actually overrides its w-full — the
// element silently renders full-width regardless. Use this base instead
// whenever a specific width is needed (toolbars, inline filters, small
// numeric fields).
export const inputClsAuto =
  "px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:border-[#E31E3D]";
export const uid = (p) => p + "-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
