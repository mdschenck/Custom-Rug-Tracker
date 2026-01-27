import { QuoteStatus } from './constants'

export interface Quote {
  id: string
  quote_number: string
  customer_name: string
  customer_number: string
  customer_company: string
  cad_file_url: string | null
  image_render_url: string | null
  status: QuoteStatus
  sales_order_number: string | null
  custom_rug_sku: string | null
  created_at: string
  updated_at: string
}

export interface QuoteInsert {
  quote_number?: string
  customer_name: string
  customer_number: string
  customer_company: string
  cad_file_url?: string | null
  image_render_url?: string | null
  status?: QuoteStatus
  sales_order_number?: string | null
  custom_rug_sku?: string | null
}

export interface QuoteUpdate {
  customer_name?: string
  customer_number?: string
  customer_company?: string
  cad_file_url?: string | null
  image_render_url?: string | null
  status?: QuoteStatus
  sales_order_number?: string | null
  custom_rug_sku?: string | null
}

export type Database = {
  public: {
    Tables: {
      quotes: {
        Row: Quote
        Insert: QuoteInsert
        Update: QuoteUpdate
      }
      quote_number_sequence: {
        Row: {
          id: number
          last_number: number
        }
        Insert: never
        Update: { last_number?: number }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
