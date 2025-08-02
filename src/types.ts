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

export interface DisplayContext {
  device_id: string;
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

export type TileLabel = Partial<{
  enabled: boolean;
  label: string;
  align: "Bottom" | "Middle" | "Top";
  font: string;
  font_size: number;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  outline: boolean;
  color: string;
  outline_color: string;
}>;

export type TileIcon =
  | {
      type: "None";
    }
  | { type: "PluginIcon"; plugin_id: string; icon: string }
  | { type: "IconPack"; pack_id: string; path: string }
  | { type: "Url"; src: string };

export interface TileModel {
  id: string;
  config: TileConfig;
  properties: unknown;
  folder_id: string;
  plugin_id: string;
  action_id: string;
  position: TilePosition;
}

export interface TileConfig {
  icon: TileIcon;
  label: TileLabel;
}

export interface TilePosition {
  row: number;
  column: number;
  row_span: number;
  column_span: number;
}
