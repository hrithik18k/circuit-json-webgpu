import assert from "node:assert/strict"
import { mkdir, writeFile } from "node:fs/promises"
import { fileURLToPath } from "node:url"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { PNG } from "pngjs"
import { Resvg } from "@resvg/resvg-js"
import type { Fixture } from "../../site/fixtures"
import { prepareComparison } from "../parity/prepare"
import { featureSnapshot } from "../parity/snapshot"

export async function snapshotBoardColorComparison({
  fixture,
  screenshot,
  width,
  height,
}: {
  fixture: Fixture
  screenshot: Buffer
  width: number
  height: number
}) {
  assert(fixture.options?.transform)
  const { scene } = prepareComparison({
    width,
    height,
    elements: [...fixture.elements],
    matrix: fixture.options.transform,
    contextTransform: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 },
    options: {},
  })
  assert(scene)
  const svg = convertCircuitJsonToPcbSvg([...fixture.elements], {
    width,
    height,
    viewport: scene.viewport,
    layer: "top",
    showSolderMask: true,
    showPcbNotes: true,
    showFabricationNotes: false,
    shouldDrawErrors: false,
    shouldDrawRatsNest: false,
    includeVersion: false,
    drawPaddingOutsideBoard: true,
    backgroundColor: "#000000",
  })
  // Match the existing bend comparison: Resvg needs the SVG's embedded font
  // supplied explicitly because it does not load CSS @font-face URLs.
  const embeddedFont = svg.match(/data:font\/ttf;base64,([^']+)/)?.[1]
  assert(embeddedFont)
  const comparisonDir = new URL("../actual/parity/", import.meta.url)
  await mkdir(comparisonDir, { recursive: true })
  const fontFile = new URL("board-colors-reference.ttf", comparisonDir)
  await writeFile(fontFile, Buffer.from(embeddedFont, "base64"))
  const reference = new Resvg(svg, {
    font: { loadSystemFonts: false, fontFiles: [fileURLToPath(fontFile)] },
  })
    .render()
    .asPng()
  const captured = PNG.sync.read(screenshot)
  const gpu = new PNG({ width, height })
  // Exclude the gallery canvas's CSS border from the comparison panels.
  PNG.bitblt(
    captured,
    gpu,
    (captured.width - width) / 2,
    (captured.height - height) / 2,
    width,
    height,
    0,
    0,
  )
  return featureSnapshot(
    "board-appearance-colors",
    PNG.sync.read(reference),
    gpu,
    "board-appearance-colors",
  )
}
