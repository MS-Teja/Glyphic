export interface SceneRect {
  type: 'rect';
  filter?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rx?: number;
  ry?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  strokeDasharray?: string;
  opacity?: number;
}

export interface SceneCircle {
  type: 'circle';
  cx: number;
  cy: number;
  r: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  strokeDasharray?: string;
  opacity?: number;
}

export interface SceneEllipse {
  type: 'ellipse';
  filter?: string;
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  strokeDasharray?: string;
  opacity?: number;
}

export interface ScenePath {
  type: 'path';
  filter?: string;
  d: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  strokeDasharray?: string;
  markerEnd?: string;
  opacity?: number;
}

export interface ScenePolygon {
  type: 'polygon';
  filter?: string;
  points: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  strokeDasharray?: string;
  opacity?: number;
}

export interface SceneLine {
  type: 'line';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  stroke?: string;
  strokeWidth?: number;
  strokeDasharray?: string;
  opacity?: number;
}

export interface SceneText {
  type: 'text';
  x: number;
  y: number;
  content: string;
  textAnchor?: 'start' | 'middle' | 'end';
  dominantBaseline?: 'auto' | 'middle' | 'central' | 'hanging' | 'text-before-edge';
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string | number;
  fill?: string;
  style?: string; // used for paint-order etc.
}

export interface SceneGroup {
  type: 'group';
  children: SceneElement[];
  transform?: string;
  filter?: string;
}

export interface SceneRawSvg {
  type: 'raw-svg';
  svg: string;
  x?: number;
  y?: number;
}

export type SceneElement =
  | SceneRect
  | SceneCircle
  | SceneEllipse
  | ScenePath
  | ScenePolygon
  | SceneLine
  | SceneText
  | SceneGroup
  | SceneRawSvg;

export interface SceneGraph {
  width: number;
  height: number;
  elements: SceneElement[];
  defs?: string;
}
