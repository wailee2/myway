/**
 * Inline script (runs before first paint, no React needed): scales the desktop phone frame down
 * to fit short windows. 870 x 416 is the outer size of the frame, 48px is breathing room.
 * Sets --phone-scale on <html>; it is ignored on real phones (no frame there).
 */
export const phoneScaleScript = `(function(){var d=document.documentElement;function f(){var s=Math.min(1,(window.innerHeight-48)/870,(window.innerWidth-48)/416);d.style.setProperty("--phone-scale",Math.max(0.3,s).toFixed(4))}f();window.addEventListener("resize",f)})()`;
