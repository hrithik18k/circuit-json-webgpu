import { expect, test } from "bun:test"
import { pcb_board, pcb_silkscreen_line } from "circuit-json"
import { compileCircuitJson } from "../lib"

test("board colors stay with their owning board in a multi-board scene", () => {
  const elements = ["primary", "secondary"].flatMap((id, index) => [
    pcb_board.parse({
      type: "pcb_board",
      pcb_board_id: id,
      subcircuit_id: id,
      center: { x: index * 20, y: 0 },
      width: 10,
      height: 10,
      thickness: 1.6,
      num_layers: 2,
      solder_mask_color: index === 0 ? "blue" : "red",
      silkscreen_color: index === 0 ? "white" : "black",
    }),
    pcb_silkscreen_line.parse({
      type: "pcb_silkscreen_line",
      pcb_silkscreen_line_id: id,
      pcb_component_id: id,
      subcircuit_id: id,
      layer: "top",
      x1: index * 20 - 2,
      y1: 0,
      x2: index * 20 + 2,
      y2: 0,
      stroke_width: 0.2,
    }),
  ])
  const scene = compileCircuitJson(elements)
  expect(scene.diagnostics).toEqual([])
  for (const layer of scene.layers.filter((layer) =>
    ["soldermask_top", "soldermask_bottom", "top_silkscreen"].includes(
      layer.name,
    ),
  )) {
    const isMask = layer.name.startsWith("soldermask_")
    expect(Array.from(layer.paint.vertices.slice(2, 6))).toEqual(
      isMask ? [0, 0, 1, 1] : [1, 1, 1, 1],
    )
    expect(Array.from(layer.paint.vertices.slice(-6, -2))).toEqual(
      isMask ? [1, 0, 0, 1] : [0, 0, 0, 1],
    )
  }
})
