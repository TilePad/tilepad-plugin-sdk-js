import { EventEmitter } from "events";
import { getProgramArgs } from "./args";
import { WebSocket } from "ws";
import {
  DeepLinkContext,
  DisplayContext,
  InspectorContext,
  TileInteractionContext,
  TileIcon,
  TileLabel,
  TileModel,
  TileConfig,
  TilePosition,
} from "./types";
import { Display } from "./display";
import { Inspector } from "./inspector";

export { Display, Inspector };

export type {
  DeepLinkContext,
  DisplayContext,
  InspectorContext,
  TileInteractionContext,
  TileIcon,
  TileLabel,
  TileModel,
  TileConfig,
  TilePosition,
};

export interface TilepadEvents {
  registered: {};
  properties: { properties: any };
  tile_properties: { tile_id: string; properties: any };
  inspector_message: { inspector: Inspector; message: any };
  display_message: { display: Display; message: any };
  inspector_open: { inspector: Inspector };
  inspector_close: { inspector: Inspector };
  deep_link: { ctx: DeepLinkContext };
  tile_clicked: { ctx: TileInteractionContext };
  device_tiles: { device_id: string; tiles: TileModel[] };
  visible_tiles: { tiles: TileModel[] };
}

export class TilepadPlugin {
  #ws: WebSocket | null = null;
  #emitter: EventEmitter = new EventEmitter();

  /**
   * Connect and registered the Tilepad plugin with the desktop app
   */
  connect() {
    const args = getProgramArgs();
    const ws = new WebSocket(args.connectUrl);
    this.#ws = ws;

    const plugin = this;

    ws.onopen = () => {
      plugin.#registerPlugin(args.pluginId);
    };

    ws.onmessage = (event) => {
      if (typeof event.data !== "string") return;
      const data = JSON.parse(event.data);
      plugin.#onMessage(data);
    };

    // Exit on connection lost
    ws.onclose = () => {
      process.exit(0);
    };
  }

  #sendMessage(msg: unknown) {
    const ws = this.#ws;
    if (!ws) return;

    ws.send(JSON.stringify(msg));
  }

  on<K extends keyof TilepadEvents>(
    event: K,
    listener: (payload: TilepadEvents[K]) => void
  ) {
    this.#emitter.on(event as string, listener);
    return this;
  }

  off<K extends keyof TilepadEvents>(
    event: K,
    listener: (payload: TilepadEvents[K]) => void
  ) {
    this.#emitter.off(event as string, listener);
    return this;
  }

  once<K extends keyof TilepadEvents>(
    event: K,
    listener: (payload: TilepadEvents[K]) => void
  ) {
    const onceListener = (payload: TilepadEvents[K]) => {
      this.#emitter.off(event as string, onceListener);
      listener(payload);
    };
    this.#emitter.on(event as string, onceListener);
    return this;
  }

  onceFilter<K extends keyof TilepadEvents>(
    event: K,
    filter: (payload: TilepadEvents[K]) => boolean,
    listener: (payload: TilepadEvents[K]) => void
  ) {
    const onceListener = (payload: TilepadEvents[K]) => {
      if (!filter(payload)) {
        return;
      }

      this.#emitter.off(event as string, onceListener);
      listener(payload);
    };
    this.#emitter.on(event as string, onceListener);
    return this;
  }

  #onMessage(msg: any) {
    if (!msg.type) return;
    switch (msg.type) {
      case "Registered": {
        this.#emitter.emit("registered", {});
        break;
      }
      case "Properties": {
        this.#emitter.emit("properties", { properties: msg.properties });
        break;
      }
      case "TileClicked": {
        this.#emitter.emit("tile_clicked", {
          ctx: msg.ctx,
          properties: msg.properties,
        });
        break;
      }
      case "RecvFromInspector": {
        const inspector = new Inspector(this, msg.ctx);
        this.#emitter.emit("inspector_message", {
          inspector,
          message: msg.message,
        });
        break;
      }
      case "RecvFromDisplay": {
        const display = new Display(this, msg.ctx);
        this.#emitter.emit("display_message", {
          display,
          message: msg.message,
        });
        break;
      }
      case "InspectorOpen": {
        const inspector = new Inspector(this, msg.ctx);
        this.#emitter.emit("inspector_open", { inspector });
        break;
      }
      case "InspectorClose": {
        const inspector = new Inspector(this, msg.ctx);
        this.#emitter.emit("inspector_close", { inspector });
        break;
      }
      case "DeepLink": {
        this.#emitter.emit("deep_link", { ctx: msg.ctx });
        break;
      }
      case "TileProperties": {
        this.#emitter.emit("tile_properties", {
          tile_id: msg.tile_id,
          properties: msg.properties,
        });
        break;
      }
      case "DeviceTiles": {
        this.#emitter.emit("device_tiles", {
          device_id: msg.device_id,
          tiles: msg.tiles,
        });
        break;
      }
      case "VisibleTiles": {
        this.#emitter.emit("visible_tiles", {
          tiles: msg.tiles,
        });
        break;
      }
    }
  }

  #registerPlugin(pluginId: string) {
    this.#sendMessage({ type: "RegisterPlugin", plugin_id: pluginId });
  }

  /**
   * Request the current plugin properties
   */
  requestProperties() {
    this.#sendMessage({ type: "GetProperties" });
  }

  /**
   * Request the current plugin properties
   *
   * @returns The current plugin properties
   */
  getProperties<T>(): Promise<T> {
    return new Promise((resolve) => {
      this.once("properties", ({ properties }) => {
        resolve(properties);
      });

      this.requestProperties();
    });
  }

  /**
   * Set the plugin properties for this plugin
   *
   * @param properties The plugin properties
   * @param partial Whether to perform a partial update or replace
   */
  setProperties(properties: unknown, partial: boolean = true) {
    this.#sendMessage({ type: "SetProperties", properties, partial });
  }

  /**
   * Send a message to a specific inspector window using its context
   *
   * @param ctx Context data for the inspector
   * @param message Message to send to the inspector
   */
  sendToInspector(ctx: InspectorContext, message: unknown) {
    this.#sendMessage({ type: "SendToInspector", ctx, message });
  }

  /**
   * Send a message to a specific display using its context
   *
   * @param ctx Context data for the display
   * @param message Message to send to the display
   */
  sendToDisplay(ctx: DisplayContext, message: unknown) {
    this.#sendMessage({ type: "SendToDisplay", ctx, message });
  }

  /**
   * Open a URL in the default system app
   *
   * @param url The URL to open
   */
  openUrl(url: string) {
    this.#sendMessage({ type: "OpenUrl", url });
  }

  /**
   * Request the properties for a specific tile
   *
   * @param tileId The ID of the tile
   */
  requestTileProperties(tileId: string) {
    this.#sendMessage({ type: "GetTileProperties", tile_id: tileId });
  }

  /**
   * Request the properties of the requested tile
   *
   * @param tileId The ID of the tile
   * @returns The current tile properties
   */
  getTileProperties(tileId: string) {
    return new Promise((resolve) => {
      this.onceFilter(
        "tile_properties",
        (event) => event.tile_id === tileId,
        ({ properties }) => {
          resolve(properties);
        }
      );

      this.requestTileProperties(tileId);
    });
  }

  /**
   * Update the properties of a specific file
   *
   * @param tileId The ID of the tile
   * @param properties The properties to set
   * @param partial Whether to perform a partial update or replace
   */
  setTileProperties(
    tileId: string,
    properties: unknown,
    partial: boolean = true
  ) {
    this.#sendMessage({
      type: "SetTileProperties",
      tile_id: tileId,
      properties,
      partial,
    });
  }

  /**
   * Set the icon of a specific tile
   *
   * @param tileId The ID of the tile
   * @param icon The new icon for the tile
   */
  setTileIcon(tileId: string, icon: TileIcon) {
    this.#sendMessage({
      type: "SetTileIcon",
      tile_id: tileId,
      icon,
    });
  }

  /**
   * Set the label of a specific tile
   *
   * @param tileId The ID of the tile
   * @param label The new label for the tile
   */
  setTileLabel(tileId: string, label: TileLabel) {
    this.#sendMessage({
      type: "SetTileLabel",
      tile_id: tileId,
      label,
    });
  }

  /**
   * Requests the list of visible tiles
   */
  requestVisibleTiles() {
    this.#sendMessage({ type: "GetVisibleTiles" });
  }

  /**
   * Request the currently visible tiles across all devices including
   * the tiles that are visible on the desktop app.
   *
   * Only includes tiles for the current plugin
   *
   * @returns The currently visible tiles
   */
  getVisibleTiles(): Promise<TileModel[]> {
    return new Promise((resolve) => {
      this.once("visible_tiles", ({ tiles }) => {
        resolve(tiles);
      });

      this.requestVisibleTiles();
    });
  }
}

const tilepad = new TilepadPlugin();

export default tilepad;
