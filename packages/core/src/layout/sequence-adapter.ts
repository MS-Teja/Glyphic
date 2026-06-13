import { SequenceDiagramType } from "@glyphic/schema";
import { LayoutResult, LayoutNode, LayoutEdge } from "./types.js";

// Basic heuristic for font width (Inter 14px/12px)
function estimateTextWidth(text: string, fontSize: number = 12): number {
  return text.length * (fontSize * 0.6);
}

// Custom grid-based layout calculator for sequence diagrams
// because ELK is not optimized for temporal participant-message flows.
export function layoutSequenceDiagram(diagram: SequenceDiagramType): LayoutResult {
  const PARTICIPANT_WIDTH = 120;
  const PARTICIPANT_HEIGHT = 60;
  const TOP_MARGIN = 50;
  const LEFT_MARGIN = 100;

  // 1. Measurement Phase
  let requiredSpacing = 150; // Minimum spacing

  const pIndexMap = new Map<string, number>();
  diagram.participants.forEach((p, idx) => pIndexMap.set(p.id, idx));

  diagram.messages.forEach(m => {
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
  });

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
      sections
    });

    currentY += 80 + messageHeight;
  });

  // 4. Create visual lifelines as vertical background edges
  diagram.participants.forEach(p => {
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
  });

  // Calculate total bounding box
  const width = LEFT_MARGIN + (diagram.participants.length * (PARTICIPANT_WIDTH + PARTICIPANT_SPACING)) + LEFT_MARGIN;
  const height = currentY + 40;

  return {
    width,
    height,
    nodes,
    edges
  };
}
