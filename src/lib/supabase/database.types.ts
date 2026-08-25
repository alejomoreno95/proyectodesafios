export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
          cargo: string
          created_at: string
          full_name: string
          id: string
        }
        Insert: {
          access_level?: string
          active?: boolean
          cargo?: string
          created_at?: string
          full_name: string
          id: string
        }
        Update: {
          access_level?: string
          active?: boolean
          cargo?: string
          created_at?: string
          full_name?: string
          id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_active_directivo: { Args: never; Returns: boolean }
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

export const Constants = {
  public: {
    Enums: {},
  },
} as const
