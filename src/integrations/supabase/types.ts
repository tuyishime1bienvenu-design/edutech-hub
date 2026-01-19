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
      contact_messages: {
        Row: {
          created_at: string
          email: string
          first_name: string
          id: string
          inquiry_type: string | null
          last_name: string
          message: string
          phone: string | null
          replied_at: string | null
          replied_by: string | null
          reply: string | null
          status: string | null
          subject: string
        }
        Insert: {
          created_at?: string
          email: string
          first_name: string
          id?: string
          inquiry_type?: string | null
          last_name: string
          message: string
          phone?: string | null
          replied_at?: string | null
          replied_by?: string | null
          reply?: string | null
          status?: string | null
          subject: string
        }
        Update: {
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          inquiry_type?: string | null
          last_name?: string
          message?: string
          phone?: string | null
          replied_at?: string | null
          replied_by?: string | null
          reply?: string | null
          status?: string | null
          subject?: string
        }
        Relationships: []
      }
      equipment: {
        Row: {
          assigned_to: string | null
          assigned_to_id: string | null
          category: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          location: string | null
          model: string | null
          name: string
          notes: string | null
          purchase_cost: number | null
          purchase_date: string | null
          serial_number: string | null
          status: string | null
          updated_at: string
          warranty_expiry: string | null
        }
        Insert: {
          assigned_to?: string | null
          assigned_to_id?: string | null
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          location?: string | null
          model?: string | null
          name: string
          notes?: string | null
          purchase_cost?: number | null
          purchase_date?: string | null
          serial_number?: string | null
          status?: string | null
          updated_at?: string
          warranty_expiry?: string | null
        }
        Update: {
          assigned_to?: string | null
          assigned_to_id?: string | null
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          location?: string | null
          model?: string | null
          name?: string
          notes?: string | null
          purchase_cost?: number | null
          purchase_date?: string | null
          serial_number?: string | null
          status?: string | null
          updated_at?: string
          warranty_expiry?: string | null
        }
        Relationships: []
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
      gallery_images: {
        Row: {
          category: string | null
          created_at: string
          created_by: string | null
          description: string | null
          display_order: number | null
          id: string
          image_url: string
          is_active: boolean | null
          tags: string[] | null
          title: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          image_url: string
          is_active?: boolean | null
          tags?: string[] | null
          title: string
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string
          is_active?: boolean | null
          tags?: string[] | null
          title?: string
        }
        Relationships: []
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
      material_transactions: {
        Row: {
          created_at: string
          id: string
          is_returned: boolean | null
          material_id: string
          notes: string | null
          purpose: string | null
          quantity: number
          recipient_id: string | null
          recipient_name: string | null
          recorded_by: string | null
          return_date: string | null
          return_notes: string | null
          total_cost: number | null
          transaction_date: string
          transaction_type: string
          unit_cost: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_returned?: boolean | null
          material_id: string
          notes?: string | null
          purpose?: string | null
          quantity: number
          recipient_id?: string | null
          recipient_name?: string | null
          recorded_by?: string | null
          return_date?: string | null
          return_notes?: string | null
          total_cost?: number | null
          transaction_date?: string
          transaction_type: string
          unit_cost?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          is_returned?: boolean | null
          material_id?: string
          notes?: string | null
          purpose?: string | null
          quantity?: number
          recipient_id?: string | null
          recipient_name?: string | null
          recorded_by?: string | null
          return_date?: string | null
          return_notes?: string | null
          total_cost?: number | null
          transaction_date?: string
          transaction_type?: string
          unit_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "material_transactions_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials_inventory"
            referencedColumns: ["id"]
          },
        ]
      }
      materials_inventory: {
        Row: {
          barcode: string | null
          category: string | null
          created_at: string
          current_quantity: number | null
          description: string | null
          id: string
          location: string | null
          minimum_quantity: number | null
          name: string
          supplier: string | null
          type: string | null
          unit: string | null
          unit_cost: number | null
          updated_at: string
        }
        Insert: {
          barcode?: string | null
          category?: string | null
          created_at?: string
          current_quantity?: number | null
          description?: string | null
          id?: string
          location?: string | null
          minimum_quantity?: number | null
          name: string
          supplier?: string | null
          type?: string | null
          unit?: string | null
          unit_cost?: number | null
          updated_at?: string
        }
        Update: {
          barcode?: string | null
          category?: string | null
          created_at?: string
          current_quantity?: number | null
          description?: string | null
          id?: string
          location?: string | null
          minimum_quantity?: number | null
          name?: string
          supplier?: string | null
          type?: string | null
          unit?: string | null
          unit_cost?: number | null
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
      services: {
        Row: {
          color: string | null
          created_at: string
          description: string
          display_order: number | null
          features: string[] | null
          icon: string | null
          id: string
          is_active: boolean | null
          price: string | null
          title: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description: string
          display_order?: number | null
          features?: string[] | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          price?: string | null
          title: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string
          display_order?: number | null
          features?: string[] | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          price?: string | null
          title?: string
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
      vacancies: {
        Row: {
          benefits: string[] | null
          created_at: string
          created_by: string | null
          deadline: string | null
          department: string
          description: string | null
          id: string
          is_active: boolean | null
          location: string | null
          requirements: string[] | null
          responsibilities: string[] | null
          salary_max: number | null
          salary_min: number | null
          title: string
          type: string | null
        }
        Insert: {
          benefits?: string[] | null
          created_at?: string
          created_by?: string | null
          deadline?: string | null
          department: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          location?: string | null
          requirements?: string[] | null
          responsibilities?: string[] | null
          salary_max?: number | null
          salary_min?: number | null
          title: string
          type?: string | null
        }
        Update: {
          benefits?: string[] | null
          created_at?: string
          created_by?: string | null
          deadline?: string | null
          department?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          location?: string | null
          requirements?: string[] | null
          responsibilities?: string[] | null
          salary_max?: number | null
          salary_min?: number | null
          title?: string
          type?: string | null
        }
        Relationships: []
      }
      visitors: {
        Row: {
          created_at: string
          departure_time: string | null
          email: string | null
          full_name: string
          host_name: string | null
          id: string
          notes: string | null
          organization: string | null
          phone: string | null
          purpose: string
          recorded_by: string | null
          visited_at: string
        }
        Insert: {
          created_at?: string
          departure_time?: string | null
          email?: string | null
          full_name: string
          host_name?: string | null
          id?: string
          notes?: string | null
          organization?: string | null
          phone?: string | null
          purpose: string
          recorded_by?: string | null
          visited_at?: string
        }
        Update: {
          created_at?: string
          departure_time?: string | null
          email?: string | null
          full_name?: string
          host_name?: string | null
          id?: string
          notes?: string | null
          organization?: string | null
          phone?: string | null
          purpose?: string
          recorded_by?: string | null
          visited_at?: string
        }
        Relationships: []
      }
      wifi_networks: {
        Row: {
          assigned_roles: string[] | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          password: string
        }
        Insert: {
          assigned_roles?: string[] | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          password: string
        }
        Update: {
          assigned_roles?: string[] | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          password?: string
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
