const API_BASE_URL = import.meta.env.VITE_API_URL;

// --- INTERFACES ---

export interface TrainMap {
  tripId: string;
  vehicleId: string;
  lat: number;
  lon: number;
  tipo: string;
  label: string;
  status: string;
}

export interface StopDetail {
  sequence: number;
  stopId?: string;
  stopName: string;
  scheduledArrival: string;
  actualArrival: string;
  isPassed: boolean;
}

export interface TrainDetail extends TrainMap {
  routeName: string;
  color: string;
  itinerary: StopDetail[];
}

// Nueva interfaz para los resultados de la búsqueda estática
export interface TrainSearchResult {
  tripId: string;
  departureTime: string;
  arrivalTime: string;
  trainType: string;
  routeName: string;
}

// --- SERVICIO ---

export const trainsService = {
  
  /**
   * 1. Obtener todos los trenes en tiempo real para el mapa
   */
  getLiveMap: async (): Promise<TrainMap[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/trains/live-map`);
      if (!response.ok) throw new Error('Error al obtener posiciones en tiempo real');
      return await response.json();
    } catch (error) {
      console.error("Error en getLiveMap:", error);
      throw error;
    }
  },

  /**
   * 2. Obtener el detalle de un tren específico (itinerario + posición actual)
   */
  getDetail: async (tripId: string): Promise<TrainDetail> => {
    try {
      const response = await fetch(`${API_BASE_URL}/trains/detail/${tripId}`);
      if (!response.ok) throw new Error('Error al obtener el detalle del tren');
      return await response.json();
    } catch (error) {
      console.error("Error en getDetail:", error);
      throw error;
    }
  },

  /**
   * 3. Buscar trenes entre dos estaciones para una fecha concreta (GTFS Estático)
   * URL objetivo: /api/search/trains?origin=XXX&destination=YYY&date=YYYY-MM-DD
   */
  searchTrains: async (
    origin: string, 
    destination: string, 
    date: string,
    startTime?: string,
    type?: string
  ): Promise<TrainSearchResult[]> => {
    try {
      // Construimos los Query Params
      const params = new URLSearchParams({ origin, destination, date });
      if (startTime) params.append('startTime', startTime);
      if (type) params.append('type', type);

      const response = await fetch(`${API_BASE_URL}/search/trains?${params.toString()}`);
      
      if (!response.ok) {
        if (response.status === 404) return [];
        throw new Error('Error en la búsqueda de trayectos');
      }

      return await response.json();
    } catch (error) {
      console.error("Error en searchTrains:", error);
      throw error;
    }
  }
};