export const APP_VERSION = "v0.10.1-beta";

// Higher number = More questions appear from this category
export const CATEGORY_WEIGHTS: Record<string, number> = {
    'Kirurgi': 10,
    'Ortopedi': 8,
    'Urologi': 6,
    'Radiologi': 5,
    'Primärvård': 5,
    'Onkologi': 4,
    'Anestesi': 3,
    'Rättsmedicin': 2, 
    // Default weight is 1
};