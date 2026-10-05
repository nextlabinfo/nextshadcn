import type { SimpleIcon } from "simple-icons";
import { siNextdotjs, siNodedotjs, siReact, siRemix } from "simple-icons";

// Maps a project's framework string (from the data layer) to its brand icon.
const FRAMEWORK_ICONS: Record<string, SimpleIcon> = {
  "next.js": siNextdotjs,
  nextjs: siNextdotjs,
  "node.js": siNodedotjs,
  nodejs: siNodedotjs,
  node: siNodedotjs,
  react: siReact,
  remix: siRemix,
};

export function getFrameworkIcon(framework: string | null): SimpleIcon | null {
  if (!framework) return null;
  return FRAMEWORK_ICONS[framework.toLowerCase()] ?? null;
}
