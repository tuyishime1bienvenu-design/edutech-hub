export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      attendance: {
        Row: {
          class_id: string
          created_at: string
          date: string
          end_time: string | null
          id: string
          is_present: boolean | null
          recorded_by: string | null
          start_time: string | null
          student_id: string
        }
        Insert: {
          class_id: string
          created_at?: string
          date?: string
          end_time?: string | null
          id?: string
          is_present?: boolean | null
          recorded_by?: string | null
          start_time?: string | null
          student_id: string
        }
        Update: {
          class_id?: string
          created_at?: string
          date?: string
          end_time?: string | null
          id?: string
          is_present?: boolean | null
          recorded_by?: string | null
          start_time?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      class_reports: {
        Row: {
          class_id: string
          created_at: string
          date: string
          id: string
          notes: string | null
          topics_covered: string
          trainer_id: string
        }
        Insert: {
          class_id: string
          created_at?: string
          date?: string
          id?: string
          notes?: string | null
          topics_covered: string
          trainer_id: string
        }
        Update: {
          class_id?: string
          created_at?: string
          date?: string
          id?: string
          notes?: string | null
          topics_covered?: string
          trainer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_reports_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          created_at: string
          current_enrollment: number | null
          id: string
          is_active: boolean | null
          level: Database["public"]["Enums"]["student_level"]
          max_capacity: number
          name: string
          program_id: string | null
          shift: Database["public"]["Enums"]["shift_type"]
          trainer_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_enrollment?: number | null
          id?: string
          is_active?: boolean | null
          level: Database["public"]["Enums"]["student_level"]
          max_capacity?: number
          name: string
          program_id?: string | null
          shift: Database["public"]["Enums"]["shift_type"]
          trainer_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_enrollment?: number | null
          id?: string
          is_active?: boolean | null
          level?: Database["public"]["Enums"]["student_level"]
          max_capacity?: number
          name?: string
          program_id?: string | null
          shift?: Database["public"]["Enums"]["shift_type"]
          trainer_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "classes_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_structures: {
        Row: {
          created_at: string
          id: string
          internship_fee: number
          is_active: boolean | null
          level: Database["public"]["Enums"]["student_level"] | null
          name: string
          program_id: string | null
          registration_fee: number
        }
        Insert: {
          created_at?: string
          id?: string
          internship_fee: number
          is_active?: boolean | null
          level?: Database["public"]["Enums"]["student_level"] | null
          name: string
          program_id?: string | null
          registration_fee: number
        }
        Update: {
          created_at?: string
          id?: string
          internship_fee?: number
          is_active?: boolean | null
          level?: Database["public"]["Enums"]["student_level"] | null
          name?: string
          program_id?: string | null
          registration_fee?: number
        }
        Relationships: [
          {
            foreignKeyName: "fee_structures_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_materials: {
        Row: {
          class_id: string
          created_at: string
          description: string | null
          id: string
          material_type: string | null
          title: string
          trainer_id: string
          url: string
        }
        Insert: {
          class_id: string
          created_at?: string
          description?: string | null
          id?: string
          material_type?: string | null
          title: string
          trainer_id: string
          url: string
        }
        Update: {
          class_id?: string
          created_at?: string
          description?: string | null
          id?: string
          material_type?: string | null
          title?: string
          trainer_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_materials_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_requests: {
        Row: {
          created_at: string
          id: string
          leave_date: string
          reason: string
          return_date: string
          review_comment: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["leave_status"] | null
          trainer_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          leave_date: string
          reason: string
          return_date: string
          review_comment?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["leave_status"] | null
          trainer_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          leave_date?: string
          reason?: string
          return_date?: string
          review_comment?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["leave_status"] | null
          trainer_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      notices: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          holiday_date: string | null
          id: string
          is_active: boolean | null
          is_holiday: boolean | null
          notice_type: string | null
          target_roles: Database["public"]["Enums"]["app_role"][] | null
          title: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          holiday_date?: string | null
          id?: string
          is_active?: boolean | null
          is_holiday?: boolean | null
          notice_type?: string | null
          target_roles?: Database["public"]["Enums"]["app_role"][] | null
          title: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          holiday_date?: string | null
          id?: string
          is_active?: boolean | null
          is_holiday?: boolean | null
          notice_type?: string | null
          target_roles?: Database["public"]["Enums"]["app_role"][] | null
          title?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          notes: string | null
          payment_method: string | null
          payment_type: string
          recorded_by: string | null
          status: Database["public"]["Enums"]["payment_status"] | null
          student_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          payment_type: string
          recorded_by?: string | null
          status?: Database["public"]["Enums"]["payment_status"] | null
          student_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          payment_type?: string
          recorded_by?: string | null
          status?: Database["public"]["Enums"]["payment_status"] | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          is_active: boolean | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          is_active?: boolean | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      programs: {
        Row: {
          created_at: string
          description: string | null
          eligible_levels: Database["public"]["Enums"]["student_level"][]
          end_date: string
          id: string
          is_active: boolean | null
          name: string
          start_date: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          eligible_levels: Database["public"]["Enums"]["student_level"][]
          end_date: string
          id?: string
          is_active?: boolean | null
          name: string
          start_date: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          eligible_levels?: Database["public"]["Enums"]["student_level"][]
          end_date?: string
          id?: string
          is_active?: boolean | null
          name?: string
          start_date?: string
          updated_at?: string
        }
        Relationships: []
      }
      salaries: {
        Row: {
          amount: number
          created_at: string
          employee_id: string
          id: string
          is_paid: boolean | null
          paid_by: string | null
          payment_date: string | null
          payment_period: string
        }
        Insert: {
          amount: number
          created_at?: string
          employee_id: string
          id?: string
          is_paid?: boolean | null
          paid_by?: string | null
          payment_date?: string | null
          payment_period: string
        }
        Update: {
          amount?: number
          created_at?: string
          employee_id?: string
          id?: string
          is_paid?: boolean | null
          paid_by?: string | null
          payment_date?: string | null
          payment_period?: string
        }
        Relationships: []
      }
      salary_advances: {
        Row: {
          amount: number
          created_at: string
          employee_id: string
          id: string
          reason: string
          review_comment: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["leave_status"] | null
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          employee_id: string
          id?: string
          reason: string
          review_comment?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["leave_status"] | null
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          employee_id?: string
          id?: string
          reason?: string
          review_comment?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["leave_status"] | null
          updated_at?: string
        }
        Relationships: []
      }
      students: {
        Row: {
          alternative_whatsapp: string | null
          class_id: string | null
          created_at: string
          generated_password: string
          has_whatsapp: boolean | null
          id: string
          is_active: boolean | null
          level: Database["public"]["Enums"]["student_level"]
          logbook_submitted: boolean | null
          preferred_shift: Database["public"]["Enums"]["shift_type"]
          registration_fee_paid: boolean | null
          registration_number: string
          school_name: string
          updated_at: string
          user_id: string
          whatsapp_verified: boolean | null
        }
        Insert: {
          alternative_whatsapp?: string | null
          class_id?: string | null
          created_at?: string
          generated_password: string
          has_whatsapp?: boolean | null
          id?: string
          is_active?: boolean | null
          level: Database["public"]["Enums"]["student_level"]
          logbook_submitted?: boolean | null
          preferred_shift: Database["public"]["Enums"]["shift_type"]
          registration_fee_paid?: boolean | null
          registration_number: string
          school_name: string
          updated_at?: string
          user_id: string
          whatsapp_verified?: boolean | null
        }
        Update: {
          alternative_whatsapp?: string | null
          class_id?: string | null
          created_at?: string
          generated_password?: string
          has_whatsapp?: boolean | null
          id?: string
          is_active?: boolean | null
          level?: Database["public"]["Enums"]["student_level"]
          logbook_submitted?: boolean | null
          preferred_shift?: Database["public"]["Enums"]["shift_type"]
          registration_fee_paid?: boolean | null
          registration_number?: string
          school_name?: string
          updated_at?: string
          user_id?: string
          whatsapp_verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "students_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "secretary" | "trainer" | "finance" | "student"
      leave_status: "pending" | "approved" | "rejected"
      payment_status: "pending" | "paid" | "partial"
      shift_type: "morning" | "afternoon"
      student_level: "L3" | "L4" | "L5"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "secretary", "trainer", "finance", "student"],
      leave_status: ["pending", "approved", "rejected"],
      payment_status: ["pending", "paid", "partial"],
      shift_type: ["morning", "afternoon"],
      student_level: ["L3", "L4", "L5"],
    },
  },
} as const
