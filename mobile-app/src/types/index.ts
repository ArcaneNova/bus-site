// Shared TypeScript types for SmartDTC Mobile App

export interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'driver' | 'passenger';
  avatar?: string;
  createdAt: string;
}

export interface Route {
  _id: string;
  url_route_id: string;
  route_name: string;
  start_stage: string;
  end_stage: string;
  total_stages: number;
  distance_km?: number;
}

export interface Stage {
  _id: string;
  url_route_id: string;
  seq: number;
  stage_name: string;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
}

export interface Bus {
  _id: string;
  busNumber: string;
  model: string;
  capacity: number;
  status: 'active' | 'maintenance' | 'inactive';
  currentRoute?: Route;
  currentDriver?: Driver;
  lastPosition?: {
    coordinates: [number, number];
    speed: number;
    heading: number;
    recordedAt: string;
  };
}

export interface Driver {
  _id: string;
  userId: User;
  licenseNumber: string;
  status: 'on-duty' | 'off-duty' | 'on-leave';
  rating: number;
  totalTrips: number;
  assignedBus?: Bus;
}

export interface Schedule {
  _id: string;
  route: Route;
  bus: Bus;
  driver: Driver;
  date: string;
  departureTime: string;
  arrivalTime: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
}

export interface BusPosition {
  busId: string;
  busNumber: string;
  routeId: string;
  coordinates: [number, number];
  speed: number;
  heading: number;
  nextStop?: string;
  delay?: number;
  recordedAt: string;
}

export interface Alert {
  _id: string;
  type: 'breakdown' | 'accident' | 'delay' | 'diversion' | 'sos' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  route?: Route;
  bus?: Bus;
  createdAt: string;
  isResolved: boolean;
}

export interface NearbyStop {
  _id: string;
  stage_name: string;
  distance: number; // metres
  location: {
    coordinates: [number, number];
  };
  routes: string[];
}

export interface SearchResult {
  routes: Route[];
  stages: Stage[];
}
