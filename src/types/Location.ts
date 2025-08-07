export interface Location {
  lat: number;
  lng: number;
  address?: string;
}

export interface DogLocation {
  dogId: string;
  dogName: string;
  ownerName: string;
  location: Location;
  price: number;
  breed: string;
  imageUrl?: string;
  available: boolean;
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface MapFilters {
  maxDistance?: number; // in kilometers
  maxPrice?: number;
  breed?: string;
  availableOnly?: boolean;
} 