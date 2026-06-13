import { TimelineDiagramType, JourneyDiagramType } from "@glyphic/schema";
import { LayoutResult, LayoutNode } from "./types.js";

const COL_W = 260;
const COL_GAP = 30;
const HEADER_H = 50;
const LEFT = 40;

// Timeline: each period is a column with a header and a stack of event cards.
export function layoutTimeline(diagram: TimelineDiagramType): LayoutResult {
  const cardH = 70;
  const cardGap = 14;
  const top = diagram.title ? 90 : 40;
  const nodes: LayoutNode[] = [];
  let maxEvents = 0;

  diagram.periods.forEach((p, i) => {
    const x = LEFT + i * (COL_W + COL_GAP);
    nodes.push({ id: `period_${i}`, x, y: top, width: COL_W, height: HEADER_H, label: p.label, shape: "timeline_period", metadata: { idx: i } });
    p.events.forEach((ev, j) => {
      nodes.push({ id: `event_${i}_${j}`, x, y: top + HEADER_H + 24 + j * (cardH + cardGap), width: COL_W, height: cardH, label: ev, shape: "timeline_event", metadata: { idx: i } });
    });
    maxEvents = Math.max(maxEvents, p.events.length);
  });

  const width = LEFT * 2 + diagram.periods.length * (COL_W + COL_GAP) - COL_GAP;
  const height = top + HEADER_H + 24 + maxEvents * (cardH + cardGap) + 30;
  nodes.unshift({ id: "chrono_config", x: 0, y: 0, width: 0, height: 0, label: diagram.title ?? "", shape: "chrono_config", metadata: { title: diagram.title } });
  return { width, height, nodes, edges: [] };
}

// Journey: each section is a column of task cards tinted by satisfaction score.
export function layoutJourney(diagram: JourneyDiagramType): LayoutResult {
  const cardH = 96;
  const cardGap = 14;
  const top = diagram.title ? 90 : 40;
  const nodes: LayoutNode[] = [];
  let maxTasks = 0;

  diagram.sections.forEach((s, i) => {
    const x = LEFT + i * (COL_W + COL_GAP);
    nodes.push({ id: `section_${i}`, x, y: top, width: COL_W, height: HEADER_H, label: s.label, shape: "journey_section", metadata: { idx: i } });
    s.tasks.forEach((t, j) => {
      nodes.push({
        id: `task_${i}_${j}`,
        x,
        y: top + HEADER_H + 24 + j * (cardH + cardGap),
        width: COL_W,
        height: cardH,
        label: t.label,
        shape: "journey_task",
        metadata: { idx: i, score: t.score, actors: t.actors ?? [] }
      });
    });
    maxTasks = Math.max(maxTasks, s.tasks.length);
  });

  const width = LEFT * 2 + diagram.sections.length * (COL_W + COL_GAP) - COL_GAP;
  const height = top + HEADER_H + 24 + maxTasks * (cardH + cardGap) + 30;
  nodes.unshift({ id: "chrono_config", x: 0, y: 0, width: 0, height: 0, label: diagram.title ?? "", shape: "chrono_config", metadata: { title: diagram.title } });
  return { width, height, nodes, edges: [] };
}
