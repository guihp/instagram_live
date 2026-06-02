export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type WebinarStatus = "draft" | "published" | "archived";
export type VideoType = "upload" | "youtube";
export type DisplayMode = "live" | "recorded";
export type FieldType = "text" | "email" | "tel" | "textarea";
export type PhoneRegion = "BR" | "US";
export type TriggerType = "button" | "cart";
export type TranscriptionStatus = "pending" | "processing" | "completed" | "failed";
export type ScheduleRecurrence = "once" | "daily" | "weekly";

export interface TranscriptionSegment {
  start: number;
  end: number;
  text: string;
}

export interface Database {
  public: {
    Tables: {
      webinars: {
        Row: {
          id: string;
          slug: string;
          title: string;
          description: string | null;
          scheduled_at: string;
          schedule_recurrence: ScheduleRecurrence;
          schedule_weekday: number | null;
          status: WebinarStatus;
          video_type: VideoType;
          video_url: string | null;
          video_duration_seconds: number | null;
          group_link: string | null;
          display_mode: DisplayMode;
          waiting_title: string | null;
          waiting_description: string | null;
          ai_context: string | null;
          ai_assistant_name: string | null;
          landing_hero_image: string | null;
          landing_promo_video_url: string | null;
          landing_benefits: Json;
          landing_topics: Json;
          landing_audience: string | null;
          host_name: string | null;
          host_title: string | null;
          host_bio: string | null;
          host_image_url: string | null;
          landing_cta_text: string | null;
          landing_footer: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["webinars"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["webinars"]["Row"]>;
      Relationships: [];
      };
      webinar_form_fields: {
        Row: {
          id: string;
          webinar_id: string;
          field_key: string;
          label: string;
          field_type: FieldType;
          required: boolean;
          enabled: boolean;
          sort_order: number;
          phone_region: PhoneRegion | null;
        };
        Insert: Partial<Database["public"]["Tables"]["webinar_form_fields"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["webinar_form_fields"]["Row"]>;
      Relationships: [];
      };
      webinar_leads: {
        Row: {
          id: string;
          webinar_id: string;
          data: Json;
          utm_source: string | null;
          utm_medium: string | null;
          utm_campaign: string | null;
          session_id: string | null;
          registered_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["webinar_leads"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["webinar_leads"]["Row"]>;
      Relationships: [];
      };
      webinar_chat_messages: {
        Row: {
          id: string;
          webinar_id: string;
          author_name: string;
          message: string;
          appear_at_seconds: number;
          sort_order: number;
        };
        Insert: Partial<Database["public"]["Tables"]["webinar_chat_messages"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["webinar_chat_messages"]["Row"]>;
      Relationships: [];
      };
      webinar_triggers: {
        Row: {
          id: string;
          webinar_id: string;
          trigger_type: TriggerType;
          label: string;
          action_url: string | null;
          appear_at_seconds: number;
          appear_mode: string;
          detected_from_transcript: boolean;
          transcript_snippet: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["webinar_triggers"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["webinar_triggers"]["Row"]>;
      Relationships: [];
      };
      webinar_transcriptions: {
        Row: {
          id: string;
          webinar_id: string;
          full_text: string | null;
          segments: TranscriptionSegment[];
          ai_summary: string | null;
          status: TranscriptionStatus;
          processed_at: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["webinar_transcriptions"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["webinar_transcriptions"]["Row"]>;
      Relationships: [];
      };
      webinar_live_messages: {
        Row: {
          id: string;
          webinar_id: string;
          lead_id: string | null;
          author_name: string;
          message: string;
          is_ai_response: boolean;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["webinar_live_messages"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["webinar_live_messages"]["Row"]>;
      Relationships: [];
      };
      webinar_lead_attendance: {
        Row: {
          id: string;
          webinar_id: string;
          lead_id: string;
          session_date: string;
          attended_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["webinar_lead_attendance"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["webinar_lead_attendance"]["Row"]>;
      Relationships: [];
      };
      webinar_trigger_clicks: {
        Row: {
          id: string;
          webinar_id: string;
          lead_id: string;
          trigger_id: string;
          session_date: string;
          clicked_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["webinar_trigger_clicks"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["webinar_trigger_clicks"]["Row"]>;
      Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
}


export type Webinar = Database["public"]["Tables"]["webinars"]["Row"];
export type WebinarFormField = Database["public"]["Tables"]["webinar_form_fields"]["Row"];
export type WebinarLead = Database["public"]["Tables"]["webinar_leads"]["Row"];
export type WebinarLeadAttendance = Database["public"]["Tables"]["webinar_lead_attendance"]["Row"];
export type WebinarTriggerClick = Database["public"]["Tables"]["webinar_trigger_clicks"]["Row"];
export type WebinarChatMessage = Database["public"]["Tables"]["webinar_chat_messages"]["Row"];
export type WebinarTrigger = Database["public"]["Tables"]["webinar_triggers"]["Row"];
