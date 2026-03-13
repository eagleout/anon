export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type UserRole = 'OWNER' | 'MANAGER' | 'AGENT_MENAGE' | 'VIEWER'
export type OrgPlan = 'free' | 'pro' | 'enterprise'
export type PropertyType = 'STUDIO' | 'APARTMENT' | 'HOUSE' | 'VILLA'
export type PropertyStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE'
export type ReservationPlatform = 'AIRBNB' | 'BOOKING' | 'VRBO' | 'DIRECT' | 'MANUAL'
export type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELLED'
export type MessageDirection = 'INBOUND' | 'OUTBOUND'
export type MessageChannel = 'EMAIL' | 'SMS' | 'AIRBNB' | 'BOOKING' | 'WHATSAPP'
export type MessageTrigger = 'BOOKING_CONFIRMED' | 'J_MINUS_7' | 'J_MINUS_3' | 'J_MINUS_1' | 'DAY_PLUS_1' | 'CHECKOUT_MINUS_1' | 'CHECKOUT_PLUS_1'
export type CommunicationProfile = 'DETAILED' | 'SUMMARY' | 'URGENT_ONLY'
export type CleaningType = 'FULL_CLEANING' | 'QUICK_CHECK' | 'MAINTENANCE'
export type CleaningStatus = 'PENDING' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'ISSUE'
export type InspectionType = 'CHECKOUT' | 'CHECKIN'
export type InspectionStatus = 'PENDING' | 'COMPLETED' | 'ISSUE_REPORTED'
export type ReportPeriod = 'WEEKLY' | 'MONTHLY'
export type PricingRuleType = 'BASE' | 'SEASON' | 'WEEKDAY' | 'EVENT' | 'LAST_MINUTE' | 'LONG_STAY'
export type AdjustmentType = 'FIXED' | 'PERCENTAGE'
export type BlockReason = 'OWNER_USE' | 'MAINTENANCE' | 'BLOCKED'
export type Language = 'fr' | 'en' | 'es' | 'de'

export interface Organization {
  id: string
  name: string
  slug: string
  logo_url: string | null
  plan: OrgPlan
  settings: Json
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  organization_id: string
  email: string
  full_name: string
  role: UserRole
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Owner {
  id: string
  organization_id: string
  full_name: string
  email: string | null
  phone: string | null
  iban: string | null
  communication_profile: CommunicationProfile
  legal: Json
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Property {
  id: string
  organization_id: string
  owner_id: string
  name: string
  address: string
  city: string
  zipcode: string
  lat: number | null
  lng: number | null
  type: PropertyType
  capacity: number
  bedrooms: number
  beds: number
  bathrooms: number
  surface_m2: number | null
  access_instructions: string | null
  access_code: string | null
  wifi_name: string | null
  wifi_password: string | null
  rules: string[]
  amenities: string[]
  platforms: Json
  ical_airbnb: string | null
  ical_booking: string | null
  pricing: Json
  status: PropertyStatus
  photos: string[]
  created_at: string
  updated_at: string
}

export interface Reservation {
  id: string
  property_id: string
  organization_id: string
  platform: ReservationPlatform
  platform_reservation_id: string | null
  guest_name: string
  guest_email: string | null
  guest_phone: string | null
  guest_count: number
  checkin_date: string
  checkout_date: string
  checkin_time: string
  checkout_time: string
  status: ReservationStatus
  amount_gross: number
  amount_net: number
  platform_fee: number
  concierge_fee: number
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  reservation_id: string
  organization_id: string
  direction: MessageDirection
  channel: MessageChannel
  content: string
  sent_at: string
  read_at: string | null
  automated: boolean
  template_id: string | null
}

export interface MessageTemplate {
  id: string
  organization_id: string
  name: string
  trigger: MessageTrigger
  channel: MessageChannel
  subject: string | null
  content: string
  active: boolean
  language: Language
  created_at: string
  updated_at: string
}

export interface CleaningMission {
  id: string
  property_id: string
  organization_id: string
  reservation_id: string | null
  assigned_to: string | null
  type: CleaningType
  scheduled_date: string
  scheduled_start: string | null
  scheduled_end: string | null
  status: CleaningStatus
  checklist_items: Json
  notes: string | null
  created_at: string
  updated_at: string
}

export interface PropertyInspection {
  id: string
  property_id: string
  organization_id: string
  cleaning_mission_id: string | null
  inspector_id: string | null
  type: InspectionType
  status: InspectionStatus
  cleanliness_score: number | null
  quality_score: number | null
  items: Json
  damages: Json
  photos: string[]
  notes: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface OwnerReport {
  id: string
  owner_id: string
  organization_id: string
  period_type: ReportPeriod
  period_start: string
  period_end: string
  data: Json
  sent_at: string | null
  sent_to: string | null
  created_at: string
}

export interface PricingRule {
  id: string
  property_id: string
  organization_id: string
  rule_type: PricingRuleType
  name: string
  description: string | null
  start_date: string | null
  end_date: string | null
  adjustment_type: AdjustmentType
  adjustment_value: number
  min_stay: number | null
  max_stay: number | null
  priority: number
  active: boolean
  created_at: string
  updated_at: string
}

export interface CalendarBlock {
  id: string
  property_id: string
  organization_id: string
  start_date: string
  end_date: string
  reason: BlockReason
  notes: string | null
  created_at: string
}

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: Organization
        Insert: Omit<Organization, 'id' | 'created_at' | 'updated_at'> & { id?: string }
        Update: Partial<Omit<Organization, 'id' | 'created_at'>>
      }
      users: {
        Row: User
        Insert: Omit<User, 'created_at' | 'updated_at'> & { id: string }
        Update: Partial<Omit<User, 'id' | 'created_at'>>
      }
      owners: {
        Row: Owner
        Insert: Omit<Owner, 'id' | 'created_at' | 'updated_at'> & { id?: string }
        Update: Partial<Omit<Owner, 'id' | 'created_at'>>
      }
      properties: {
        Row: Property
        Insert: Omit<Property, 'id' | 'created_at' | 'updated_at'> & { id?: string }
        Update: Partial<Omit<Property, 'id' | 'created_at'>>
      }
      reservations: {
        Row: Reservation
        Insert: Omit<Reservation, 'id' | 'created_at' | 'updated_at'> & { id?: string }
        Update: Partial<Omit<Reservation, 'id' | 'created_at'>>
      }
      messages: {
        Row: Message
        Insert: Omit<Message, 'id'> & { id?: string }
        Update: Partial<Omit<Message, 'id'>>
      }
      message_templates: {
        Row: MessageTemplate
        Insert: Omit<MessageTemplate, 'id' | 'created_at' | 'updated_at'> & { id?: string }
        Update: Partial<Omit<MessageTemplate, 'id' | 'created_at'>>
      }
      cleaning_missions: {
        Row: CleaningMission
        Insert: Omit<CleaningMission, 'id' | 'created_at' | 'updated_at'> & { id?: string }
        Update: Partial<Omit<CleaningMission, 'id' | 'created_at'>>
      }
      property_inspections: {
        Row: PropertyInspection
        Insert: Omit<PropertyInspection, 'id' | 'created_at' | 'updated_at'> & { id?: string }
        Update: Partial<Omit<PropertyInspection, 'id' | 'created_at'>>
      }
      owner_reports: {
        Row: OwnerReport
        Insert: Omit<OwnerReport, 'id' | 'created_at'> & { id?: string }
        Update: Partial<Omit<OwnerReport, 'id' | 'created_at'>>
      }
      pricing_rules: {
        Row: PricingRule
        Insert: Omit<PricingRule, 'id' | 'created_at' | 'updated_at'> & { id?: string }
        Update: Partial<Omit<PricingRule, 'id' | 'created_at'>>
      }
      calendar_blocks: {
        Row: CalendarBlock
        Insert: Omit<CalendarBlock, 'id' | 'created_at'> & { id?: string }
        Update: Partial<Omit<CalendarBlock, 'id' | 'created_at'>>
      }
    }
    Functions: {
      get_user_organization_id: { Args: Record<string, never>; Returns: string }
      get_user_role: { Args: Record<string, never>; Returns: string }
      calculate_revenue: {
        Args: { p_property_id: string; p_start_date: string; p_end_date: string }
        Returns: { gross_revenue: number; net_revenue: number; total_fees: number; reservation_count: number }[]
      }
      get_occupancy_rate: {
        Args: { p_property_id: string; p_start_date: string; p_end_date: string }
        Returns: number
      }
    }
  }
}
