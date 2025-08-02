import { TilepadPlugin } from ".";
import { InspectorContext } from "./types";

export class Inspector {
  ctx: InspectorContext;
  tilepad: TilepadPlugin;

  constructor(tilepad: TilepadPlugin, ctx: InspectorContext) {
    this.ctx = ctx;
    this.tilepad = tilepad;
  }

  send(msg: unknown) {
    this.tilepad.sendToInspector(this.ctx, msg);
  }
}
