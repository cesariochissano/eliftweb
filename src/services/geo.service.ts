import { getGeocode, getLatLng } from "use-places-autocomplete";

interface LocationResult {
    lat: number;
    lng: number;
    address: string;
}

export const GeoService = {
    // Reverse Geocoding (Lat/Lng -> Address)
    async reverseGeocode(lat: number, lng: number): Promise<string> {
        const useGoogle = !!import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

        if (useGoogle) {
            try {
                const results = await getGeocode({ location: { lat, lng } });
                return results[0]?.formatted_address || `Local (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
            } catch {
                return `Local (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
            }
        }

        // Nominatim Fallback
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
                headers: { 'Accept-Language': 'pt' }
            });
            const data = await response.json();
            return this.formatAddress(data);
        } catch {
            return `Local (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
        }
    },

    // Search Places (Address -> List of Locations)
    async searchPlaces(query: string): Promise<LocationResult[]> {
        if (!query || query.length < 3) return [];

        // Note: Google Places Autocomplete logic is usually hook-based (usePlacesAutocomplete).
        // For this async service method, we primarily support the fallback or server-side search.
        // However, if we wanted to wrap google services effectively, we'd use the Maps JS API Service here.
        // For now, implementing the Nominatim fallback which is fetch-based.

        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1&countrycodes=mz`, {
                headers: { 'Accept-Language': 'pt' }
            });

            if (!response.ok) throw new Error('Network error');

            const data = await response.json();
            return data.map((item: any) => ({
                lat: parseFloat(item.lat),
                lng: parseFloat(item.lon),
                address: this.formatAddress(item)
            }));
        } catch (error) {
            console.warn('GeoService Search Error:', error);
            return [];
        }
    },

    // Helper to resolve Google Place ID
    async resolveGooglePlaceId(placeId: string, description: string): Promise<LocationResult | null> {
        try {
            const results = await getGeocode({ placeId });
            const { lat, lng } = await getLatLng(results[0]);
            return { lat, lng, address: description };
        } catch (error) {
            console.error("GeoService Google Resolve Error:", error);
            return null;
        }
    },

    // Formatter Helper
    formatAddress(item: any): string {
        const addr = item.address || {};
        // Prioritize specific POI names
        const poi = addr.amenity || addr.shop || addr.leisure || addr.tourism || addr.historic || addr.building || addr.office || addr.public_transport;
        const road = addr.road || addr.street || addr.pedestrian || addr.residential;
        const suburb = addr.suburb || addr.neighbourhood || addr.quarter;
        const city = addr.city || addr.town || addr.village || addr.county;

        let main = poi;
        const contextParts: string[] = [];

        if (main) {
            if (road) contextParts.push(road);
        } else {
            main = road;
        }

        if (suburb) contextParts.push(suburb);
        if (city && city !== suburb) contextParts.push(city);

        if (!main) return item.display_name?.split(',').slice(0, 3).join(',') || '';

        const context = contextParts.slice(0, 2).join(', ');
        return context ? `${main}, ${context}` : main;
    }
};
