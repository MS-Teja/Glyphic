import { fas } from "@fortawesome/free-solid-svg-icons";
import { fab } from "@fortawesome/free-brands-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { escapeXml } from "./sanitize.js";

// Ex: getIconSVG("fas-user", "#fff") or getIconSVG("fab-aws", "#000")
export function getIconSVG(iconName: string, color: string, width = 24, height = 24): string {
  let iconDef: IconDefinition | undefined;

  const parts = iconName.split("-");
  const prefix = parts[0];
  const name = parts.slice(1).join("-");

  // FontAwesome keys are camelCase (e.g. faUser, faAws)
  const camelName = `fa${name.charAt(0).toUpperCase()}${name.slice(1).replace(/-([a-z])/g, (g) => g[1].toUpperCase())}`;

  if (prefix === "fas" || prefix === "fa") {
    iconDef = (fas as any)[camelName];
  } else if (prefix === "fab") {
    iconDef = (fab as any)[camelName];
  }

  // Unknown icon: callers treat the empty string as "no icon".
  if (!iconDef) {
    return "";
  }

  const [iconWidth, iconHeight, , , iconPath] = iconDef.icon;
  // Duotone/dual-layer icons expose an array of path strings; use the primary layer.
  const pathData = Array.isArray(iconPath) ? iconPath[0] : iconPath;

  // FontAwesome paths are usually 512x512. `color` is caller-controlled — escape it.
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${iconWidth} ${iconHeight}" width="${width}" height="${height}">
    <path fill="${escapeXml(color)}" d="${pathData}" />
  </svg>`;
}
