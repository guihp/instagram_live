export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type IgBroadcastStatus = "idle" | "armed" | "starting" | "live" | "stopped" | "error";

export interface Database {
  public: {
    Tables: {
      ig_broadcasts: {
        Row: {
          id: string;
          title: string;
          video_path: string | null;
          rtmp_url: string | null;
          loop_enabled: boolean;
          status: IgBroadcastStatus;
          scheduled_at: string | null;
          started_at: string | null;
          ended_at: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["ig_broadcasts"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["ig_broadcasts"]["Insert"]>;
      };
      ig_broadcast_events: {
        Row: {
          id: string;
          broadcast_id: string;
          type: string;
          message: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["ig_broadcast_events"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["ig_broadcast_events"]["Insert"]>;
      };
    };
  };
}

export type IgBroadcast = Database["public"]["Tables"]["ig_broadcasts"]["Row"];
export type IgBroadcastEvent = Database["public"]["Tables"]["ig_broadcast_events"]["Row"];
