import type { SequenceDiagramType } from "@glyphicjs/schema";
import type { LayoutResult, LayoutNode, LayoutEdge } from "./types.js";
import { unknownIdError } from "./validation.js";
import { measureTextWidth, wrapSequenceLabel, SEQ_LABEL_LINE_HEIGHT, SEQ_LABEL_PAD } from "../text-metrics.js";

// Proportional font-width estimate (Inter).
function estimateTextWidth(text: string, fontSize = 12): number {
  return measureTextWidth(text, fontSize);
}

const clamp = (v: number, min: number, max: number): number => Math.max(min, Math.min(max, v));

// Custom grid-based layout calculator for sequence diagrams
// because ELK is not optimized for temporal participant-message flows.
export function layoutSequenceDiagram(diagram: SequenceDiagramType): LayoutResult {
  const PARTICIPANT_WIDTH = 120;
  const PARTICIPANT_HEIGHT = 60;
  const TOP_MARGIN = 50;
  const LEFT_MARGIN = 100;

  // Label wrapping / row sizing. Wrap width is the message's span minus padding,
  // clamped so a tiny span still fits a couple of words and a huge one doesn't
  // stretch a label into one unreadable line. Row height = ROW_BASE + lines, with
  // a floor so single-line rows aren't cramped.
  const MIN_LABEL_WIDTH = 90;
  const MAX_LABEL_WIDTH = 260;
  const SELF_MSG_LABEL_WIDTH = 120; // self-messages span nothing; give the loop a fixed budget
  const ROW_BASE = 42;
  const MIN_ROW_GAP = 56;

  // 1. Measurement Phase
  let requiredSpacing = 150; // Minimum spacing

  const pIndexMap = new Map<string, number>();
  diagram.participants.forEach((p, idx) => pIndexMap.set(p.id, idx));

  // Fail fast if a message references a participant that doesn't exist,
  // rather than silently drawing the message from the origin (0,0).
  diagram.messages.forEach((m, idx) => {
    if (!pIndexMap.has(m.source))
      throw unknownIdError({ kind: "Sequence message", index: idx, field: "source", badId: m.source, knownIds: pIndexMap.keys(), noun: "participant" });
    if (!pIndexMap.has(m.target))
      throw unknownIdError({ kind: "Sequence message", index: idx, field: "target", badId: m.target, knownIds: pIndexMap.keys(), noun: "participant" });
  });

  for (const m of diagram.messages) {
    const sIdx = pIndexMap.get(m.source);
    const tIdx = pIndexMap.get(m.target);
    if (sIdx !== undefined && tIdx !== undefined && sIdx !== tIdx) {
      const distance = Math.abs(tIdx - sIdx);
      const textWidth = estimateTextWidth(m.label, 12) + 40; // 40px padding
      const spacingNeeded = (textWidth - PARTICIPANT_WIDTH) / distance;
      if (spacingNeeded > requiredSpacing) {
        requiredSpacing = spacingNeeded;
      }
    }
  }

  const PARTICIPANT_SPACING = requiredSpacing;

  const nodes: LayoutNode[] = [];
  const participantXMap = new Map<string, number>();

  // 2. Layout participants horizontally
  diagram.participants.forEach((p, idx) => {
    const x = LEFT_MARGIN + idx * (PARTICIPANT_WIDTH + PARTICIPANT_SPACING);
    const y = TOP_MARGIN;
    nodes.push({
      id: p.id,
      x,
      y,
      width: PARTICIPANT_WIDTH,
      height: PARTICIPANT_HEIGHT,
      label: p.label,
      shape: p.shape
    });
    participantXMap.set(p.id, x + PARTICIPANT_WIDTH / 2); // Store center X for lifelines
  });

  const edges: LayoutEdge[] = [];
  
  let currentY = TOP_MARGIN + PARTICIPANT_HEIGHT + 80;

  // 3. Layout messages vertically
  diagram.messages.forEach((m, idx) => {
    const sourceX = participantXMap.get(m.source) || 0;
    const targetX = participantXMap.get(m.target) || 0;

    // Self-messages need more vertical space to loop around
    const isSelfMessage = m.source === m.target;
    const messageHeight = isSelfMessage ? 40 : 0;

    // Wrap the label to the room this message actually spans, then size its row
    // from the resulting line count. The renderer wraps with the same helper and
    // the same budget (passed via metadata.labelMaxWidth) so what we measure is
    // exactly what gets drawn. Self-messages span nothing, so give them a fixed
    // budget rather than a zero one.
    const span = isSelfMessage ? SELF_MSG_LABEL_WIDTH : Math.abs(targetX - sourceX);
    const labelMaxWidth = clamp(span - SEQ_LABEL_PAD, MIN_LABEL_WIDTH, MAX_LABEL_WIDTH);
    const lineCount = m.label ? wrapSequenceLabel(m.label, labelMaxWidth).length : 1;

    const sections = isSelfMessage ? [
      {
        startPoint: { x: sourceX, y: currentY },
        bendPoints: [
          { x: sourceX + 60, y: currentY },
          { x: sourceX + 60, y: currentY + 30 }
        ],
        endPoint: { x: targetX, y: currentY + 30 }
      }
    ] : [
      {
        startPoint: { x: sourceX, y: currentY },
        endPoint: { x: targetX, y: currentY }
      }
    ];

    edges.push({
      id: `msg-${idx}`,
      source: m.source,
      target: m.target,
      label: m.label,
      style: m.type === "return" ? "dashed" : "solid",
      arrow: m.type === "async" ? "open" : "forward",
      sections,
      metadata: { labelMaxWidth }
    });

    // Row height scales with the label: a single line tightens the old flat 80px
    // gap, multi-line labels get the room they need instead of crowding.
    const rowGap = Math.max(MIN_ROW_GAP, ROW_BASE + lineCount * SEQ_LABEL_LINE_HEIGHT);
    currentY += rowGap + messageHeight;
  });

  // 4. Create visual lifelines as vertical background edges
  for (const p of diagram.participants) {
    const pX = participantXMap.get(p.id) || 0;
    edges.unshift({
      id: `lifeline-${p.id}`,
      source: p.id,
      target: p.id,
      label: "",
      style: "dashed",
      arrow: "none",
      sections: [{
        startPoint: { x: pX, y: TOP_MARGIN + PARTICIPANT_HEIGHT },
        endPoint: { x: pX, y: currentY }
      }]
    });
  }

  // Calculate total bounding box. The right margin mirrors LEFT_MARGIN so the
  // participants are centered (the previous formula left a full column of extra
  // space on the right, making diagrams lean left).
  const lastParticipantRight =
    LEFT_MARGIN + (diagram.participants.length - 1) * (PARTICIPANT_WIDTH + PARTICIPANT_SPACING) + PARTICIPANT_WIDTH;
  const width = lastParticipantRight + LEFT_MARGIN;
  const height = currentY + 40;

  return {
    width,
    height,
    nodes,
    edges
  };
}
