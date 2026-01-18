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
      certificate_templates: {
        Row: {
          additional_text: string | null
          background_color: string | null
          border_style: string | null
          created_at: string
          created_by: string | null
          font_family: string | null
          id: string
          include_dates: boolean | null
          include_registration_number: boolean | null
          is_active: boolean | null
          logo_url: string | null
          message: string
          name: string
          text_color: string | null
          updated_at: string
        }
        Insert: {
          additional_text?: string | null
          background_color?: string | null
          border_style?: string | null
          created_at?: string
          created_by?: string | null
          font_family?: string | null
          id?: string
          include_dates?: boolean | null
          include_registration_number?: boolean | null
          is_active?: boolean | null
          logo_url?: string | null
          message: string
          name: string
          text_color?: string | null
          updated_at?: string
        }
        Update: {
          additional_text?: string | null
          background_color?: string | null
          border_style?: string | null
          created_at?: string
          created_by?: string | null
          font_family?: string | null
          id?: string
          include_dates?: boolean | null
          include_registration_number?: boolean | null
          is_active?: boolean | null
          logo_url?: string | null
          message?: string
          name?: string
          text_color?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      class_curriculum: {
        Row: {
          class_id: string
          completed_by: string | null
          completed_date: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_completed: boolean | null
          order_index: number | null
          topic: string
          updated_at: string
        }
        Insert: {
          class_id: string
          completed_by?: string | null
          completed_date?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_completed?: boolean | null
          order_index?: number | null
          topic: string
          updated_at?: string
        }
        Update: {
          class_id?: string
          completed_by?: string | null
          completed_date?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_completed?: boolean | null
          order_index?: number | null
          topic?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_curriculum_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
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
      class_trainers: {
        Row: {
          class_id: string
          created_at: string
          id: string
          is_primary: boolean | null
          trainer_id: string
        }
        Insert: {
          class_id: string
          created_at?: string
          id?: string
          is_primary?: boolean | null
          trainer_id: string
        }
        Update: {
          class_id?: string
          created_at?: string
          id?: string
          is_primary?: boolean | null
          trainer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_trainers_class_id_fkey"
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
      expenses: {
        Row: {
          amount: number
          category: Database["public"]["Enums"]["expense_category"]
          created_at: string
          description: string
          expense_date: string
          id: string
          notes: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          receipt_url: string | null
          recorded_by: string
          updated_at: string
        }
        Insert: {
          amount: number
          category: Database["public"]["Enums"]["expense_category"]
          created_at?: string
          description: string
          expense_date: string
          id?: string
          notes?: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          receipt_url?: string | null
          recorded_by: string
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: Database["public"]["Enums"]["expense_category"]
          created_at?: string
          description?: string
          expense_date?: string
          id?: string
          notes?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          receipt_url?: string | null
          recorded_by?: string
          updated_at?: string
        }
        Relationships: []
      }
      payroll: {
        Row: {
          advances_deducted: number
          base_salary: number
          created_at: string
          employee_id: string
          id: string
          notes: string | null
          payment_date: string | null
          period_end: string
          period_start: string
          processed_at: string | null
          processed_by: string | null
          status: Database["public"]["Enums"]["payroll_status"]
          total_payable: number
          updated_at: string
        }
        Insert: {
          advances_deducted?: number
          base_salary: number
          created_at?: string
          employee_id: string
          id?: string
          notes?: string | null
          payment_date?: string | null
          period_end: string
          period_start: string
          processed_at?: string | null
          processed_by?: string | null
          status?: Database["public"]["Enums"]["payroll_status"]
          total_payable: number
          updated_at?: string
        }
        Update: {
          advances_deducted?: number
          base_salary?: number
          created_at?: string
          employee_id?: string
          id?: string
          notes?: string | null
          payment_date?: string | null
          period_end?: string
          period_start?: string
          processed_at?: string | null
          processed_by?: string | null
          status?: Database["public"]["Enums"]["payroll_status"]
          total_payable?: number
          updated_at?: string
        }
        Relationships: []
      }
      equipment: {
        Row: {
          assigned_to: string | null
          category: string | null
          created_at: string
          description: string | null
          id: string
          location: string | null
          model: string | null
          name: string
          notes: string | null
          purchase_cost: number | null
          purchase_date: string | null
          serial_number: string | null
          status: Database["public"]["Enums"]["equipment_status"]
          updated_at: string
          warranty_expiry: string | null
        }
        Insert: {
          assigned_to?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          location?: string | null
          model?: string | null
          name: string
          notes?: string | null
          purchase_cost?: number | null
          purchase_date?: string | null
          serial_number?: string | null
          status?: Database["public"]["Enums"]["equipment_status"]
          updated_at?: string
          warranty_expiry?: string | null
        }
        Update: {
          assigned_to?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          location?: string | null
          model?: string | null
          name?: string
          notes?: string | null
          purchase_cost?: number | null
          purchase_date?: string | null
          serial_number?: string | null
          status?: Database["public"]["Enums"]["equipment_status"]
          updated_at?: string
          warranty_expiry?: string | null
        }
        Relationships: []
      }
      materials_inventory: {
        Row: {
          barcode: string | null
          category: string | null
          created_at: string
          current_quantity: number
          description: string | null
          id: string
          is_active: boolean
          location: string | null
          minimum_quantity: number
          name: string
          supplier: string | null
          type: Database["public"]["Enums"]["material_type"]
          unit: string
          unit_cost: number | null
          updated_at: string
        }
        Insert: {
          barcode?: string | null
          category?: string | null
          created_at?: string
          current_quantity?: number
          description?: string | null
          id?: string
          is_active?: boolean
          location?: string | null
          minimum_quantity?: number
          name: string
          supplier?: string | null
          type: Database["public"]["Enums"]["material_type"]
          unit?: string
          unit_cost?: number | null
          updated_at?: string
        }
        Update: {
          barcode?: string | null
          category?: string | null
          created_at?: string
          current_quantity?: number
          description?: string | null
          id?: string
          is_active?: boolean
          location?: string | null
          minimum_quantity?: number
          name?: string
          supplier?: string | null
          type?: Database["public"]["Enums"]["material_type"]
          unit?: string
          unit_cost?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      material_transactions: {
        Row: {
          created_at: string
          id: string
          material_id: string
          notes: string | null
          purpose: string | null
          quantity: number
          recipient_id: string | null
          recipient_name: string | null
          recorded_by: string
          total_cost: number | null
          transaction_date: string
          transaction_type: Database["public"]["Enums"]["transaction_type"]
          unit_cost: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          material_id: string
          notes?: string | null
          purpose?: string | null
          quantity: number
          recipient_id?: string | null
          recipient_name?: string | null
          recorded_by: string
          total_cost?: number | null
          transaction_date?: string
          transaction_type: Database["public"]["Enums"]["transaction_type"]
          unit_cost?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          material_id?: string
          notes?: string | null
          purpose?: string | null
          quantity?: number
          recipient_id?: string | null
          recipient_name?: string | null
          recorded_by?: string
          total_cost?: number | null
          transaction_date?: string
          transaction_type?: Database["public"]["Enums"]["transaction_type"]
          unit_cost?: number | null
        }
        Relationships: []
      }
      wifi_networks: {
        Row: {
          assigned_roles: Database["public"]["Enums"]["app_role"][] | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          password: string
          updated_at: string
        }
        Insert: {
          assigned_roles?: Database["public"]["Enums"]["app_role"][] | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          password: string
          updated_at?: string
        }
        Update: {
          assigned_roles?: Database["public"]["Enums"]["app_role"][] | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          password?: string
          updated_at?: string
        }
        Relationships: []
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
      app_role: "admin" | "secretary" | "trainer" | "finance" | "student" | "it"
      expense_category: "office_supplies" | "utilities" | "rent" | "equipment" | "software" | "training" | "marketing" | "maintenance" | "travel" | "other"
      leave_status: "pending" | "approved" | "rejected"
      payment_method: "cash" | "bank_transfer" | "check" | "credit_card" | "other"
      payment_status: "pending" | "paid" | "partial"
      payroll_status: "pending" | "processed" | "paid" | "cancelled"
      shift_type: "morning" | "afternoon"
      student_level: "L3" | "L4" | "L5"
      equipment_status: "active" | "maintenance" | "repair" | "retired" | "lost"
      material_type: "consumable" | "non_consumable" | "equipment"
      transaction_type: "in" | "out" | "adjustment"
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
