import { expect, test } from "bun:test"
import { pcb_plated_hole } from "circuit-json"
import { compileCircuitJson } from "../lib"
import { meshBounds } from "./fixtures/mesh-geometry"
import { rotatedPadDrillOffsets } from "./fixtures/rotated-pad-drill-offsets"

test.failing(
  "repro: rotating a rectangular pad must not rotate its board-space drill offset",
  () => {
    for (const element of rotatedPadDrillOffsets) {
      if (element.type !== "pcb_plated_hole") continue
      const hole = pcb_plated_hole.parse(element)
      const scene = compileCircuitJson([hole])
      expect(scene.diagnostics).toEqual([])
      const expectedCenter = {
        x: element.x + element.hole_offset_x,
        y: element.y + element.hole_offset_y,
      }
      const drill = scene.layers.find((layer) => layer.name === "drill")!.paint
      const bounds = meshBounds(drill)
      expect((bounds[0] + bounds[1]) / 2).toBeCloseTo(expectedCenter.x)
      expect((bounds[2] + bounds[3]) / 2).toBeCloseTo(expectedCenter.y)
      for (const name of ["top", "bottom"]) {
        const clearance = scene.layers.find(
          (layer) => layer.name === name,
        )!.erase
        expect(meshBounds(clearance)).toEqual(bounds)
      }
    }
  },
)
