import axios, { AxiosInstance } from 'axios';
import { POI, Route, Coordinates, CreateRouteRequest, CreateRouteResponse, POICategory } from '../types';

const API_BASE_URL = __DEV__ ? 'http://192.168.0.11:3000/api' : 'https://api.antinavigator.com';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  setBaseUrl(url: string) {
    this.client.defaults.baseURL = url;
  }

  // Health check
  async health(): Promise<{ status: string }> {
    const response = await this.client.get('/health');
    return response.data;
  }

  // POI endpoints
  async searchPOI(params: {
    query?: string;
    lat?: number;
    lng?: number;
    radius?: number;
    categories?: POICategory[];
    limit?: number;
  }): Promise<POI[]> {
    const response = await this.client.get('/poi/search', { params });
    return response.data;
  }

  async getPOI(id: string): Promise<POI> {
    const response = await this.client.get(`/poi/${id}`);
    return response.data;
  }

  async getNearbyPOI(lat: number, lng: number, radius?: number): Promise<POI[]> {
    const response = await this.client.get('/poi/nearby', {
      params: { lat, lng, radius },
    });
    return response.data;
  }

  async getPOIsByBbox(
    minLat: number,
    maxLat: number,
    minLng: number,
    maxLng: number,
    categories?: POICategory[],
    limit?: number
  ): Promise<POI[]> {
    const response = await this.client.get('/poi/bbox', {
      params: {
        minLat,
        maxLat,
        minLng,
        maxLng,
        categories: categories?.join(','),
        limit,
      },
    });
    return response.data;
  }

  // Import POIs from OpenStreetMap for an area
  async importPOIsFromOSM(
    lat: number,
    lng: number,
    radius: number = 5000,
    categories?: string[]
  ): Promise<{ message: string; count: number }> {
    const response = await this.client.post('/poi/import', {
      lat,
      lng,
      radius,
      categories: categories || ['museum', 'restaurant', 'cafe', 'park', 'viewpoint', 'historical', 'monument', 'gallery', 'bar', 'garden'],
    });
    return response.data;
  }

  // Route endpoints
  async createRoute(request: CreateRouteRequest): Promise<CreateRouteResponse> {
    const response = await this.client.post('/routes', request);
    return response.data;
  }

  async getRoute(id: string): Promise<Route> {
    const response = await this.client.get(`/routes/${id}`);
    return response.data;
  }

  // Recommendations
  async getRecommendations(
    routeId: string,
    currentLocation: Coordinates
  ): Promise<POI[]> {
    const response = await this.client.post('/recommendations', {
      routeId,
      currentLocation,
    });
    return response.data;
  }
}

export const api = new ApiClient();
export default api;
