# Examples Gallery

Every diagram below was produced by [`@glyphicjs/core`](../../packages/core) from pure JSON — no headless browser, no Mermaid. Click any `.json` link to see the exact input, or browse all source fixtures in this folder. For the field-by-field schema of each type, see the [Diagram Types reference](../diagram-types.md).

> All 18 first-class diagram types are represented. Diagrams render in the **compact** style and are auto-framed to 16:9 / 9:16 by default — see [Styles & Aspect-Ratio Framing](../styles.md).

---

## Render styles

The same diagram in different `style` presets (default is **compact**). See the [styles guide](../styles.md).

<img src="./00_sketch_architecture.png" alt="Sketch style architecture" width="520" />

<img src="./00_minimal_flowchart.png" alt="Minimal style flowchart" width="300" />

[`00_sketch_architecture.json`](./00_sketch_architecture.json) (sketch) · [`00_minimal_flowchart.json`](./00_minimal_flowchart.json) (minimal)

---

## Architecture

Nested VPCs / clusters (`groupId`), FontAwesome icons, colored nodes, labeled edges.

<img src="./01_cloud_architecture.png" alt="Cloud architecture" width="380" />
<img src="./32_production_platform_architecture.png" alt="44-node production platform architecture" width="300" />

[`01_cloud_architecture.json`](./01_cloud_architecture.json) · [`14_microservices_k8s.json`](./14_microservices_k8s.json) · [`13_star_wars_battle.json`](./13_star_wars_battle.json) · [`32_production_platform_architecture.json`](./32_production_platform_architecture.json)

The last one is deliberately large — **44 nodes across four nested tiers with 38 edges**. This is the range where hand-drawing SVG breaks down: a model can place the boxes, but edge routing turns into diagonal lines cutting through other shapes, and the result can't be edited without regenerating it. A real layout engine nests the clusters and routes around obstacles, and the JSON stays an editable source of truth.

## C4 Context

C4 element kinds (person / system / external / container / database / boundary) with `[technology]` on relationships.

<img src="./29_banking_c4_context.png" alt="C4 context diagram" width="460" />

[`29_banking_c4_context.json`](./29_banking_c4_context.json)

## Flowchart

Shapes, decision diamonds, branch labels — shown here with the built-in **dark** theme.

<img src="./31_dark_cicd_pipeline.png" alt="Dark CI/CD flowchart" width="620" />

[`04_oauth_flowchart.json`](./04_oauth_flowchart.json) · [`31_dark_cicd_pipeline.json`](./31_dark_cicd_pipeline.json)

## Sequence

Participants, lifelines, sync / async / return messages, self-messages.

<img src="./02_ecommerce_checkout_sequence.png" alt="Sequence diagram" width="520" />

[`02_ecommerce_checkout_sequence.json`](./02_ecommerce_checkout_sequence.json) · [`15_coffee_shop_sequence.json`](./15_coffee_shop_sequence.json)

## State Machine

Initial / final / composite states and labeled transitions.

<img src="./22_order_state_machine.png" alt="State machine" width="240" />

[`22_order_state_machine.json`](./22_order_state_machine.json)

## ERD

Entities with PK/FK attributes rendered as tables, relationships with **crow's-foot** cardinality markers.

<img src="./23_blog_erd.png" alt="Entity-relationship diagram" width="560" />

[`23_blog_erd.json`](./23_blog_erd.json)

## UML Class

Classes with attribute / method compartments and UML relationship markers (inheritance, composition, aggregation, dependency).

<img src="./24_shapes_class_diagram.png" alt="UML class diagram" width="420" />

[`24_shapes_class_diagram.json`](./24_shapes_class_diagram.json)

## Mindmap

Radial layout with branch coloring and icons.

<img src="./09_product_mindmap.png" alt="Mindmap" width="480" />

[`09_product_mindmap.json`](./09_product_mindmap.json) · [`17_ai_startup_mindmap.json`](./17_ai_startup_mindmap.json)

## Gantt

Sections, tasks with start/duration/dependencies, a time axis, and dependency arrows.

<img src="./05_software_release_gantt.png" alt="Gantt chart" width="560" />

[`05_software_release_gantt.json`](./05_software_release_gantt.json) · [`18_mars_mission_gantt.json`](./18_mars_mission_gantt.json)

## Timeline

Chronological periods, each a colored column of event cards.

<img src="./25_product_timeline.png" alt="Timeline" width="520" />

[`25_product_timeline.json`](./25_product_timeline.json)

## User Journey

Stages → task cards tinted by a 1–5 satisfaction score, with actors.

<img src="./26_onboarding_journey.png" alt="User journey" width="520" />

[`26_onboarding_journey.json`](./26_onboarding_journey.json)

## Kanban

Columns of cards with priority accent, assignee, and tags.

<img src="./28_sprint_kanban.png" alt="Kanban board" width="620" />

[`28_sprint_kanban.json`](./28_sprint_kanban.json)

## Pie

Slices with leader-line labels, explode offsets, and an optional color legend (`"legend": true`).

<img src="./27_browser_share_pie.png" alt="Pie chart with legend" width="460" />

[`07_market_share_pie.json`](./07_market_share_pie.json) · [`20_developer_time_pie.json`](./20_developer_time_pie.json) · [`27_browser_share_pie.json`](./27_browser_share_pie.json)

## Quadrant

2×2 matrix with axis labels and de-conflicted point labels.

<img src="./08_risk_quadrant.png" alt="Quadrant chart" width="400" />

[`08_risk_quadrant.json`](./08_risk_quadrant.json) · [`21_programming_lang_quadrant.json`](./21_programming_lang_quadrant.json)

## Sankey

Proportional flows via `d3-sankey`.

<img src="./10_energy_sankey.png" alt="Sankey diagram" width="520" />

[`10_energy_sankey.json`](./10_energy_sankey.json) · [`16_startup_funding_sankey.json`](./16_startup_funding_sankey.json)

## Git Graph

Branches as lanes, merges, and tags.

<img src="./11_git_history.png" alt="Git graph" width="540" />

[`11_git_history.json`](./11_git_history.json) · [`12_complex_git_history.json`](./12_complex_git_history.json)

## Treemap

Hierarchical value rectangles (squarified, via `d3-hierarchy`), colored by top-level group.

<img src="./30_disk_usage_treemap.png" alt="Treemap" width="520" />

[`30_disk_usage_treemap.json`](./30_disk_usage_treemap.json)

## Canvas (freeform)

Absolute-positioned SVG primitives (rect / circle / text / path / group / raw-svg) for fully custom visuals.

<img src="./00_freeform_canvas.png" alt="Freeform canvas" width="460" />

[`00_freeform_canvas.json`](./00_freeform_canvas.json)
