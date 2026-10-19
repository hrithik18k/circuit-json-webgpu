import { expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import type { CircuitJson } from "../lib"
import { compileCircuitJson } from "../lib"
import { area, meshCovers } from "./fixtures/mesh-geometry"

test("released Core route vias retain copper and drills without renderer inference", () => {
  // PCB output from @tscircuit/core@0.0.2173: one explicit 2/1 mm route
  // via and one route via using the board's 0.9/0.45 mm PCB style defaults.
  const elements: CircuitJson = JSON.parse(
    readFileSync(
      new URL("./fixtures/core-trace-vias.circuit.json", import.meta.url),
      "utf8",
    ),
  )
  const vias = elements.filter((element) => element.type === "pcb_via")
  expect(vias).toHaveLength(2)
  expect(vias).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ x: -3, outer_diameter: 2, hole_diameter: 1 }),
      expect.objectContaining({
        x: 3,
        outer_diameter: 0.9,
        hole_diameter: 0.45,
      }),
    ]),
  )
  const original = structuredClone(elements)
  const scene = compileCircuitJson(elements)
  expect(scene.diagnostics).toEqual([])
  const drill = scene.layers.find((layer) => layer.name === "drill")!.paint
  expect(area(drill)).toBeCloseTo(Math.PI * ((1 / 2) ** 2 + (0.45 / 2) ** 2), 1)
  for (const via of vias) {
    for (const name of ["top", "bottom"]) {
      const layer = scene.layers.find((layer) => layer.name === name)!
      expect(
        meshCovers({
          mesh: layer.paint,
          point: {
            x: via.x,
            y: via.y + (via.hole_diameter + via.outer_diameter) / 4,
          },
        }),
      ).toBe(true)
      expect(meshCovers({ mesh: layer.erase, point: via })).toBe(true)
    }
    expect(meshCovers({ mesh: drill, point: via })).toBe(true)
  }
  expect(elements).toEqual(original)
})
