const WASHINGTON_DRIVER_GUIDE_BASE_URL =
  'https://dol.wa.gov/driver-licenses-and-permits/driver-training-and-testing/driver-guides/washington-state-driver-guide-text-only'

const DRIVER_GUIDE_CHAPTER_ANCHORS: Record<string, string> = {
  '1': '#chapterlicenses',
  '2': '#chaptervehicles',
  '3': '#chapterdrivers',
  '4': '#chapterroads',
  '5': '#chapterhazards',
}

const DRIVER_GUIDE_MISC_ANCHORS: Record<string, string> = {
  conclusion: '#conclusion',
  glossary: '#glossary',
  'accessibility and accommodations': '#accessibilityandaccommodations',
  disclaimer: '#disclaimer',
}

const getDriverGuideAnchorFragment = (section: string): string | undefined => {
  const chapterMatch = section.match(/^(?:Chapter\s*)?(\d+)/i)
  if (chapterMatch) {
    const anchor = DRIVER_GUIDE_CHAPTER_ANCHORS[chapterMatch[1]]
    if (anchor) {
      return anchor
    }
  }

  const normalizedSection = section.toLowerCase()
  for (const [keyword, anchor] of Object.entries(DRIVER_GUIDE_MISC_ANCHORS)) {
    if (normalizedSection.startsWith(keyword)) {
      return anchor
    }
  }

  return undefined
}

export type Question = {
  id: number
  prompt: string
  choices: string[]
  answerIndex: number
  explanation: string
  quote: string
  reference: string
  image?: string
  imageAlt?: string
}

export type QuestionBank = Record<string, Question[]>

export const getReferenceLink = (reference?: string): string | undefined => {
  if (!reference) {
    return undefined
  }

  if (reference.startsWith('Washington Driver Guide (2023)')) {
    const section = reference.split(',')[1]?.trim()
    if (!section) {
      return WASHINGTON_DRIVER_GUIDE_BASE_URL
    }

    const fragment = getDriverGuideAnchorFragment(section)
    if (fragment) {
      return `${WASHINGTON_DRIVER_GUIDE_BASE_URL}${fragment}`
    }

    return WASHINGTON_DRIVER_GUIDE_BASE_URL
  }

  return undefined
}

type QuestionDraft = Omit<Question, 'id'>

const buildQuestions = (drafts: QuestionDraft[]): Question[] =>
  drafts.map((draft, index) => ({
    id: index + 1,
    ...draft,
  }))

const MUTCD = {
  stop: 'https://upload.wikimedia.org/wikipedia/commons/c/c0/MUTCD_R1-1.svg',
  yield: 'https://upload.wikimedia.org/wikipedia/commons/3/39/MUTCD_R1-2.svg',
  speedLimit: 'https://upload.wikimedia.org/wikipedia/commons/8/8b/MUTCD_R2-1.svg',
  minimumSpeed: 'https://upload.wikimedia.org/wikipedia/commons/f/fe/MUTCD_R2-4.svg',
  keepRight: 'https://upload.wikimedia.org/wikipedia/commons/4/40/MUTCD_R4-7.svg',
  doNotEnter: 'https://upload.wikimedia.org/wikipedia/commons/7/7d/MUTCD_R5-1.svg',
  wrongWay: 'https://upload.wikimedia.org/wikipedia/commons/2/2a/MUTCD_R5-1a.svg',
  oneWayLeft: 'https://upload.wikimedia.org/wikipedia/commons/7/7a/MUTCD_R6-1L.svg',
  oneWayRight: 'https://upload.wikimedia.org/wikipedia/commons/a/a6/MUTCD_R6-1R.svg',
  noRightTurn: 'https://upload.wikimedia.org/wikipedia/commons/8/8f/MUTCD_R3-1.svg',
  noLeftTurn: 'https://upload.wikimedia.org/wikipedia/commons/1/11/MUTCD_R3-2.svg',
  noUTurn: 'https://upload.wikimedia.org/wikipedia/commons/d/d1/MUTCD_R3-4.svg',
  doNotPass: 'https://upload.wikimedia.org/wikipedia/commons/a/aa/MUTCD_R4-1.svg',
  centerTurnLane: 'https://upload.wikimedia.org/wikipedia/commons/0/09/MUTCD_R3-9a.svg',
  roundabout: 'https://upload.wikimedia.org/wikipedia/commons/1/19/MUTCD_W2-6.svg',
  pedestrian: 'https://upload.wikimedia.org/wikipedia/commons/9/98/MUTCD_W11-2.svg',
  schoolZone: 'https://upload.wikimedia.org/wikipedia/commons/1/1d/MUTCD_S1-1.svg',
  advisorySpeed: 'https://upload.wikimedia.org/wikipedia/commons/4/4a/MUTCD_W13-1P.svg',
  roadWorkAhead: 'https://upload.wikimedia.org/wikipedia/commons/b/ba/MUTCD_CW20-1.svg',
  workers: 'https://upload.wikimedia.org/wikipedia/commons/3/35/MUTCD_CW21-1.svg',
  endRoadWork: 'https://upload.wikimedia.org/wikipedia/commons/9/99/MUTCD_G20-2.svg',
} as const

const REF = {
  signs: 'Washington Driver Guide (2023), Chapter 4: Signs',
  commonSigns: 'Washington Driver Guide (2023), Chapter 4: Signs (Common signs)',
  brokenSignals: 'Washington Driver Guide (2023), Chapter 4: Roads (Broken lights or signals)',
  trafficSignals: 'Washington Driver Guide (2023), Chapter 4: Roads (Traffic light signals)',
  turning: 'Washington Driver Guide (2023), Chapter 4: Roads (Turning)',
  roundabout: 'Washington Driver Guide (2023), Chapter 4: Roads (Roundabout)',
  crosswalks: 'Washington Driver Guide (2023), Chapter 4: Roads (Crosswalks)',
  schoolZone: 'Washington Driver Guide (2023), Chapter 4: Roads (School zone)',
  workZone: 'Washington Driver Guide (2023), Chapter 4: Roads (Work zone)',
  workZoneSigns: 'Washington Driver Guide (2023), Chapter 4: Signs (Work zone signs)',
  occupantProtection: 'Washington Driver Guide (2023), Chapter 2: Vehicles (Occupant protection)',
  headlights: 'Washington Driver Guide (2023), Chapter 2: Vehicles (Vehicle maintenance: Headlights)',
} as const

const QUOTE = {
  signOverview:
    'Traffic signs tell you about traffic rules, hazards, roadway directions, and the location of roadway services. The shape and color of these signs, and their symbols and words, give clues to the type of information they provide.',
  signRed: 'Red = Prohibitive or restricted action',
  signOrange: 'Orange = Construction and maintenance warning',
  signYellow: 'Yellow = General and unexpected road conditions warning',
  signFluorescent:
    'Fluorescent Yellow Green = Warning of school, pedestrian, and bicycling activity',
  signWhite: 'White = Regulatory',
  signGreen: 'Green = Guide or directional information',
  signBlue: 'Blue = Motorist services guidance',
  signBrown: 'Brown = Public recreation, cultural and historical area identification',

  stopSign:
    'A stop sign means you must stop at the line, crosswalk, or corner. Look for crossing vehicles and pedestrians in all directions and yield the right-of-way.',
  yieldSign:
    'A yield sign means you must slow down and allow traffic that has the right-of-way to cross first.',
  speedLimit:
    'These signs tell you the maximum safe speed allowed or the minimum safe speed required.',
  speedTooFast:
    'Even if you’re driving under the posted speed limit, you can get a ticket for traveling too fast for road conditions.',
  minimumSpeed:
    'Some roads have minimum speed limits. You’re required to travel at least this fast so you are not a hazard to other drivers.',
  keepRight:
    'This sign reminds you to stay in the right lane unless you’re passing another vehicle.',
  oneWay:
    'These signs identify where traffic flows only in the direction of the arrow. Never drive the wrong way on a 1-way street.',
  redCircleSlash:
    'Some regulatory signs have a red circle with a red slash over a symbol. These signs indicate certain actions, such as left turns, right turns, or U-turns, are not allowed.',
  doNotEnter:
    'A square sign with a white horizontal line inside a circle means you can’t enter the street from that direction.',
  wrongWay:
    'This alerts you that you’re driving in the wrong direction and is meant to prevent head-on collisions. Stop and turn around immediately.',
  noPassing:
    'These signs tell you where passing isn’t allowed. You might see these signs where there are potential hazards, such as hills, curves, and intersections, and other places a vehicle could enter the roadway. There are also signs and lane markings that tell you when it is safe to pass.',
  centerTurnLane:
    'This sign indicates where a lane is reserved for left-turning vehicles from either direction and isn’t to be used for through traffic or passing other vehicles. Arrows are often painted on the road.',
  roundaboutEntrance:
    'These signs mark the entrance to a roundabout. Roundabouts can also have yield, pedestrian warning, and directional arrow signs.',
  advisorySpeed:
    'These signs indicate that a speed change is recommended for a potential hazard or road condition (often a curve or turn). Adjust your speed appropriately given all factors (road, weather, traffic, etc.) and follow the speed warning limit.',
  workZoneSigns:
    'These construction, maintenance, or emergency operations signs warn you people are working near the roadway. Motorists, pedestrians, and bicyclists must yield to any highway construction personnel, vehicles with flashing yellow lights, or equipment inside a highway construction or maintenance work zone. Fines double for offenses committed while driving in construction areas when workers are present.',

  solidRed:
    'Stop. Wait until the traffic light turns green and there are no vehicles or pedestrians in the intersection before you move ahead.',
  rightOnRed:
    'After coming to a complete stop at a red light, you can turn right if you don’t see a “no turn on red” sign and you have plenty of room to enter traffic.',
  leftOnRed:
    'After coming to a complete stop at a red light, you can turn left onto a one-way street if you don’t see a “no turn on red” sign and you have plenty of room to enter traffic.',
  flashingRed:
    'Stop. A flashing red traffic light functions as a stop sign. Come to a full stop and then go when it’s your turn.',
  redArrow:
    'Stop. A red arrow means you can’t go in the direction of the arrow.',
  solidYellow:
    'When you see a yellow light, slow down and prepare to stop.',
  yellowInIntersection:
    'If you’re in the intersection when the yellow light comes on, continue through the intersection at the posted speed.',
  noAccelerateOnYellow:
    'You are not allowed to accelerate beyond the posted speed limit to enter or clear an intersection when the light is yellow.',
  flashingYellow:
    'A flashing yellow light has the same meaning as a yield sign. Treat the intersection as an uncontrolled intersection. Proceed when you have the right-of-way.',
  solidGreen:
    'Go ahead, but make sure to: Wait for the intersection to clear. Yield to emergency vehicles as required by law. Yield to pedestrians.',
  greenArrow:
    'A green arrow gives you the right-of-way to travel in that direction. There should be no oncoming vehicles, crossing traffic, or pedestrians while the arrow is green.',
  rampMeters:
    'Ramp meters work like regular traffic signals. When the light is red, stop at the white stop line. When the signal turns green, you can continue along the on-ramp.',
  brokenSignal:
    'If a traffic signal isn’t working, treat the intersection like a 4-way stop. Come to a complete stop. Yield to traffic on your right. Proceed cautiously when it’s safe.',

  turnSignal100:
    'Put on your turn signal at least 100 feet before you turn left or right across oncoming traffic. Then, look for a safe gap in the traffic. Check the street you’re turning onto to make sure no vehicles, pedestrians, or bicyclists are in or approaching your path.',

  roundaboutDefinition:
    'A roundabout is a circular intersection where all approaching vehicles yield on entry and travel counterclockwise around a raised center island.',
  roundaboutSpeed:
    'Slow down when approaching the roundabout. Roundabouts are designed for speeds between 15 and 25 mph.',
  roundaboutPickLane:
    'Pick a lane as you approach the roundabout. The lane choice sign shows you which lanes are used for right turns, straight through travel, and left turns. Once you pick a lane, stay in that lane until you exit the roundabout.',
  roundaboutCrosswalks:
    'Stop for pedestrians and bicyclists in crosswalks when you enter and exit the roundabout.',
  roundaboutYield:
    'Yield to all traffic in the roundabout. Look left and yield to all traffic already in the roundabout since they have the right-of-way. Once you see a gap in traffic, enter the circle and proceed to your exit.',
  roundaboutCounterclockwise:
    'Enter the roundabout to the right, traveling counterclockwise and staying in your lane.',
  roundaboutEmergency:
    'Drive through the roundabout and pull over if an emergency vehicle approaches, just like you would at any other intersection.',

  crosswalkYield:
    'Crosswalks provide a safe way for pedestrians and bicyclists to cross the road. You must yield to people in or about to enter a crosswalk.',
  crosswalkAlert:
    'Get in the habit of being alert for pedestrians and bicyclists when you’re crossing an intersection or turning.',
  crosswalkLights:
    'Some crosswalks might also have in-pavement lights that are activated by crossing pedestrians. You must yield when these lights are flashing.',
  crosswalkNotMarked:
    'Not all crosswalks are marked! Every intersection is legally defined as a crosswalk regardless of whether a crosswalk marking is present.',
  pedBikeRightOfWay:
    'Pedestrians and bicyclists have the right-of-way at crosswalks and intersections whether the road is marked or not.',

  schoolZoneDefinition:
    'A school zone refers to the roads around a school building or playground. These areas can be marked with signs, pavement markings, and flashing lights.',
  schoolZoneSpeed:
    'The school zone speed limit is 20 mph because higher speeds increase the risk of fatal crashes. You might see signs that clarify when the 20 mph speed limit applies.',
  schoolZoneReminder:
    'Remember: Students might participate in after-school activities, sports teams, or access the playground after hours. Slow down and watch out when you’re driving near a school.',

  workZoneDefinition:
    'A work zone is an area where roadwork or construction takes place. It could involve lane closures, detours, and moving equipment.',
  workZoneSlow:
    'Always reduce your speed in a work zone, even if there are no workers. The narrower lanes and rough pavement can create a hazardous condition.',
  workZoneNight:
    'Use extreme caution when driving through a work zone at night, whether you see workers or not.',

  seatBeltAll:
    'Every person in a moving vehicle must wear a seat belt or be securely fastened into an approved child restraint device.',
  seatBeltFit:
    'Your seat belt should go across the middle of your chest. Never put it behind your back or under your arm.',
  childRearFacing:
    'Children up to age 2 must ride in a rear-facing car seat.',
  childForwardFacing:
    'Ages 2 to 4 years must ride in a car seat with a rear- or forward-facing harness.',
  childBooster:
    'Ages 4 and older must ride in a car or booster seat until the vehicle lap and shoulder seat belts fit properly— typically, between the ages of 8 and 12 years of age.',
  airbags:
    'Airbags are also why children under the age of 13 should never ride in the front seat. They could be seriously injured or killed if an airbag deploys.',

  headlightsLaw:
    'Washington law says you need to have your headlights on a half hour after sunset to a half hour before sunrise.',
  headlightsConditions:
    'When it’s rainy, snowy, foggy, or smoky.',
  highBeamsOncoming: '500 feet in front of an oncoming vehicle.',
  highBeamsFollowing: '300 feet when you’re behind.',
} as const

const WA_QUESTION_DRAFTS: QuestionDraft[] = [
  // Signs overview + color meanings
  {
    prompt: 'Traffic signs primarily tell you about what?',
    choices: [
      'Only where to buy fuel',
      'Traffic rules, hazards, directions, and roadway services',
      'Only parking rules',
      'Only construction detours',
    ],
    answerIndex: 1,
    explanation: 'The guide explains signs communicate rules, hazards, directions, and services.',
    quote: QUOTE.signOverview,
    reference: REF.signs,
  },
  {
    prompt: 'Which sign color indicates a prohibitive or restricted action?',
    choices: ['Red', 'Brown', 'Yellow', 'Blue'],
    answerIndex: 0,
    explanation: 'Red signs communicate prohibited or restricted actions.',
    quote: QUOTE.signRed,
    reference: REF.signs,
  },
  {
    prompt: 'Which sign color is used for construction and maintenance warnings?',
    choices: ['Green', 'Orange', 'White', 'Brown'],
    answerIndex: 1,
    explanation: 'Orange signs warn of construction and maintenance.',
    quote: QUOTE.signOrange,
    reference: REF.signs,
  },
  {
    prompt: 'Which sign color warns of general and unexpected road conditions?',
    choices: ['Yellow', 'Blue', 'White', 'Green'],
    answerIndex: 0,
    explanation: 'Yellow signs warn of general and unexpected road conditions.',
    quote: QUOTE.signYellow,
    reference: REF.signs,
  },
  {
    prompt: 'Which sign color warns of school, pedestrian, and bicycling activity?',
    choices: ['Fluorescent Yellow Green', 'Orange', 'Red', 'Brown'],
    answerIndex: 0,
    explanation: 'Fluorescent yellow-green highlights school/pedestrian/bike activity.',
    quote: QUOTE.signFluorescent,
    reference: REF.signs,
  },
  {
    prompt: 'Which sign color is typically used for regulatory signs?',
    choices: ['White', 'Blue', 'Green', 'Yellow'],
    answerIndex: 0,
    explanation: 'White signs are used for regulatory messages.',
    quote: QUOTE.signWhite,
    reference: REF.signs,
  },
  {
    prompt: 'Which sign color provides guide or directional information?',
    choices: ['Green', 'Yellow', 'Brown', 'Red'],
    answerIndex: 0,
    explanation: 'Green signs provide guide or directional information.',
    quote: QUOTE.signGreen,
    reference: REF.signs,
  },
  {
    prompt: 'Which sign color is used for motorist services guidance?',
    choices: ['Blue', 'White', 'Orange', 'Yellow'],
    answerIndex: 0,
    explanation: 'Blue signs guide motorists to services.',
    quote: QUOTE.signBlue,
    reference: REF.signs,
  },
  {
    prompt: 'Which sign color identifies public recreation, cultural, and historical areas?',
    choices: ['Brown', 'Green', 'Red', 'Blue'],
    answerIndex: 0,
    explanation: 'Brown signs identify recreation and cultural/historical areas.',
    quote: QUOTE.signBrown,
    reference: REF.signs,
  },

  // Road signs (image-based) — ~1/3 of the bank
  {
    prompt: 'What does this sign require you to do?',
    choices: [
      'Stop at the line, crosswalk, or corner and yield the right-of-way',
      'Slow down and proceed without stopping',
      'Stop only if pedestrians are present',
      'Speed up to clear the intersection',
    ],
    answerIndex: 0,
    explanation: 'A stop sign requires a full stop and yielding before proceeding.',
    quote: QUOTE.stopSign,
    reference: REF.commonSigns,
    image: MUTCD.stop,
    imageAlt: 'MUTCD R1-1 stop sign',
  },
  {
    prompt: 'A stop sign means you must stop at the:',
    choices: ['Stop line, crosswalk, or corner', 'Middle of the intersection', 'Nearest driveway', 'Next block'],
    answerIndex: 0,
    explanation: 'The guide lists the exact places you must stop for a stop sign.',
    quote: QUOTE.stopSign,
    reference: REF.commonSigns,
    image: MUTCD.stop,
    imageAlt: 'MUTCD R1-1 stop sign',
  },
  {
    prompt: 'After stopping at this sign, what must you do before going?',
    choices: [
      'Yield the right-of-way to crossing vehicles and pedestrians',
      'Proceed immediately if you arrived first',
      'Honk once and proceed',
      'Only look to the left',
    ],
    answerIndex: 0,
    explanation: 'After stopping, you must look and yield as needed.',
    quote: QUOTE.stopSign,
    reference: REF.commonSigns,
    image: MUTCD.stop,
    imageAlt: 'MUTCD R1-1 stop sign',
  },
  {
    prompt: 'When you see this sign, what should you do?',
    choices: [
      'Slow down and allow traffic with the right-of-way to go first',
      'Stop and wait for a green light',
      'Speed up to merge',
      'Continue without changing speed',
    ],
    answerIndex: 0,
    explanation: 'A yield sign means slow down and give the right-of-way to others.',
    quote: QUOTE.yieldSign,
    reference: REF.commonSigns,
    image: MUTCD.yield,
    imageAlt: 'MUTCD R1-2 yield sign',
  },
  {
    prompt: 'A yield sign means you must:',
    choices: ['Slow down and allow traffic with the right-of-way to cross first', 'Stop every time', 'Turn right only', 'Sound your horn'],
    answerIndex: 0,
    explanation: 'The guide defines yield as slowing and letting right-of-way traffic go first.',
    quote: QUOTE.yieldSign,
    reference: REF.commonSigns,
    image: MUTCD.yield,
    imageAlt: 'MUTCD R1-2 yield sign',
  },
  {
    prompt: 'What do speed limit signs tell you?',
    choices: [
      'The maximum safe speed allowed or the minimum safe speed required',
      'Only a suggested speed for dry weather',
      'A speed you must drive exactly at all times',
      'A warning that the road is closed',
    ],
    answerIndex: 0,
    explanation: 'Speed limit signs can set maximums and minimums.',
    quote: QUOTE.speedLimit,
    reference: REF.commonSigns,
    image: MUTCD.speedLimit,
    imageAlt: 'MUTCD R2-1 speed limit sign',
  },
  {
    prompt: 'Even if you are under the posted speed limit, you can still get a ticket for:',
    choices: ['Traveling too fast for road conditions', 'Driving at the speed limit', 'Stopping at a red light', 'Using a turn signal'],
    answerIndex: 0,
    explanation: 'The guide states you can be cited for driving too fast for conditions.',
    quote: QUOTE.speedTooFast,
    reference: REF.commonSigns,
    image: MUTCD.speedLimit,
    imageAlt: 'MUTCD R2-1 speed limit sign',
  },
  {
    prompt: 'A minimum speed limit means you are required to:',
    choices: ['Travel at least that fast so you are not a hazard', 'Drive exactly at that speed', 'Drive slower than traffic', 'Stop every mile'],
    answerIndex: 0,
    explanation: 'Minimum speeds exist so slow vehicles do not become hazards.',
    quote: QUOTE.minimumSpeed,
    reference: REF.commonSigns,
    image: MUTCD.minimumSpeed,
    imageAlt: 'MUTCD R2-4 minimum speed limit sign',
  },
  {
    prompt: 'What does this sign remind you to do?',
    choices: [
      'Stay in the right lane unless you’re passing another vehicle',
      'Use the left lane unless turning',
      'Turn right at the next intersection',
      'Stop for any vehicle behind you',
    ],
    answerIndex: 0,
    explanation: 'Keep right reinforces lane discipline: stay right unless passing.',
    quote: QUOTE.keepRight,
    reference: REF.commonSigns,
    image: MUTCD.keepRight,
    imageAlt: 'MUTCD R4-7 keep right sign',
  },
  {
    prompt: 'These signs identify where traffic flows only in the direction of the arrow. What should you never do?',
    choices: ['Drive the wrong way on a one-way street', 'Yield before turning', 'Signal before turning', 'Stop at a stop line'],
    answerIndex: 0,
    explanation: 'One-way signs indicate travel in one direction only.',
    quote: QUOTE.oneWay,
    reference: REF.commonSigns,
    image: MUTCD.oneWayRight,
    imageAlt: 'MUTCD R6-1R one way (right) sign',
  },
  {
    prompt: 'What does this sign indicate?',
    choices: ['Traffic flows only in the direction of the arrow', 'Two-way traffic ahead', 'No passing zone', 'Road closed'],
    answerIndex: 0,
    explanation: 'A one-way sign identifies traffic flow direction.',
    quote: QUOTE.oneWay,
    reference: REF.commonSigns,
    image: MUTCD.oneWayLeft,
    imageAlt: 'MUTCD R6-1L one way (left) sign',
  },
  {
    prompt: 'A red circle with a red slash over a symbol means:',
    choices: ['The action shown is not allowed', 'The action is required', 'The action is recommended', 'The action is allowed only at night'],
    answerIndex: 0,
    explanation: 'The guide says these signs prohibit the action shown.',
    quote: QUOTE.redCircleSlash,
    reference: REF.commonSigns,
    image: MUTCD.noUTurn,
    imageAlt: 'MUTCD R3-4 no U-turn sign',
  },
  {
    prompt: 'This sign indicates which action is not allowed?',
    choices: ['Right turn', 'Passing', 'Parking', 'Pedestrian crossing'],
    answerIndex: 0,
    explanation: 'A red circle and slash means the pictured action is prohibited.',
    quote: QUOTE.redCircleSlash,
    reference: REF.commonSigns,
    image: MUTCD.noRightTurn,
    imageAlt: 'MUTCD R3-1 no right turn sign',
  },
  {
    prompt: 'This sign indicates which action is not allowed?',
    choices: ['Left turn', 'Merging', 'Going straight', 'Stopping'],
    answerIndex: 0,
    explanation: 'A red circle and slash prohibits the pictured action.',
    quote: QUOTE.redCircleSlash,
    reference: REF.commonSigns,
    image: MUTCD.noLeftTurn,
    imageAlt: 'MUTCD R3-2 no left turn sign',
  },
  {
    prompt: 'What does this sign mean?',
    choices: [
      'You can’t enter the street from that direction',
      'You may enter if you stop first',
      'Only buses may enter',
      'One-way traffic is approaching you',
    ],
    answerIndex: 0,
    explanation: 'Do Not Enter means you may not enter from that direction.',
    quote: QUOTE.doNotEnter,
    reference: REF.commonSigns,
    image: MUTCD.doNotEnter,
    imageAlt: 'MUTCD R5-1 do not enter sign',
  },
  {
    prompt: 'If you see this sign while driving, what should you do?',
    choices: ['Stop and turn around immediately', 'Continue but turn on hazard lights', 'Move to the left lane', 'Drive faster to match traffic'],
    answerIndex: 0,
    explanation: 'Wrong Way means stop and turn around immediately to avoid a head-on crash.',
    quote: QUOTE.wrongWay,
    reference: REF.commonSigns,
    image: MUTCD.wrongWay,
    imageAlt: 'MUTCD R5-1a wrong way sign',
  },
  {
    prompt: 'Where might you see “Do not pass” signs?',
    choices: ['Where there are potential hazards like hills, curves, and intersections', 'Only on parking lots', 'Only in school zones', 'Only on freeways'],
    answerIndex: 0,
    explanation: 'The guide lists hazard locations where passing may be prohibited.',
    quote: QUOTE.noPassing,
    reference: REF.commonSigns,
    image: MUTCD.doNotPass,
    imageAlt: 'MUTCD R4-1 do not pass sign',
  },
  {
    prompt: 'What does this sign tell you?',
    choices: ['Passing isn’t allowed here', 'Passing is required', 'This lane is for bicycles only', 'This road is one-way'],
    answerIndex: 0,
    explanation: 'Do Not Pass signs mark places where passing is prohibited.',
    quote: QUOTE.noPassing,
    reference: REF.commonSigns,
    image: MUTCD.doNotPass,
    imageAlt: 'MUTCD R4-1 do not pass sign',
  },
  {
    prompt: 'This sign indicates what kind of lane?',
    choices: ['A lane reserved for left-turning vehicles from either direction', 'A lane for passing slower vehicles', 'A lane for buses only', 'A lane for parking'],
    answerIndex: 0,
    explanation: 'This sign marks a center lane reserved for left turns and not for passing.',
    quote: QUOTE.centerTurnLane,
    reference: REF.commonSigns,
    image: MUTCD.centerTurnLane,
    imageAlt: 'MUTCD R3-9a two-way left turn only sign',
  },
  {
    prompt: 'A center turn lane marked by this sign is not to be used for:',
    choices: ['Through traffic or passing other vehicles', 'Left turns', 'U-turns where allowed', 'Entering a driveway'],
    answerIndex: 0,
    explanation: 'The guide states the lane is reserved for left-turning vehicles and not for through traffic or passing.',
    quote: QUOTE.centerTurnLane,
    reference: REF.commonSigns,
    image: MUTCD.centerTurnLane,
    imageAlt: 'MUTCD R3-9a two-way left turn only sign',
  },
  {
    prompt: 'What do these signs mark?',
    choices: ['The entrance to a roundabout', 'A railroad crossing', 'A school zone boundary', 'A dead end'],
    answerIndex: 0,
    explanation: 'The guide says these signs mark the entrance to a roundabout.',
    quote: QUOTE.roundaboutEntrance,
    reference: REF.commonSigns,
    image: MUTCD.roundabout,
    imageAlt: 'MUTCD W2-6 roundabout warning sign',
  },
  {
    prompt: 'These signs indicate what kind of speed change?',
    choices: ['A recommended speed change for a hazard or road condition', 'A mandatory minimum speed', 'A toll price', 'A school bus route'],
    answerIndex: 0,
    explanation: 'Advisory speed signs recommend a speed adjustment for hazards.',
    quote: QUOTE.advisorySpeed,
    reference: REF.commonSigns,
    image: MUTCD.advisorySpeed,
    imageAlt: 'MUTCD W13-1P advisory speed plaque',
  },
  {
    prompt: 'What must motorists, pedestrians, and bicyclists do in a highway construction or maintenance work zone?',
    choices: ['Yield to construction personnel, vehicles with flashing yellow lights, or equipment inside the work zone', 'Speed up to clear the zone quickly', 'Use the shoulder to pass', 'Ignore instructions from construction personnel'],
    answerIndex: 0,
    explanation: 'The guide requires yielding to work-zone personnel/vehicles/equipment.',
    quote: QUOTE.workZoneSigns,
    reference: REF.workZoneSigns,
    image: MUTCD.workers,
    imageAlt: 'MUTCD CW21-1 workers sign',
  },
  {
    prompt: 'Fines for offenses committed while driving in construction areas when workers are present are:',
    choices: ['Doubled', 'Reduced', 'Waived', 'Unchanged'],
    answerIndex: 0,
    explanation: 'The guide states fines double when workers are present.',
    quote: QUOTE.workZoneSigns,
    reference: REF.workZoneSigns,
    image: MUTCD.roadWorkAhead,
    imageAlt: 'MUTCD CW20-1 road work ahead sign',
  },
  {
    prompt: 'Which sign is used to warn you to watch for roadwork ahead?',
    choices: ['Road Work Ahead', 'Do Not Enter', 'Speed Limit', 'Wrong Way'],
    answerIndex: 0,
    explanation: 'Work zones can involve lane closures, detours, and equipment—watch for warning signs.',
    quote: QUOTE.workZoneDefinition,
    reference: REF.workZone,
    image: MUTCD.roadWorkAhead,
    imageAlt: 'MUTCD CW20-1 road work ahead sign',
  },
  {
    prompt: 'A school zone refers to:',
    choices: ['The roads around a school building or playground', 'Only roads directly in front of a courthouse', 'Any road with a bike lane', 'A freeway interchange'],
    answerIndex: 0,
    explanation: 'The guide defines what a school zone is and how it may be marked.',
    quote: QUOTE.schoolZoneDefinition,
    reference: REF.schoolZone,
    image: MUTCD.schoolZone,
    imageAlt: 'MUTCD S1-1 school zone sign',
  },
  {
    prompt: 'What is the school zone speed limit mentioned in the guide?',
    choices: ['20 mph', '15 mph', '25 mph', '30 mph'],
    answerIndex: 0,
    explanation: 'The guide states the school zone speed limit is 20 mph (with signs clarifying when it applies).',
    quote: QUOTE.schoolZoneSpeed,
    reference: REF.schoolZone,
    image: MUTCD.schoolZone,
    imageAlt: 'MUTCD S1-1 school zone sign',
  },
  {
    prompt: 'When you see a pedestrian warning sign near a crosswalk, what must you do if someone is in or about to enter the crosswalk?',
    choices: ['Yield to the person in or about to enter the crosswalk', 'Honk and continue', 'Speed up to clear the crosswalk', 'Stop only if a police officer is present'],
    answerIndex: 0,
    explanation: 'You must yield to people in or about to enter a crosswalk.',
    quote: QUOTE.crosswalkYield,
    reference: REF.crosswalks,
    image: MUTCD.pedestrian,
    imageAlt: 'MUTCD W11-2 pedestrian warning sign',
  },
  {
    prompt: 'If you see “END ROAD WORK” after a work zone, what should you have been doing up to that point?',
    choices: ['Observing the posted work zone signs until you see the End Road Work sign', 'Driving only in the left lane', 'Passing on the shoulder', 'Turning on hazard lights'],
    answerIndex: 0,
    explanation: 'The guide says to observe work-zone signs until the end sign.',
    quote: 'Observe the posted work zone signs until you see the End Road Work sign.',
    reference: REF.workZone,
    image: MUTCD.endRoadWork,
    imageAlt: 'MUTCD G20-2 road work ends sign',
  },

  // Traffic signals (non-image)
  {
    prompt: 'What does a solid red traffic light mean?',
    choices: ['Stop and wait until green (and the intersection is clear)', 'Slow down and proceed if clear', 'Stop only if pedestrians are present', 'Proceed through if you were already slowing'],
    answerIndex: 0,
    explanation: 'Solid red means stop and wait for green before proceeding.',
    quote: QUOTE.solidRed,
    reference: REF.trafficSignals,
  },
  {
    prompt: 'After coming to a complete stop at a red light, you may turn right when:',
    choices: [
      'There is no “no turn on red” sign and you have plenty of room to enter traffic',
      'You honk twice',
      'The crosswalk is occupied',
      'You are in the left lane',
    ],
    answerIndex: 0,
    explanation: 'Right on red is allowed only after a complete stop and only when not prohibited and it is safe.',
    quote: QUOTE.rightOnRed,
    reference: REF.trafficSignals,
  },
  {
    prompt: 'After coming to a complete stop at a red light, you may turn left onto a one-way street when:',
    choices: [
      'There is no “no turn on red” sign and you have plenty of room to enter traffic',
      'You are turning from a shoulder',
      'The light is flashing green',
      'A pedestrian is in the crosswalk',
    ],
    answerIndex: 0,
    explanation: 'Left on red to a one-way street is allowed after stopping if not prohibited and it is safe.',
    quote: QUOTE.leftOnRed,
    reference: REF.trafficSignals,
  },
  {
    prompt: 'A flashing red traffic light functions as a:',
    choices: ['Stop sign', 'Yield sign', 'Green arrow', 'Railroad crossing signal'],
    answerIndex: 0,
    explanation: 'Flashing red is treated the same as a stop sign.',
    quote: QUOTE.flashingRed,
    reference: REF.trafficSignals,
  },
  {
    prompt: 'What does a red arrow mean?',
    choices: ['You can’t go in the direction of the arrow', 'You may proceed after slowing', 'You must turn in the direction of the arrow', 'You may go only if the intersection is empty'],
    answerIndex: 0,
    explanation: 'A red arrow prohibits travel in the arrow’s direction.',
    quote: QUOTE.redArrow,
    reference: REF.trafficSignals,
  },
  {
    prompt: 'When you see a solid yellow light, you should:',
    choices: ['Slow down and prepare to stop', 'Speed up to beat the red', 'Stop immediately in the intersection', 'Proceed without checking'],
    answerIndex: 0,
    explanation: 'Yellow warns the light is changing to red—slow and prepare to stop.',
    quote: QUOTE.solidYellow,
    reference: REF.trafficSignals,
  },
  {
    prompt: 'If you are already in the intersection when the yellow light comes on, you should:',
    choices: ['Continue through the intersection at the posted speed', 'Back up', 'Stop in the middle', 'Accelerate hard'],
    answerIndex: 0,
    explanation: 'If you are already in the intersection, continue through at the posted speed.',
    quote: QUOTE.yellowInIntersection,
    reference: REF.trafficSignals,
  },
  {
    prompt: 'When the light is yellow, you are not allowed to:',
    choices: ['Accelerate beyond the posted speed limit to enter or clear the intersection', 'Slow down', 'Prepare to stop', 'Continue through if already in the intersection'],
    answerIndex: 0,
    explanation: 'The guide prohibits accelerating beyond the posted limit to “make” the yellow.',
    quote: QUOTE.noAccelerateOnYellow,
    reference: REF.trafficSignals,
  },
  {
    prompt: 'A flashing yellow light has the same meaning as a:',
    choices: ['Yield sign', 'Stop sign', 'Green arrow', 'Red arrow'],
    answerIndex: 0,
    explanation: 'Flashing yellow means slow down and proceed when you have the right-of-way.',
    quote: QUOTE.flashingYellow,
    reference: REF.trafficSignals,
  },
  {
    prompt: 'A solid green light means you may go, but you must still:',
    choices: ['Yield to pedestrians', 'Ignore emergency vehicles', 'Assume the intersection is clear', 'Accelerate quickly without checking'],
    answerIndex: 0,
    explanation: 'Even on green, you must yield to pedestrians and ensure the intersection is clear.',
    quote: QUOTE.solidGreen,
    reference: REF.trafficSignals,
  },
  {
    prompt: 'A green arrow gives you the right-of-way to travel in that direction, and there should be no:',
    choices: ['Oncoming vehicles, crossing traffic, or pedestrians', 'Road markings', 'Traffic signs', 'Streetlights'],
    answerIndex: 0,
    explanation: 'A green arrow indicates protected movement with no conflicting traffic/pedestrians expected.',
    quote: QUOTE.greenArrow,
    reference: REF.trafficSignals,
  },
  {
    prompt: 'Ramp meters work like regular traffic signals. When the light is red, you should:',
    choices: ['Stop at the white stop line', 'Keep rolling slowly', 'Stop only if someone honks', 'Merge immediately'],
    answerIndex: 0,
    explanation: 'Ramp meters are traffic signals—stop on red at the stop line.',
    quote: QUOTE.rampMeters,
    reference: REF.trafficSignals,
  },
  {
    prompt: 'If a traffic signal isn’t working, how should you treat the intersection?',
    choices: ['Treat it like a 4-way stop', 'Proceed through without stopping', 'Treat it like a yield in all directions', 'Wait until the light turns green'],
    answerIndex: 0,
    explanation: 'The guide directs drivers to treat a dark signal like a four-way stop.',
    quote: QUOTE.brokenSignal,
    reference: REF.brokenSignals,
  },

  // Turning
  {
    prompt: 'How far before turning left or right across oncoming traffic should you signal (minimum)?',
    choices: ['At least 100 feet', 'At least 10 feet', 'At least 500 feet', 'Only after you start turning'],
    answerIndex: 0,
    explanation: 'The guide says to signal at least 100 feet before turning across oncoming traffic.',
    quote: QUOTE.turnSignal100,
    reference: REF.turning,
  },
  {
    prompt: 'After signaling at least 100 feet before a turn, what should you look for?',
    choices: ['A safe gap in traffic', 'A place to honk', 'A speed limit sign', 'A parking spot'],
    answerIndex: 0,
    explanation: 'After signaling, the guide says to look for a safe gap.',
    quote: QUOTE.turnSignal100,
    reference: REF.turning,
  },
  {
    prompt: 'Before turning onto a street, you should check that no ____ are in or approaching your path.',
    choices: ['Vehicles, pedestrians, or bicyclists', 'Streetlights', 'Road workers', 'Railroad tracks'],
    answerIndex: 0,
    explanation: 'The guide says to check for vehicles, pedestrians, and bicyclists before turning.',
    quote: QUOTE.turnSignal100,
    reference: REF.turning,
  },

  // Roundabouts
  {
    prompt: 'A roundabout is a circular intersection where vehicles:',
    choices: ['Yield on entry and travel counterclockwise', 'Stop on entry and travel clockwise', 'Have right-of-way on entry and travel clockwise', 'Yield on exit and travel clockwise'],
    answerIndex: 0,
    explanation: 'The guide defines roundabouts as yielding on entry and traveling counterclockwise.',
    quote: QUOTE.roundaboutDefinition,
    reference: REF.roundabout,
  },
  {
    prompt: 'Roundabouts are designed for speeds between:',
    choices: ['15 and 25 mph', '35 and 45 mph', '5 and 10 mph', '55 and 70 mph'],
    answerIndex: 0,
    explanation: 'The guide notes typical roundabout design speeds.',
    quote: QUOTE.roundaboutSpeed,
    reference: REF.roundabout,
  },
  {
    prompt: 'When approaching a roundabout, you should:',
    choices: ['Pick a lane and stay in it until you exit', 'Change lanes inside the roundabout', 'Stop in the circle and wait', 'Drive in the shoulder'],
    answerIndex: 0,
    explanation: 'Pick your lane before entry and stay in it until you exit.',
    quote: QUOTE.roundaboutPickLane,
    reference: REF.roundabout,
  },
  {
    prompt: 'When entering and exiting a roundabout, you must:',
    choices: ['Stop for pedestrians and bicyclists in crosswalks', 'Assume pedestrians will wait', 'Honk to clear crosswalks', 'Speed up to reduce delay'],
    answerIndex: 0,
    explanation: 'Crosswalks at roundabouts must be treated like crosswalks elsewhere—stop/yield as required.',
    quote: QUOTE.roundaboutCrosswalks,
    reference: REF.roundabout,
  },
  {
    prompt: 'At a roundabout, you should yield to:',
    choices: ['All traffic already in the roundabout', 'Only traffic entering behind you', 'Only traffic on your right', 'No one if you are going straight'],
    answerIndex: 0,
    explanation: 'Yield to traffic already circulating in the roundabout.',
    quote: QUOTE.roundaboutYield,
    reference: REF.roundabout,
  },
  {
    prompt: 'Roundabout traffic travels:',
    choices: ['Counterclockwise', 'Clockwise', 'Either direction', 'Straight through only'],
    answerIndex: 0,
    explanation: 'The guide states roundabout traffic travels counterclockwise.',
    quote: QUOTE.roundaboutDefinition,
    reference: REF.roundabout,
  },
  {
    prompt: 'To enter a roundabout correctly, you should enter:',
    choices: ['To the right, traveling counterclockwise', 'To the left, traveling clockwise', 'In any lane, then change lanes', 'By stopping in the circle first'],
    answerIndex: 0,
    explanation: 'Enter to the right and circulate counterclockwise.',
    quote: QUOTE.roundaboutCounterclockwise,
    reference: REF.roundabout,
  },
  {
    prompt: 'If an emergency vehicle approaches while you are in a roundabout, you should:',
    choices: ['Drive through and pull over, like at any other intersection', 'Stop immediately in the circle', 'Back up to your entry point', 'Speed up to exit wherever possible'],
    answerIndex: 0,
    explanation: 'The guide says to drive through and then pull over.',
    quote: QUOTE.roundaboutEmergency,
    reference: REF.roundabout,
  },

  // Crosswalks and pedestrians/bicyclists
  {
    prompt: 'Who has the right-of-way at crosswalks and intersections (marked or unmarked)?',
    choices: ['Pedestrians and bicyclists', 'Only cars', 'Only buses', 'Only emergency vehicles'],
    answerIndex: 0,
    explanation: 'The guide states pedestrians and bicyclists have the right-of-way at crosswalks and intersections whether marked or not.',
    quote: QUOTE.pedBikeRightOfWay,
    reference: REF.crosswalks,
  },
  {
    prompt: 'You must yield to people in or about to enter a:',
    choices: ['Crosswalk', 'Parking lot', 'Median', 'Shoulder'],
    answerIndex: 0,
    explanation: 'You must yield to people in or about to enter a crosswalk.',
    quote: QUOTE.crosswalkYield,
    reference: REF.crosswalks,
  },
  {
    prompt: 'Some crosswalks have in-pavement lights activated by pedestrians. When the lights are flashing, you must:',
    choices: ['Yield', 'Speed up', 'Honk', 'Ignore them'],
    answerIndex: 0,
    explanation: 'Flashing in-pavement crosswalk lights mean you must yield.',
    quote: QUOTE.crosswalkLights,
    reference: REF.crosswalks,
  },
  {
    prompt: 'True or false: Every intersection is legally defined as a crosswalk even if there are no crosswalk markings.',
    choices: ['True', 'False', 'Only in school zones', 'Only when a sign is present'],
    answerIndex: 0,
    explanation: 'The guide emphasizes not all crosswalks are marked; intersections still count as crosswalks.',
    quote: QUOTE.crosswalkNotMarked,
    reference: REF.crosswalks,
  },
  {
    prompt: 'When should you be alert for pedestrians and bicyclists?',
    choices: ['When crossing an intersection or turning', 'Only in downtown areas', 'Only when it is raining', 'Only on highways'],
    answerIndex: 0,
    explanation: 'The guide encourages building a habit of being alert when crossing intersections or turning.',
    quote: QUOTE.crosswalkAlert,
    reference: REF.crosswalks,
  },

  // School zone
  {
    prompt: 'Why does the guide say the school zone speed limit is 20 mph?',
    choices: ['Because higher speeds increase the risk of fatal crashes', 'Because traffic lights are timed for 20 mph', 'Because school buses require it', 'Because roads are always icy near schools'],
    answerIndex: 0,
    explanation: 'The guide states higher speeds increase the risk of fatal crashes, so school zones are 20 mph.',
    quote: QUOTE.schoolZoneSpeed,
    reference: REF.schoolZone,
  },
  {
    prompt: 'The guide reminds drivers that students may still be present after hours. What should you do near a school?',
    choices: ['Slow down and watch out', 'Assume the area is clear after 3 pm', 'Drive faster to reduce congestion', 'Use your horn frequently'],
    answerIndex: 0,
    explanation: 'The guide tells drivers to slow down and watch out near schools, even after hours.',
    quote: QUOTE.schoolZoneReminder,
    reference: REF.schoolZone,
  },

  // Work zones
  {
    prompt: 'A work zone is an area where:',
    choices: ['Roadwork or construction takes place', 'Only parking is allowed', 'Traffic signals are always broken', 'Only pedestrians may travel'],
    answerIndex: 0,
    explanation: 'The guide defines a work zone as an area where roadwork or construction takes place.',
    quote: QUOTE.workZoneDefinition,
    reference: REF.workZone,
  },
  {
    prompt: 'According to the guide, you should always reduce your speed in a work zone:',
    choices: ['Even if there are no workers', 'Only when you see a flagger', 'Only during the day', 'Only if you are late'],
    answerIndex: 0,
    explanation: 'The guide says always reduce speed in work zones because lanes can be narrower and pavement rough.',
    quote: QUOTE.workZoneSlow,
    reference: REF.workZone,
  },
  {
    prompt: 'Use extreme caution when driving through a work zone at night:',
    choices: ['Whether you see workers or not', 'Only if it is raining', 'Only on freeways', 'Only when traffic is heavy'],
    answerIndex: 0,
    explanation: 'The guide explicitly calls for extreme caution in work zones at night.',
    quote: QUOTE.workZoneNight,
    reference: REF.workZone,
  },

  // Occupant protection: seat belts, kids, airbags
  {
    prompt: 'In Washington, who must wear a seat belt or be secured in an approved child restraint in a moving vehicle?',
    choices: ['Every person in a moving vehicle', 'Only the driver', 'Only front-seat occupants', 'Only children under 16'],
    answerIndex: 0,
    explanation: 'The guide states the requirement applies to everyone in a moving vehicle.',
    quote: QUOTE.seatBeltAll,
    reference: REF.occupantProtection,
  },
  {
    prompt: 'Proper seat belt use includes placing the belt:',
    choices: ['Across the middle of your chest', 'Behind your back', 'Under your arm', 'Across your face'],
    answerIndex: 0,
    explanation: 'The guide describes correct placement and warns against unsafe positioning.',
    quote: QUOTE.seatBeltFit,
    reference: REF.occupantProtection,
  },
  {
    prompt: 'Children up to what age must ride in a rear-facing car seat?',
    choices: ['Up to age 2', 'Up to age 1', 'Up to age 4', 'Up to age 8'],
    answerIndex: 0,
    explanation: 'The guide states children up to age 2 must ride rear-facing.',
    quote: QUOTE.childRearFacing,
    reference: REF.occupantProtection,
  },
  {
    prompt: 'Ages 2 to 4 must ride in:',
    choices: ['A car seat with a rear- or forward-facing harness', 'A booster seat only', 'No restraint if seated in the back', 'The front seat with a lap belt'],
    answerIndex: 0,
    explanation: 'The guide specifies a harnessed car seat for ages 2–4.',
    quote: QUOTE.childForwardFacing,
    reference: REF.occupantProtection,
  },
  {
    prompt: 'Ages 4 and older must ride in a car/booster seat until seat belts fit properly—typically between what ages?',
    choices: ['8 and 12 years of age', '4 and 6 years of age', '13 and 16 years of age', '2 and 4 years of age'],
    answerIndex: 0,
    explanation: 'The guide gives a typical age range (8–12) for proper belt fit.',
    quote: QUOTE.childBooster,
    reference: REF.occupantProtection,
  },
  {
    prompt: 'Why should children under age 13 never ride in the front seat (per the guide)?',
    choices: ['They could be seriously injured or killed if an airbag deploys', 'They cannot wear seat belts', 'They must sit by a window', 'Front seats are illegal for all children'],
    answerIndex: 0,
    explanation: 'The guide says airbags can seriously injure or kill children in the front seat.',
    quote: QUOTE.airbags,
    reference: REF.occupantProtection,
  },

  // Headlights
  {
    prompt: 'Washington law says you need to have your headlights on:',
    choices: ['A half hour after sunset to a half hour before sunrise', 'Only when it rains', 'Only on freeways', 'Only when using high beams'],
    answerIndex: 0,
    explanation: 'The guide states this minimum legal window for headlights.',
    quote: QUOTE.headlightsLaw,
    reference: REF.headlights,
  },
  {
    prompt: 'According to the guide’s “easier to remember” list, headlights should be on when it is:',
    choices: ['Rainy, snowy, foggy, or smoky', 'Warm and sunny', 'Only at noon', 'Only in parking lots'],
    answerIndex: 0,
    explanation: 'The guide explicitly lists conditions where you should have headlights on.',
    quote: QUOTE.headlightsConditions,
    reference: REF.headlights,
  },
  {
    prompt: 'When using high beams, switch back to regular headlights when you are about how far from an oncoming vehicle?',
    choices: ['500 feet', '50 feet', '1,000 feet', '100 feet'],
    answerIndex: 0,
    explanation: 'The guide gives a 500-foot distance for oncoming traffic.',
    quote: QUOTE.highBeamsOncoming,
    reference: REF.headlights,
  },
  {
    prompt: 'When following another vehicle, switch back to regular headlights when you are about how far behind?',
    choices: ['300 feet', '30 feet', '600 feet', '1,500 feet'],
    answerIndex: 0,
    explanation: 'The guide gives a 300-foot distance when following another vehicle.',
    quote: QUOTE.highBeamsFollowing,
    reference: REF.headlights,
  },

  // More guide-based coverage to reach ~120 questions
  {
    prompt: 'According to the guide, the shape and color of traffic signs give clues to:',
    choices: [
      'The type of information they provide',
      'How old the sign is',
      'Whether the road is privately owned',
      'The speed you are driving right now',
    ],
    answerIndex: 0,
    explanation: 'The guide says sign shape and color provide clues to the information type.',
    quote: QUOTE.signOverview,
    reference: REF.signs,
  },
  {
    prompt: 'Minimum speed limits exist primarily so you are not a:',
    choices: ['Hazard to other drivers', 'Better fuel saver', 'Faster lane user', 'Passing vehicle'],
    answerIndex: 0,
    explanation: 'The guide explains minimum speed limits help prevent hazards caused by driving too slowly.',
    quote: QUOTE.minimumSpeed,
    reference: REF.commonSigns,
  },
  {
    prompt: '“Keep Right” reminds you to stay in the right lane unless you’re:',
    choices: ['Passing another vehicle', 'Turning left at the next corner', 'Stopping at a red light', 'Entering a driveway'],
    answerIndex: 0,
    explanation: 'The guide ties “Keep Right” to staying right except when passing.',
    quote: QUOTE.keepRight,
    reference: REF.commonSigns,
  },
  {
    prompt: 'Advisory speed signs recommend you adjust speed based on:',
    choices: ['Road, weather, traffic, and other factors', 'Only the posted speed limit', 'Only your vehicle color', 'Only the number of lanes'],
    answerIndex: 0,
    explanation: 'The guide says to consider conditions and follow the speed warning limit.',
    quote: QUOTE.advisorySpeed,
    reference: REF.commonSigns,
  },
  {
    prompt: 'On a solid green light, you should also:',
    choices: ['Wait for the intersection to clear', 'Assume cross traffic will always stop', 'Ignore pedestrians', 'Accelerate without checking'],
    answerIndex: 0,
    explanation: 'The guide says green means go, but only after ensuring the intersection is clear and yielding as required.',
    quote: QUOTE.solidGreen,
    reference: REF.trafficSignals,
  },
  {
    prompt: 'A flashing yellow light should be treated as:',
    choices: ['An uncontrolled intersection where you proceed when you have the right-of-way', 'A stop sign', 'A green arrow', 'A railroad crossing'],
    answerIndex: 0,
    explanation: 'The guide says flashing yellow acts like a yield sign and you proceed when you have the right-of-way.',
    quote: QUOTE.flashingYellow,
    reference: REF.trafficSignals,
  },
  {
    prompt: 'If a traffic signal isn’t working, after stopping you should yield to traffic on your:',
    choices: ['Right', 'Left', 'Rear only', 'Both sides equally (no right-of-way rules apply)'],
    answerIndex: 0,
    explanation: 'The guide says to treat it as a 4-way stop and yield to traffic on your right.',
    quote: QUOTE.brokenSignal,
    reference: REF.brokenSignals,
  },
  {
    prompt: 'Roundabout rule: when yielding on entry, the guide says to look ____ and yield to traffic already in the roundabout.',
    choices: ['Left', 'Right', 'Straight ahead only', 'Behind you'],
    answerIndex: 0,
    explanation: 'The guide instructs you to look left and yield to traffic already in the roundabout.',
    quote: QUOTE.roundaboutYield,
    reference: REF.roundabout,
  },
  {
    prompt: 'At a roundabout, once you see a gap in traffic you should:',
    choices: ['Enter the circle and proceed to your exit', 'Stop in the circle', 'Change lanes immediately', 'Back up and choose another route'],
    answerIndex: 0,
    explanation: 'The guide says to enter when there is a safe gap and proceed to your exit.',
    quote: QUOTE.roundaboutYield,
    reference: REF.roundabout,
  },
  {
    prompt: 'Roundabout lane choice signs show which lanes are used for:',
    choices: ['Right turns, straight through travel, and left turns', 'Stopping and parking', 'Buses only', 'U-turns only'],
    answerIndex: 0,
    explanation: 'The guide says the lane choice sign tells you which lane to use for your direction.',
    quote: QUOTE.roundaboutPickLane,
    reference: REF.roundabout,
  },
  {
    prompt: 'When approaching a roundabout, the guide says to:',
    choices: ['Slow down', 'Speed up to enter quickly', 'Stop before the yield line every time', 'Change lanes inside the roundabout'],
    answerIndex: 0,
    explanation: 'The guide explicitly says to slow down when approaching a roundabout.',
    quote: QUOTE.roundaboutSpeed,
    reference: REF.roundabout,
  },
  {
    prompt: 'Crosswalks provide a safe way for ____ to cross the road.',
    choices: ['Pedestrians and bicyclists', 'Only cars', 'Only buses', 'Only emergency vehicles'],
    answerIndex: 0,
    explanation: 'The guide describes crosswalks as providing a safe crossing for pedestrians and bicyclists.',
    quote: QUOTE.crosswalkYield,
    reference: REF.crosswalks,
  },
  {
    prompt: 'At an unmarked intersection crosswalk, you must:',
    choices: ['Yield to people in or about to enter the crosswalk', 'Proceed without yielding because it is unmarked', 'Honk to warn pedestrians', 'Stop only if a signal is present'],
    answerIndex: 0,
    explanation: 'The guide says every intersection is legally a crosswalk and you must yield to people in or about to enter.',
    quote: QUOTE.crosswalkNotMarked,
    reference: REF.crosswalks,
  },
  {
    prompt: 'A school zone can be marked with:',
    choices: ['Signs, pavement markings, and flashing lights', 'Only a painted curb', 'Only a stop sign', 'Only a traffic signal'],
    answerIndex: 0,
    explanation: 'The guide lists signs, pavement markings, and flashing lights as possible school-zone markings.',
    quote: QUOTE.schoolZoneDefinition,
    reference: REF.schoolZone,
  },
  {
    prompt: 'A work zone could involve:',
    choices: ['Lane closures, detours, and moving equipment', 'Only bike lanes', 'Only parked cars', 'Only toll booths'],
    answerIndex: 0,
    explanation: 'The guide lists lane closures, detours, and moving equipment as work zone possibilities.',
    quote: QUOTE.workZoneDefinition,
    reference: REF.workZone,
  },
  {
    prompt: 'Why does the guide say you should reduce speed in a work zone even if there are no workers?',
    choices: ['Narrower lanes and rough pavement can create a hazardous condition', 'Work zones always have lower speed limits everywhere', 'You must stop at every cone', 'Work zones are only for emergency vehicles'],
    answerIndex: 0,
    explanation: 'The guide cites hazards like narrow lanes and rough pavement.',
    quote: QUOTE.workZoneSlow,
    reference: REF.workZone,
  },
  {
    prompt: 'What is one thing you should never do with a seat belt?',
    choices: ['Put it behind your back or under your arm', 'Wear it across your chest', 'Adjust it for comfort', 'Buckle it before driving'],
    answerIndex: 0,
    explanation: 'The guide warns not to route a seat belt behind your back or under your arm.',
    quote: QUOTE.seatBeltFit,
    reference: REF.occupantProtection,
  },
  {
    prompt: 'Children under age 13 should never ride in the front seat because:',
    choices: ['An airbag deployment could seriously injure or kill them', 'Seat belts do not work for children', 'It is always illegal to ride in front', 'They must sit next to the driver'],
    answerIndex: 0,
    explanation: 'The guide ties this directly to airbag risks.',
    quote: QUOTE.airbags,
    reference: REF.occupantProtection,
  },

  // Additional image-based sign questions to keep sign coverage ~1/3
  {
    prompt: 'A school zone may be marked with signs, pavement markings, and what else?',
    choices: ['Flashing lights', 'Toll gates', 'Railroad arms', 'Drawbridges'],
    answerIndex: 0,
    explanation: 'The guide lists flashing lights as one way school zones can be marked.',
    quote: QUOTE.schoolZoneDefinition,
    reference: REF.schoolZone,
    image: MUTCD.schoolZone,
    imageAlt: 'MUTCD S1-1 school zone sign',
  },
  {
    prompt: 'Near a school, the guide reminds drivers that students may be present after hours. What should you do?',
    choices: ['Slow down and watch out', 'Assume the area is clear after school ends', 'Use high beams to see better', 'Pass other vehicles quickly'],
    answerIndex: 0,
    explanation: 'The guide explicitly says to slow down and watch out near schools.',
    quote: QUOTE.schoolZoneReminder,
    reference: REF.schoolZone,
    image: MUTCD.schoolZone,
    imageAlt: 'MUTCD S1-1 school zone sign',
  },
  {
    prompt: 'In a work zone, you should always reduce speed:',
    choices: ['Even if there are no workers', 'Only when you see workers', 'Only when traffic is heavy', 'Only during the day'],
    answerIndex: 0,
    explanation: 'The guide says to reduce speed in work zones even when workers are not present.',
    quote: QUOTE.workZoneSlow,
    reference: REF.workZone,
    image: MUTCD.roadWorkAhead,
    imageAlt: 'MUTCD CW20-1 road work ahead sign',
  },
  {
    prompt: 'Use extreme caution when driving through a work zone at night:',
    choices: ['Whether you see workers or not', 'Only if the road is wet', 'Only on rural roads', 'Only when you are tired'],
    answerIndex: 0,
    explanation: 'The guide calls for extreme caution at night in work zones.',
    quote: QUOTE.workZoneNight,
    reference: REF.workZone,
    image: MUTCD.roadWorkAhead,
    imageAlt: 'MUTCD CW20-1 road work ahead sign',
  },
  {
    prompt: 'According to the guide, these signs mark the entrance to what?',
    choices: ['A roundabout', 'A freeway', 'A tunnel', 'A ferry terminal'],
    answerIndex: 0,
    explanation: 'The guide says these signs mark roundabout entrances.',
    quote: QUOTE.roundaboutEntrance,
    reference: REF.commonSigns,
    image: MUTCD.roundabout,
    imageAlt: 'MUTCD W2-6 roundabout warning sign',
  },
  {
    prompt: 'Roundabouts can also have which additional signs (per the guide)?',
    choices: ['Yield, pedestrian warning, and directional arrow signs', 'Stop signs only', 'Speed limit signs only', 'Parking signs only'],
    answerIndex: 0,
    explanation: 'The guide lists other signs that may appear at roundabouts.',
    quote: QUOTE.roundaboutEntrance,
    reference: REF.commonSigns,
    image: MUTCD.roundabout,
    imageAlt: 'MUTCD W2-6 roundabout warning sign',
  },
  {
    prompt: 'This sign indicates that a speed change is:',
    choices: ['Recommended for a potential hazard or road condition', 'Required minimum speed', 'A toll price', 'A school zone boundary'],
    answerIndex: 0,
    explanation: 'The guide describes these as recommended speed changes for hazards (often curves/turns).',
    quote: QUOTE.advisorySpeed,
    reference: REF.commonSigns,
    image: MUTCD.advisorySpeed,
    imageAlt: 'MUTCD W13-1P advisory speed plaque',
  },
  {
    prompt: 'Besides signs, what else can tell you when it is safe to pass?',
    choices: ['Lane markings', 'Only the time of day', 'Only other drivers’ signals', 'Only your GPS'],
    answerIndex: 0,
    explanation: 'The guide notes that signs and lane markings both indicate when passing is safe.',
    quote: QUOTE.noPassing,
    reference: REF.commonSigns,
    image: MUTCD.doNotPass,
    imageAlt: 'MUTCD R4-1 do not pass sign',
  },
  {
    prompt: 'What should you never do on a one-way street?',
    choices: ['Drive the wrong way', 'Yield to pedestrians', 'Use a turn signal', 'Stop at a stop line'],
    answerIndex: 0,
    explanation: 'The guide warns never to drive the wrong way on a one-way street.',
    quote: QUOTE.oneWay,
    reference: REF.commonSigns,
    image: MUTCD.oneWayRight,
    imageAlt: 'MUTCD R6-1R one way (right) sign',
  },
  {
    prompt: 'A “Wrong Way” sign is meant to prevent what type of crash?',
    choices: ['Head-on collisions', 'Rear-end collisions', 'Sideswipes', 'Parking lot fender-benders'],
    answerIndex: 0,
    explanation: 'The guide says the sign is meant to prevent head-on collisions.',
    quote: QUOTE.wrongWay,
    reference: REF.commonSigns,
    image: MUTCD.wrongWay,
    imageAlt: 'MUTCD R5-1a wrong way sign',
  },
  {
    prompt: 'If in-pavement crosswalk lights are flashing, what must you do?',
    choices: ['Yield', 'Ignore them if no one is in the roadway', 'Speed up', 'Honk'],
    answerIndex: 0,
    explanation: 'The guide says you must yield when these crosswalk lights are flashing.',
    quote: QUOTE.crosswalkLights,
    reference: REF.crosswalks,
    image: MUTCD.pedestrian,
    imageAlt: 'MUTCD W11-2 pedestrian warning sign',
  },

  {
    prompt: 'Ramp meters work like regular traffic signals. When the signal turns green, you can:',
    choices: ['Continue along the on-ramp', 'Stop and wait for a police officer', 'Turn around', 'Merge immediately without checking'],
    answerIndex: 0,
    explanation: 'The guide says you may continue along the on-ramp on green.',
    quote: QUOTE.rampMeters,
    reference: REF.trafficSignals,
  },
  {
    prompt: 'A green arrow gives you:',
    choices: ['The right-of-way to travel in that direction', 'A requirement to stop', 'Permission to speed up past the limit', 'Permission to ignore pedestrians'],
    answerIndex: 0,
    explanation: 'The guide says a green arrow provides the right-of-way in the arrow’s direction.',
    quote: QUOTE.greenArrow,
    reference: REF.trafficSignals,
  },
  {
    prompt: 'A flashing red traffic light means you should:',
    choices: ['Come to a full stop and then go when it’s your turn', 'Slow down and proceed without stopping', 'Treat it like a green light', 'Stop only if cross traffic is heavy'],
    answerIndex: 0,
    explanation: 'The guide says flashing red works as a stop sign: stop fully, then go when it’s your turn.',
    quote: QUOTE.flashingRed,
    reference: REF.trafficSignals,
  },
  {
    prompt: 'Right turn on red is allowed only after you:',
    choices: ['Come to a complete stop', 'Roll through slowly', 'Honk twice', 'Wait for a green arrow'],
    answerIndex: 0,
    explanation: 'The guide requires a complete stop before turning right on red (when allowed and safe).',
    quote: QUOTE.rightOnRed,
    reference: REF.trafficSignals,
  },
  {
    prompt: 'A left turn on red is allowed (in the situation described by the guide) after a complete stop when turning onto a:',
    choices: ['One-way street', 'Two-way street', 'Freeway entrance ramp', 'School zone street'],
    answerIndex: 0,
    explanation: 'The guide allows left on red onto a one-way street when permitted and safe.',
    quote: QUOTE.leftOnRed,
    reference: REF.trafficSignals,
  },
  {
    prompt: 'The guide notes you might see signs that clarify when what speed limit applies in a school zone?',
    choices: ['20 mph', '15 mph', '25 mph', '30 mph'],
    answerIndex: 0,
    explanation: 'The guide says signs may clarify when the 20 mph school zone speed limit applies.',
    quote: QUOTE.schoolZoneSpeed,
    reference: REF.schoolZone,
  },
  {
    prompt: 'Fines in construction areas when workers are present are:',
    choices: ['Doubled', 'Reduced by half', 'Waived', 'Always the same as normal'],
    answerIndex: 0,
    explanation: 'The guide states fines double when workers are present.',
    quote: QUOTE.workZoneSigns,
    reference: REF.workZoneSigns,
  },
  {
    prompt: 'Where should a seat belt lie on your body (per the guide)?',
    choices: ['Across the middle of your chest', 'Behind your back', 'Under your arm', 'Across your stomach only'],
    answerIndex: 0,
    explanation: 'The guide says the belt should go across the middle of your chest.',
    quote: QUOTE.seatBeltFit,
    reference: REF.occupantProtection,
  },
  {
    prompt: 'When the traffic light is yellow, you are not allowed to:',
    choices: [
      'Accelerate beyond the posted speed limit to enter or clear the intersection',
      'Slow down and prepare to stop',
      'Continue through if you are already in the intersection',
      'Check for pedestrians',
    ],
    answerIndex: 0,
    explanation: 'The guide prohibits accelerating beyond the posted limit to “make” the yellow.',
    quote: QUOTE.noAccelerateOnYellow,
    reference: REF.trafficSignals,
  },
]

export const WA_QUESTIONS: Question[] = buildQuestions(WA_QUESTION_DRAFTS)

export const questionBank: QuestionBank = {
  WA: WA_QUESTIONS,
}
