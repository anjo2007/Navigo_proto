
export enum TransportMode {
  WALK = 'WALK',
  BUS = 'BUS',
  TRAIN = 'TRAIN',
  AUTO = 'AUTO',
  TAXI = 'TAXI',
  FERRY = 'FERRY',
}

export interface Coordinate {
  lat: number;
  lng: number;
}

export interface UserPreferences {
  walkingTolerance: 'low' | 'medium' | 'high';
  priority: 'cheapest' | 'balanced' | 'fastest';
}

export interface ScheduledOption {
  id: string;
  name: string;
  startTime: string;
  startLocation: string;
  endTime: string;
  endLocation: string;
  priceINR: number;
  frequencyMinutes?: number;
  operator?: string;
  occupancyHint?: 'LOW' | 'MEDIUM' | 'HIGH';
  isRealtime?: boolean;
}

export interface PlaceResult {
  id: string;
  name: string;
  address: string;
  rating?: number;
  category: string;
  location?: Coordinate;
  phoneNumber?: string;
  openingHours?: string;
}

export interface RouteSegment {
  mode: TransportMode;
  start: string;
  end:string;
  durationMinutes: number;
  costINR: number;
  details: string;
  pathCoordinates: Coordinate[]; 
  busNumber?: string;
  boardingPointDetails?: string;
  scheduledDeparture?: string;
  googleMapsLink?: string;
  bookingLink?: string;
  schedules?: ScheduledOption[];
}

export interface Route {
  id: string;
  name: string;
  totalDurationMinutes: number;
  totalCostINR: number;
  segments: RouteSegment[];
  summary: string;
  category: 'TIME_EFFICIENT' | 'BUDGET_FRIENDLY' | 'BALANCED';
  modeSummary: TransportMode[];
}

export interface SavedRoute extends Route {
    savedAt: number;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  isThinking?: boolean;
  sources?: { title: string; uri: string }[];
}

// --- RBAC & CROWDSOURCING TYPES ---

export type UserRole = 'admin' | 'contributor' | 'user' | 'fleet_mgr';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  trustScore: number;
  greenPoints: number;
  isAmbassador: boolean;
}

export enum OccupancyLevel {
  MANY_SEATS = 'MANY_SEATS',
  FEW_SEATS = 'FEW_SEATS',
  STANDING_ONLY = 'STANDING_ONLY',
  CRUSHED = 'CRUSHED'
}

export interface CrowdReport {
  id: string;
  userId: string;
  routeId?: string;
  type: 'OCCUPANCY' | 'TRAFFIC' | 'INCIDENT';
  level?: OccupancyLevel;
  location: Coordinate;
  timestamp: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface LeaderboardEntry {
    userId: string;
    userName: string;
    points: number;
    rank: number;
}
