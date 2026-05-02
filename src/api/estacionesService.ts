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
  },

  // Nueva función para obtener una estación por su ID/Código
  getById: async (id_codigo: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/estaciones/${encodeURIComponent(id_codigo)}`);
      if (!response.ok) {
        if (response.status === 404) throw new Error('Estación no encontrada');
        throw new Error('Error al obtener los detalles de la estación');
      }
      return await response.json();
    } catch (error) {
      console.error("API Error (getById):", error);
      throw error;
    }
  }
};