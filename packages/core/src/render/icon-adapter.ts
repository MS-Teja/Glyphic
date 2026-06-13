import { fas } from "@fortawesome/free-solid-svg-icons";
import { fab } from "@fortawesome/free-brands-svg-icons";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";

// Ex: getIconSVG("fas-user", "#fff") or getIconSVG("fab-aws", "#000")
export function getIconSVG(iconName: string, color: string, width: number = 24, height: number = 24): string {
  let iconDef: IconDefinition | undefined;

  const parts = iconName.split("-");
  const prefix = parts[0];
  const name = parts.slice(1).join("-");

  // FontAwesome keys are camelCase (e.g. faUser, faAws)
  const camelName = "fa" + name.charAt(0).toUpperCase() + name.slice(1).replace(/-([a-z])/g, (g) => g[1].toUpperCase());

  if (prefix === "fas" || prefix === "fa") {
    iconDef = (fas as any)[camelName];
  } else if (prefix === "fab") {
    iconDef = (fab as any)[camelName];
  }

  if (!iconDef) {
    console.error("ICON NOT FOUND:", iconName, "CAMEL:", camelName, "HAS FAS:", !!fas, "KEYS IN FAS:", fas ? Object.keys(fas).length : 0);
    return "";
  }

  const [iconWidth, iconHeight, , , iconPath] = iconDef.icon;
  
  // FontAwesome paths are usually 512x512
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${iconWidth} ${iconHeight}" width="${width}" height="${height}">
    <path fill="${color}" d="${iconPath}" />
  </svg>`;
}
