import { expect, test } from "bun:test"
import type { CircuitJson, Color } from "../lib"
import { compileCircuitJson } from "../lib"
import { DEFAULT_LAYER_COLORS } from "../lib/colors"

test("board appearance colors apply to both sides while explicit layer colors win", () => {
  const elements: CircuitJson = [
    {
      type: "pcb_board",
      pcb_board_id: "board",
      center: { x: 0, y: 0 },
      width: 10,
      height: 10,
      thickness: 1.6,
      num_layers: 2,
      material: "fr4",
      solder_mask_color: "blue",
      silkscreen_color: "white",
    },
    ...(["top", "bottom"] as const).flatMap((layer) => [
      {
        type: "pcb_silkscreen_text" as const,
        pcb_silkscreen_text_id: `${layer}-text`,
        pcb_component_id: "component",
        text: "PCB",
        layer,
        font: "tscircuit2024" as const,
        font_size: 1,
        anchor_alignment: "center" as const,
        anchor_position: { x: 0, y: 0 },
      },
      {
        type: "pcb_silkscreen_line" as const,
        pcb_silkscreen_line_id: `${layer}-line`,
        pcb_component_id: "component",
        layer,
        x1: -2,
        y1: -2,
        x2: 2,
        y2: -2,
        stroke_width: 0.2,
      },
    ]),
  ]
  const original = structuredClone(elements)
  const overrides: Record<string, Color> = {
    soldermask_top: [1, 0, 0, 1],
    top_silkscreen: [0, 0, 0, 1],
  }
  for (const layerColors of [undefined, overrides]) {
    const scene = compileCircuitJson(elements, { layerColors })
    expect(scene.diagnostics).toEqual([])
    for (const layer of scene.layers) {
      const colorLayer = layer.name.replace(/_silkscreen_text$/, "_silkscreen")
      const expected =
        layerColors?.[colorLayer] ??
        (layer.name.startsWith("soldermask_")
          ? [0, 0, 1, 1]
          : layer.name.includes("silkscreen")
            ? [1, 1, 1, 1]
            : DEFAULT_LAYER_COLORS[colorLayer])
      expect(layer.paint.indices.length).toBeGreaterThan(0)
      for (let i = 0; i < layer.paint.vertices.length; i += 8)
        expect(Array.from(layer.paint.vertices.slice(i + 2, i + 6))).toEqual(
          Array.from(new Float32Array(expected)),
        )
    }
  }
  expect(elements).toEqual(original)
  const defaults = compileCircuitJson(
    elements.map((element) =>
      element.type === "pcb_board"
        ? {
            ...element,
            solder_mask_color: undefined,
            silkscreen_color: undefined,
          }
        : element,
    ),
  )
  for (const layer of defaults.layers) {
    const colorLayer = layer.name.replace(/_silkscreen_text$/, "_silkscreen")
    expect(Array.from(layer.paint.vertices.slice(2, 6))).toEqual(
      Array.from(new Float32Array(DEFAULT_LAYER_COLORS[colorLayer])),
    )
  }
})
