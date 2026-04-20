export const defaultSpots = [
  { id: "hammonasset-beach", name: "Hammonasset Beach State Park", lat: 41.2630, lon: -72.5510, type: "beach_surf", bestTide: "outgoing", bestTime: "dawn", noaaStation: "8465705", description: "Long sandy beach with good surf casting. Best at the points and near the jetty." },
  { id: "meigs-point-jetty", name: "Meigs Point Jetty", lat: 41.2612, lon: -72.5385, type: "jetty", bestTide: "incoming", bestTime: "dusk", noaaStation: "8465705", description: "Rock jetty at the east end of Hammonasset. Fish the current seams on incoming tide." },
  { id: "clinton-town-beach", name: "Clinton Town Beach", lat: 41.2648, lon: -72.5218, type: "beach_surf", bestTide: "outgoing", bestTime: "any", noaaStation: "8465705", description: "Sandy beach with structure. Fish the sandbars and troughs." },
  { id: "harveys-beach", name: "Harvey's Beach", lat: 41.2631, lon: -72.5985, type: "beach_surf", bestTide: "any", bestTime: "dawn", noaaStation: "8465705", description: "Protected beach in Madison. Good for schoolies in spring." },
  { id: "ct-river-mouth", name: "CT River Mouth - Old Lyme", lat: 41.2578, lon: -72.3428, type: "river_mouth", bestTide: "outgoing", bestTime: "night", noaaStation: "8461490", description: "Where the CT River meets Long Island Sound. Monster bass on outgoing tide at night." },
  { id: "new-haven-harbor", name: "New Haven Harbor", lat: 41.2270, lon: -72.9070, type: "inlet", bestTide: "incoming", bestTime: "dusk", noaaStation: "8465705", description: "Deep harbor with structure. Good year-round. Fish the channel edges." },
  { id: "housatonic-mouth", name: "Housatonic River Mouth", lat: 41.1630, lon: -73.1030, type: "river_mouth", bestTide: "outgoing", bestTime: "night", noaaStation: "8467150", description: "Productive river mouth. Outgoing tide pushes bait into the sound." },
  { id: "thames-river", name: "Thames River - New London", lat: 41.3460, lon: -72.0930, type: "river_mouth", bestTide: "outgoing", bestTime: "night", noaaStation: "8461490", description: "Deep river with strong current. Bridge lights attract bait and bass." },
  { id: "i95-bridge-ct-river", name: "I-95 Bridge - CT River", lat: 41.2730, lon: -72.3480, type: "bridge", bestTide: "any", bestTime: "night", noaaStation: "8461490", description: "Fish the shadow lines at night. Stripers ambush bait in the light/dark edges." },
  { id: "westbrook-beach", name: "Westbrook Town Beach", lat: 41.2630, lon: -72.4490, type: "beach_surf", bestTide: "outgoing", bestTime: "dawn", noaaStation: "8465705", description: "Jetty and beach combo. Work the jetty tip on moving water." },
  { id: "rocky-neck", name: "Rocky Neck State Park", lat: 41.2610, lon: -72.2280, type: "rocky_point", bestTide: "incoming", bestTime: "dawn", noaaStation: "8461490", description: "Rocky shore with deep water access. Fish the rocks on incoming tide." },
  { id: "niantic-river", name: "Niantic River", lat: 41.3130, lon: -72.1950, type: "river_mouth", bestTide: "outgoing", bestTime: "dusk", noaaStation: "8461490", description: "Smaller river mouth. Great for spring run and fall migration." },
  { id: "ct-river-haddam", name: "CT River - Haddam", lat: 41.4510, lon: -72.5000, type: "river_mouth", bestTide: "any", bestTime: "night", noaaStation: "8461490", description: "Upriver spot. Good during spring shad run. Stripers follow the bait." },
  { id: "housatonic-derby", name: "Housatonic River - Derby", lat: 41.3200, lon: -73.0860, type: "river_mouth", bestTide: "any", bestTime: "dawn", noaaStation: "8467150", description: "Fresh/saltwater transition zone. Herring and shad runs draw big bass." },
  { id: "greenwich-point", name: "Greenwich Point", lat: 41.0060, lon: -73.5680, type: "rocky_point", bestTide: "incoming", bestTime: "dawn", noaaStation: "8467150", description: "Western CT. Rocky shoreline with good structure for ambush feeding." },
];

export function getDefaultSpotById(id: string) {
  return defaultSpots.find((s) => s.id === id);
}
