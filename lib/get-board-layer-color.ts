import cssColor from "color"
import type { PcbBoard } from "circuit-json"
import type { Color } from "./types"

export function getBoardLayerColor({
  boards,
  element,
  layer,
}: {
  boards: readonly PcbBoard[]
  element: { type: string; pcb_board_id?: string; subcircuit_id?: string }
  layer: string
}): Color | undefined {
  const board =
    boards.find((candidate) =>
      element.pcb_board_id !== undefined
        ? candidate.pcb_board_id === element.pcb_board_id
        : element.subcircuit_id !== undefined &&
          candidate.subcircuit_id === element.subcircuit_id,
    ) ?? (boards.length === 1 ? boards[0] : undefined)
  const boardColor =
    layer === "soldermask_top" || layer === "soldermask_bottom"
      ? board?.solder_mask_color
      : layer === "top_silkscreen" || layer === "bottom_silkscreen"
        ? board?.silkscreen_color
        : undefined
  if (boardColor === undefined) return undefined
  const color = cssColor(boardColor.trim().toLowerCase()).rgb()
  return [
    color.red() / 255,
    color.green() / 255,
    color.blue() / 255,
    color.alpha(),
  ]
}
