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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      axes: {
        Row: {
          color: string | null
          id: string
          nombre: string
          numero: number
          sort_order: number
        }
        Insert: {
          color?: string | null
          id?: string
          nombre: string
          numero: number
          sort_order?: number
        }
        Update: {
          color?: string | null
          id?: string
          nombre?: string
          numero?: number
          sort_order?: number
        }
        Relationships: []
      }
      courses: {
        Row: {
          active: boolean
          anio_grado: string
          ciclo: string | null
          display_name: string
          division: string
          id: string
          nivel: string
          sort_order: number
        }
        Insert: {
          active?: boolean
          anio_grado: string
          ciclo?: string | null
          display_name: string
          division: string
          id?: string
          nivel: string
          sort_order?: number
        }
        Update: {
          active?: boolean
          anio_grado?: string
          ciclo?: string | null
          display_name?: string
          division?: string
          id?: string
          nivel?: string
          sort_order?: number
        }
        Relationships: []
      }
      encounters: {
        Row: {
          actividades: string
          axis_id: string
          compartido_familia: boolean
          contenidos: string
          course_id: string
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          docente: string
          fecha_encuentro: string
          id: string
          product_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          actividades: string
          axis_id: string
          compartido_familia: boolean
          contenidos: string
          course_id: string
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          docente: string
          fecha_encuentro: string
          id?: string
          product_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          actividades?: string
          axis_id?: string
          compartido_familia?: boolean
          contenidos?: string
          course_id?: string
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          docente?: string
          fecha_encuentro?: string
          id?: string
          product_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "encounters_axis_id_fkey"
            columns: ["axis_id"]
            isOneToOne: false
            referencedRelation: "axes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "encounters_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "encounters_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "encounters_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "encounters_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notificaciones: {
        Row: {
          created_at: string
          destinatario_id: string
          id: string
          leido: boolean
          mensaje: string
          situacion_id: string | null
          tipo: string
        }
        Insert: {
          created_at?: string
          destinatario_id: string
          id?: string
          leido?: boolean
          mensaje: string
          situacion_id?: string | null
          tipo: string
        }
        Update: {
          created_at?: string
          destinatario_id?: string
          id?: string
          leido?: boolean
          mensaje?: string
          situacion_id?: string | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "notificaciones_destinatario_id_fkey"
            columns: ["destinatario_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notificaciones_situacion_id_fkey"
            columns: ["situacion_id"]
            isOneToOne: false
            referencedRelation: "situaciones"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean
          id: string
          nombre: string
          sort_order: number
        }
        Insert: {
          active?: boolean
          id?: string
          nombre: string
          sort_order?: number
        }
        Update: {
          active?: boolean
          id?: string
          nombre?: string
          sort_order?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          access_level: string
          active: boolean
          alcance: string
          cargo: string
          created_at: string
          full_name: string
          id: string
          roles: string[]
          ver_notas_eoe: boolean
          ver_situaciones_eoe: boolean
        }
        Insert: {
          access_level?: string
          active?: boolean
          alcance?: string
          cargo?: string
          created_at?: string
          full_name: string
          id: string
          roles?: string[]
          ver_notas_eoe?: boolean
          ver_situaciones_eoe?: boolean
        }
        Update: {
          access_level?: string
          active?: boolean
          alcance?: string
          cargo?: string
          created_at?: string
          full_name?: string
          id?: string
          roles?: string[]
          ver_notas_eoe?: boolean
          ver_situaciones_eoe?: boolean
        }
        Relationships: []
      }
      situacion_historial: {
        Row: {
          autor_id: string | null
          campo: string
          created_at: string
          id: string
          situacion_id: string
          valor_anterior: string | null
          valor_nuevo: string | null
        }
        Insert: {
          autor_id?: string | null
          campo: string
          created_at?: string
          id?: string
          situacion_id: string
          valor_anterior?: string | null
          valor_nuevo?: string | null
        }
        Update: {
          autor_id?: string | null
          campo?: string
          created_at?: string
          id?: string
          situacion_id?: string
          valor_anterior?: string | null
          valor_nuevo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "situacion_historial_autor_id_fkey"
            columns: ["autor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "situacion_historial_situacion_id_fkey"
            columns: ["situacion_id"]
            isOneToOne: false
            referencedRelation: "situaciones"
            referencedColumns: ["id"]
          },
        ]
      }
      situacion_notas: {
        Row: {
          autor_id: string
          created_at: string
          id: string
          nota: string
          situacion_id: string
        }
        Insert: {
          autor_id: string
          created_at?: string
          id?: string
          nota: string
          situacion_id: string
        }
        Update: {
          autor_id?: string
          created_at?: string
          id?: string
          nota?: string
          situacion_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "situacion_notas_autor_id_fkey"
            columns: ["autor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "situacion_notas_situacion_id_fkey"
            columns: ["situacion_id"]
            isOneToOne: false
            referencedRelation: "situaciones"
            referencedColumns: ["id"]
          },
        ]
      }
      situaciones: {
        Row: {
          course_id: string
          created_at: string
          descripcion: string
          docente_id: string
          encounter_id: string | null
          estado: string
          id: string
          nivel: string
          responsable_id: string | null
          titulo: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          course_id: string
          created_at?: string
          descripcion: string
          docente_id: string
          encounter_id?: string | null
          estado?: string
          id?: string
          nivel: string
          responsable_id?: string | null
          titulo: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          course_id?: string
          created_at?: string
          descripcion?: string
          docente_id?: string
          encounter_id?: string | null
          estado?: string
          id?: string
          nivel?: string
          responsable_id?: string | null
          titulo?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "situaciones_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "situaciones_docente_id_fkey"
            columns: ["docente_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "situaciones_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "situaciones_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "situaciones_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tareas_eoe: {
        Row: {
          autor_id: string
          course_id: string | null
          created_at: string
          descripcion: string | null
          estado: string
          id: string
          nivel: string
          situacion_id: string | null
          titulo: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          autor_id: string
          course_id?: string | null
          created_at?: string
          descripcion?: string | null
          estado?: string
          id?: string
          nivel: string
          situacion_id?: string | null
          titulo: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          autor_id?: string
          course_id?: string | null
          created_at?: string
          descripcion?: string | null
          estado?: string
          id?: string
          nivel?: string
          situacion_id?: string | null
          titulo?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tareas_eoe_autor_id_fkey"
            columns: ["autor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tareas_eoe_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tareas_eoe_situacion_id_fkey"
            columns: ["situacion_id"]
            isOneToOne: false
            referencedRelation: "situaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tareas_eoe_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_manage_personal: { Args: never; Returns: boolean }
      course_in_scope: { Args: { p_course_id: string }; Returns: boolean }
      has_role: { Args: { p_role: string }; Returns: boolean }
      is_active_directivo: { Args: never; Returns: boolean }
      my_alcance: { Args: never; Returns: string }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
