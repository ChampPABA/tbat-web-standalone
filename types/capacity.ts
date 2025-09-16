// CapacityManagement interface as defined in Story 3.1
export interface CapacityManagement {
  id: string;
  total_capacity: number; // 300 seats absolute maximum
  free_capacity: number; // 150 seats hard cap
  advanced_capacity: number; // Flexible up to remaining total
  current_free_count: number;
  current_advanced_count: number;
  exam_date: Date; // 27 กันยายน 2568
  is_full: boolean; // Computed: total >= 300
  free_slots_available: boolean; // Computed: current_free < 150 && !is_full
  advanced_slots_available: boolean; // Computed: !is_full
  created_at: Date;
  updated_at: Date;
}

// Extended interface that includes session time for the TBAT platform
export interface SessionCapacityManagement extends CapacityManagement {
  session_time: "MORNING" | "AFTERNOON";
}

// Response type for capacity APIs that comply with UI "no numbers" rule
export interface CapacityStatusResponse {
  session_time: "MORNING" | "AFTERNOON";
  exam_date: string;
  availability_status: "AVAILABLE" | "LIMITED" | "FULL" | "CLOSED";
  message: string; // Thai message
  message_en: string; // English message
  can_register_free: boolean;
  can_register_advanced: boolean;
  show_disabled_state: boolean;
}

// Algorithm result type for internal capacity calculations
export interface CapacityAlgorithmResult {
  total_count: number;
  free_count: number;
  advanced_count: number;
  max_capacity: number;
  free_limit: number;
  is_full: boolean;
  free_slots_available: boolean;
  advanced_slots_available: boolean;
  availability_status: "AVAILABLE" | "LIMITED" | "FULL" | "CLOSED";
}

// Business rules constants
export const CAPACITY_CONSTRAINTS = {
  TOTAL_CAPACITY: 300, // Absolute maximum
  FREE_PACKAGE_LIMIT: 150, // Hard cap for free registrations
  ADVANCED_CAN_USE_FREE_SLOTS: true, // Advanced can fill unused free slots
  UI_HIDE_EXACT_NUMBERS: true, // Never show capacity numbers to users
  WARNING_THRESHOLD: 0.8, // 80% capacity warning
  FULL_THRESHOLD: 0.95, // 95% capacity nearly full
} as const;