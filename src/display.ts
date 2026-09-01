import { TilepadPlugin } from ".";
import { DisplayContext } from "./types";

export class Display {
  ctx: DisplayContext;
  tilepad: TilepadPlugin;

  constructor(tilepad: TilepadPlugin, ctx: DisplayContext) {
    this.ctx = ctx;
    this.tilepad = tilepad;
  }

  send(msg: unknown): void {
    this.tilepad.sendToDisplay(this.ctx, msg);
  }
}
