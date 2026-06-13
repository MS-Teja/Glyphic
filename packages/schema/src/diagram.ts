import { z } from "zod";

// Size caps — defense against resource-exhaustion via oversized payloads.
// Generous enough for real diagrams, small enough to bound layout/render cost.
const MAX_NODES = 1000;
const MAX_EDGES = 2000;
const MAX_PARTICIPANTS = 100;
const MAX_MESSAGES = 1000;
const MAX_SECTIONS = 100;
const MAX_TASKS = 1000;
const MAX_COMMITS = 1000;
const MAX_PIE_SLICES = 200;
const MAX_POINTS = 500;
const MAX_CANVAS_ELEMENTS = 5000;
const MAX_CANVAS_DEPTH = 20;
const MAX_CUSTOM_ICONS = 50;

const ThemeObject = z.object({
  background: z.string().max(64).optional().describe("Background color of the diagram (hex)"),
  nodeBackground: z.string().max(64).optional().describe("Default background color for nodes (hex)"),
  nodeBorder: z.string().max(64).optional().describe("Default border color for nodes (hex)"),
  nodeText: z.string().max(64).optional().describe("Default text color for nodes (hex)"),
  edgeColor: z.string().max(64).optional().describe("Color of the connecting edges/lines (hex)"),
  edgeLabelColor: z.string().max(64).optional().describe("Color of the text labels on edges (hex)"),
  fontFamily: z
    .string()
    .max(100)
    .regex(/^[a-zA-Z0-9 _-]+$/, "fontFamily may only contain letters, numbers, spaces, hyphens, and underscores")
    .optional()
    .describe("Google Font family name (e.g. 'Roboto', 'Fira Code')"),
  customFontUrl: z
    .string()
    .url()
    .max(500)
    .refine((u) => u.startsWith("https://"), "customFontUrl must be an https URL")
    .optional()
    .describe("HTTPS URL to a custom .ttf font file"),
  customIcons: z
    .record(z.string().max(20000))
    .refine((obj) => Object.keys(obj).length <= MAX_CUSTOM_ICONS, `At most ${MAX_CUSTOM_ICONS} custom icons are allowed`)
    .optional()
    .describe("Map of icon name to raw SVG string for custom brand icons")
});

export const ThemeConfig = z
  .union([z.enum(["light", "dark", "pastel", "mono"]), ThemeObject])
  .optional()
  .describe("A named preset ('light' | 'dark' | 'pastel' | 'mono') or a custom color theme object");

const BaseDiagram = z.object({
  title: z.string().max(500).optional().describe("A descriptive title for the diagram"),
  theme: ThemeConfig,
  exportFormat: z.array(z.enum(["png", "svg", "react-flow"])).default(["png"]).describe("Requested export formats (png, svg, react-flow)"),
});

export const NodeEdgeDiagram = BaseDiagram.extend({
  type: z.enum(["flowchart", "architecture"]).describe("The type of diagram to generate"),
  direction: z.enum(["TB", "BT", "LR", "RL"]).default("TB").describe("Layout direction: Top-Bottom, Bottom-Top, Left-Right, Right-Left"),
  routing: z.enum(["orthogonal", "polyline", "splines"]).default("orthogonal").describe("Edge routing style: orthogonal (bends), polyline (straight lines), splines (curves)"),
  nodes: z.array(z.object({
    id: z.string().regex(/^[a-zA-Z0-9_-]+$/).describe("Unique identifier (alphanumeric, no spaces)"),
    label: z.string().describe("Text displayed on the node (keep it concise)"),
    shape: z.enum(["rectangle", "rounded", "cylinder", "cloud", "diamond", "hexagon", "person", "database", "service", "table", "class", "state_start", "state_end"]).default("rectangle"),
    groupId: z.string().optional().describe("If this node is inside a boundary/group (like a VPC), put the parent group node's ID here"),
    icon: z.string().optional().describe("Optional identifier for a brand or tech icon (e.g., 'aws-lambda', 'react', or FontAwesome 'fas-user')"),
    x: z.number().optional().describe("Explicit X coordinate (bypasses auto-layout if provided)"),
    y: z.number().optional().describe("Explicit Y coordinate (bypasses auto-layout if provided)"),
    width: z.number().optional().describe("Explicit width"),
    height: z.number().optional().describe("Explicit height"),
    metadata: z.record(z.any()).optional().describe("Additional structured data, such as 'fields' for tables or 'methods'/'attributes' for classes")
  })).min(1).max(MAX_NODES),
  edges: z.array(z.object({
    source: z.string().describe("ID of the source node"),
    target: z.string().describe("ID of the target node"),
    label: z.string().optional().describe("Optional text label on the edge"),
    style: z.enum(["solid", "dashed", "dotted"]).default("solid"),
    arrow: z.enum([
      "forward", "back", "both", "none", "open",
      "inheritance", "composition", "aggregation", "dependency",
      "crow", "crow-one", "crow-zero-many", "zero-one", "one-one"
    ]).default("forward"),
    metadata: z.record(z.any()).optional().describe("Additional structured data, such as 'labelPosition'")
  })).max(MAX_EDGES).default([]),
});

export const SequenceDiagram = BaseDiagram.extend({
  type: z.literal("sequence"),
  participants: z.array(z.object({
    id: z.string().regex(/^[a-zA-Z0-9_-]+$/).describe("Unique identifier"),
    label: z.string().describe("Display name of the actor or system"),
    shape: z.enum(["actor", "service", "database"]).default("service")
  })).min(2).max(MAX_PARTICIPANTS),
  messages: z.array(z.object({
    source: z.string().describe("ID of the participant sending the message (can be same as target for self-messages)"),
    target: z.string().describe("ID of the participant receiving the message"),
    label: z.string().describe("Description of the API call or action"),
    type: z.enum(["sync", "async", "return"]).default("sync").describe("Sync (solid line), async (solid line, open arrow), or return (dashed line)")
  })).min(1).max(MAX_MESSAGES).describe("Ordered list of messages in chronological sequence"),
});

export const PieChart = BaseDiagram.extend({
  type: z.literal("pie"),
  title: z.string().optional().describe("Title of the pie chart"),
  width: z.number().optional().describe("Total width of the canvas (e.g. 800)"),
  height: z.number().optional().describe("Total height of the canvas (e.g. 600)"),
  cx: z.number().optional().describe("X coordinate of the pie center (e.g. 400)"),
  cy: z.number().optional().describe("Y coordinate of the pie center (e.g. 300)"),
  radius: z.number().optional().describe("Radius of the pie chart (e.g. 200)"),
  data: z.array(z.object({
    label: z.string().describe("Label for the pie slice"),
    value: z.number().min(0).describe("Percentage value (e.g. 50 for 50%)"),
    color: z.string().optional().describe("Custom hex color for the slice (e.g. #ec4899)"),
    explode: z.number().optional().describe("Offset radius to explode the slice outwards (e.g. 20)")
  })).min(1).max(MAX_PIE_SLICES).describe("Data points for the pie chart. Total values should equal 100."),
});

export const QuadrantChart = BaseDiagram.extend({
  type: z.literal("quadrant"),
  title: z.string().optional().describe("Title of the quadrant chart"),
  xAxis: z.object({
    left: z.string().describe("Label for the left side of X axis"),
    right: z.string().describe("Label for the right side of X axis")
  }),
  yAxis: z.object({
    bottom: z.string().describe("Label for the bottom side of Y axis"),
    top: z.string().describe("Label for the top side of Y axis")
  }),
  points: z.array(z.object({
    label: z.string().describe("Label of the data point"),
    x: z.number().min(0).max(1).describe("X coordinate (0.0 to 1.0)"),
    y: z.number().min(0).max(1).describe("Y coordinate (0.0 to 1.0)")
  })).min(1).max(MAX_POINTS).describe("Data points plotted on the quadrant")
});

export const Mindmap = BaseDiagram.extend({
  type: z.literal("mindmap"),
  nodes: z.array(z.object({
    id: z.string().regex(/^[a-zA-Z0-9_-]+$/),
    label: z.string(),
    icon: z.string().optional(),
    shape: z.enum(["rectangle", "rounded", "cloud"]).default("rounded")
  })).min(1).max(MAX_NODES),
  edges: z.array(z.object({
    source: z.string(),
    target: z.string(),
    label: z.string().optional()
  })).max(MAX_EDGES).default([])
});

export const GanttChart = BaseDiagram.extend({
  type: z.literal("gantt"),
  title: z.string().optional(),
  dateFormat: z.string().optional().describe("Format of the dates, or 'generic' for numeric units"),
  sections: z.array(z.object({
    id: z.string().optional(),
    label: z.string().describe("Name of the section (e.g., 'Planning', 'Development')"),
    tasks: z.array(z.object({
      id: z.string().regex(/^[a-zA-Z0-9_-]+$/),
      label: z.string(),
      start: z.union([z.string(), z.number()]).describe("Start date or generic numeric value"),
      end: z.union([z.string(), z.number()]).optional().describe("End date or generic numeric value"),
      duration: z.number().optional().describe("Duration if end is not provided"),
      dependencies: z.array(z.string()).optional().describe("Array of task IDs that must finish before this starts")
    }).refine((t) => t.end !== undefined || t.duration !== undefined, {
      message: "Each task must have either 'end' or 'duration'",
      path: ["end"],
    })).max(MAX_TASKS)
  })).min(1).max(MAX_SECTIONS)
});

export const SankeyDiagram = BaseDiagram.extend({
  type: z.literal("sankey"),
  nodes: z.array(z.object({
    id: z.string().regex(/^[a-zA-Z0-9_-]+$/),
    label: z.string().optional(),
    color: z.string().optional()
  })).min(2).max(MAX_NODES),
  edges: z.array(z.object({
    source: z.string(),
    target: z.string(),
    value: z.number().min(0).describe("Weight/Thickness of the flow")
  })).min(1).max(MAX_EDGES)
});

export const GitGraph = BaseDiagram.extend({
  type: z.literal("git"),
  commits: z.array(z.object({
    id: z.string().regex(/^[a-zA-Z0-9_-]+$/),
    message: z.string().optional(),
    branch: z.string().describe("Name of the branch this commit belongs to"),
    parents: z.array(z.string()).optional().describe("Array of parent commit IDs. 2 parents indicate a merge."),
    tag: z.string().optional()
  })).min(1).max(MAX_COMMITS)
});

const CanvasRect = z.object({
  type: z.literal("rect"), x: z.number(), y: z.number(), width: z.number(), height: z.number(),
  rx: z.number().optional(), ry: z.number().optional(), fill: z.string().optional(),
  stroke: z.string().optional(), strokeWidth: z.number().optional(), opacity: z.number().optional()
});

const CanvasCircle = z.object({
  type: z.literal("circle"), cx: z.number(), cy: z.number(), r: z.number(),
  fill: z.string().optional(), stroke: z.string().optional(), strokeWidth: z.number().optional(), opacity: z.number().optional()
});

const CanvasEllipse = z.object({
  type: z.literal("ellipse"), cx: z.number(), cy: z.number(), rx: z.number(), ry: z.number(),
  fill: z.string().optional(), stroke: z.string().optional(), strokeWidth: z.number().optional(), opacity: z.number().optional()
});

const CanvasPath = z.object({
  type: z.literal("path"), d: z.string(),
  fill: z.string().optional(), stroke: z.string().optional(), strokeWidth: z.number().optional(),
  strokeDasharray: z.string().optional(), markerEnd: z.string().optional(), opacity: z.number().optional()
});

const CanvasPolygon = z.object({
  type: z.literal("polygon"), points: z.string(),
  fill: z.string().optional(), stroke: z.string().optional(), strokeWidth: z.number().optional(), opacity: z.number().optional()
});

const CanvasLine = z.object({
  type: z.literal("line"), x1: z.number(), y1: z.number(), x2: z.number(), y2: z.number(),
  stroke: z.string().optional(), strokeWidth: z.number().optional(), strokeDasharray: z.string().optional(), opacity: z.number().optional()
});

const CanvasText = z.object({
  type: z.literal("text"), x: z.number(), y: z.number(), content: z.string(),
  textAnchor: z.enum(["start", "middle", "end"]).optional(),
  dominantBaseline: z.enum(["auto", "middle", "central", "hanging", "text-before-edge"]).optional(),
  fontFamily: z.string().optional(), fontSize: z.number().optional(), fontWeight: z.union([z.string(), z.number()]).optional(),
  fill: z.string().optional(), style: z.string().optional()
});

const CanvasRawSvg = z.object({
  type: z.literal("raw-svg"), svg: z.string(), x: z.number().optional(), y: z.number().optional()
});

export const CanvasElement: z.ZodType<any> = z.lazy(() =>
  z.discriminatedUnion("type", [
    CanvasRect, CanvasCircle, CanvasEllipse, CanvasPath, CanvasPolygon, CanvasLine, CanvasText, CanvasRawSvg,
    z.object({
      type: z.literal("group"),
      children: z.array(CanvasElement),
      transform: z.string().optional()
    })
  ])
);

// Bound recursion depth and total element count for canvas trees.
function canvasWithinLimits(elements: any[]): boolean {
  let count = 0;
  const walk = (els: any[], depth: number): boolean => {
    if (depth > MAX_CANVAS_DEPTH) return false;
    for (const el of els) {
      if (++count > MAX_CANVAS_ELEMENTS) return false;
      if (el && el.type === "group" && Array.isArray(el.children)) {
        if (!walk(el.children, depth + 1)) return false;
      }
    }
    return true;
  };
  return walk(elements, 1);
}

export const CanvasDiagram = BaseDiagram.extend({
  type: z.literal("canvas"),
  width: z.number().describe("Canvas width"),
  height: z.number().describe("Canvas height"),
  elements: z.array(CanvasElement)
    .refine(canvasWithinLimits, `Canvas exceeds element (${MAX_CANVAS_ELEMENTS}) or nesting depth (${MAX_CANVAS_DEPTH}) limits`)
    .describe("List of elements to draw")
});

export const StateDiagram = BaseDiagram.extend({
  type: z.literal("state"),
  direction: z.enum(["TB", "BT", "LR", "RL"]).default("TB").describe("Layout direction"),
  states: z.array(z.object({
    id: z.string().regex(/^[a-zA-Z0-9_-]+$/),
    label: z.string().optional().describe("Display label (defaults to id)"),
    kind: z.enum(["state", "initial", "final", "composite"]).default("state").describe("initial = start dot, final = end dot, composite = nested container"),
    parent: z.string().optional().describe("id of the composite state this nests inside")
  })).min(1).max(MAX_NODES),
  transitions: z.array(z.object({
    from: z.string().describe("source state id"),
    to: z.string().describe("target state id"),
    label: z.string().optional().describe("event/guard label")
  })).max(MAX_EDGES).default([])
});

export const ErdDiagram = BaseDiagram.extend({
  type: z.literal("erd"),
  direction: z.enum(["TB", "BT", "LR", "RL"]).default("LR").describe("Layout direction"),
  entities: z.array(z.object({
    id: z.string().regex(/^[a-zA-Z0-9_-]+$/),
    label: z.string().optional().describe("Entity/table name (defaults to id)"),
    color: z.string().optional(),
    attributes: z.array(z.object({
      name: z.string(),
      type: z.string().optional().describe("e.g. 'uuid', 'varchar(255)'"),
      key: z.enum(["PK", "FK"]).optional().describe("Primary or foreign key")
    })).max(100).optional()
  })).min(1).max(MAX_NODES),
  relationships: z.array(z.object({
    from: z.string(),
    to: z.string(),
    label: z.string().optional(),
    cardinality: z.enum(["one-to-one", "one-to-many", "many-to-one", "many-to-many", "zero-or-one", "zero-or-many"]).optional().describe("Crow's-foot cardinality")
  })).max(MAX_EDGES).default([])
});

export const ClassDiagram = BaseDiagram.extend({
  type: z.literal("class"),
  direction: z.enum(["TB", "BT", "LR", "RL"]).default("TB").describe("Layout direction"),
  classes: z.array(z.object({
    id: z.string().regex(/^[a-zA-Z0-9_-]+$/),
    label: z.string().optional().describe("Class name (defaults to id)"),
    color: z.string().optional(),
    attributes: z.array(z.string()).max(100).optional().describe("e.g. '+ name: string'"),
    methods: z.array(z.string()).max(100).optional().describe("e.g. '+ getName(): string'")
  })).min(1).max(MAX_NODES),
  relationships: z.array(z.object({
    from: z.string(),
    to: z.string(),
    label: z.string().optional(),
    type: z.enum(["association", "inheritance", "extends", "implements", "composition", "aggregation", "dependency"]).optional().describe("UML relationship kind")
  })).max(MAX_EDGES).default([])
});

export const DiagramInput = z.discriminatedUnion("type", [NodeEdgeDiagram, SequenceDiagram, PieChart, QuadrantChart, Mindmap, GanttChart, SankeyDiagram, GitGraph, CanvasDiagram, StateDiagram, ErdDiagram, ClassDiagram]);

export type DiagramInputType = z.infer<typeof DiagramInput>;
export type NodeEdgeDiagramType = z.infer<typeof NodeEdgeDiagram>;
export type SequenceDiagramType = z.infer<typeof SequenceDiagram>;
export type PieChartType = z.infer<typeof PieChart>;
export type QuadrantChartType = z.infer<typeof QuadrantChart>;
export type MindmapType = z.infer<typeof Mindmap>;
export type GanttChartType = z.infer<typeof GanttChart>;
export type SankeyDiagramType = z.infer<typeof SankeyDiagram>;
export type GitGraphType = z.infer<typeof GitGraph>;
export type CanvasDiagramType = z.infer<typeof CanvasDiagram>;
export type StateDiagramType = z.infer<typeof StateDiagram>;
export type ErdDiagramType = z.infer<typeof ErdDiagram>;
export type ClassDiagramType = z.infer<typeof ClassDiagram>;
