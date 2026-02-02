import { QuoteStatus } from './constants'

export interface Quote {
  id: string
  quote_number: string
  customer_name: string
  customer_number: string
  customer_company: string
  product_name: string | null
  documents_url: string | null
  cad_file_url: string | null
  image_render_url: string | null
  cad_requested: boolean
  cad_approved: boolean
  cad_approved_at: string | null
  swatch_approved: boolean
  swatch_approved_at: string | null
  swatch_approved_by: string | null
  status: QuoteStatus
  sales_order_number: string | null
  custom_rug_sku: string | null
  created_at: string
  updated_at: string
}

export interface QuoteNote {
  id: string
  quote_id: string
  content: string
  created_by: string
  created_at: string
}

export interface QuoteNoteInsert {
  quote_id: string
  content: string
  created_by: string
}

export type ActivityActionType =
  | 'quote_created'
  | 'quote_updated'
  | 'quote_deleted'
  | 'status_changed'
  | 'cad_approved'
  | 'swatch_approved'

export interface ActivityLog {
  id: string
  action_type: ActivityActionType
  quote_id: string | null
  quote_number: string | null
  performed_by: string
  details: string | null
  created_at: string
}

export interface ActivityLogInsert {
  action_type: ActivityActionType
  quote_id?: string | null
  quote_number?: string | null
  performed_by: string
  details?: string | null
}

export interface QuoteInsert {
  quote_number?: string
  customer_name: string
  customer_number: string
  customer_company: string
  product_name?: string | null
  documents_url?: string | null
  cad_file_url?: string | null
  image_render_url?: string | null
  cad_requested?: boolean
  cad_approved?: boolean
  swatch_approved?: boolean
  swatch_approved_by?: string | null
  status?: QuoteStatus
  sales_order_number?: string | null
  custom_rug_sku?: string | null
}

export interface QuoteUpdate {
  customer_name?: string
  customer_number?: string
  customer_company?: string
  product_name?: string | null
  documents_url?: string | null
  cad_file_url?: string | null
  image_render_url?: string | null
  cad_requested?: boolean
  cad_approved?: boolean
  swatch_approved?: boolean
  swatch_approved_by?: string | null
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
      quote_notes: {
        Row: QuoteNote
        Insert: QuoteNoteInsert
        Update: never
      }
      activity_logs: {
        Row: ActivityLog
        Insert: ActivityLogInsert
        Update: never
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
