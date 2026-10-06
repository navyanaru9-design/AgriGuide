export type WeatherInput = {
  temperatureC: number | null;
  rainfallMm: number | null;
  humidityPercent: number | null;
  windKmh: number | null;
  condition: string;
  source: string;
  fallback: boolean;
};

export type FarmInput = {
  farmName?: string;
  country: string;
  state?: string;
  district?: string;
  village?: string;
  latitude?: number | null;
  longitude?: number | null;
  soilType: string;
  waterAvailability: string;
  irrigationSource: string;
  previousCrop: string;
  season: string;
};

type Crop = {
  name: string;
  suitableSoils: string[];
  suitableSeasons: string[];
  waterRequirement: string;
  waterTarget: number;
  suitableRegions: string[];
  temp: [number, number];
  rainfall: [number, number];
  weatherRequirements: string;
  growthDuration: string;
  rotationCompatibility: string[];
  risks: string[];
};

export const crops: Crop[] = [
  { name: "Rice", suitableSoils: ["Alluvial Soil", "Clay Soil", "Loamy Soil"], suitableSeasons: ["Kharif", "Summer"], waterRequirement: "Very high", waterTarget: 5, suitableRegions: ["India", "Andhra Pradesh", "West Bengal", "Punjab", "Odisha"], temp: [22, 34], rainfall: [120, 350], weatherRequirements: "Warm conditions with abundant rainfall or reliable irrigation", growthDuration: "120–150 days", rotationCompatibility: ["Green Gram", "Black Gram", "Groundnut"], risks: ["High water demand", "Flooding or drought can damage crops"] },
  { name: "Maize", suitableSoils: ["Loamy Soil", "Alluvial Soil", "Red Soil"], suitableSeasons: ["Kharif", "Rabi", "Summer"], waterRequirement: "Moderate", waterTarget: 3, suitableRegions: ["India", "Andhra Pradesh", "Karnataka", "Telangana"], temp: [18, 32], rainfall: [50, 180], weatherRequirements: "Warm days and moderate, well-distributed rainfall", growthDuration: "90–120 days", rotationCompatibility: ["Groundnut", "Soybean", "Green Gram", "Red Gram"], risks: ["Water stress at flowering", "Waterlogging"] },
  { name: "Groundnut", suitableSoils: ["Red Soil", "Sandy Soil", "Loamy Soil"], suitableSeasons: ["Kharif", "Summer"], waterRequirement: "Low to moderate", waterTarget: 2.5, suitableRegions: ["India", "Andhra Pradesh", "Gujarat", "Tamil Nadu", "Karnataka"], temp: [20, 32], rainfall: [40, 130], weatherRequirements: "Warm, sunny weather and light to moderate rainfall", growthDuration: "100–130 days", rotationCompatibility: ["Maize", "Rice", "Sorghum", "Pearl Millet"], risks: ["Waterlogging", "Drought during pod formation"] },
  { name: "Cotton", suitableSoils: ["Black Soil", "Alluvial Soil", "Loamy Soil"], suitableSeasons: ["Kharif"], waterRequirement: "Moderate", waterTarget: 3, suitableRegions: ["India", "Andhra Pradesh", "Gujarat", "Maharashtra", "Telangana"], temp: [21, 35], rainfall: [50, 180], weatherRequirements: "Warm, mostly dry conditions during boll opening", growthDuration: "150–180 days", rotationCompatibility: ["Maize", "Sorghum", "Green Gram"], risks: ["Pest pressure", "Excess rain near harvest"] },
  { name: "Red Gram", suitableSoils: ["Red Soil", "Black Soil", "Loamy Soil"], suitableSeasons: ["Kharif"], waterRequirement: "Low to moderate", waterTarget: 2, suitableRegions: ["India", "Andhra Pradesh", "Karnataka", "Telangana"], temp: [20, 35], rainfall: [40, 140], weatherRequirements: "Warm weather and moderate rainfall with good drainage", growthDuration: "150–180 days", rotationCompatibility: ["Maize", "Sorghum", "Pearl Millet", "Groundnut"], risks: ["Waterlogging", "Pod borer"] },
  { name: "Green Gram", suitableSoils: ["Red Soil", "Sandy Soil", "Loamy Soil"], suitableSeasons: ["Kharif", "Summer"], waterRequirement: "Low", waterTarget: 1.5, suitableRegions: ["India", "Andhra Pradesh", "Rajasthan", "Maharashtra"], temp: [22, 35], rainfall: [30, 100], weatherRequirements: "Warm, dry weather near maturity", growthDuration: "60–75 days", rotationCompatibility: ["Rice", "Maize", "Cotton", "Sorghum"], risks: ["Waterlogging", "Yellow mosaic virus"] },
  { name: "Black Gram", suitableSoils: ["Alluvial Soil", "Red Soil", "Loamy Soil"], suitableSeasons: ["Kharif", "Rabi"], waterRequirement: "Low", waterTarget: 1.5, suitableRegions: ["India", "Andhra Pradesh", "Tamil Nadu", "Madhya Pradesh"], temp: [22, 35], rainfall: [35, 120], weatherRequirements: "Warm conditions and moderate rainfall", growthDuration: "70–90 days", rotationCompatibility: ["Rice", "Maize", "Sorghum", "Cotton"], risks: ["Waterlogging", "Leaf curl and mosaic diseases"] },
  { name: "Chilli", suitableSoils: ["Red Soil", "Loamy Soil", "Black Soil"], suitableSeasons: ["Kharif", "Rabi"], waterRequirement: "Moderate", waterTarget: 3, suitableRegions: ["India", "Andhra Pradesh", "Telangana", "Karnataka"], temp: [20, 32], rainfall: [50, 160], weatherRequirements: "Warm weather without prolonged waterlogging", growthDuration: "150–180 days", rotationCompatibility: ["Maize", "Rice", "Green Gram"], risks: ["Thrips and mites", "Fruit rot in prolonged wet spells"] },
  { name: "Tomato", suitableSoils: ["Loamy Soil", "Alluvial Soil", "Red Soil"], suitableSeasons: ["Rabi", "Summer"], waterRequirement: "Moderate", waterTarget: 3, suitableRegions: ["India", "Andhra Pradesh", "Karnataka", "Maharashtra"], temp: [18, 30], rainfall: [30, 100], weatherRequirements: "Mild to warm weather and consistent soil moisture", growthDuration: "90–120 days", rotationCompatibility: ["Maize", "Groundnut", "Green Gram"], risks: ["Heat stress", "Late blight in prolonged humidity"] },
  { name: "Onion", suitableSoils: ["Loamy Soil", "Alluvial Soil", "Sandy Soil"], suitableSeasons: ["Rabi", "Summer"], waterRequirement: "Moderate", waterTarget: 2.5, suitableRegions: ["India", "Andhra Pradesh", "Maharashtra", "Karnataka"], temp: [13, 28], rainfall: [30, 100], weatherRequirements: "Cool growth period followed by dry conditions for curing", growthDuration: "100–140 days", rotationCompatibility: ["Maize", "Rice", "Green Gram"], risks: ["Bolting in cold spells", "Rot if curing is wet"] },
  { name: "Sorghum", suitableSoils: ["Black Soil", "Red Soil", "Loamy Soil"], suitableSeasons: ["Kharif", "Rabi"], waterRequirement: "Low", waterTarget: 1.5, suitableRegions: ["India", "Andhra Pradesh", "Maharashtra", "Karnataka"], temp: [25, 35], rainfall: [25, 100], weatherRequirements: "Hot, relatively dry conditions; drought tolerant", growthDuration: "100–120 days", rotationCompatibility: ["Groundnut", "Red Gram", "Green Gram"], risks: ["Bird damage", "Moisture stress at flowering"] },
  { name: "Pearl Millet", suitableSoils: ["Sandy Soil", "Red Soil", "Loamy Soil"], suitableSeasons: ["Kharif"], waterRequirement: "Very low", waterTarget: 1, suitableRegions: ["India", "Andhra Pradesh", "Rajasthan", "Gujarat"], temp: [25, 38], rainfall: [20, 80], weatherRequirements: "Hot, dry weather and low to moderate rainfall", growthDuration: "75–100 days", rotationCompatibility: ["Groundnut", "Red Gram", "Green Gram"], risks: ["Downy mildew", "Bird damage"] },
  { name: "Finger Millet", suitableSoils: ["Red Soil", "Loamy Soil", "Laterite Soil"], suitableSeasons: ["Kharif"], waterRequirement: "Low to moderate", waterTarget: 2, suitableRegions: ["India", "Andhra Pradesh", "Karnataka", "Tamil Nadu"], temp: [20, 32], rainfall: [40, 140], weatherRequirements: "Warm weather with moderate rainfall", growthDuration: "100–120 days", rotationCompatibility: ["Groundnut", "Red Gram", "Green Gram"], risks: ["Blast disease", "Waterlogging"] },
  { name: "Soybean", suitableSoils: ["Black Soil", "Loamy Soil", "Alluvial Soil"], suitableSeasons: ["Kharif"], waterRequirement: "Moderate", waterTarget: 3, suitableRegions: ["India", "Andhra Pradesh", "Madhya Pradesh", "Maharashtra"], temp: [20, 32], rainfall: [60, 180], weatherRequirements: "Warm conditions and moderate rainfall", growthDuration: "90–120 days", rotationCompatibility: ["Wheat", "Rice", "Maize"], risks: ["Waterlogging", "Moisture stress during pod filling"] },
  { name: "Sugarcane", suitableSoils: ["Alluvial Soil", "Black Soil", "Loamy Soil"], suitableSeasons: ["Kharif", "Summer"], waterRequirement: "Very high", waterTarget: 5, suitableRegions: ["India", "Andhra Pradesh", "Uttar Pradesh", "Maharashtra"], temp: [20, 35], rainfall: [100, 300], weatherRequirements: "Long warm growing season with reliable water", growthDuration: "10–14 months", rotationCompatibility: ["Green Gram", "Groundnut", "Soybean"], risks: ["Very high water demand", "Long field occupancy"] },
  { name: "Wheat", suitableSoils: ["Alluvial Soil", "Loamy Soil", "Black Soil"], suitableSeasons: ["Rabi"], waterRequirement: "Moderate", waterTarget: 3, suitableRegions: ["India", "Punjab", "Haryana", "Uttar Pradesh"], temp: [10, 25], rainfall: [20, 100], weatherRequirements: "Cool season with dry, sunny weather as grain matures", growthDuration: "110–150 days", rotationCompatibility: ["Soybean", "Rice", "Green Gram"], risks: ["Heat during grain filling", "Rust disease"] },
  { name: "Sunflower", suitableSoils: ["Black Soil", "Red Soil", "Loamy Soil"], suitableSeasons: ["Kharif", "Rabi", "Summer"], waterRequirement: "Low to moderate", waterTarget: 2, suitableRegions: ["India", "Andhra Pradesh", "Karnataka", "Maharashtra"], temp: [20, 35], rainfall: [30, 120], weatherRequirements: "Sunny, warm conditions with adequate moisture at flowering", growthDuration: "85–110 days", rotationCompatibility: ["Maize", "Groundnut", "Green Gram"], risks: ["Bird damage", "Water stress at flowering"] },
  { name: "Mustard", suitableSoils: ["Loamy Soil", "Alluvial Soil", "Sandy Soil"], suitableSeasons: ["Rabi"], waterRequirement: "Low", waterTarget: 1.5, suitableRegions: ["India", "Rajasthan", "Uttar Pradesh", "Haryana"], temp: [10, 25], rainfall: [15, 80], weatherRequirements: "Cool, dry weather during flowering and seed maturity", growthDuration: "110–140 days", rotationCompatibility: ["Rice", "Maize", "Green Gram"], risks: ["Aphids", "Heat during flowering"] },
  { name: "Potato", suitableSoils: ["Loamy Soil", "Alluvial Soil", "Sandy Soil"], suitableSeasons: ["Rabi", "Summer"], waterRequirement: "Moderate", waterTarget: 3, suitableRegions: ["India", "Uttar Pradesh", "West Bengal", "Punjab"], temp: [12, 25], rainfall: [30, 100], weatherRequirements: "Cool weather and steady moisture in well-drained soil", growthDuration: "80–120 days", rotationCompatibility: ["Maize", "Rice", "Green Gram"], risks: ["Late blight", "Heat and waterlogging"] },
  { name: "Turmeric", suitableSoils: ["Red Soil", "Loamy Soil", "Laterite Soil"], suitableSeasons: ["Kharif"], waterRequirement: "High", waterTarget: 4, suitableRegions: ["India", "Andhra Pradesh", "Telangana", "Tamil Nadu"], temp: [20, 35], rainfall: [100, 250], weatherRequirements: "Warm, humid growing period with reliable moisture", growthDuration: "7–9 months", rotationCompatibility: ["Maize", "Rice", "Green Gram"], risks: ["Rhizome rot", "Water stress during rhizome development"] },
];

const waterValues: Record<string, number> = {
  "Very Low": 1,
  Low: 2,
  Moderate: 3,
  High: 4,
  "Very High": 5,
};

const soilNeighbors: Record<string, string[]> = {
  "Black Soil": ["Alluvial Soil", "Loamy Soil"],
  "Red Soil": ["Loamy Soil", "Laterite Soil", "Sandy Soil"],
  "Alluvial Soil": ["Loamy Soil", "Clay Soil", "Black Soil"],
  "Sandy Soil": ["Red Soil", "Loamy Soil"],
  "Loamy Soil": ["Alluvial Soil", "Red Soil", "Black Soil", "Sandy Soil"],
  "Clay Soil": ["Alluvial Soil", "Black Soil"],
  "Laterite Soil": ["Red Soil", "Loamy Soil"],
};

function round(value: number): number {
  return Math.round(Math.max(0, Math.min(100, value)) * 10) / 10;
}

function rangeScore(value: number, min: number, max: number): number {
  if (value >= min && value <= max) return 100;
  const distance = value < min ? min - value : value - max;
  return Math.max(0, 100 - distance * 4);
}

function locationScore(crop: Crop, farm: FarmInput): number {
  const place = [farm.village, farm.district, farm.state].filter(Boolean).join(" ").toLowerCase();
  const match = crop.suitableRegions
    .filter((region) => region.toLowerCase() !== "india")
    .some((region) => place.includes(region.toLowerCase()));
  if (match) return 100;
  if (farm.country.toLowerCase() === "india") return 65;
  return 45;
}

function explanation(factors: Record<string, number>): string {
  const labels: Record<string, string> = {
    soil: "soil",
    location: "region",
    weather: "weather",
    water: "water availability",
    rotation: "crop rotation",
    season: "season",
  };
  const strongest = Object.entries(factors).sort((a, b) => b[1] - a[1]).slice(0, 2);
  const weakest = Object.entries(factors).sort((a, b) => a[1] - b[1])[0];
  const strengths = strongest.map(([key]) => labels[key]).join(" and ");
  return `${strengths[0]?.toUpperCase()}${strengths.slice(1)} support this choice; ${labels[weakest[0]]} is the main factor to review.`;
}

export function getCropDataset() {
  return crops.map(({ waterTarget: _waterTarget, temp: _temp, rainfall: _rainfall, ...crop }) => crop);
}

export function recommendCrops(farm: FarmInput, weather: WeatherInput) {
  const previousCrop = farm.previousCrop.toLowerCase();
  const scored = crops.map((crop) => {
    const soil = farm.soilType === "Unknown" ? 55
      : crop.suitableSoils.includes(farm.soilType) ? 100
        : soilNeighbors[farm.soilType]?.some((soilType) => crop.suitableSoils.includes(soilType)) ? 65 : 35;
    const location = locationScore(crop, farm);
    const wxValues: number[] = [];
    if (weather.temperatureC !== null) wxValues.push(rangeScore(weather.temperatureC, ...crop.temp));
    if (weather.rainfallMm !== null) wxValues.push(rangeScore(weather.rainfallMm, ...crop.rainfall));
    if (weather.humidityPercent !== null) wxValues.push(rangeScore(weather.humidityPercent, 35, 90));
    if (weather.windKmh !== null) wxValues.push(rangeScore(weather.windKmh, 0, 35));
    const wx = wxValues.length ? wxValues.reduce((a, b) => a + b, 0) / wxValues.length : 65;
    const availableWater = waterValues[farm.waterAvailability] ?? 3;
    const water = 100 - Math.abs(availableWater - crop.waterTarget) * 24;
    let rotation = 78;
    if (previousCrop && previousCrop !== "none" && previousCrop !== "not selected") {
      if (previousCrop === crop.name.toLowerCase()) rotation = 20;
      else if (crop.rotationCompatibility.some((name) => previousCrop.includes(name.toLowerCase()))) rotation = 95;
      else rotation = 68;
    }
    const season = crop.suitableSeasons.includes(farm.season) ? 100 : 30;
    const factors = {
      soil: round(soil),
      location: round(location),
      weather: round(wx),
      water: round(water),
      rotation: round(rotation),
      season: round(season),
    };
    const score = round(
      factors.soil * 0.25 +
      factors.location * 0.20 +
      factors.weather * 0.20 +
      factors.water * 0.15 +
      factors.rotation * 0.10 +
      factors.season * 0.10,
    );
    const riskScores = [factors.water, factors.weather, factors.soil, factors.rotation];
    const weakest = Math.min(...riskScores);
    const riskLevel = weakest >= 75 ? "Low" : weakest >= 50 ? "Moderate" : "High";
    const risks = [
      `Water risk: ${factors.water >= 75 ? "Low" : factors.water >= 50 ? "Moderate" : "High"}`,
      `Weather risk: ${factors.weather >= 75 ? "Low" : factors.weather >= 50 ? "Moderate" : "High"}`,
      `Soil compatibility risk: ${factors.soil >= 75 ? "Low" : factors.soil >= 50 ? "Moderate" : "High"}`,
      `Rotation risk: ${factors.rotation >= 75 ? "Low" : factors.rotation >= 50 ? "Moderate" : "High"}`,
    ];
    return {
      crop: crop.name,
      score,
      factors,
      waterRequirement: crop.waterRequirement,
      growthDuration: crop.growthDuration,
      seasons: crop.suitableSeasons,
      why: explanation(factors),
      risks,
      riskLevel,
    };
  });
  return scored
    .sort((a, b) => b.score - a.score || a.crop.localeCompare(b.crop))
    .slice(0, 3)
    .map((recommendation, index) => ({ ...recommendation, rank: index + 1 }));
}
