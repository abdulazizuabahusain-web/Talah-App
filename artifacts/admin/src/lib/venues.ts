export interface Venue {
  name: string;
  area?: string;
}

const VENUES_BY_CITY: Record<string, Venue[]> = {
  riyadh: [
    { name: "Felfel Café", area: "Al Olaya" },
    { name: "Brew 92", area: "Al Malaz" },
    { name: "The Nest", area: "Al Nakheel" },
    { name: "Joud Café", area: "Al Olaya" },
    { name: "Bab Rizq Jameel", area: "Al Nakheel" },
    { name: "Camel Café", area: "Al Diriyah" },
    { name: "Cactus Club", area: "Hittin" },
    { name: "Latitude", area: "Al Olaya" },
  ],
  jeddah: [
    { name: "Al Baik", area: "Al Balad" },
    { name: "Côte Brasserie", area: "Al Hamra" },
    { name: "The Roastery", area: "Al Shate" },
    { name: "Café Bateel", area: "Al Andalus" },
    { name: "Byblos", area: "Al Zahraa" },
    { name: "Namma", area: "Al Hamra" },
    { name: "Ciao", area: "Al Ruwais" },
  ],
  dammam: [
    { name: "Crumz Café", area: "Al Faisaliya" },
    { name: "Ykoon", area: "Al Shatea" },
    { name: "Mimi Café", area: "Al Hamra" },
    { name: "One Café", area: "Al Badi" },
  ],
  khobar: [
    { name: "Starbucks Reserve", area: "Corniche" },
    { name: "Coffee Bean", area: "Al Khobar Corniche" },
    { name: "Baba Café", area: "Al Ulaya" },
  ],
  medina: [
    { name: "Al Nakheel Café", area: "Al Madinah" },
    { name: "Dates & More", area: "Central" },
  ],
  mecca: [
    { name: "Abraj Café", area: "Al Aziziyah" },
    { name: "Hira Café", area: "Central" },
  ],
};

export function getVenuesForCity(city: string | null | undefined): Venue[] {
  if (!city) return [];
  return VENUES_BY_CITY[city.toLowerCase()] ?? [];
}
