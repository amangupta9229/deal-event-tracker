import type {
  DealStatus,
  EventPriority,
  EventStatus,
  UserRole,
} from "@/types"

type Relationship = {
  foreignKeyName: string
  columns: string[]
  isOneToOne: boolean
  referencedRelation: string
  referencedColumns: string[]
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string
          email: string
          role: UserRole
          is_active: boolean
          created_at: string
        }
        Insert: {
          id: string
          name: string
          email: string
          role: UserRole
          is_active?: boolean
          created_at?: string
        }
        Update: {
          name?: string
          email?: string
          role?: UserRole
          is_active?: boolean
        }
        Relationships: Relationship[]
      }
      deals: {
        Row: {
          id: string
          name: string
          status: DealStatus
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          status?: DealStatus
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          status?: DealStatus
          updated_at?: string
        }
        Relationships: Relationship[]
      }
      events: {
        Row: {
          id: string
          deal_id: string
          description: string
          priority: EventPriority
          status: EventStatus
          created_by: string
          created_at: string
          updated_at: string
          done_by: string | null
          done_at: string | null
        }
        Insert: {
          id?: string
          deal_id: string
          description: string
          priority?: EventPriority
          status?: EventStatus
          created_by: string
          created_at?: string
          updated_at?: string
          done_by?: string | null
          done_at?: string | null
        }
        Update: {
          status?: EventStatus
          done_by?: string | null
          done_at?: string | null
          updated_at?: string
        }
        Relationships: Relationship[]
      }
      event_comments: {
        Row: {
          id: string
          event_id: string
          author_id: string
          comment: string
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          author_id: string
          comment: string
          created_at?: string
        }
        Update: {
          comment?: string
        }
        Relationships: Relationship[]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: UserRole
      deal_status: DealStatus
      event_status: EventStatus
      event_priority: EventPriority
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
