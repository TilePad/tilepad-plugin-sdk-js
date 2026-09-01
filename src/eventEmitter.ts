/**
 * Event emitting and subscribing
 */
export class EventEmitter<Events extends Record<string, any>> {
  private events: { [K in keyof Events]?: ((args: Events[K]) => void)[] };

  constructor() {
    this.events = {};
  }

  // Subscribe to an event
  on<K extends keyof Events>(event: K, callback: (args: Events[K]) => void) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event]!.push(callback);
  }

  // Unsubscribe from an event
  off<K extends keyof Events>(event: K, callback: (args: Events[K]) => void) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event]!.filter((cb) => cb !== callback);
  }

  // Emit an event
  emit<K extends keyof Events>(event: K, args: Events[K]) {
    if (!this.events[event]) return;
    this.events[event]!.forEach((callback) => callback(args));
  }
}
