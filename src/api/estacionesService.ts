const API_BASE_URL = import.meta.env.VITE_API_URL;

export const estacionesService = {
  search: async (query: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/estaciones/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error('Error en la respuesta del servidor');
      return await response.json();
    } catch (error) {
      console.error("API Error:", error);
      throw error;
    }
  }
};