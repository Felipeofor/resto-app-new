export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          role: 'super_admin' | 'admin' | 'user'
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          role?: 'super_admin' | 'admin' | 'user'
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: 'super_admin' | 'admin' | 'user'
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      restaurants: {
        Row: {
          id: string
          owner_id: string
          name: string
          slug: string
          description: string | null
          logo_url: string | null
          cover_url: string | null
          plan: 'free' | 'pro'
          require_email: boolean
          welcome_message: string | null
          discount_text: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          name: string
          slug: string
          description?: string | null
          logo_url?: string | null
          cover_url?: string | null
          plan?: 'free' | 'pro'
          require_email?: boolean
          welcome_message?: string | null
          discount_text?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          name?: string
          slug?: string
          description?: string | null
          logo_url?: string | null
          cover_url?: string | null
          plan?: 'free' | 'pro'
          require_email?: boolean
          welcome_message?: string | null
          discount_text?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'restaurants_owner_id_fkey'
            columns: ['owner_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      restaurant_members: {
        Row: {
          id: string
          restaurant_id: string
          user_id: string
          member_role: 'owner' | 'editor' | 'viewer'
          invited_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          restaurant_id: string
          user_id: string
          member_role?: 'owner' | 'editor' | 'viewer'
          invited_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          restaurant_id?: string
          user_id?: string
          member_role?: 'owner' | 'editor' | 'viewer'
          invited_by?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'restaurant_members_restaurant_id_fkey'
            columns: ['restaurant_id']
            isOneToOne: false
            referencedRelation: 'restaurants'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'restaurant_members_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      menu_categories: {
        Row: {
          id: string
          restaurant_id: string
          name: string
          description: string | null
          sort_order: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          restaurant_id: string
          name: string
          description?: string | null
          sort_order?: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          restaurant_id?: string
          name?: string
          description?: string | null
          sort_order?: number
          is_active?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'menu_categories_restaurant_id_fkey'
            columns: ['restaurant_id']
            isOneToOne: false
            referencedRelation: 'restaurants'
            referencedColumns: ['id']
          }
        ]
      }
      menu_items: {
        Row: {
          id: string
          category_id: string
          restaurant_id: string
          name: string
          description: string | null
          price: number
          image_url: string | null
          is_available: boolean
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          category_id: string
          restaurant_id: string
          name: string
          description?: string | null
          price: number
          image_url?: string | null
          is_available?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          category_id?: string
          restaurant_id?: string
          name?: string
          description?: string | null
          price?: number
          image_url?: string | null
          is_available?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'menu_items_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'menu_categories'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'menu_items_restaurant_id_fkey'
            columns: ['restaurant_id']
            isOneToOne: false
            referencedRelation: 'restaurants'
            referencedColumns: ['id']
          }
        ]
      }
      customer_emails: {
        Row: {
          id: string
          restaurant_id: string
          email: string
          name: string | null
          registered_via: 'manual' | 'google'
          created_at: string
        }
        Insert: {
          id?: string
          restaurant_id: string
          email: string
          name?: string | null
          registered_via?: 'manual' | 'google'
          created_at?: string
        }
        Update: {
          id?: string
          restaurant_id?: string
          email?: string
          name?: string | null
          registered_via?: 'manual' | 'google'
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'customer_emails_restaurant_id_fkey'
            columns: ['restaurant_id']
            isOneToOne: false
            referencedRelation: 'restaurants'
            referencedColumns: ['id']
          }
        ]
      }
      qr_codes: {
        Row: {
          id: string
          restaurant_id: string
          url: string
          created_at: string
        }
        Insert: {
          id?: string
          restaurant_id: string
          url: string
          created_at?: string
        }
        Update: {
          id?: string
          restaurant_id?: string
          url?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'qr_codes_restaurant_id_fkey'
            columns: ['restaurant_id']
            isOneToOne: false
            referencedRelation: 'restaurants'
            referencedColumns: ['id']
          }
        ]
      }
      analytics_events: {
        Row: {
          id: string
          restaurant_id: string
          event_type: 'visit' | 'qr_scan' | 'email_register'
          metadata: Record<string, unknown> | null
          created_at: string
        }
        Insert: {
          id?: string
          restaurant_id: string
          event_type: 'visit' | 'qr_scan' | 'email_register'
          metadata?: Record<string, unknown> | null
          created_at?: string
        }
        Update: {
          id?: string
          restaurant_id?: string
          event_type?: 'visit' | 'qr_scan' | 'email_register'
          metadata?: Record<string, unknown> | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'analytics_events_restaurant_id_fkey'
            columns: ['restaurant_id']
            isOneToOne: false
            referencedRelation: 'restaurants'
            referencedColumns: ['id']
          }
        ]
      }
      ai_usage: {
        Row: {
          id: string
          restaurant_id: string
          month: string
          photos_processed: number
          created_at: string
        }
        Insert: {
          id?: string
          restaurant_id: string
          month: string
          photos_processed?: number
          created_at?: string
        }
        Update: {
          id?: string
          restaurant_id?: string
          month?: string
          photos_processed?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'ai_usage_restaurant_id_fkey'
            columns: ['restaurant_id']
            isOneToOne: false
            referencedRelation: 'restaurants'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
    CompositeTypes: {}
  }
}
