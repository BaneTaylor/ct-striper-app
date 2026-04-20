import type { SpotType, LureRecommendation } from '@/lib/types';

// ═══════════════════════════════════════════════════════════════════════════
// Public API
// ═══════════════════════════════════════════════════════════════════════════

export function getRecommendations(params: {
  spotType: SpotType;
  timeOfDay: 'dawn' | 'day' | 'dusk' | 'night';
  season: 'spring' | 'summer' | 'fall' | 'winter';
  waterTemp: number;
  tideDirection: 'incoming' | 'outgoing' | 'slack';
  tideStrength: 'strong' | 'moderate' | 'weak';
  waterClarity: 'clear' | 'stained' | 'murky';
}): LureRecommendation[] {
  const recs: LureRecommendation[] = [];

  // ── Condition-specific recommendations ────────────────────────────────
  addConditionRecs(recs, params);

  // ── Seasonal overlay ──────────────────────────────────────────────────
  addSeasonalRecs(recs, params);

  // ── Water clarity adjustments ─────────────────────────────────────────
  addClarityRecs(recs, params);

  // ── Water temp adjustments ────────────────────────────────────────────
  addTempRecs(recs, params);

  // Sort by confidence descending, deduplicate by name
  const seen = new Set<string>();
  return recs
    .sort((a, b) => b.confidence - a.confidence)
    .filter((r) => {
      if (seen.has(r.name)) return false;
      seen.add(r.name);
      return true;
    })
    .slice(0, 8); // return top 8
}

// ═══════════════════════════════════════════════════════════════════════════
// Condition-based recommendations
// ═══════════════════════════════════════════════════════════════════════════

function addConditionRecs(
  recs: LureRecommendation[],
  p: Parameters<typeof getRecommendations>[0],
) {
  const { spotType, timeOfDay, tideDirection, tideStrength } = p;

  // Night + river mouth + outgoing = live eel, rigged eel
  if (timeOfDay === 'night' && spotType === 'river_mouth' && tideDirection === 'outgoing') {
    recs.push({
      name: 'Live Eel',
      type: 'bait',
      retrieve: 'Drift or slow swim with the current, keeping bottom contact',
      why: 'Outgoing tide washes bait from the river — stripers stage at the mouth. Live eels are irresistible in the dark.',
      confidence: 10,
    });
    recs.push({
      name: 'Rigged Eel',
      type: 'lure',
      retrieve: 'Slow, steady retrieve across the current with occasional pauses',
      why: 'Mimics a disoriented eel being swept out. The jig head gets it down in the current.',
      confidence: 9,
    });
  }

  // Dawn + rocky jetty/shore + incoming = topwater popper, pencil popper
  if (
    (timeOfDay === 'dawn' || timeOfDay === 'dusk') &&
    (spotType === 'jetty' || spotType === 'rocky_shore' || spotType === 'rocky_point') &&
    tideDirection === 'incoming'
  ) {
    recs.push({
      name: 'Topwater Popper',
      type: 'lure',
      retrieve: 'Aggressive pop-pop-pause — let the rings settle between pops',
      why: 'Incoming tide pushes bait against the rocks. Stripers smash surface baits at dawn/dusk near structure.',
      confidence: 9,
    });
    recs.push({
      name: 'Pencil Popper',
      type: 'lure',
      retrieve: 'Walk-the-dog with a medium-fast cadence, keeping the nose splashing',
      why: 'The erratic side-to-side action triggers reaction strikes from bass keyed in on surface bait.',
      confidence: 8,
    });
  }

  // Daytime + deep water + strong current = bucktail jig
  if (timeOfDay === 'day' && spotType === 'deep_water' && tideStrength === 'strong') {
    recs.push({
      name: 'Bucktail Jig (white) with Gulp trailer',
      type: 'lure',
      retrieve: 'Bounce along bottom — lift, drop, reel up slack. Let the current sweep it.',
      why: 'Strong current in deep water positions fish near bottom structure. White bucktail is the most versatile striper jig.',
      confidence: 9,
    });
    recs.push({
      name: 'Diamond Jig (2-4 oz)',
      type: 'lure',
      retrieve: 'Vertical jig — drop to bottom, crank up 5 turns, let it flutter back',
      why: 'Cuts through current to reach holding fish. The flutter triggers strikes.',
      confidence: 7,
    });
  }

  // Surf beach + outgoing = chunked bunker on fishfinder rig
  if (spotType === 'beach_surf' && tideDirection === 'outgoing') {
    recs.push({
      name: 'Chunked Bunker on Fish-Finder Rig',
      type: 'bait',
      retrieve: 'Cast out, set in sand spike, keep line tight. Use circle hook, let them eat.',
      why: 'Outgoing tide creates a bait-scented slick that draws stripers along the beach. Chunk bait soaks and attracts.',
      confidence: 9,
    });
    recs.push({
      name: 'Darter Plug',
      type: 'lure',
      retrieve: 'Slow, steady retrieve — let the current give it action',
      why: 'The subtle swimming action works in the wash. Outgoing tide creates current along the beach that activates the plug.',
      confidence: 7,
    });
  }

  // Bridge + night + any movement
  if (spotType === 'bridge' && timeOfDay === 'night' && tideDirection !== 'slack') {
    recs.push({
      name: 'Needlefish Plug',
      type: 'lure',
      retrieve: 'Dead-slow retrieve through the shadow line where light meets dark',
      why: 'Bridge lights create a shadow line where stripers ambush bait. Needlefish has a subtle profile that gets crushed in the dark.',
      confidence: 10,
    });
    recs.push({
      name: 'Darter Plug',
      type: 'lure',
      retrieve: 'Swing in the current — cast upcurrent and let it sweep through the light/shadow line',
      why: 'The darter\'s side-to-side action is deadly when swung in bridge current at night.',
      confidence: 9,
    });
    recs.push({
      name: 'Soft Plastic Paddle Tail (white/chartreuse)',
      type: 'lure',
      retrieve: 'Slow roll through the shadow line on a light jig head',
      why: 'Quiet presentation for pressured bridge fish. Paddle tail gives subtle vibration.',
      confidence: 7,
    });
  }

  // Night + beach surf
  if (timeOfDay === 'night' && spotType === 'beach_surf') {
    recs.push({
      name: 'Black Bomber (surface swimmer)',
      type: 'lure',
      retrieve: 'Slow, steady retrieve — just fast enough to feel the wobble',
      why: 'Black silhouette against the night sky. Stripers hunt the surf wash at night.',
      confidence: 8,
    });
    recs.push({
      name: 'Live Eel',
      type: 'bait',
      retrieve: 'Cast into the wash and let the waves work it. Slow retrieve back.',
      why: 'Nothing beats a live eel in the nighttime surf. The scent and action are deadly.',
      confidence: 9,
    });
  }

  // Incoming + estuary/tidal flat
  if (
    tideDirection === 'incoming' &&
    (spotType === 'estuary' || spotType === 'tidal_flat' || spotType === 'flat')
  ) {
    recs.push({
      name: 'Soft Plastic Jerkbait (white)',
      type: 'lure',
      retrieve: 'Twitch-twitch-pause on a weedless hook. Fish shallow flats as water floods in.',
      why: 'Incoming tide floods flats with bait — stripers follow. Weedless presentation avoids grass.',
      confidence: 8,
    });
    recs.push({
      name: 'Spook-style Topwater',
      type: 'lure',
      retrieve: 'Walk-the-dog over flooded grass edges',
      why: 'Stripers prowl flooded flats targeting crabs and baitfish. Surface strikes are explosive.',
      confidence: 7,
    });
  }

  // Slack tide — any spot
  if (tideDirection === 'slack') {
    recs.push({
      name: 'Soft Plastic Slug (Hogy style)',
      type: 'lure',
      retrieve: 'Weightless or light jig — slow twitch and glide. Let it sink on the pause.',
      why: 'Slack tide means less current to work lures. A slow-sinking slug imitates a dying baitfish.',
      confidence: 7,
    });
    recs.push({
      name: 'Live Lined Bunker',
      type: 'bait',
      retrieve: 'Hook through nose or back, free-line with minimal weight. Let it swim.',
      why: 'When current stops, live bait does the work for you. Hard to beat a lively bunker.',
      confidence: 8,
    });
  }

  // Strong outgoing + jetty or inlet
  if (
    tideStrength === 'strong' &&
    tideDirection === 'outgoing' &&
    (spotType === 'jetty' || spotType === 'inlet')
  ) {
    recs.push({
      name: 'Heavy Bucktail Jig (2-3 oz)',
      type: 'lure',
      retrieve: 'Cast into the rip and bounce back — heavy enough to hold bottom in the sweep',
      why: 'Heavy outgoing rips concentrate bait. A heavy bucktail gets in the zone and stays there.',
      confidence: 9,
    });
    recs.push({
      name: 'Metal Lip Swimmer',
      type: 'lure',
      retrieve: 'Cast across the rip and slow-roll back, feeling the lip dig and wobble',
      why: 'Classic rip-fishing technique. The metal lip gets the plug down in heavy current.',
      confidence: 8,
    });
  }

  // Dawn/dusk + any spot = general topwater/swimmer options
  if ((timeOfDay === 'dawn' || timeOfDay === 'dusk') && tideDirection !== 'slack') {
    recs.push({
      name: 'Surface Swimmer (Gibbs, Daiwa SP)',
      type: 'lure',
      retrieve: 'Medium-slow retrieve creating a V-wake on the surface',
      why: 'Low-light topwater fishing is prime striper time. Surface swimmers draw strikes from below.',
      confidence: 7,
    });
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Seasonal overlays
// ═══════════════════════════════════════════════════════════════════════════

function addSeasonalRecs(
  recs: LureRecommendation[],
  p: Parameters<typeof getRecommendations>[0],
) {
  const { season, spotType } = p;

  switch (season) {
    case 'spring':
      recs.push({
        name: 'Swim Shad (white/pearl, 4-6")',
        type: 'lure',
        retrieve: 'Slow to medium retrieve — match the lethargic early-season bait',
        why: 'Spring fish are keyed on herring and shad running up rivers. Swim shads are a perfect match.',
        confidence: 7,
      });
      if (spotType === 'river_mouth' || spotType === 'inlet') {
        recs.push({
          name: 'Al\'s Goldfish or Kastmaster (silver)',
          type: 'lure',
          retrieve: 'Cast and retrieve with a flutter — or jig vertically',
          why: 'Imitates river herring running through. Compact profile casts far and sinks fast in spring current.',
          confidence: 7,
        });
      }
      recs.push({
        name: 'Soft Plastic Jerkbait (pearl/white)',
        type: 'lure',
        retrieve: 'Twitch-pause on a light jig head. Slow presentation for cold-water fish.',
        why: 'Spring water is still cool — slower presentations give sluggish fish time to commit.',
        confidence: 6,
      });
      break;

    case 'summer':
      recs.push({
        name: 'Live Eel',
        type: 'bait',
        retrieve: 'Fish after dark — drift or slow retrieve along structure',
        why: 'Summer means night fishing. Live eels are the #1 big-fish bait from June through August.',
        confidence: 9,
      });
      recs.push({
        name: 'Topwater Popper (large)',
        type: 'lure',
        retrieve: 'Aggressive pops at first and last light',
        why: 'Summer dawn and dusk blitzes are legendary. Big poppers draw explosive strikes.',
        confidence: 7,
      });
      break;

    case 'fall':
      recs.push({
        name: 'Large Swimmer Plug (7-9")',
        type: 'lure',
        retrieve: 'Slow roll — match the size of adult bunker',
        why: 'Fall run fish are chasing big bait. Large profiles trigger trophy strikes.',
        confidence: 9,
      });
      recs.push({
        name: 'Tin/Metal (3-4 oz)',
        type: 'lure',
        retrieve: 'Long cast, fast retrieve or flutter on the drop in a blitz',
        why: 'When fall blitzes happen, tins reach the fish and match panicked bait.',
        confidence: 8,
      });
      recs.push({
        name: 'Chunked Bunker',
        type: 'bait',
        retrieve: 'Fish-finder rig, let it soak in areas with bait activity',
        why: 'Fall bunker schools mean stripers are keyed on the scent. Chunk bait is deadly.',
        confidence: 8,
      });
      break;

    case 'winter':
      recs.push({
        name: 'Small Soft Plastic (3-4" paddle tail)',
        type: 'lure',
        retrieve: 'Very slow retrieve on light jig head — barely moving',
        why: 'Winter holdover fish are lethargic. Downsize and slow down dramatically.',
        confidence: 7,
      });
      recs.push({
        name: 'Blade Bait (Silver Buddy style)',
        type: 'lure',
        retrieve: 'Vertical jigging — lift and drop near warm water discharge areas',
        why: 'Winter fish concentrate near power plant outflows and deep holes. Blade baits trigger reaction strikes.',
        confidence: 6,
      });
      break;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Water clarity adjustments
// ═══════════════════════════════════════════════════════════════════════════

function addClarityRecs(
  recs: LureRecommendation[],
  p: Parameters<typeof getRecommendations>[0],
) {
  const { waterClarity } = p;

  if (waterClarity === 'murky') {
    recs.push({
      name: 'Chartreuse Bucktail with Rattle',
      type: 'lure',
      retrieve: 'Slow bounce — the rattle and color help fish find it in dirty water',
      why: 'Murky water means fish hunt by vibration and scent. Chartreuse pops and the rattle calls them in.',
      confidence: 7,
    });
    recs.push({
      name: 'Cut Bait (bunker or mackerel)',
      type: 'bait',
      retrieve: 'Bottom rig — let scent do the work in stained water',
      why: 'When visibility is low, scent is king. Fresh cut bait puts out a scent trail.',
      confidence: 7,
    });
  }

  if (waterClarity === 'clear') {
    recs.push({
      name: 'Natural-color Soft Plastic (smoky shad)',
      type: 'lure',
      retrieve: 'Light jig head, natural drift with subtle twitches',
      why: 'Clear water means fish can see well — natural colors and subtle presentations fool wary stripers.',
      confidence: 6,
    });
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Water temperature adjustments
// ═══════════════════════════════════════════════════════════════════════════

function addTempRecs(
  recs: LureRecommendation[],
  p: Parameters<typeof getRecommendations>[0],
) {
  const { waterTemp } = p;

  if (waterTemp < 50) {
    // Cold water — slow everything down
    recs.push({
      name: 'Hair Jig (marabou)',
      type: 'lure',
      retrieve: 'Dead-slow drag along bottom — barely moving, long pauses',
      why: 'Cold water fish will not chase. A hair jig breathes on its own and triggers slow takes.',
      confidence: 6,
    });
  }

  if (waterTemp > 70) {
    // Warm water — fish deep or at night
    recs.push({
      name: 'Deep-diving Plug',
      type: 'lure',
      retrieve: 'Troll or cast-and-crank to reach deeper, cooler water columns',
      why: 'Warm surface temps push stripers deep. Get below the thermocline.',
      confidence: 6,
    });
  }
}
