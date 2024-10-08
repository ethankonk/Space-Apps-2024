import { scale } from "maath/dist/declarations/src/vector2";

export const ORBIT_MULTIPLIER = 17000;
export const MAX_VISIBLE_DISTANCE = 20000; // CHANGE THIS LATER
export const MIN_VISIBLE_DISTANCE = 240000; // CHANGE THIS LATER
export const MIN_DOLLY_DISTANCE = 0;
export const MAX_DOLLY_DISTANCE = 1500000;
export const MIN_RADIUS = 10;

// x offset= e × semi-major axis
// scale is relative to the sun

export const PLANET_DATA = {
  Mercury: {
    semiMajorAxis: 0.38709893,   // AU
    semiMinorAxis: 0.37949598,   // Calculated from semi-major and eccentricity
    eccentricity: 0.20563069,    // Actual value
    inclination: 7.00497902 * (Math.PI / 180),  // Converted from degrees to radians
    longitudeOfAscendingNode: 48.33167 * (Math.PI / 180), // Converted from degrees to radians
    argumentOfPeriapsis: 29.12478 * (Math.PI / 180), // Converted from degrees to radians
    scale: 0.0035,
    offset: 0.0796, // 0.20563069 * 0.38709893
    color: '#9768ac',
    hoverColor: '#714e81'
  },
  Venus: {
    semiMajorAxis: 0.72333199,   // AU
    semiMinorAxis: 0.72332375,   // Slightly less than the semi-major due to small eccentricity
    eccentricity: 0.00677323,    // Actual value
    inclination: 3.39467605 * (Math.PI / 180),  // Converted from degrees to radians
    longitudeOfAscendingNode: 76.68069 * (Math.PI / 180), // Converted from degrees to radians
    argumentOfPeriapsis: 54.85229 * (Math.PI / 180), // Converted from degrees to radians
    scale: 0.0087,
    offset: 0.0049, // 0.00677323 * 0.72333199
    color: '#b07919',
    hoverColor: '#845b13'
  },
  Earth: {
    semiMajorAxis: 1.00000011,   // AU
    semiMinorAxis: 0.99986200,   // Calculated value
    eccentricity: 0.01671022,    // Actual value
    inclination: 0.00005 * (Math.PI / 180),     // Earth's inclination is almost 0
    longitudeOfAscendingNode: -11.26064 * (Math.PI / 180), // Converted from degrees to radians
    argumentOfPeriapsis: 114.20783 * (Math.PI / 180), // Converted from degrees to radians
    scale: 0.0092,
    offset: 0.0167, // 0.01671022 * 1.00000011
    color: '#09c',
    hoverColor: '#007399'
  },
  Moon: {
    semiMajorAxis: 0.00256955529, // AU (384,400 km)
    semiMinorAxis: 0.0025656799, // Calculated from semi-major and eccentricity
    eccentricity: 0.0549, // Actual value
    inclination: 5.145 * (Math.PI / 180), // Converted from degrees to radians
    longitudeOfAscendingNode: 125.08 * (Math.PI / 180), // Converted from degrees to radians
    argumentOfPeriapsis: 318.15 * (Math.PI / 180), // Converted from degrees to radians
    scale: 0.272, // Relative to Earth's scale
    offset: 0.000141, // 0.0549 * 0.00256955529
    color: '#cccccc',
    hoverColor: '#aaaaaa'
  },
  Mars: {
    semiMajorAxis: 1.52371034,   // AU
    semiMinorAxis: 1.51752573,   // Calculated value
    eccentricity: 0.09339410,    // Actual value
    inclination: 1.85061078 * (Math.PI / 180),  // Converted from degrees to radians
    longitudeOfAscendingNode: 49.57854 * (Math.PI / 180), // Converted from degrees to radians
    argumentOfPeriapsis: 286.46230 * (Math.PI / 180), // Converted from degrees to radians
    scale: 0.0049,
    offset: 0.1423, // 0.09339410 * 1.52371034
    color: '#9a4e19',
    hoverColor: '#733a13'
  },
  Phobos: {
    semiMajorAxis: 0.000627, // AU (9,378 km)
    semiMinorAxis: 0.000627, // Calculated from semi-major and eccentricity
    eccentricity: 0.0151, // Actual value
    inclination: 1.093 * (Math.PI / 180), // Converted from degrees to radians
    longitudeOfAscendingNode: 49.57854 * (Math.PI / 180), // Converted from degrees to radians
    argumentOfPeriapsis: 286.46230 * (Math.PI / 180), // Converted from degrees to radians
    scale: 0.0177, // Relative to Earth's scale
    offset: 0.00000094677, // 0.0151 * 0.0000627
    color: '#888888',
    hoverColor: '#666666'
  },
  Deimos: {
    semiMajorAxis: 0.00156, // AU (23,460 km)
    semiMinorAxis: 0.00156, // Calculated from semi-major and eccentricity
    eccentricity: 0.0002, // Actual value
    inclination: 1.788 * (Math.PI / 180), // Converted from degrees to radians
    longitudeOfAscendingNode: 49.57854 * (Math.PI / 180), // Converted from degrees to radians
    argumentOfPeriapsis: 286.46230 * (Math.PI / 180), // Converted from degrees to radians
    scale: 0.0097, // Relative to Earth's scale
    offset: 0.0000000312, // 0.0002 * 0.000156
    color: '#888888',
    hoverColor: '#666666'
  },
  Jupiter: {
    semiMajorAxis: 5.20288700,   // AU
    semiMinorAxis: 5.19560938,   // Calculated value
    eccentricity: 0.04838624,    // Actual value
    inclination: 1.30439695 * (Math.PI / 180),  // Converted from degrees to radians
    longitudeOfAscendingNode: 100.55615 * (Math.PI / 180), // Converted from degrees to radians
    argumentOfPeriapsis: 273.86700 * (Math.PI / 180), // Converted from degrees to radians
    scale: 0.1005,
    offset: 0.2543, // 0.04838624 * 5.20288700
    color: '#da8b72',
    hoverColor: '#a36855'
  },
  Saturn: {
    semiMajorAxis: 9.53667594,   // AU
    semiMinorAxis: 9.52039381,   // Calculated value
    eccentricity: 0.05386179,    // Actual value
    inclination: 2.48599187 * (Math.PI / 180),  // Converted from degrees to radians
    longitudeOfAscendingNode: 113.66242 * (Math.PI / 180), // Converted from degrees to radians
    argumentOfPeriapsis: 339.39200 * (Math.PI / 180), // Converted from degrees to radians
    scale: 0.0837,
    offset: 0.5386, // 0.05386179 * 9.53667594
    color: '#d5c187',
    hoverColor: '#786d4c'
  },
  Uranus: {
    semiMajorAxis: 19.18916464,  // AU
    semiMinorAxis: 19.18193915,  // Calculated value
    eccentricity: 0.04725744,    // Actual value
    inclination: 0.7730590 * (Math.PI / 180),   // Converted from degrees to radians
    longitudeOfAscendingNode: 74.22988 * (Math.PI / 180), // Converted from degrees to radians
    argumentOfPeriapsis: 96.998857 * (Math.PI / 180), // Converted from degrees to radians
    scale: 0.0365,
    offset: 0.8905, // 0.04725744 * 19.18916464
    color: '#68ccda',
    hoverColor: '#4e99a3'
  },
  Neptune: {
    semiMajorAxis: 30.110386,    // AU
    semiMinorAxis: 30.109458,    // Calculated value
    eccentricity: 0.00867760,    // Actual value
    inclination: 1.7691704 * (Math.PI / 180),   // Converted from degrees to radians
    longitudeOfAscendingNode: 131.72169 * (Math.PI / 180), // Converted from degrees to radians
    argumentOfPeriapsis: 276.0450 * (Math.PI / 180), // Converted from degrees to radians
    scale: 0.0354,
    offset: 0.2608, // 0.00867760 * 30.110386
    color: '#708ce3',
    hoverColor: '#5469AF'
  },
};