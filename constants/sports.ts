// Centralized sports configuration
// All sport-related constants should be imported from this file

export interface Sport {
  id: number;
  name: string;
  icon: string; // Ionicons icon name
}

// Master list of all available sports
export const SPORTS: Sport[] = [
  { id: 1, name: 'Tennis', icon: 'tennisball-outline' },
  { id: 2, name: 'Badminton', icon: 'fitness-outline' },
  { id: 3, name: 'Table Tennis', icon: 'ellipse-outline' },
  { id: 4, name: 'Squash', icon: 'square-outline' },
  { id: 5, name: 'Racquetball', icon: 'radio-button-off-outline' },
  { id: 6, name: 'Golf', icon: 'golf-outline' },
  { id: 7, name: 'Basketball', icon: 'basketball-outline' },
  { id: 8, name: 'Soccer', icon: 'football-outline' },
  { id: 9, name: 'Volleyball', icon: 'american-football-outline' },
  { id: 10, name: 'Pickleball', icon: 'tennisball-outline' },
  { id: 11, name: 'Beach Volleyball', icon: 'sunny-outline' },
  { id: 12, name: 'Futsal', icon: 'football-outline' },
];

// Map of sport ID to sport name
export const sportIdToName: Record<number, string> = SPORTS.reduce(
  (acc, sport) => ({ ...acc, [sport.id]: sport.name }),
  {}
);

// Map of sport name to sport ID
export const sportNameToId: Record<string, number> = SPORTS.reduce(
  (acc, sport) => ({ ...acc, [sport.name]: sport.id }),
  {}
);

// Array of sport names (for lists/filters)
export const SPORT_NAMES: string[] = SPORTS.map((sport) => sport.name);

// Dropdown options format (for react-native-element-dropdown)
export const SPORTS_DROPDOWN = SPORTS.map((sport) => ({
  value: String(sport.id),
  label: sport.name,
}));

// Get sport by ID
export const getSportById = (id: number): Sport | undefined => {
  return SPORTS.find((sport) => sport.id === id);
};

// Get sport by name
export const getSportByName = (name: string): Sport | undefined => {
  return SPORTS.find((sport) => sport.name === name);
};

// Get sport name by ID (with fallback)
export const getSportName = (id: number, fallback = 'Unknown Sport'): string => {
  return sportIdToName[id] || fallback;
};

// Get sport icon by ID
export const getSportIcon = (id: number, fallback = 'help-outline'): string => {
  const sport = getSportById(id);
  return sport?.icon || fallback;
};
