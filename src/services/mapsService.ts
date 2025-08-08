import { Loader } from '@googlemaps/js-api-loader';
import type { Location, DogLocation, MapBounds, MapFilters } from '../types/Location';

export class MapsService {
  private loader: Loader;
  private map: google.maps.Map | null = null;
  private markers: google.maps.Marker[] = [];
  private infoWindows: google.maps.InfoWindow[] = [];

  constructor() {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyCX7lbqN6uYrisjdrD0fehWd0Bbbo5AfDU';
    console.log('MapsService constructor - API key:', apiKey ? 'Found' : 'Not found');
    
    this.loader = new Loader({
      apiKey: apiKey,
      version: 'weekly',
      libraries: ['places'],
      language: 'en',
      region: 'US'
    });
  }

  // Test if Google Maps API is working
  async testGoogleMapsAPI(): Promise<boolean> {
    try {
      console.log('Testing Google Maps API...');
      const google = await this.loader.load();
      
      if (!google || !google.maps) {
        console.error('Google Maps API not loaded');
        return false;
      }
      
      if (!google.maps.Map) {
        console.error('Google Maps Map constructor not available');
        return false;
      }
      
      console.log('Google Maps API test passed');
      return true;
    } catch (error) {
      console.error('Google Maps API test failed:', error);
      return false;
    }
  }

  // Initialize Google Maps
  async initializeMap(containerId: string | HTMLElement, center: Location = { lat: 40.7128, lng: -74.0060 }): Promise<google.maps.Map> {
    try {
      console.log('Loading Google Maps API...');
      const google = await this.loader.load();
      console.log('Google Maps loaded successfully');
      
      let container: HTMLElement;
      if (typeof containerId === 'string') {
        container = document.getElementById(containerId)!;
        if (!container) {
          throw new Error(`Container with id '${containerId}' not found`);
        }
      } else {
        container = containerId;
        if (!container) {
          throw new Error('Container element is null or undefined');
        }
      }
      
      console.log('Creating map with container:', container);
      
      // Check if Google Maps API is properly loaded
      if (!google || !google.maps || !google.maps.Map) {
        throw new Error('Google Maps API not properly loaded. Please check your API key and enable the Maps JavaScript API.');
      }
      
      this.map = new google.maps.Map(container, {
        center: { lat: center.lat, lng: center.lng },
        zoom: 12,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false
      });

      console.log('Map initialized successfully');
      return this.map;
    } catch (error) {
      console.error('Error initializing Google Maps:', error);
      
      // Check for specific API errors
      if (error instanceof Error) {
        if (error.message.includes('ApiNotActivatedMapError') || 
            error.message.includes('api-not-activated-map-error') ||
            error.message.includes('Google Maps API not properly loaded')) {
          throw new Error('Google Maps API not available. Please enable the Maps JavaScript API in your Google Cloud Console.');
        }
      }
      
      throw error;
    }
  }

  // Get user's current location
  async getCurrentLocation(): Promise<Location> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser.'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          reject(error);
        }
      );
    });
  }

  // Add dog markers to the map
  addDogMarkers(dogs: DogLocation[], onMarkerClick?: (dog: DogLocation) => void): void {
    if (!this.map) return;

    // Clear existing markers
    this.clearMarkers();

    dogs.forEach((dog) => {
      const marker = new google.maps.Marker({
        position: { lat: dog.location.lat, lng: dog.location.lng },
        map: this.map,
        title: dog.dogName,
        icon: {
          url: dog.imageUrl || 'https://maps.google.com/mapfiles/ms/icons/dog-park.png',
          scaledSize: new google.maps.Size(32, 32)
        }
      });

      // Create info window
      const infoWindow = new google.maps.InfoWindow({
        content: this.createInfoWindowContent(dog)
      });

      // Add click listener
      marker.addListener('click', () => {
        // Close all other info windows
        this.infoWindows.forEach(window => window.close());
        infoWindow.open(this.map, marker);
        
        if (onMarkerClick) {
          onMarkerClick(dog);
        }
      });

      this.markers.push(marker);
      this.infoWindows.push(infoWindow);
    });
  }

  // Create info window content for a dog
  private createInfoWindowContent(dog: DogLocation): string {
    return `
      <div style="padding: 10px; max-width: 200px;">
        <h3 style="margin: 0 0 8px 0; color: #333;">${dog.dogName}</h3>
        <p style="margin: 0 0 4px 0; color: #666;">Owner: ${dog.ownerName}</p>
        <p style="margin: 0 0 4px 0; color: #666;">Breed: ${dog.breed}</p>
        <p style="margin: 0 0 8px 0; color: #28a745; font-weight: bold;">$${dog.price}/day</p>
        <div style="display: flex; gap: 8px;">
          <button onclick="window.rentDog('${dog.dogId}')" 
                  style="background: #007bff; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer;">
            Rent
          </button>
          <button onclick="window.messageOwner('${dog.dogId}')" 
                  style="background: #28a745; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer;">
            Message
          </button>
        </div>
      </div>
    `;
  }

  // Clear all markers
  clearMarkers(): void {
    this.markers.forEach(marker => marker.setMap(null));
    this.infoWindows.forEach(window => window.close());
    this.markers = [];
    this.infoWindows = [];
  }

  // Fit map to show all markers
  fitBounds(): void {
    if (!this.map || this.markers.length === 0) return;

    const bounds = new google.maps.LatLngBounds();
    this.markers.forEach(marker => {
      bounds.extend(marker.getPosition()!);
    });
    this.map.fitBounds(bounds);
  }

  // Get current map bounds
  getMapBounds(): MapBounds | null {
    if (!this.map) return null;

    const bounds = this.map.getBounds();
    if (!bounds) return null;

    return {
      north: bounds.getNorthEast().lat(),
      south: bounds.getSouthWest().lat(),
      east: bounds.getNorthEast().lng(),
      west: bounds.getSouthWest().lng()
    };
  }

  // Calculate distance between two points
  calculateDistance(point1: Location, point2: Location): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(point2.lat - point1.lat);
    const dLng = this.toRadians(point2.lng - point1.lng);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(point1.lat)) * Math.cos(this.toRadians(point2.lat)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  // Filter dogs by distance and other criteria
  filterDogsByLocation(dogs: DogLocation[], userLocation: Location, filters: MapFilters): DogLocation[] {
    return dogs.filter(dog => {
      // Check distance
      if (filters.maxDistance) {
        const distance = this.calculateDistance(userLocation, dog.location);
        if (distance > filters.maxDistance) return false;
      }

      // Check price
      if (filters.maxPrice && dog.price > filters.maxPrice) {
        return false;
      }

      // Check breed
      if (filters.breed && !dog.breed.toLowerCase().includes(filters.breed.toLowerCase())) {
        return false;
      }

      // Check availability
      if (filters.availableOnly && !dog.available) {
        return false;
      }

      return true;
    });
  }
}

export const useMapsService = () => {
  return new MapsService();
}; 