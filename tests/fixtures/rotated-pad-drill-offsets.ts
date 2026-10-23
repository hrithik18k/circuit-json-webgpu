import type { CircuitJson } from "../../lib"

export const rotatedPadDrillOffsets = [
  ...[0, 90].flatMap((rect_ccw_rotation, column) => {
    const x = column === 0 ? -7 : 7
    return [
      {
        type: "pcb_plated_hole" as const,
        pcb_plated_hole_id: `pad-${rect_ccw_rotation}`,
        shape: "circular_hole_with_rect_pad" as const,
        x,
        y: 0,
        rect_pad_width: 6,
        rect_pad_height: 4,
        rect_ccw_rotation,
        hole_shape: "circle" as const,
        pad_shape: "rect" as const,
        hole_diameter: 1,
        hole_offset_x: 1,
        hole_offset_y: -1,
        layers: ["top" as const, "bottom" as const],
      },
      {
        type: "pcb_note_text" as const,
        pcb_note_text_id: `label-${rect_ccw_rotation}`,
        pcb_component_id: "component",
        text: column === 0 ? "CONTROL: PAD 0deg" : "BUG: PAD 90deg",
        anchor_position: { x, y: 5 },
        anchor_alignment: "center" as const,
        font_size: 0.7,
        font: "tscircuit2024" as const,
        layer: "top" as const,
      },
    ]
  }),
  {
    type: "pcb_note_text",
    pcb_note_text_id: "expected-drill-offset",
    pcb_component_id: "component",
    text: "BOTH DRILLS: 1mm RIGHT AND 1mm BELOW PAD CENTER",
    anchor_position: { x: 0, y: -6 },
    anchor_alignment: "center",
    font_size: 0.65,
    font: "tscircuit2024",
    layer: "top",
  },
] satisfies CircuitJson
