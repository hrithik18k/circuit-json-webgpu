import { expect, test } from "bun:test"
import { pcb_board } from "circuit-json"
import { compileCircuitJson } from "../lib"
import { fixtures } from "../site/fixtures"

test("repro: Air Mouse board appearance colors do not affect rendered meshes", () => {
  const elements = fixtures["air-mouse-board-colors"].elements
  const board = pcb_board.parse(elements.find((e) => e.type === "pcb_board"))
  expect(board.solder_mask_color).toBe("blue")
  expect(board.silkscreen_color).toBe("white")

  const scene = compileCircuitJson(elements)
  expect(scene.diagnostics).toEqual([])
  for (const name of [
    "soldermask_top",
    "top_silkscreen",
    "top_silkscreen_text",
  ]) {
    expect(
      scene.layers.find((layer) => layer.name === name)!.paint.indices.length,
    ).toBeGreaterThan(0)
  }
  const changedColors = compileCircuitJson(
    elements.map((element) =>
      element.type === "pcb_board"
        ? { ...element, solder_mask_color: "red", silkscreen_color: "black" }
        : element,
    ),
  )
  // Record the bug: changing both valid board colors leaves every mesh unchanged.
  expect(changedColors).toEqual(scene)
})
