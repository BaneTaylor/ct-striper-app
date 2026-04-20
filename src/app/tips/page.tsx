'use client';

import { useState } from 'react';

// ── Collapsible Card Component ──────────────────────────────────────────────

function TipCard({
  title,
  icon,
  children,
  defaultOpen = false,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="glass-card rounded-2xl overflow-hidden transition-all duration-300">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors active:bg-[#162a4a]/50"
      >
        <span className="text-xl flex-shrink-0">{icon}</span>
        <span className="flex-1 text-sm font-semibold text-white">{title}</span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#64748b"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`flex-shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${
          open ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="border-t border-[#1e3a5f]/30 px-5 py-4 text-sm leading-relaxed text-slate-300">
          {children}
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4 mt-8 first:mt-0">
      <h2 className="gradient-text text-lg font-bold">{title}</h2>
      {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
    </div>
  );
}

// ── Main Tips Page ──────────────────────────────────────────────────────────

export default function TipsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#0a1628] pb-24 water-ripple">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-[#1e3a5f]/50 bg-[#0a1628]/80 backdrop-blur-xl">
        <div className="mx-auto max-w-2xl px-4 py-3">
          <h1 className="text-base font-bold text-white">Striper Tips</h1>
          <p className="text-[11px] text-slate-500">CT-specific guides from local anglers</p>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">

        {/* ── SEASONAL GUIDE ───────────────────────────────────────────── */}
        <SectionHeader
          title="Seasonal Guide"
          subtitle="Know what to expect each month on the CT shoreline"
        />

        <div className="space-y-3">
          <TipCard title="Spring (April - May)" icon="🌱" defaultOpen>
            <p className="mb-3">
              Spring is when the Connecticut River comes alive. Stripers push up from Long Island Sound following herring and shad runs, making the CT River from Old Saybrook to Enfield Dam prime territory.
            </p>
            <p className="mb-3 font-semibold text-teal-400">Where to fish:</p>
            <ul className="mb-3 list-disc pl-5 space-y-1 text-slate-400">
              <li>CT River - Essex, Deep River, East Haddam (schoolies to keepers)</li>
              <li>River mouths and tidal creeks as water warms past 50F</li>
              <li>Housatonic River from Milford upstream</li>
              <li>Thames River around Norwich and Montville</li>
            </ul>
            <p className="mb-3 font-semibold text-teal-400">What they eat:</p>
            <ul className="mb-3 list-disc pl-5 space-y-1 text-slate-400">
              <li>Herring (alewife and blueback) - match with white/silver soft plastics</li>
              <li>Bloodworms and sandworms - killer in the rivers early</li>
              <li>Small white bucktail jigs 1/2 to 1 oz bounced along bottom</li>
            </ul>
            <p className="text-xs text-slate-500">
              Pro tip: Watch water temp closely. When the river hits 52-55F, the bite turns on fast. Fish the first two hours of incoming tide near river mouths.
            </p>
          </TipCard>

          <TipCard title="Early Summer (June - July)" icon="☀️">
            <p className="mb-3">
              The shore fishing heats up as stripers spread across Long Island Sound. Topwater action starts in earnest, especially at dawn and dusk. Bunker pods show up and big fish follow.
            </p>
            <p className="mb-3 font-semibold text-teal-400">Where to fish:</p>
            <ul className="mb-3 list-disc pl-5 space-y-1 text-slate-400">
              <li>Beaches: Hammonasset, Rocky Neck, Sherwood Island, Penfield Reef</li>
              <li>Jetties at Meigs Point, Madison Surf Club, Westbrook</li>
              <li>Harbors at dawn - Branford, Guilford, Clinton</li>
              <li>Night fishing picks up at bridges and lighted docks</li>
            </ul>
            <p className="mb-3 font-semibold text-teal-400">Tactics:</p>
            <ul className="mb-3 list-disc pl-5 space-y-1 text-slate-400">
              <li>Topwater plugs at first and last light - pencil poppers, Spooks</li>
              <li>Snag-and-drop with snagged bunker in bunker schools</li>
              <li>Soft plastics on jigheads worked slowly along sandy structure</li>
              <li>Fly fishing with Clouser minnows and Deceivers</li>
            </ul>
            <p className="text-xs text-slate-500">
              Pro tip: When you see bunker flipping on the surface, do not cast into them. Cast to the edges and let your lure drift into the school. Big fish patrol the perimeter.
            </p>
          </TipCard>

          <TipCard title="Late Summer (August - September)" icon="🌙">
            <p className="mb-3">
              Night fishing is king. Water temps peak and daytime fishing slows, but after dark the stripers turn aggressive. This is prime eeling season and the bridge bite is red hot.
            </p>
            <p className="mb-3 font-semibold text-teal-400">Where to fish:</p>
            <ul className="mb-3 list-disc pl-5 space-y-1 text-slate-400">
              <li>Bridges: I-95 bridges over rivers, Baldwin Bridge, Gold Star Bridge</li>
              <li>Jetties after dark with eels or soft plastics</li>
              <li>Warm water discharge at Millstone Power Station (Niantic)</li>
              <li>Mouth of the CT River on outgoing tide</li>
            </ul>
            <p className="mb-3 font-semibold text-teal-400">Tactics:</p>
            <ul className="mb-3 list-disc pl-5 space-y-1 text-slate-400">
              <li>Live eels fished on a fish-finder rig or free-lined</li>
              <li>Black or dark purple soft plastics on 1oz jigheads at night</li>
              <li>Slow-roll paddle tails through shadow lines at bridges</li>
              <li>Chunk bait (bunker or mackerel) soaked on bottom</li>
            </ul>
            <p className="text-xs text-slate-500">
              Pro tip: At bridges, position yourself so your bait drifts from the lit side into the shadow line. Stripers sit in the dark waiting to ambush bait that gets swept past.
            </p>
          </TipCard>

          <TipCard title="Fall (October - November)" icon="🍂">
            <p className="mb-3">
              The fall run is what CT striper anglers live for. Migrating fish from the north push through the Sound, gorging on bunker, peanut bunker, and bay anchovies. This is when the biggest fish of the year are caught.
            </p>
            <p className="mb-3 font-semibold text-teal-400">Where to fish:</p>
            <ul className="mb-3 list-disc pl-5 space-y-1 text-slate-400">
              <li>Race Point and the Race (boat fishing - monster bass)</li>
              <li>Any beach with bunker schools - watch for bird activity</li>
              <li>Rocky points: Hatchett Point, Cornfield Point, Tongue Point</li>
              <li>Jetties and breakwalls as fish stack up migrating west</li>
            </ul>
            <p className="mb-3 font-semibold text-teal-400">Tactics:</p>
            <ul className="mb-3 list-disc pl-5 space-y-1 text-slate-400">
              <li>Large swimmers and needlefish plugs worked slowly</li>
              <li>3-6oz metal lip swimmers at night along beaches</li>
              <li>Trolling tube-and-worm or umbrella rigs (boat)</li>
              <li>Live-lining bunker near structure</li>
            </ul>
            <p className="text-xs text-slate-500">
              Pro tip: Follow the birds. When you see terns and gulls diving in a concentrated area, get there fast. Fall blitzes can last minutes or hours, but the window is everything.
            </p>
          </TipCard>

          <TipCard title="Winter (December - March)" icon="❄️">
            <p className="mb-3">
              Most anglers hang it up, but holdover stripers remain in CT waters all winter. They concentrate around warm water discharges and deep holes. Fishing is slow but rewarding if you know where to look.
            </p>
            <p className="mb-3 font-semibold text-teal-400">Where to fish:</p>
            <ul className="mb-3 list-disc pl-5 space-y-1 text-slate-400">
              <li>Warm water discharges - Millstone (Niantic), Norwalk Harbor</li>
              <li>Deep holes in harbors where water holds heat</li>
              <li>CT River from Old Saybrook to Chester (holdover schoolies)</li>
              <li>Housatonic River near Devon power plant outflow</li>
            </ul>
            <p className="mb-3 font-semibold text-teal-400">Tactics:</p>
            <ul className="mb-3 list-disc pl-5 space-y-1 text-slate-400">
              <li>Super slow presentations - dead-sticked soft plastics</li>
              <li>Small paddle tails on light jigheads (1/4 to 1/2 oz)</li>
              <li>Bloodworms on bottom rigs near warm outflows</li>
              <li>Slow-retrieve suspending jerkbaits</li>
            </ul>
            <p className="text-xs text-slate-500">
              Pro tip: Cold water means slow metabolism. Slow everything down by 50%. A retrieve that feels painfully slow to you is probably just right for a 40-degree striper.
            </p>
          </TipCard>
        </div>

        {/* ── TECHNIQUE TIPS ───────────────────────────────────────────── */}
        <SectionHeader
          title="Technique Tips"
          subtitle="Master these skills to catch more stripers"
        />

        <div className="space-y-3">
          <TipCard title="How to Fish a Live Eel" icon="🐍">
            <p className="mb-3">
              Live eels are the number one big-striper bait in Connecticut. Nothing else consistently produces trophy fish the way a well-presented eel does.
            </p>
            <p className="mb-2 font-semibold text-teal-400">Rigging:</p>
            <ul className="mb-3 list-disc pl-5 space-y-1 text-slate-400">
              <li>Hook through the lips (bottom jaw up through top) with a 5/0-7/0 circle hook</li>
              <li>Use a fish-finder rig with 36-inch 40lb fluoro leader for bottom</li>
              <li>For free-lining, just hook and cast - no weight needed</li>
              <li>Grab eels with a dry rag - they can not slime through dry cloth</li>
            </ul>
            <p className="mb-2 font-semibold text-teal-400">Retrieve:</p>
            <ul className="mb-3 list-disc pl-5 space-y-1 text-slate-400">
              <li>Slow and steady. Eels do the work - do not over-work them</li>
              <li>On bottom: Let it sit. Move it only when tide shifts</li>
              <li>Free-lined: Slow sweep retrieve, letting the eel swim naturally</li>
              <li>When you feel the hit, wait 3-5 seconds before setting (circle hooks set themselves)</li>
            </ul>
            <p className="text-xs text-slate-500">
              Pro tip: Keep eels in a bucket with an aerator and ice cubes. Cold eels are easier to handle and swim more naturally. Buy from local tackle shops - Fisherman's World (Norwalk), Rivers End (Old Saybrook).
            </p>
          </TipCard>

          <TipCard title="Reading Tide for Stripers" icon="🌊">
            <p className="mb-3">
              Tide is the single most important factor for striper fishing in CT. Moving water moves bait, and stripers follow the bait. Understanding tide stages will double your catch rate.
            </p>
            <p className="mb-2 font-semibold text-teal-400">Best stages:</p>
            <ul className="mb-3 list-disc pl-5 space-y-1 text-slate-400">
              <li><span className="text-white font-medium">2 hours before to 2 hours after high tide</span> - best window at most CT spots</li>
              <li>The last 2 hours of incoming concentrate bait against structure</li>
              <li>First hour of outgoing flushes bait from estuaries and creeks</li>
              <li>Dead slack (especially slack low) is usually the slowest</li>
            </ul>
            <p className="mb-2 font-semibold text-teal-400">Why current matters:</p>
            <ul className="mb-3 list-disc pl-5 space-y-1 text-slate-400">
              <li>Current creates feeding lanes - stripers hold behind structure and ambush</li>
              <li>Stronger flow = more active feeding (up to a point - too fast and they hide)</li>
              <li>Moon tides (new/full) create stronger currents and usually better fishing</li>
              <li>Neap tides (quarter moons) have weaker flow - fish may scatter</li>
            </ul>
            <p className="text-xs text-slate-500">
              Pro tip: The CT Striper app shows tide stage and flow strength in real-time. Look for strong incoming or early outgoing for the best action at jetties and points.
            </p>
          </TipCard>

          <TipCard title="Night Fishing Essentials" icon="🔦">
            <p className="mb-3">
              Stripers are primarily nocturnal feeders, especially in summer. Night fishing in CT produces the biggest fish consistently, but requires different tactics and safety awareness.
            </p>
            <p className="mb-2 font-semibold text-teal-400">Gear:</p>
            <ul className="mb-3 list-disc pl-5 space-y-1 text-slate-400">
              <li>Headlamp with red-light mode (white light spooks fish and ruins night vision)</li>
              <li>Clip-on glow sticks for rod tips to detect bites</li>
              <li>Dark colored lures (black, dark purple) - they create a better silhouette</li>
              <li>Wading staff and studded boots/korkers for jetty work</li>
              <li>Always tell someone where you are fishing and when to expect you back</li>
            </ul>
            <p className="mb-2 font-semibold text-teal-400">Technique changes at night:</p>
            <ul className="mb-3 list-disc pl-5 space-y-1 text-slate-400">
              <li>Slow down your retrieve by 50% compared to daytime</li>
              <li>Fish structure edges where light meets shadow</li>
              <li>Use sound-producing lures - rattles, surface splashing</li>
              <li>Live bait (eels, chunks) becomes even more effective</li>
              <li>Trust your rod tip and line feel - you can not see the water</li>
            </ul>
            <p className="text-xs text-slate-500">
              Pro tip: Arrive at your spot 30 minutes before dark so you can see the structure and plan your approach. Once it is dark, stay put - moving around unfamiliar rocks at night is dangerous.
            </p>
          </TipCard>

          <TipCard title="Matching the Hatch" icon="🎯">
            <p className="mb-3">
              Stripers are opportunistic but during heavy bait presence they can become selective. Knowing what bait is in your area and matching size, color, and action is critical.
            </p>
            <p className="mb-2 font-semibold text-teal-400">Common CT baitfish:</p>
            <ul className="mb-3 list-disc pl-5 space-y-1 text-slate-400">
              <li><span className="text-white font-medium">Atlantic Menhaden (bunker)</span> - 6-12 inches, silver/green. Match with large swimmers, bunker flies, or snag-and-drop live ones</li>
              <li><span className="text-white font-medium">Peanut Bunker</span> - 2-4 inches, silver. Small metals, Deadly Dicks, epoxy jigs</li>
              <li><span className="text-white font-medium">Bay Anchovies (rain bait)</span> - 1-3 inches, translucent. Tiny soft plastics, small Clousers</li>
              <li><span className="text-white font-medium">Silversides</span> - 3-5 inches, thin/silver. Needlefish plugs, slim profile soft plastics</li>
              <li><span className="text-white font-medium">Herring/Shad</span> - 6-10 inches, deep body. White paddle tails, swim shads</li>
              <li><span className="text-white font-medium">Sand Eels</span> - 4-7 inches, thin. AVA jigs, sand eel flies, Hogy epoxy jigs</li>
              <li><span className="text-white font-medium">Crabs</span> - 1-3 inches. Crab flies, soft crab imitations fished on bottom</li>
            </ul>
            <p className="text-xs text-slate-500">
              Pro tip: When you catch a striper, check its stomach contents (carefully, if releasing). That tells you exactly what to throw. If bunker come up, bunker pattern. If sand eels, go slim.
            </p>
          </TipCard>

          <TipCard title="Working a Jetty" icon="🪨">
            <p className="mb-3">
              CT has excellent jetty fishing from Greenwich to Stonington. Jetties concentrate bait and create current breaks that stripers love. But they demand respect - wet rocks are treacherous.
            </p>
            <p className="mb-2 font-semibold text-teal-400">Positioning:</p>
            <ul className="mb-3 list-disc pl-5 space-y-1 text-slate-400">
              <li>Fish the current-side first - bait gets pushed against the rocks</li>
              <li>Work the tip where current is strongest on moving tides</li>
              <li>Do not ignore the pocket water between the jetty and beach</li>
              <li>Cast parallel to the jetty, not just out from it</li>
            </ul>
            <p className="mb-2 font-semibold text-teal-400">Safety:</p>
            <ul className="mb-3 list-disc pl-5 space-y-1 text-slate-400">
              <li>Korkers or studded boots are non-negotiable - algae-covered rocks are ice</li>
              <li>Never turn your back to the ocean - rogue waves happen</li>
              <li>Fish with a buddy, especially at night</li>
              <li>Carry a whistle and light</li>
            </ul>
            <p className="text-xs text-slate-500">
              Pro tip: The best jetty fishing is the last 2 hours of incoming through the first hour of outgoing. Fish stack up at the tip waiting for bait to sweep past.
            </p>
          </TipCard>

          <TipCard title="Bridge Fishing at Night" icon="🌉">
            <p className="mb-3">
              Bridge fishing is a CT tradition. Lighted bridges create shadow lines that stripers use as ambush points. The technique is specific and deadly effective.
            </p>
            <p className="mb-2 font-semibold text-teal-400">The shadow line:</p>
            <ul className="mb-3 list-disc pl-5 space-y-1 text-slate-400">
              <li>Bridge lights illuminate water on one side, creating a hard shadow edge</li>
              <li>Baitfish congregate in the light (like bugs to a lamp)</li>
              <li>Stripers hold in the dark shadow, facing into the current</li>
              <li>They dart into the light to grab bait, then retreat</li>
            </ul>
            <p className="mb-2 font-semibold text-teal-400">Presentation:</p>
            <ul className="mb-3 list-disc pl-5 space-y-1 text-slate-400">
              <li>Cast up-current so your bait drifts naturally through the shadow line</li>
              <li>Slow-roll paddle tails or swim baits across the light/dark edge</li>
              <li>Live eels drifted through the shadow line are devastating</li>
              <li>Keep your profile low and quiet - these fish are close</li>
            </ul>
            <p className="text-xs text-slate-500">
              Pro tip: Popular CT bridges include the Baldwin Bridge (Old Saybrook), Rt. 1 bridge over the Saugatuck, and various I-95 overpasses. Check local regs - some bridges have no-fishing zones.
            </p>
          </TipCard>

          <TipCard title="Surf Fishing CT Beaches" icon="🏖️">
            <p className="mb-3">
              CT has miles of productive surf fishing. The key is reading the beach structure - not all sand is equal. Learning to identify cuts, troughs, and sandbars puts you on fish.
            </p>
            <p className="mb-2 font-semibold text-teal-400">Reading the beach:</p>
            <ul className="mb-3 list-disc pl-5 space-y-1 text-slate-400">
              <li><span className="text-white font-medium">Cuts/Troughs:</span> Darker water between sandbars where fish travel and feed</li>
              <li><span className="text-white font-medium">Points:</span> Where sand extends further out - current sweeps bait past these</li>
              <li><span className="text-white font-medium">Rocky patches:</span> Mixed sand/rock bottoms hold more bait and fish</li>
              <li><span className="text-white font-medium">Outflows:</span> Any creek, pipe, or runoff that enters the surf attracts fish</li>
            </ul>
            <p className="mb-2 font-semibold text-teal-400">Best CT surf spots:</p>
            <ul className="mb-3 list-disc pl-5 space-y-1 text-slate-400">
              <li>Hammonasset Beach State Park - miles of structured beach</li>
              <li>Rocky Neck State Park - rock and sand mix</li>
              <li>Sherwood Island - access to deeper water</li>
              <li>Long Beach (Stratford) - consistent producer</li>
            </ul>
            <p className="text-xs text-slate-500">
              Pro tip: Visit your surf spots at dead low tide during the day. You can see all the structure that will be underwater at high tide, and you will know exactly where to cast when it matters.
            </p>
          </TipCard>

          <TipCard title="CT River Striper Tactics" icon="🏞️">
            <p className="mb-3">
              The Connecticut River is one of the most important striper nurseries on the East Coast. Every spring, fish push over 60 miles upstream following baitfish. It is a unique fishery with its own rules.
            </p>
            <p className="mb-2 font-semibold text-teal-400">Spring run (April-June):</p>
            <ul className="mb-3 list-disc pl-5 space-y-1 text-slate-400">
              <li>Fish follow herring and shad upstream - track bait migration</li>
              <li>Key spots: Old Lyme, Essex, Deep River, East Haddam, Enfield</li>
              <li>Incoming tide pushes fish upstream - outgoing concentrates them at bends</li>
              <li>Dawn and dusk are prime, but midday action happens in murky water</li>
            </ul>
            <p className="mb-2 font-semibold text-teal-400">Bait vs. Lures:</p>
            <ul className="mb-3 list-disc pl-5 space-y-1 text-slate-400">
              <li>Bloodworms on bottom: Deadly from April through May, simple and effective</li>
              <li>White bucktail jigs (1/2-1oz): Bounce along bottom, mimics herring</li>
              <li>Soft plastics (white/pearl): Swim slowly through current seams</li>
              <li>Live herring (where legal): The ultimate spring bait</li>
            </ul>
            <p className="text-xs text-slate-500">
              Pro tip: The CT River is tidal all the way to Enfield Dam. Even 40 miles from the Sound, tide changes the bite. Check the tide predictions for each section - timing changes as you go upstream.
            </p>
          </TipCard>

          <TipCard title="Reading Your Sonar for Stripers" icon="📡">
            <p className="mb-3">
              Modern fish finders are game-changers for CT striper fishing from a boat. Knowing what to look for separates productive trips from sightseeing.
            </p>
            <p className="mb-2 font-semibold text-teal-400">What to look for:</p>
            <ul className="mb-3 list-disc pl-5 space-y-1 text-slate-400">
              <li><span className="text-white font-medium">Bait balls:</span> Dense clouds of marks, often mid-water column. Where there is bait, bass are near</li>
              <li><span className="text-white font-medium">Arches:</span> Classic fish marks, larger arches = larger fish. Stripers show as thick, defined arches</li>
              <li><span className="text-white font-medium">Bottom huggers:</span> Marks tight to the bottom are often stripers waiting to ambush</li>
              <li><span className="text-white font-medium">Suspended fish:</span> Individual marks hovering at a specific depth - target that depth exactly</li>
            </ul>
            <p className="mb-2 font-semibold text-teal-400">Settings tips:</p>
            <ul className="mb-3 list-disc pl-5 space-y-1 text-slate-400">
              <li>Use 200kHz for shallow water (under 50 feet) - better detail</li>
              <li>Slow your scroll speed for better mark definition</li>
              <li>Turn off fish ID symbols - learn to read raw sonar</li>
              <li>Side imaging is incredible for finding structure and schools</li>
            </ul>
            <p className="text-xs text-slate-500">
              Pro tip: When you mark fish, note the exact depth. Then present your bait or lure at that depth or slightly above. Stripers usually feed up, not down.
            </p>
          </TipCard>

          <TipCard title="Catch and Release Best Practices" icon="💚">
            <p className="mb-3">
              Striped bass populations depend on responsible C&R. CT has slot limits and conservation rules for a reason. Handle every fish like it matters, because it does.
            </p>
            <p className="mb-2 font-semibold text-teal-400">Handling:</p>
            <ul className="mb-3 list-disc pl-5 space-y-1 text-slate-400">
              <li>Wet your hands before touching any fish - dry hands remove slime coat</li>
              <li>Support the belly with one hand, jaw or lip with the other</li>
              <li>Never hold a large striper vertically by the jaw - it damages organs</li>
              <li>Keep the fish in water as much as possible - under 30 seconds out of water</li>
            </ul>
            <p className="mb-2 font-semibold text-teal-400">Hooks and revival:</p>
            <ul className="mb-3 list-disc pl-5 space-y-1 text-slate-400">
              <li>Use inline circle hooks - they hook the corner of the mouth 90%+ of the time</li>
              <li>Barbless or crush your barbs for easier, faster releases</li>
              <li>If a fish is gut-hooked, cut the leader close. The hook will dissolve</li>
              <li>To revive: hold the fish upright in the water, facing into current</li>
              <li>Move the fish gently forward (not back and forth) until it kicks away on its own</li>
            </ul>
            <p className="text-xs text-slate-500">
              Pro tip: In warm water (above 70F), fight fish quickly and release fast. Prolonged fights in warm water build up lactic acid that can kill a striper hours after release, even if it swims away fine.
            </p>
          </TipCard>
        </div>

        {/* ── GEAR RECOMMENDATIONS ─────────────────────────────────────── */}
        <SectionHeader
          title="Gear Recommendations"
          subtitle="What you actually need for CT striper fishing"
        />

        <div className="space-y-3">
          <TipCard title="Rod & Reel Combos" icon="🎣">
            <p className="mb-3 font-semibold text-teal-400">Surf / Jetty (shore fishing):</p>
            <ul className="mb-4 list-disc pl-5 space-y-1 text-slate-400">
              <li><span className="text-white font-medium">Rod:</span> 9-10 foot medium-heavy spinning rod, fast action. Tsunami Airwave Elite or St. Croix Mojo Surf</li>
              <li><span className="text-white font-medium">Reel:</span> 5000-6000 size spinning reel. Penn Battle III, Daiwa BG, or Shimano Stradic</li>
              <li><span className="text-white font-medium">Line:</span> 30lb braided main, 30-40lb fluorocarbon leader (3-4 feet)</li>
            </ul>
            <p className="mb-3 font-semibold text-teal-400">River / Light tackle:</p>
            <ul className="mb-4 list-disc pl-5 space-y-1 text-slate-400">
              <li><span className="text-white font-medium">Rod:</span> 7 foot medium spinning rod. Great for soft plastics and light jigs</li>
              <li><span className="text-white font-medium">Reel:</span> 3000-4000 size spinning. Penn Spinfisher VI or Shimano Nasci</li>
              <li><span className="text-white font-medium">Line:</span> 20lb braid, 20-30lb fluoro leader</li>
            </ul>
            <p className="mb-3 font-semibold text-teal-400">Boat:</p>
            <ul className="list-disc pl-5 space-y-1 text-slate-400">
              <li><span className="text-white font-medium">Trolling:</span> 7 foot medium-heavy conventional rod, Penn Squall lever drag reel, 50lb braid</li>
              <li><span className="text-white font-medium">Jigging/Live bait:</span> Same as surf setup but 7-8 foot length for better boat control</li>
            </ul>
          </TipCard>

          <TipCard title="Essential Terminal Tackle" icon="🔗">
            <ul className="list-disc pl-5 space-y-2 text-slate-400">
              <li><span className="text-white font-medium">Circle hooks:</span> 5/0-8/0 inline (Owner SSW, Gamakatsu Octopus Circle). Required by CT regs when bait fishing</li>
              <li><span className="text-white font-medium">Jigheads:</span> 1/2oz to 2oz, 5/0-7/0 hook. Hogy, SPRO, or Z-Man</li>
              <li><span className="text-white font-medium">Barrel swivels:</span> Size 1-3, for connecting braid to leader without twist</li>
              <li><span className="text-white font-medium">Snap swivels:</span> 75lb+ for quick lure changes (Tactical Anglers power clips are best)</li>
              <li><span className="text-white font-medium">Sinkers:</span> 1-4oz bank sinkers for bottom fishing, egg sinkers for fish-finder rigs</li>
              <li><span className="text-white font-medium">Fluorocarbon leader:</span> 30-50lb spools (Seaguar Blue Label is the standard)</li>
              <li><span className="text-white font-medium">Split rings and treble hooks:</span> For replacing dull hooks on plugs (#1-#4 trebles)</li>
            </ul>
          </TipCard>

          <TipCard title="Must-Have Lures for CT" icon="🪝">
            <p className="mb-3">These 10 lures will cover 90% of CT striper situations:</p>
            <ol className="list-decimal pl-5 space-y-2 text-slate-400">
              <li><span className="text-white font-medium">Hogy 7&quot; Original:</span> Olive or white. The CT standard for soft plastics</li>
              <li><span className="text-white font-medium">Daiwa SP Minnow:</span> Blue/silver. Killer plug for beaches and jetties</li>
              <li><span className="text-white font-medium">Bomber Saltwater Grade:</span> White. The nighttime striper plug</li>
              <li><span className="text-white font-medium">Pencil Popper (Super Strike):</span> Yellow or bone. Topwater for blitzes</li>
              <li><span className="text-white font-medium">Deadly Dick #1:</span> Silver or gold. For peanut bunker situations</li>
              <li><span className="text-white font-medium">Bucktail jig (Spro):</span> White, 1-2oz. Versatile and deadly year-round</li>
              <li><span className="text-white font-medium">Z-Man DieZel MinnowZ:</span> Pearl or motor oil. Budget soft plastic that works</li>
              <li><span className="text-white font-medium">Slug-Go 9&quot;:</span> White or bubblegum. Weightless jerkbait for shallow water</li>
              <li><span className="text-white font-medium">Atom Popper:</span> Yellow or white. Old school topwater that still catches</li>
              <li><span className="text-white font-medium">Al Gag&apos;s Whip-It Fish:</span> Bunker or herring color. Paddle tail with great action</li>
            </ol>
          </TipCard>

          <TipCard title="Night Fishing Gear Checklist" icon="🌃">
            <p className="mb-3">Do not leave home without these:</p>
            <ul className="space-y-2 text-slate-400">
              <li className="flex items-start gap-2">
                <span className="text-teal-400 mt-0.5">&#10003;</span>
                <span>Headlamp with red-light mode (Black Diamond Spot is excellent)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-teal-400 mt-0.5">&#10003;</span>
                <span>Backup light source (small flashlight or phone)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-teal-400 mt-0.5">&#10003;</span>
                <span>Glow sticks (clip to rod tips for bite detection)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-teal-400 mt-0.5">&#10003;</span>
                <span>Wading belt and studded boots/korkers</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-teal-400 mt-0.5">&#10003;</span>
                <span>PFD (inflatable waist pack style is comfortable)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-teal-400 mt-0.5">&#10003;</span>
                <span>Lip gripper and long pliers (for hook removal in the dark)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-teal-400 mt-0.5">&#10003;</span>
                <span>Dark-colored lures (black, dark purple, dark red)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-teal-400 mt-0.5">&#10003;</span>
                <span>Bug spray (no-see-ums are brutal June-September)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-teal-400 mt-0.5">&#10003;</span>
                <span>Fully charged phone with location sharing on</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-teal-400 mt-0.5">&#10003;</span>
                <span>Whistle (attached to your PFD or waders)</span>
              </li>
            </ul>
          </TipCard>
        </div>

        {/* Bottom spacer */}
        <div className="mt-8 text-center text-[10px] text-slate-600">
          Tips curated for the Connecticut shoreline
        </div>
      </main>
    </div>
  );
}
