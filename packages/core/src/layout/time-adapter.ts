import { GanttChartType } from "@glyphicjs/schema";
import { LayoutResult, LayoutNode, LayoutEdge } from "./types.js";

function parseUnit(val: string | number): number {
  if (typeof val === "number") return val;
  const num = Number(val);
  if (!isNaN(num)) return num;
  const d = new Date(val).getTime();
  if (!isNaN(d)) return d;
  return 0;
}

export function layoutGanttChart(diagram: GanttChartType): LayoutResult {
  const nodes: LayoutNode[] = [];
  const edges: LayoutEdge[] = [];

  const rowHeight = 40;
  const sectionGap = 20;
  let currentY = 80; // Start below title and timeline axis

  // 1. Calculate min and max time bounds
  let minTime = Infinity;
  let maxTime = -Infinity;

  const parsedTasks: any[] = [];
  const parsedTaskMap = new Map<string, any>();

  for (const section of diagram.sections) {
    for (const t of section.tasks) {
      const start = parseUnit(t.start);
      let end = start;
      if (t.end !== undefined) {
        end = parseUnit(t.end);
      } else if (t.duration !== undefined) {
        end = start + parseUnit(t.duration);
      } else {
        end = start + 1; // Default duration of 1 unit
      }

      if (start < minTime) minTime = start;
      if (end > maxTime) maxTime = end;

      const parsed = { ...t, parsedStart: start, parsedEnd: end, sectionId: section.id || section.label };
      parsedTasks.push(parsed);
      parsedTaskMap.set(t.id, parsed);
    }
  }

  if (minTime === Infinity) {
    minTime = 0;
    maxTime = 100;
  }

  // 2. Setup grid bounds
  const canvasWidth = 1000;
  const leftMargin = 200; // For section/task labels
  const rightMargin = 50;
  const timelineWidth = canvasWidth - leftMargin - rightMargin;
  
  const timeSpan = maxTime - minTime || 1;
  const scale = timelineWidth / timeSpan;

  // Add grid config node
  nodes.push({
    id: "gantt_config",
    x: 0, y: 0, width: 0, height: 0,
    label: "", shape: "gantt_config",
    metadata: {
      minTime, maxTime, scale, leftMargin, rightMargin, timelineWidth,
      title: diagram.title, dateFormat: diagram.dateFormat || "generic"
    }
  });

  // 3. Layout rows
  const taskMap = new Map<string, LayoutNode>();

  for (const section of diagram.sections) {
    // Section Header
    nodes.push({
      id: `section_${section.label}`,
      x: 10,
      y: currentY,
      width: leftMargin - 20,
      height: rowHeight,
      label: section.label,
      shape: "gantt_section"
    });
    currentY += rowHeight;

    for (const t of section.tasks) {
      const parsed = parsedTaskMap.get(t.id);
      const startX = leftMargin + (parsed.parsedStart - minTime) * scale;
      const width = (parsed.parsedEnd - parsed.parsedStart) * scale;

      const node: LayoutNode = {
        id: t.id,
        x: startX,
        y: currentY,
        width: Math.max(width, 5), // At least 5px wide
        height: rowHeight * 0.7, // Padding inside row
        label: t.label,
        shape: "gantt_task",
        metadata: {
          start: parsed.parsedStart,
          end: parsed.parsedEnd,
          rowY: currentY
        }
      };
      nodes.push(node);
      taskMap.set(t.id, node);

      // Label Node for the left sidebar
      nodes.push({
        id: `label_${t.id}`,
        x: 20,
        y: currentY,
        width: leftMargin - 30,
        height: rowHeight,
        label: t.label,
        shape: "gantt_task_label"
      });

      currentY += rowHeight;
    }
    currentY += sectionGap;
  }

  // 4. Calculate dependencies (edges)
  for (const t of parsedTasks) {
    if (t.dependencies && t.dependencies.length > 0) {
      for (const depId of t.dependencies) {
        const sourceNode = taskMap.get(depId);
        const targetNode = taskMap.get(t.id);
        if (sourceNode && targetNode) {
          edges.push({
            id: `dep_${depId}_${t.id}`,
            source: depId,
            target: t.id,
            style: "solid",
            arrow: "forward",
            sections: [{
              startPoint: { x: sourceNode.x + sourceNode.width, y: sourceNode.y + sourceNode.height / 2 },
              endPoint: { x: targetNode.x, y: targetNode.y + targetNode.height / 2 },
              bendPoints: [
                { x: sourceNode.x + sourceNode.width + 10, y: sourceNode.y + sourceNode.height / 2 },
                { x: targetNode.x - 10, y: targetNode.y + targetNode.height / 2 }
              ]
            }]
          });
        }
      }
    }
  }

  return {
    width: canvasWidth,
    height: currentY + 40,
    nodes,
    edges
  };
}
