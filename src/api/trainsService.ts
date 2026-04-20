const API_BASE_URL = import.meta.env.VITE_API_URL;

// Definimos interfaces para que TypeScript te ayude con el autocompletado
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

export const trainsService = {
  // 1. Obtener todos los trenes para el mapa (Llamada ligera cada 30s)
  getLiveMap: async (): Promise<TrainMap[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/trains/live-map`);
      if (!response.ok) throw new Error('Error al obtener posiciones');
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error en getLiveMap:", error);
      throw error;
    }
  },

  // 2. Obtener el detalle de un tren al hacer click
  getDetail: async (tripId: string): Promise<TrainDetail> => {
    try {
      const response = await fetch(`${API_BASE_URL}/trains/detail/${tripId}`);
      if (!response.ok) throw new Error('Error al obtener detalle del tren');
      return await response.json();
    } catch (error) {
      console.error("Error en getDetail:", error);
      throw error;
    }
  }
};