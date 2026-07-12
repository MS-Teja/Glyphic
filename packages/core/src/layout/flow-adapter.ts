import { SankeyDiagramType, GitGraphType } from "@glyphicjs/schema";
import { LayoutResult, LayoutNode, LayoutEdge } from "./types.js";

import { sankey, sankeyCenter } from "d3-sankey";

export function layoutSankeyDiagram(diagram: SankeyDiagramType): LayoutResult {
  const width = 1000;
  const height = 600;

  // Use d3-sankey
  const sankeyLayout = sankey<any, any>()
    .nodeId((d: any) => d.id)
    .nodeWidth(40)
    .nodePadding(30)
    .nodeAlign(sankeyCenter)
    .extent([[50, 50], [width - 50, height - 50]]);

  // Fail fast on links referencing unknown nodes; d3-sankey otherwise throws a
  // cryptic `missing: <id>` from deep inside its graph builder.
  const nodeIdSet = new Set(diagram.nodes.map((n) => n.id));
  diagram.edges.forEach((e, idx) => {
    if (!nodeIdSet.has(e.source)) throw new Error(`Link #${idx} references unknown source node "${e.source}"`);
    if (!nodeIdSet.has(e.target)) throw new Error(`Link #${idx} references unknown target node "${e.target}"`);
  });

  const graph = {
    nodes: diagram.nodes.map(n => ({ id: n.id, label: n.label, color: n.color })),
    links: diagram.edges.map(e => ({ source: e.source, target: e.target, value: e.value }))
  };

  const { nodes: snodes, links: slinks } = sankeyLayout(graph);

  const outNodes: LayoutNode[] = snodes.map((n: any) => ({
    id: n.id,
    x: n.x0,
    y: n.y0,
    width: n.x1 - n.x0,
    height: n.y1 - n.y0,
    label: n.label || n.id,
    shape: "sankey_node",
    metadata: { color: n.color, weight: n.value }
  }));

  const outEdges: LayoutEdge[] = slinks.map((l: any, idx: number) => ({
    id: `e_${l.source.id}_${l.target.id}_${idx}`,
    source: l.source.id,
    target: l.target.id,
    style: "solid",
    arrow: "none",
    sections: [],
    metadata: {
      value: l.value,
      y0: l.y0, // Start vertical center
      y1: l.y1, // End vertical center
      width: l.width // Thickness
    }
  }));

  return { width, height, nodes: outNodes, edges: outEdges };
}

export function layoutGitGraph(diagram: GitGraphType): LayoutResult {
  const nodes: LayoutNode[] = [];
  const edges: LayoutEdge[] = [];
  
  const rowHeight = 60;
  const colWidth = 160;

  // Track branches to assign them specific Y lanes
  const branches = Array.from(new Set(diagram.commits.map(c => c.branch)));
  const lastCommitByBranch = new Map<string, string>();
  
  const width = Math.max(800, diagram.commits.length * colWidth + 100);
  const height = Math.max(400, branches.length * rowHeight + 100);

  // Nodes are just commits placed at X=index, Y=branch_index
  diagram.commits.forEach((c, idx) => {
    const laneIndex = branches.indexOf(c.branch);
    
    nodes.push({
      id: c.id,
      x: 50 + idx * colWidth,
      y: 50 + laneIndex * rowHeight,
      width: 20, // Circle radius = 10
      height: 20,
      label: c.message || c.id,
      shape: "git_commit",
      metadata: {
        branch: c.branch,
        laneIndex,
        tag: c.tag,
        alternateLabel: idx % 2 === 0
      }
    });

    // Draw edges from parents TO this commit
    if (c.parents) {
      c.parents.forEach(p => {
        edges.push({
          id: `git_${p}_${c.id}`,
          source: p,
          target: c.id,
          style: "solid",
          arrow: "forward",
          sections: [] // Handled by git renderer
        });
      });
    } else {
      // Implicit parent is the last commit seen on the same branch (O(1)).
      const prevId = lastCommitByBranch.get(c.branch);
      if (prevId) {
        edges.push({
          id: `git_${prevId}_${c.id}`,
          source: prevId,
          target: c.id,
          style: "solid",
          arrow: "forward",
          sections: []
        });
      }
    }

    lastCommitByBranch.set(c.branch, c.id);
  });

  return { width, height, nodes, edges };
}
