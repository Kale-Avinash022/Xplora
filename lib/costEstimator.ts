import {
  TRIP_COST_CONFIG,
  DestinationClass,
  calculateHaversineDistance,
  resolveDestinationCoordinates,
  resolveOriginCoordinates,
} from './destinationCosts';

export interface TripCostInput {
  destination: string;
  from?: string;
  durationDays: number;
  travelers?: number;
  travelStyle?: string;
}

export type CostCategoryType =
  | 'intercity_transport'
  | 'stay'
  | 'food'
  | 'local_transport'
  | 'activities'
  | 'buffer';

export interface TripCostBreakdownItem {
  category: CostCategoryType;
  label: string;
  minimum: number;
  recommended: number;
}

export interface TripCostEstimate {
  minimumRequired: number;
  recommended: number;
  comfortable: number;
  currency: 'INR';
  breakdown: TripCostBreakdownItem[];
  assumptions: string[];
}

/**
 * Pure, deterministic trip cost estimator based on 2026 realistic Indian travel rates.
 * Generates minimum required, recommended, and comfortable budget baselines,
 * complete with itemized breakdowns and clear assumptions.
 */
export function estimateTripCost(input: TripCostInput): TripCostEstimate {
  const assumptions: string[] = [];

  const rawDest = (input.destination || 'Trip').trim();
  const days = Math.max(1, Math.round(Number(input.durationDays) || 1));
  const travelers = Math.max(1, Math.round(Number(input.travelers) || 1));
  const styleRaw = (input.travelStyle || 'Adventure').toLowerCase().trim();

  // 1. Resolve Destination & Destination Class
  const destCoords = resolveDestinationCoordinates(rawDest);
  const destCleanKey = destCoords ? destCoords.key : rawDest.toLowerCase().replace(/[^a-z0-9]/g, '');

  const destClass: DestinationClass =
    TRIP_COST_CONFIG.destinationClass[destCleanKey] || 'METRO_HERITAGE';

  // 2. Resolve Travel Style Tier & Multipliers
  const styleConfig =
    TRIP_COST_CONFIG.styleTierMapping[styleRaw] ||
    TRIP_COST_CONFIG.styleTierMapping['general'];

  // 3. Calculate Intercity Round-Trip Transport via Haversine Distance
  let transportMin = 0;
  let transportRec = 0;
  let transportMode = 'Bus / Train';

  const originResolved = resolveOriginCoordinates(input.from);
  if (originResolved.isDefault) {
    assumptions.push(
      `Origin city not provided or unrecognized; defaulted to ${originResolved.name} for round-trip transport estimation.`
    );
  }

  if (destCoords) {
    const oneWayDistanceKm = calculateHaversineDistance(
      originResolved.lat,
      originResolved.lng,
      destCoords.lat,
      destCoords.lng
    );

    if (oneWayDistanceKm < 25) {
      // Same city/district: intercity transport not required
      transportMin = 0;
      transportRec = 0;
      assumptions.push(
        `Origin (${originResolved.name}) and destination (${destCoords.name}) are in the same local zone; intercity transport set to ₹0.`
      );
    } else {
      const roundTripDistanceKm = oneWayDistanceKm * 2;
      const isOverThreshold = oneWayDistanceKm >= TRIP_COST_CONFIG.transport.distanceThresholdKm;
      const rateConfig = isOverThreshold
        ? TRIP_COST_CONFIG.transport.overThreshold
        : TRIP_COST_CONFIG.transport.underThreshold;

      transportMode = rateConfig.mode;

      const perPersonMin = Math.max(
        rateConfig.minFloor,
        Math.round(roundTripDistanceKm * rateConfig.minRatePerKm)
      );
      const perPersonRec = Math.max(
        rateConfig.recFloor,
        Math.round(roundTripDistanceKm * rateConfig.recRatePerKm)
      );

      transportMin = perPersonMin * travelers;
      transportRec = perPersonRec * travelers;

      assumptions.push(
        `Round-trip transport (${roundTripDistanceKm} km via ${transportMode}) between ${originResolved.name} and ${destCoords.name} for ${travelers} traveler(s).`
      );
    }
  } else {
    // Fallback if destination coords are not known
    const fallbackRate = TRIP_COST_CONFIG.transport.underThreshold;
    transportMin = fallbackRate.minFloor * travelers;
    transportRec = fallbackRate.recFloor * travelers;
    assumptions.push(
      `Estimated baseline regional transport for ${travelers} traveler(s).`
    );
  }

  // 4. Lodging / Stay (Per ROOM, ceil(travelers / 2), minimum 1 night)
  const nights = Math.max(1, days - 1);
  const rooms = Math.ceil(travelers / 2);

  const stayTierConfig = TRIP_COST_CONFIG.stayRatesPerRoomPerNight[destClass];
  const stayMin = Math.round(stayTierConfig.minimum * rooms * nights);
  const stayRec = Math.round(
    stayTierConfig.recommended * rooms * nights * styleConfig.stayMult
  );
  const stayComfortable = Math.round(
    stayTierConfig.comfortable * rooms * nights * Math.max(1.2, styleConfig.stayMult)
  );

  assumptions.push(
    `Lodging calculated for ${nights} night(s) in ${rooms} room(s) for ${travelers} traveler(s).`
  );

  // 5. Daily Per-Person Costs: Food, Local Transport, Activities
  const personDays = travelers * days;
  const dailyRates = TRIP_COST_CONFIG.dailyPerPersonRates[destClass];

  // Food
  const foodMin = Math.round(dailyRates.food.min * personDays);
  const foodRec = Math.round(dailyRates.food.rec * personDays * styleConfig.foodMult);

  // Local City Transit & Cabs
  const localTransMin = Math.round(dailyRates.localTransport.min * personDays);
  const localTransRec = Math.round(dailyRates.localTransport.rec * personDays);

  // Activities, Darshan, Passes & Entry Fees
  const activitiesMin = Math.round(dailyRates.activities.min * personDays);
  const activitiesRec = Math.round(
    dailyRates.activities.rec * personDays * styleConfig.actMult
  );

  assumptions.push(
    `Daily food, local transit, and activities calculated at ${destClass.replace(/_/g, ' ').toLowerCase()} rates across ${personDays} traveler-day(s).`
  );

  // 6. Subtotals & Buffer (10%)
  const subtotalMin =
    transportMin + stayMin + foodMin + localTransMin + activitiesMin;
  const bufferMin = Math.round(subtotalMin * TRIP_COST_CONFIG.bufferPercent);
  const minimumRequired = subtotalMin + bufferMin;

  const subtotalRec =
    transportRec + stayRec + foodRec + localTransRec + activitiesRec;
  const bufferRec = Math.round(subtotalRec * TRIP_COST_CONFIG.bufferPercent);
  const recommended = subtotalRec + bufferRec;

  // Comfortable Tier (4-star / luxury stay, flight/first-class transport, premium dining)
  const comfortableTransport =
    transportRec > 0 ? Math.round(transportRec * 1.35) : 0;
  const comfortableFood = Math.round(foodRec * 1.5);
  const comfortableLocal = Math.round(localTransRec * 1.4);
  const comfortableAct = Math.round(activitiesRec * 1.5);
  const subtotalComfortable =
    comfortableTransport +
    stayComfortable +
    comfortableFood +
    comfortableLocal +
    comfortableAct;
  const bufferComfortable = Math.round(
    subtotalComfortable * TRIP_COST_CONFIG.bufferPercent
  );
  const comfortable = subtotalComfortable + bufferComfortable;

  // 7. Itemized Breakdown
  const breakdown: TripCostBreakdownItem[] = [
    {
      category: 'intercity_transport',
      label: 'Intercity Transport (Round Trip)',
      minimum: transportMin,
      recommended: transportRec,
    },
    {
      category: 'stay',
      label: 'Hotel & Lodging',
      minimum: stayMin,
      recommended: stayRec,
    },
    {
      category: 'food',
      label: 'Food & Dining',
      minimum: foodMin,
      recommended: foodRec,
    },
    {
      category: 'local_transport',
      label: 'Local Transit & Sightseeing Cabs',
      minimum: localTransMin,
      recommended: localTransRec,
    },
    {
      category: 'activities',
      label: 'Activities, Darshan & Entry Passes',
      minimum: activitiesMin,
      recommended: activitiesRec,
    },
    {
      category: 'buffer',
      label: 'Contingency Buffer (10%)',
      minimum: bufferMin,
      recommended: bufferRec,
    },
  ];

  return {
    minimumRequired,
    recommended,
    comfortable,
    currency: 'INR',
    breakdown,
    assumptions,
  };
}
