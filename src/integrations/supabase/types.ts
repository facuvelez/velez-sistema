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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      alineador_vacaciones: {
        Row: {
          created_at: string
          created_by_username: string | null
          es_enfermedad: boolean
          fecha_desde: string
          fecha_hasta: string
          id: string
          motivo: string | null
        }
        Insert: {
          created_at?: string
          created_by_username?: string | null
          es_enfermedad?: boolean
          fecha_desde: string
          fecha_hasta: string
          id?: string
          motivo?: string | null
        }
        Update: {
          created_at?: string
          created_by_username?: string | null
          es_enfermedad?: boolean
          fecha_desde?: string
          fecha_hasta?: string
          id?: string
          motivo?: string | null
        }
        Relationships: []
      }
      appointments: {
        Row: {
          appointment_date: string
          client_id: string
          client_phone: string | null
          completed_at: string | null
          completed_by_username: string | null
          created_at: string
          deleted_at: string | null
          deleted_by_username: string | null
          id: string
          kilometraje: number | null
          notes: string | null
          reminder_sent_1h: boolean | null
          reminder_sent_24h: boolean | null
          service_type: string
          status: string
          updated_at: string
          vehicle_info: string | null
          whatsapp_sent: boolean
        }
        Insert: {
          appointment_date: string
          client_id: string
          client_phone?: string | null
          completed_at?: string | null
          completed_by_username?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_by_username?: string | null
          id?: string
          kilometraje?: number | null
          notes?: string | null
          reminder_sent_1h?: boolean | null
          reminder_sent_24h?: boolean | null
          service_type: string
          status?: string
          updated_at?: string
          vehicle_info?: string | null
          whatsapp_sent?: boolean
        }
        Update: {
          appointment_date?: string
          client_id?: string
          client_phone?: string | null
          completed_at?: string | null
          completed_by_username?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_by_username?: string | null
          id?: string
          kilometraje?: number | null
          notes?: string | null
          reminder_sent_1h?: boolean | null
          reminder_sent_24h?: boolean | null
          service_type?: string
          status?: string
          updated_at?: string
          vehicle_info?: string | null
          whatsapp_sent?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "appointments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      bot_proactive_notes: {
        Row: {
          last_sent_at: string
          phone_number: string
          topic: string
        }
        Insert: {
          last_sent_at?: string
          phone_number: string
          topic: string
        }
        Update: {
          last_sent_at?: string
          phone_number?: string
          topic?: string
        }
        Relationships: []
      }
      categorias_config: {
        Row: {
          rubro: string
          updated_at: string
          visible: boolean
        }
        Insert: {
          rubro: string
          updated_at?: string
          visible?: boolean
        }
        Update: {
          rubro?: string
          updated_at?: string
          visible?: boolean
        }
        Relationships: []
      }
      cheques: {
        Row: {
          amount: number
          bank_name: string
          cbu_number: string | null
          cheque_number: string
          cheque_type: string
          client_id: string
          created_at: string
          debt_payment_id: string | null
          holder_name: string
          id: string
          image_url: string | null
          issuance_date: string
          notes: string | null
          payment_date: string
          service_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          bank_name: string
          cbu_number?: string | null
          cheque_number: string
          cheque_type?: string
          client_id: string
          created_at?: string
          debt_payment_id?: string | null
          holder_name: string
          id?: string
          image_url?: string | null
          issuance_date: string
          notes?: string | null
          payment_date: string
          service_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          bank_name?: string
          cbu_number?: string | null
          cheque_number?: string
          cheque_type?: string
          client_id?: string
          created_at?: string
          debt_payment_id?: string | null
          holder_name?: string
          id?: string
          image_url?: string | null
          issuance_date?: string
          notes?: string | null
          payment_date?: string
          service_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cheques_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cheques_debt_payment_id_fkey"
            columns: ["debt_payment_id"]
            isOneToOne: false
            referencedRelation: "debt_payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cheques_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          company_name: string | null
          created_at: string
          email: string | null
          first_name: string
          id: string
          last_name: string
          notes: string | null
          phone: string | null
          tax_id: string | null
          type: Database["public"]["Enums"]["client_type"]
          updated_at: string
        }
        Insert: {
          address?: string | null
          company_name?: string | null
          created_at?: string
          email?: string | null
          first_name: string
          id?: string
          last_name: string
          notes?: string | null
          phone?: string | null
          tax_id?: string | null
          type?: Database["public"]["Enums"]["client_type"]
          updated_at?: string
        }
        Update: {
          address?: string | null
          company_name?: string | null
          created_at?: string
          email?: string | null
          first_name?: string
          id?: string
          last_name?: string
          notes?: string | null
          phone?: string | null
          tax_id?: string | null
          type?: Database["public"]["Enums"]["client_type"]
          updated_at?: string
        }
        Relationships: []
      }
      competidores: {
        Row: {
          activo: boolean
          created_at: string
          id: string
          nombre: string
          seller_id_mercadolibre: string | null
          updated_at: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          id?: string
          nombre: string
          seller_id_mercadolibre?: string | null
          updated_at?: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          id?: string
          nombre?: string
          seller_id_mercadolibre?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      debt_history: {
        Row: {
          client_id: string
          created_at: string
          days_to_cancel: number
          debt_created_at: string
          debt_id: string
          fully_paid_at: string
          id: string
          original_amount: number
          service_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          days_to_cancel: number
          debt_created_at: string
          debt_id: string
          fully_paid_at?: string
          id?: string
          original_amount: number
          service_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          days_to_cancel?: number
          debt_created_at?: string
          debt_id?: string
          fully_paid_at?: string
          id?: string
          original_amount?: number
          service_id?: string
        }
        Relationships: []
      }
      debt_payments: {
        Row: {
          amount: number
          created_at: string
          debt_id: string
          id: string
          notes: string | null
          payment_date: string
          payment_method: Database["public"]["Enums"]["payment_method"]
        }
        Insert: {
          amount: number
          created_at?: string
          debt_id: string
          id?: string
          notes?: string | null
          payment_date?: string
          payment_method: Database["public"]["Enums"]["payment_method"]
        }
        Update: {
          amount?: number
          created_at?: string
          debt_id?: string
          id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
        }
        Relationships: [
          {
            foreignKeyName: "debt_payments_debt_id_fkey"
            columns: ["debt_id"]
            isOneToOne: false
            referencedRelation: "debts"
            referencedColumns: ["id"]
          },
        ]
      }
      debts: {
        Row: {
          client_id: string
          created_at: string
          id: string
          original_amount: number
          remaining_amount: number
          service_id: string
          status: string | null
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          original_amount: number
          remaining_amount: number
          service_id: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          original_amount?: number
          remaining_amount?: number
          service_id?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "debts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "debts_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: true
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      marca_categoria_oculta: {
        Row: {
          marca: string
          rubro: string
          updated_at: string
          visible: boolean
        }
        Insert: {
          marca: string
          rubro: string
          updated_at?: string
          visible?: boolean
        }
        Update: {
          marca?: string
          rubro?: string
          updated_at?: string
          visible?: boolean
        }
        Relationships: []
      }
      matches_producto_competidor: {
        Row: {
          competidor_id: string
          confirmado: boolean
          created_at: string
          id: string
          producto_id: string
          publication_id: string
          titulo_publicacion: string | null
          updated_at: string
        }
        Insert: {
          competidor_id: string
          confirmado?: boolean
          created_at?: string
          id?: string
          producto_id: string
          publication_id: string
          titulo_publicacion?: string | null
          updated_at?: string
        }
        Update: {
          competidor_id?: string
          confirmado?: boolean
          created_at?: string
          id?: string
          producto_id?: string
          publication_id?: string
          titulo_publicacion?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "matches_producto_competidor_competidor_id_fkey"
            columns: ["competidor_id"]
            isOneToOne: false
            referencedRelation: "competidores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_producto_competidor_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
        ]
      }
      mayorista_categorias: {
        Row: {
          rubro: string
          updated_at: string
          visible: boolean
        }
        Insert: {
          rubro: string
          updated_at?: string
          visible?: boolean
        }
        Update: {
          rubro?: string
          updated_at?: string
          visible?: boolean
        }
        Relationships: []
      }
      precios_competencia: {
        Row: {
          competidor_id: string
          created_at: string
          fecha_relevamiento: string
          id: string
          precio: number
          producto_id: string
          publication_id: string
          stock_disponible: number | null
          titulo_publicacion: string | null
        }
        Insert: {
          competidor_id: string
          created_at?: string
          fecha_relevamiento?: string
          id?: string
          precio: number
          producto_id: string
          publication_id: string
          stock_disponible?: number | null
          titulo_publicacion?: string | null
        }
        Update: {
          competidor_id?: string
          created_at?: string
          fecha_relevamiento?: string
          id?: string
          precio?: number
          producto_id?: string
          publication_id?: string
          stock_disponible?: number | null
          titulo_publicacion?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "precios_competencia_competidor_id_fkey"
            columns: ["competidor_id"]
            isOneToOne: false
            referencedRelation: "competidores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "precios_competencia_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
        ]
      }
      presupuestos_log: {
        Row: {
          cliente: string
          created_at: string
          generado_por: string | null
          generado_por_username: string | null
          id: string
          vehiculo: string | null
        }
        Insert: {
          cliente: string
          created_at?: string
          generado_por?: string | null
          generado_por_username?: string | null
          id?: string
          vehiculo?: string | null
        }
        Update: {
          cliente?: string
          created_at?: string
          generado_por?: string | null
          generado_por_username?: string | null
          id?: string
          vehiculo?: string | null
        }
        Relationships: []
      }
      price_flow_tiers: {
        Row: {
          cost_from: number
          cost_to: number | null
          created_at: string
          flow_id: string
          id: string
          public_mode: string
          public_value: number
          sort_order: number
          updated_at: string
          wholesale_mode: string
          wholesale_value: number
        }
        Insert: {
          cost_from: number
          cost_to?: number | null
          created_at?: string
          flow_id: string
          id?: string
          public_mode: string
          public_value?: number
          sort_order?: number
          updated_at?: string
          wholesale_mode: string
          wholesale_value?: number
        }
        Update: {
          cost_from?: number
          cost_to?: number | null
          created_at?: string
          flow_id?: string
          id?: string
          public_mode?: string
          public_value?: number
          sort_order?: number
          updated_at?: string
          wholesale_mode?: string
          wholesale_value?: number
        }
        Relationships: [
          {
            foreignKeyName: "price_flow_tiers_flow_id_fkey"
            columns: ["flow_id"]
            isOneToOne: false
            referencedRelation: "price_flows"
            referencedColumns: ["id"]
          },
        ]
      }
      price_flows: {
        Row: {
          created_at: string
          freight_fixed: number
          freight_percent: number
          freight_threshold: number
          id: string
          is_default: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          freight_fixed?: number
          freight_percent?: number
          freight_threshold?: number
          id?: string
          is_default?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          freight_fixed?: number
          freight_percent?: number
          freight_threshold?: number
          id?: string
          is_default?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      productos: {
        Row: {
          activo: boolean
          created_at: string
          id: string
          marca: string
          medida: string
          modelo: string
          precio_actual: number
          updated_at: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          id?: string
          marca: string
          medida: string
          modelo: string
          precio_actual?: number
          updated_at?: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          id?: string
          marca?: string
          medida?: string
          modelo?: string
          precio_actual?: number
          updated_at?: string
        }
        Relationships: []
      }
      productos_mayoristas: {
        Row: {
          created_at: string
          descripcion: string | null
          id: string
          marca: string | null
          medida: string | null
          origen: string
          precio: number | null
          rubro: string | null
          sku: string
          stock: number | null
          tipo_vehiculo: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          descripcion?: string | null
          id?: string
          marca?: string | null
          medida?: string | null
          origen?: string
          precio?: number | null
          rubro?: string | null
          sku: string
          stock?: number | null
          tipo_vehiculo?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          descripcion?: string | null
          id?: string
          marca?: string | null
          medida?: string | null
          origen?: string
          precio?: number | null
          rubro?: string | null
          sku?: string
          stock?: number | null
          tipo_vehiculo?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      service_prices: {
        Row: {
          category: string
          created_at: string
          id: string
          is_active: boolean | null
          item_name: string
          notes: string | null
          price: number
          service_type: string
          subcategory: string | null
          updated_at: string
          vehicle_type: string | null
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          item_name: string
          notes?: string | null
          price: number
          service_type: string
          subcategory?: string | null
          updated_at?: string
          vehicle_type?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          item_name?: string
          notes?: string | null
          price?: number
          service_type?: string
          subcategory?: string | null
          updated_at?: string
          vehicle_type?: string | null
        }
        Relationships: []
      }
      services: {
        Row: {
          amount_delivered: number
          category: string
          client_id: string
          company_representative: string | null
          created_at: string
          id: string
          notes: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          responsible_person: string | null
          secondary_payment_method:
            | Database["public"]["Enums"]["payment_method"]
            | null
          service_date: string
          service_items: Json | null
          service_type: string
          signature_data: string | null
          status: Database["public"]["Enums"]["service_status"]
          total_amount: number
          updated_at: string
          vehicle_info: string | null
        }
        Insert: {
          amount_delivered?: number
          category?: string
          client_id: string
          company_representative?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          responsible_person?: string | null
          secondary_payment_method?:
            | Database["public"]["Enums"]["payment_method"]
            | null
          service_date: string
          service_items?: Json | null
          service_type: string
          signature_data?: string | null
          status?: Database["public"]["Enums"]["service_status"]
          total_amount?: number
          updated_at?: string
          vehicle_info?: string | null
        }
        Update: {
          amount_delivered?: number
          category?: string
          client_id?: string
          company_representative?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          responsible_person?: string | null
          secondary_payment_method?:
            | Database["public"]["Enums"]["payment_method"]
            | null
          service_date?: string
          service_items?: Json | null
          service_type?: string
          signature_data?: string | null
          status?: Database["public"]["Enums"]["service_status"]
          total_amount?: number
          updated_at?: string
          vehicle_info?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "services_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_brands: {
        Row: {
          brand: string
          category: string | null
          construccion: string | null
          created_at: string
          display_brand: string | null
          id: string
          notes: string | null
          origen: string | null
          segment: string | null
          subcategoria: string | null
          supplier_id: string
          updated_at: string
          vehicle_types: string[]
        }
        Insert: {
          brand: string
          category?: string | null
          construccion?: string | null
          created_at?: string
          display_brand?: string | null
          id?: string
          notes?: string | null
          origen?: string | null
          segment?: string | null
          subcategoria?: string | null
          supplier_id: string
          updated_at?: string
          vehicle_types?: string[]
        }
        Update: {
          brand?: string
          category?: string | null
          construccion?: string | null
          created_at?: string
          display_brand?: string | null
          id?: string
          notes?: string | null
          origen?: string | null
          segment?: string | null
          subcategoria?: string | null
          supplier_id?: string
          updated_at?: string
          vehicle_types?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "supplier_brands_category_fkey"
            columns: ["category"]
            isOneToOne: false
            referencedRelation: "supplier_categories"
            referencedColumns: ["name"]
          },
        ]
      }
      supplier_categories: {
        Row: {
          created_at: string
          name: string
        }
        Insert: {
          created_at?: string
          name: string
        }
        Update: {
          created_at?: string
          name?: string
        }
        Relationships: []
      }
      supplier_category_discounts: {
        Row: {
          brand: string | null
          category: string
          construccion: string | null
          created_at: string
          discount_percent_1: number
          discount_percent_2: number | null
          discount_percent_3: number | null
          discount_percent_4: number | null
          discount_percent_5: number | null
          id: string
          origen: string | null
          segment: string | null
          subcategoria: string | null
          supplier_id: string
          updated_at: string
        }
        Insert: {
          brand?: string | null
          category: string
          construccion?: string | null
          created_at?: string
          discount_percent_1?: number
          discount_percent_2?: number | null
          discount_percent_3?: number | null
          discount_percent_4?: number | null
          discount_percent_5?: number | null
          id?: string
          origen?: string | null
          segment?: string | null
          subcategoria?: string | null
          supplier_id: string
          updated_at?: string
        }
        Update: {
          brand?: string | null
          category?: string
          construccion?: string | null
          created_at?: string
          discount_percent_1?: number
          discount_percent_2?: number | null
          discount_percent_3?: number | null
          discount_percent_4?: number | null
          discount_percent_5?: number | null
          id?: string
          origen?: string | null
          segment?: string | null
          subcategoria?: string | null
          supplier_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_category_discounts_category_fkey"
            columns: ["category"]
            isOneToOne: false
            referencedRelation: "supplier_categories"
            referencedColumns: ["name"]
          },
          {
            foreignKeyName: "supplier_category_discounts_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_column_preferences: {
        Row: {
          brand: string | null
          category: string | null
          column_codigo: string | null
          column_descripcion: string | null
          column_marca: string | null
          column_medida: string | null
          column_precio: string
          column_stock: string | null
          created_at: string
          header_row: number | null
          id: string
          notes: string | null
          sheet_name_hint: string | null
          stock_zero_text_values: string[] | null
          supplier_id: string
          updated_at: string
        }
        Insert: {
          brand?: string | null
          category?: string | null
          column_codigo?: string | null
          column_descripcion?: string | null
          column_marca?: string | null
          column_medida?: string | null
          column_precio: string
          column_stock?: string | null
          created_at?: string
          header_row?: number | null
          id?: string
          notes?: string | null
          sheet_name_hint?: string | null
          stock_zero_text_values?: string[] | null
          supplier_id: string
          updated_at?: string
        }
        Update: {
          brand?: string | null
          category?: string | null
          column_codigo?: string | null
          column_descripcion?: string | null
          column_marca?: string | null
          column_medida?: string | null
          column_precio?: string
          column_stock?: string | null
          created_at?: string
          header_row?: number | null
          id?: string
          notes?: string | null
          sheet_name_hint?: string | null
          stock_zero_text_values?: string[] | null
          supplier_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_column_preferences_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_excel_templates: {
        Row: {
          column_codigo: string | null
          column_descripcion: string | null
          column_medida: string | null
          column_precio: string
          created_at: string
          header_row: number | null
          id: string
          sheet_name: string | null
          supplier_id: string
          updated_at: string
        }
        Insert: {
          column_codigo?: string | null
          column_descripcion?: string | null
          column_medida?: string | null
          column_precio: string
          created_at?: string
          header_row?: number | null
          id?: string
          sheet_name?: string | null
          supplier_id: string
          updated_at?: string
        }
        Update: {
          column_codigo?: string | null
          column_descripcion?: string | null
          column_medida?: string | null
          column_precio?: string
          created_at?: string
          header_row?: number | null
          id?: string
          sheet_name?: string | null
          supplier_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_excel_templates_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: true
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_extraction_baseline: {
        Row: {
          avg_items_count: number
          brand: string | null
          category: string | null
          created_at: string
          id: string
          last_items_count: number
          last_source_type: string | null
          samples_count: number
          supplier_id: string
          updated_at: string
        }
        Insert: {
          avg_items_count: number
          brand?: string | null
          category?: string | null
          created_at?: string
          id?: string
          last_items_count: number
          last_source_type?: string | null
          samples_count?: number
          supplier_id: string
          updated_at?: string
        }
        Update: {
          avg_items_count?: number
          brand?: string | null
          category?: string | null
          created_at?: string
          id?: string
          last_items_count?: number
          last_source_type?: string | null
          samples_count?: number
          supplier_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_extraction_baseline_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_price_list_items: {
        Row: {
          codigo: string | null
          created_at: string
          descripcion: string | null
          id: string
          medida: string | null
          precio: number
          price_list_id: string
          stock: string | null
        }
        Insert: {
          codigo?: string | null
          created_at?: string
          descripcion?: string | null
          id?: string
          medida?: string | null
          precio?: number
          price_list_id: string
          stock?: string | null
        }
        Update: {
          codigo?: string | null
          created_at?: string
          descripcion?: string | null
          id?: string
          medida?: string | null
          precio?: number
          price_list_id?: string
          stock?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_price_list_items_price_list_id_fkey"
            columns: ["price_list_id"]
            isOneToOne: false
            referencedRelation: "supplier_price_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_price_lists: {
        Row: {
          created_at: string
          id: string
          name: string
          source: string
          supplier_brand_id: string
          updated_at: string
          uploaded_at: string
          vehicle_type: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          source?: string
          supplier_brand_id: string
          updated_at?: string
          uploaded_at?: string
          vehicle_type?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          source?: string
          supplier_brand_id?: string
          updated_at?: string
          uploaded_at?: string
          vehicle_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_price_lists_supplier_brand_id_fkey"
            columns: ["supplier_brand_id"]
            isOneToOne: false
            referencedRelation: "supplier_brands"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_purchase_items: {
        Row: {
          brand: string | null
          category: string | null
          created_at: string
          description: string | null
          discount_percent: number
          final_unit_cost: number
          freight_percent: number
          id: string
          list_price: number
          purchase_id: string
          quantity: number
          subtotal: number
          vehicle_type: string | null
        }
        Insert: {
          brand?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          discount_percent?: number
          final_unit_cost?: number
          freight_percent?: number
          id?: string
          list_price?: number
          purchase_id: string
          quantity?: number
          subtotal?: number
          vehicle_type?: string | null
        }
        Update: {
          brand?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          discount_percent?: number
          final_unit_cost?: number
          freight_percent?: number
          id?: string
          list_price?: number
          purchase_id?: string
          quantity?: number
          subtotal?: number
          vehicle_type?: string | null
        }
        Relationships: []
      }
      supplier_purchases: {
        Row: {
          created_at: string
          id: string
          invoice_number: string | null
          notes: string | null
          purchase_date: string
          supplier_id: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          invoice_number?: string | null
          notes?: string | null
          purchase_date: string
          supplier_id: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          invoice_number?: string | null
          notes?: string | null
          purchase_date?: string
          supplier_id?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          address: string | null
          categories: string[]
          created_at: string
          currency: string
          delivery_time_estimate: string | null
          email: string | null
          exchange_rate: number | null
          exchange_rate_source: string
          exchange_rate_updated_at: string | null
          id: string
          is_active: boolean
          name: string
          notes: string | null
          notes_updated_at: string | null
          phone: string | null
          province: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          categories?: string[]
          created_at?: string
          currency?: string
          delivery_time_estimate?: string | null
          email?: string | null
          exchange_rate?: number | null
          exchange_rate_source?: string
          exchange_rate_updated_at?: string | null
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          notes_updated_at?: string | null
          phone?: string | null
          province?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          categories?: string[]
          created_at?: string
          currency?: string
          delivery_time_estimate?: string | null
          email?: string | null
          exchange_rate?: number | null
          exchange_rate_source?: string
          exchange_rate_updated_at?: string | null
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          notes_updated_at?: string | null
          phone?: string | null
          province?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      whatsapp_authorized_numbers: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          is_active: boolean
          is_admin: boolean
          phone_number: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id?: string
          is_active?: boolean
          is_admin?: boolean
          phone_number: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          is_active?: boolean
          is_admin?: boolean
          phone_number?: string
          updated_at?: string
        }
        Relationships: []
      }
      whatsapp_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          phone_number: string
          role: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          phone_number: string
          role: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          phone_number?: string
          role?: string
        }
        Relationships: []
      }
      whatsapp_pending_attachments: {
        Row: {
          attachments: Json
          created_at: string
          phone_number: string
        }
        Insert: {
          attachments: Json
          created_at?: string
          phone_number: string
        }
        Update: {
          attachments?: Json
          created_at?: string
          phone_number?: string
        }
        Relationships: []
      }
      work_orders: {
        Row: {
          client_id: string | null
          client_name: string
          client_phone: string | null
          completed_aligner_at: string | null
          completed_by_aligner: string | null
          completed_by_aligner_username: string | null
          completed_by_operator: string | null
          completed_by_operator_username: string | null
          completed_operator_at: string | null
          created_at: string
          created_by: string | null
          created_by_username: string | null
          id: string
          notes: string | null
          requires_alignment: boolean
          status: string
          tasks: string[]
          updated_at: string
          vehicle_info: string
          whatsapp_sent: boolean
        }
        Insert: {
          client_id?: string | null
          client_name: string
          client_phone?: string | null
          completed_aligner_at?: string | null
          completed_by_aligner?: string | null
          completed_by_aligner_username?: string | null
          completed_by_operator?: string | null
          completed_by_operator_username?: string | null
          completed_operator_at?: string | null
          created_at?: string
          created_by?: string | null
          created_by_username?: string | null
          id?: string
          notes?: string | null
          requires_alignment?: boolean
          status?: string
          tasks?: string[]
          updated_at?: string
          vehicle_info: string
          whatsapp_sent?: boolean
        }
        Update: {
          client_id?: string | null
          client_name?: string
          client_phone?: string | null
          completed_aligner_at?: string | null
          completed_by_aligner?: string | null
          completed_by_aligner_username?: string | null
          completed_by_operator?: string | null
          completed_by_operator_username?: string | null
          completed_operator_at?: string | null
          created_at?: string
          created_by?: string | null
          created_by_username?: string | null
          id?: string
          notes?: string | null
          requires_alignment?: boolean
          status?: string
          tasks?: string[]
          updated_at?: string
          vehicle_info?: string
          whatsapp_sent?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "work_orders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      buscar_catalogo_mayorista: {
        Args: { termino: string }
        Returns: {
          descripcion: string
          marca: string
          medida: string
          precio: number
          stock: number
          tipo_vehiculo: string
        }[]
      }
      cancel_debt: { Args: { debt_id_param: string }; Returns: undefined }
      fix_debt_calculations: { Args: never; Returns: undefined }
      fix_existing_debt_payment: { Args: never; Returns: undefined }
      get_all_profiles_for_admin: {
        Args: never
        Returns: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_id: string
          username: string
        }[]
      }
      get_client_avg_debt_cancellation_days: {
        Args: { client_uuid: string }
        Returns: Json
      }
      get_current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      get_operators_public: {
        Args: never
        Returns: {
          username: string
        }[]
      }
      get_producto_min_competencia: {
        Args: { p_producto_id: string }
        Returns: number
      }
      get_user_role: {
        Args: { user_uuid: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      has_role: {
        Args: {
          required_role: Database["public"]["Enums"]["user_role"]
          user_uuid: string
        }
        Returns: boolean
      }
      is_administrator: { Args: { user_uuid: string }; Returns: boolean }
      sync_all_services_with_debts: { Args: never; Returns: undefined }
    }
    Enums: {
      client_type: "Persona" | "Empresa"
      payment_method:
        | "Efectivo"
        | "Tarjeta de Crédito"
        | "Tarjeta de Débito"
        | "Transferencia Bancaria"
        | "Cheque"
        | "Echeq"
      service_status: "pending" | "partial" | "paid"
      user_role: "Administrator" | "Administracion" | "Operator" | "Alineador"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      client_type: ["Persona", "Empresa"],
      payment_method: [
        "Efectivo",
        "Tarjeta de Crédito",
        "Tarjeta de Débito",
        "Transferencia Bancaria",
        "Cheque",
        "Echeq",
      ],
      service_status: ["pending", "partial", "paid"],
      user_role: ["Administrator", "Administracion", "Operator", "Alineador"],
    },
  },
} as const
