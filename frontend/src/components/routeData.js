/**
 * Mock data for bus routes, stops, and timings.
 * In a real application, this would come from a backend API.
 */
export const routeData = {
  'S1: VALASARAVAKKAM': {
    stops: {
      'Valasaravakkam': '08:00 AM',
      'Alwarthirunagar': '08:15 AM',
      'Virugambakkam': '08:30 AM',
    },
  },
  'S5: TIRUVOTRIYUR': {
    stops: {
      'Tiruvottiyur': '07:45 AM',
      'Tollgate': '08:05 AM',
      'Royapuram': '08:25 AM',
    },
  },
  'S2: Porur': {
    stops: { 'Porur Junction': '08:10 AM', 'DLF IT Park': '08:40 AM' },
  },
};

export const routeNames = Object.keys(routeData);