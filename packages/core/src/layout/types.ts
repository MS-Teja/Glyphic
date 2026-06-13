export interface LayoutNode {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  shape: string;
  children?: LayoutNode[];
  metadata?: Record<string, any>;
  icon?: string;
}

export interface LayoutEdgeSegment {
  startPoint: { x: number; y: number };
  endPoint: { x: number; y: number };
  bendPoints?: { x: number; y: number }[];
}

export interface LayoutEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  sections: LayoutEdgeSegment[];
  style: string;
  arrow: string;
  metadata?: Record<string, any>;
  labelPosition?: { x: number; y: number };
}

export interface LayoutResult {
  width: number;
  height: number;
  nodes: LayoutNode[];
  edges: LayoutEdge[];
}
