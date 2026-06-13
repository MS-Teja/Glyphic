import { z } from "zod";

export const ThemeConfig = z.object({
  background: z.string().optional().describe("Background color of the diagram (hex)"),
  nodeBackground: z.string().optional().describe("Default background color for nodes (hex)"),
  nodeBorder: z.string().optional().describe("Default border color for nodes (hex)"),
  nodeText: z.string().optional().describe("Default text color for nodes (hex)"),
  edgeColor: z.string().optional().describe("Color of the connecting edges/lines (hex)"),
  edgeLabelColor: z.string().optional().describe("Color of the text labels on edges (hex)"),
  fontFamily: z.string().optional().describe("Google Font family name (e.g. 'Roboto', 'Fira Code')"),
  customFontUrl: z.string().optional().describe("URL to a custom .ttf font file"),
  customIcons: z.record(z.string()).optional().describe("Map of icon name to raw SVG string for custom brand icons")
}).optional().describe("Optional custom color theme for the diagram");

const BaseDiagram = z.object({
  title: z.string().optional().describe("A descriptive title for the diagram"),
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
  })).min(1),
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
  })).default([]),
});

export const SequenceDiagram = BaseDiagram.extend({
  type: z.literal("sequence"),
  participants: z.array(z.object({
    id: z.string().regex(/^[a-zA-Z0-9_-]+$/).describe("Unique identifier"),
    label: z.string().describe("Display name of the actor or system"),
    shape: z.enum(["actor", "service", "database"]).default("service")
  })).min(2),
  messages: z.array(z.object({
    source: z.string().describe("ID of the participant sending the message (can be same as target for self-messages)"),
    target: z.string().describe("ID of the participant receiving the message"),
    label: z.string().describe("Description of the API call or action"),
    type: z.enum(["sync", "async", "return"]).default("sync").describe("Sync (solid line), async (solid line, open arrow), or return (dashed line)")
  })).min(1).describe("Ordered list of messages in chronological sequence"),
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
    value: z.number().describe("Percentage value (e.g. 50 for 50%)"),
    color: z.string().optional().describe("Custom hex color for the slice (e.g. #ec4899)"),
    explode: z.number().optional().describe("Offset radius to explode the slice outwards (e.g. 20)")
  })).min(1).describe("Data points for the pie chart. Total values should equal 100."),
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
  })).describe("Data points plotted on the quadrant")
});

export const Mindmap = BaseDiagram.extend({
  type: z.literal("mindmap"),
  nodes: z.array(z.object({
    id: z.string().regex(/^[a-zA-Z0-9_-]+$/),
    label: z.string(),
    icon: z.string().optional(),
    shape: z.enum(["rectangle", "rounded", "cloud"]).default("rounded")
  })).min(1),
  edges: z.array(z.object({
    source: z.string(),
    target: z.string(),
    label: z.string().optional()
  })).default([])
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
    }))
  })).min(1)
});

export const SankeyDiagram = BaseDiagram.extend({
  type: z.literal("sankey"),
  nodes: z.array(z.object({
    id: z.string().regex(/^[a-zA-Z0-9_-]+$/),
    label: z.string().optional(),
    color: z.string().optional()
  })).min(2),
  edges: z.array(z.object({
    source: z.string(),
    target: z.string(),
    value: z.number().min(0).describe("Weight/Thickness of the flow")
  })).min(1)
});

export const GitGraph = BaseDiagram.extend({
  type: z.literal("git"),
  commits: z.array(z.object({
    id: z.string().regex(/^[a-zA-Z0-9_-]+$/),
    message: z.string().optional(),
    branch: z.string().describe("Name of the branch this commit belongs to"),
    parents: z.array(z.string()).optional().describe("Array of parent commit IDs. 2 parents indicate a merge."),
    tag: z.string().optional()
  })).min(1)
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

export const CanvasDiagram = BaseDiagram.extend({
  type: z.literal("canvas"),
  width: z.number().describe("Canvas width"),
  height: z.number().describe("Canvas height"),
  elements: z.array(CanvasElement).describe("List of elements to draw")
});

export const DiagramInput = z.discriminatedUnion("type", [NodeEdgeDiagram, SequenceDiagram, PieChart, QuadrantChart, Mindmap, GanttChart, SankeyDiagram, GitGraph, CanvasDiagram]);

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
