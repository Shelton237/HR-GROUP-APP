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
export const uid = (p) => p + "-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
