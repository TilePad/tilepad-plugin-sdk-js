import { EventEmitter } from "events";
import { getProgramArgs } from "./args";
import { WebSocket } from "ws";

export interface TilepadEvents {
  registered: {};
  properties: { properties: any };
  inspector_message: { inspector: Inspector; message: any };
  inspector_open: { inspector: Inspector };
  inspector_close: { inspector: Inspector };
  deep_link: { ctx: DeepLinkContext };
  tile_clicked: { ctx: TileInteractionContext };
}

export interface DeepLinkContext {
  url: string;
  host: string | null;
  path: string;
  query: string | null;
  fragment: string | null;
}

export interface InspectorContext {
  profile_id: string;
  folder_id: string;
  plugin_id: string;
  action_id: string;
  tile_id: string;
}

export interface TileInteractionContext {
  device_id: string;
  plugin_id: string;
  action_id: string;
  tile_id: string;
}

class TilepadPlugin {
  #ws: WebSocket | null = null;
  #emitter: EventEmitter = new EventEmitter();

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

  #onMessage(msg: any) {
    console.debug(msg);

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
        const inspector = new Inspector(msg.ctx);
        this.#emitter.emit("inspector_message", {
          inspector,
          message: msg.message,
        });
        break;
      }
      case "InspectorOpen": {
        const inspector = new Inspector(msg.ctx);
        this.#emitter.emit("inspector_open", { inspector });
        break;
      }
      case "InspectorClose": {
        const inspector = new Inspector(msg.ctx);
        this.#emitter.emit("inspector_close", { inspector });
        break;
      }
      case "DeepLink": {
        this.#emitter.emit("deep_link", { ctx: msg.ctx });
        break;
      }
    }
  }

  #registerPlugin(pluginId: string) {
    this.sendMessage({ type: "RegisterPlugin", plugin_id: pluginId });
  }

  getProperties() {
    this.sendMessage({ type: "GetProperties" });
  }

  setProperties(properties: unknown) {
    this.sendMessage({ type: "SetProperties", properties });
  }

  sendToInspector(ctx: InspectorContext, message: unknown) {
    this.sendMessage({ type: "SendToInspector", ctx, message });
  }

  openUrl(url: string) {
    this.sendMessage({ type: "OpenUrl", url });
  }

  sendMessage(msg: unknown) {
    const ws = this.#ws;
    if (!ws) return;

    ws.send(JSON.stringify(msg));
  }
}

const tilepad = new TilepadPlugin();

export class Inspector {
  ctx: InspectorContext;

  constructor(ctx: InspectorContext) {
    this.ctx = ctx;
  }

  send(msg: unknown) {
    tilepad.sendToInspector(this.ctx, msg);
  }
}

export default tilepad;
