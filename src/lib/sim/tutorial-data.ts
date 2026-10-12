/**
 * tutorial-data.ts
 * 16-Chapter Step-by-Step Interactive Tutorial matching OPlayTCG (https://oplaytcg.com/play?tutorial=1)
 * and official Bandai One Piece Card Game rules.
 */

export interface CardInspectionCallout {
  label: string; // e.g. "POWER 5000", "LIFE 5", "COLOR", "COST 3", "COUNTER +1000"
  position: 'top-left' | 'top-right' | 'left' | 'bottom-left' | 'bottom-right';
  description?: string;
  dotColor?: string;
}

export interface TutorialStep {
  id: number;
  chapter: number;
  totalChapters?: number;
  title: string;
  bannerPrompt: string; // The floating pill prompt (e.g. "✦ Attach a DON!!")
  subtitle: string;
  body: string;
  targetHighlight: 'leader' | 'characters' | 'hand' | 'costArea' | 'donDeck' | 'life' | 'opponent' | 'endTurn' | 'none';
  instruction?: string;
  isActionStep?: boolean;
  inspectCard?: {
    cardId: string;
    name: string;
    imageUrl: string;
    category: 'Leader' | 'Character' | 'Stage' | 'Event';
    callouts: CardInspectionCallout[];
  };
}

export const OPTCG_TUTORIAL_STEPS: TutorialStep[] = [
  // Chapter 1: The Leader Overview (Screenshot 1)
  {
    id: 1,
    chapter: 1,
    totalChapters: 16,
    title: 'THE LEADER',
    bannerPrompt: '✦ Welcome: The Leader',
    subtitle: 'Battlefield Overview & Heart of the Deck',
    body:
      'This is your Leader, and every deck has exactly one. It stays face up the whole game and is the heart of your deck: its color decides what cards you can run, and its power and Life are yours.',
    targetHighlight: 'leader',
    instruction: 'Review your Leader in the center of the playmat. Tap Next to inspect its details.',
  },

  // Chapter 2: The Leader Anatomy Zoom (Screenshot 2)
  {
    id: 2,
    chapter: 2,
    totalChapters: 16,
    title: 'THE LEADER',
    bannerPrompt: '✦ Leader Anatomy',
    subtitle: 'Power, Life, and Color',
    body:
      'This is your Leader. Every deck has one, and it stays face up all game. It has Power (for its own attacks), Life (how much damage you can take), and a color.',
    targetHighlight: 'leader',
    instruction: 'Observe the Leader card anatomy: Power (top-right), Life (bottom-right), and Color (bottom-left).',
    inspectCard: {
      cardId: 'ST01-001',
      name: 'Monkey.D.Luffy',
      imageUrl: 'https://en.onepiece-cardgame.com/images/cardlist/card/ST01-001.png?260929',
      category: 'Leader',
      callouts: [
        { label: 'POWER 5000', position: 'top-right', description: 'Attack & defense power in combat' },
        { label: 'LIFE 5', position: 'bottom-right', description: 'Starting life cards placed on battlefield' },
        { label: 'COLOR', position: 'bottom-left', dotColor: '#ef4444', description: 'Dictates cards allowed in deck' },
      ],
    },
  },

  // Chapter 3: Characters Anatomy Zoom (Screenshot 3)
  {
    id: 3,
    chapter: 3,
    totalChapters: 16,
    title: 'CHARACTERS',
    bannerPrompt: '✦ Character Anatomy',
    subtitle: 'Cost, Power, and Counter',
    body:
      'Characters are the cards you play to the field to fight. They show a Cost (top left, the DON!! to play them), Power (top right, for battles), and a Counter value used to defend. Do not worry about that last one yet: chapter 9 is all about it.',
    targetHighlight: 'hand',
    instruction: 'Check the card anatomy: Cost (top-left), Power (top-right), and Counter (left border).',
    inspectCard: {
      cardId: 'ST01-008',
      name: 'Nico Robin',
      imageUrl: 'https://en.onepiece-cardgame.com/images/cardlist/card/ST01-008.png?260929',
      category: 'Character',
      callouts: [
        { label: 'COST 3', position: 'top-left', description: 'Active DON!! required to play from hand' },
        { label: 'POWER 5000', position: 'top-right', description: 'Battle combat strength' },
        { label: 'COUNTER +1000', position: 'left', description: 'Discard from hand to boost defender in battle' },
      ],
    },
  },

  // Chapter 4: DON!! Resources & Cost Area
  {
    id: 4,
    chapter: 4,
    totalChapters: 16,
    title: 'DON!! RESOURCES',
    bannerPrompt: '✦ DON!! Deck & Cost Area',
    subtitle: 'Your Core Energy',
    body:
      'On the left is your DON!! deck (10 cards total). In the center is your Cost Area where DON!! cards land.\n\nDON!! cards are your only resource: you turn them sideways (rested) to pay costs to summon characters, and you can attach active DON!! to your Leader or Characters to power them up!',
    targetHighlight: 'costArea',
    instruction: 'Check your Cost Area with 5 active DON!! cards ready to use.',
  },

  // Chapter 5: Attaching DON!! (Screenshot 5 Action Step)
  {
    id: 5,
    chapter: 5,
    totalChapters: 16,
    title: 'ATTACHING DON!!',
    bannerPrompt: '✦ Attach a DON!!',
    subtitle: 'Powering Up for Battle',
    body:
      'Now you try! Tap your Leader (Monkey.D.Luffy) and tap "Attach DON (+1000)".\n\nYour Leader gains +1,000 Power for each attached DON!! during your turn. Attach 2 DON!! to power Luffy up from 5,000 to 7,000 Power!',
    targetHighlight: 'leader',
    isActionStep: true,
    instruction: 'Tap Luffy → Tap "Attach DON (+1000)" to increase his battle power to 7,000.',
  },

  // Chapter 6: Playing a Character
  {
    id: 6,
    chapter: 6,
    totalChapters: 16,
    title: 'PLAYING A CHARACTER',
    bannerPrompt: '✦ Play a Character',
    subtitle: 'Paying DON!! Costs to Summon',
    body:
      'To play a Character from your hand, pay its Cost with active DON!! in your Cost Area.\n\nTry tapping Tony Tony.Chopper (Cost 1) or Roronoa Zoro (Cost 3) in your hand, and tap "Play Card". The needed DON!! will turn sideways (rested) in your Cost Area.',
    targetHighlight: 'hand',
    isActionStep: true,
    instruction: 'Tap a Character in your hand → Tap "Play Card" to summon it to your frontline.',
  },

  // Chapter 7: Declaring an Attack
  {
    id: 7,
    chapter: 7,
    totalChapters: 16,
    title: 'DECLARING AN ATTACK',
    bannerPrompt: '✦ Attack Opponent Leader',
    subtitle: 'Combat Declaration & Rest Rules',
    body:
      'You can attack with your active Leader or active Characters (characters cannot attack the turn they are played, unless they have [Rush]).\n\nWhen attacking, your card turns sideways (RESTED). You can target the opponent\'s Leader or any of their RESTED characters.',
    targetHighlight: 'opponent',
    isActionStep: true,
    instruction: 'Tap your powered-up Leader Luffy → Tap "Attack Opponent Leader" to strike Kaido!',
  },

  // Chapter 8: Battle Resolution
  {
    id: 8,
    chapter: 8,
    totalChapters: 16,
    title: 'BATTLE RESOLUTION',
    bannerPrompt: '✦ Power Comparison',
    subtitle: 'Equal or Greater Hits!',
    body:
      'In One Piece TCG, combat is decided by comparing Total Power:\n\n• If Attacker Power >= Defender Power: DIRECT HIT! If targeting Leader, they lose 1 Life. If targeting a Character, they are K.O.\'d to the Trash!\n• If Attacker Power < Defender Power: Attack fails. The attacker still remains rested.',
    targetHighlight: 'opponent',
    instruction: 'Review the combat log to verify power calculation and damage dealt.',
  },

  // Chapter 9: Defending with Counters
  {
    id: 9,
    chapter: 9,
    totalChapters: 16,
    title: 'DEFENDING: COUNTERS',
    bannerPrompt: '✦ Defense: Counters',
    subtitle: 'Discarding Cards from Hand to Boost Power',
    body:
      'When your opponent attacks your Leader or Character, you enter the Counter Step!\n\nYou can discard cards from your hand with a printed Counter value (+1000 or +2000 on the left edge) to temporarily boost your defender\'s power for that battle and prevent damage.',
    targetHighlight: 'hand',
    instruction: 'Keep counter cards in hand to survive powerful incoming attacks.',
  },

  // Chapter 10: Defending with Blockers
  {
    id: 10,
    chapter: 10,
    totalChapters: 16,
    title: 'DEFENDING: BLOCKERS',
    bannerPrompt: '✦ Defense: [Blocker]',
    subtitle: 'Intercepting Enemy Attacks',
    body:
      'Characters with the [Blocker] trait (like Tony Tony.Chopper or Queen) can protect your Leader!\n\nWhen an opponent declares an attack, you can rest your active [Blocker] character to redirect the attack to that character instead of your Leader.',
    targetHighlight: 'characters',
    instruction: 'Maintain [Blocker] characters on field to protect your Leader\'s life total.',
  },

  // Chapter 11: Life Damage Stack
  {
    id: 11,
    chapter: 11,
    totalChapters: 16,
    title: 'LIFE STACK & DAMAGE',
    bannerPrompt: '✦ Life Stack Cards',
    subtitle: 'Taking Hits to Fuel Your Hand',
    body:
      'When your Leader takes damage, you take the top card of your Life stack into your hand.\n\nThis means taking damage actually gives you more cards to defend and fight back with on subsequent turns!',
    targetHighlight: 'life',
    instruction: 'Check your Life stack on the left side of your playmat.',
  },

  // Chapter 12: [Trigger] Effects
  {
    id: 12,
    chapter: 12,
    totalChapters: 16,
    title: '[TRIGGER] EFFECTS',
    bannerPrompt: '✦ Free [Trigger] Abilities',
    subtitle: 'Instant Reversals from Life',
    body:
      'Some cards have a yellow [Trigger] box at the bottom. When you take damage and add that card from Life to your hand, you can reveal it to activate its [Trigger] effect immediately for FREE (such as K.O.\'ing an enemy character or drawing extra cards)!',
    targetHighlight: 'life',
    instruction: 'Check trigger abilities on cards in your deck.',
  },

  // Chapter 13: Stage Cards
  {
    id: 13,
    chapter: 13,
    totalChapters: 16,
    title: 'STAGE CARDS',
    bannerPrompt: '✦ Continuous Field Stages',
    subtitle: 'Long-Term Strategic Support',
    body:
      'Stage cards (like Thousand Sunny) stay on the field in your Stage slot.\n\nThey provide persistent buffs and activate abilities throughout the game to give your crew ongoing tactical advantages.',
    targetHighlight: 'leader',
    instruction: 'Locate the STAGE slot next to your Leader and Main Deck.',
  },

  // Chapter 14: Event Cards
  {
    id: 14,
    chapter: 14,
    totalChapters: 16,
    title: 'EVENT CARDS',
    bannerPrompt: '✦ Tactical Event Spells',
    subtitle: 'Instant Actions & Counter Events',
    body:
      'Event cards are one-time tactical commands:\n\n• Main Events: Played on your turn to draw cards, K.O. enemies, or boost attacks.\n• Counter Events: Played during your opponent\'s attack to grant massive defensive buffs (e.g. Guard Point gives +3000 Power)!',
    targetHighlight: 'hand',
    instruction: 'Event cards go straight to the Trash after their effect resolves.',
  },

  // Chapter 15: The 5 Game Phases
  {
    id: 15,
    chapter: 15,
    totalChapters: 16,
    title: 'THE 5 GAME PHASES',
    bannerPrompt: '✦ Turn Flow: 5 Phases',
    subtitle: 'Refresh, Draw, DON!!, Main, and End',
    body:
      'Each turn consists of 5 official phases in sequence:\n\n1. Refresh: Un-rest all cards & return attached DON!! to Cost Area\n2. Draw: Draw 1 card from deck\n3. DON!! Phase: Place 2 active DON!! in Cost Area\n4. Main Phase: Play cards, attach DON!!, and attack\n5. End Phase: Pass turn to opponent',
    targetHighlight: 'endTurn',
    instruction: 'Tap "End turn ▷" when you are finished with your Main Phase.',
  },

  // Chapter 16: Victory & Final Blow
  {
    id: 16,
    chapter: 16,
    totalChapters: 16,
    title: 'VICTORY & FINAL BLOW',
    bannerPrompt: '✦ Winning the Match',
    subtitle: 'Landing the Fatal Attack',
    body:
      'To win the match:\n\n1. Reduce your opponent\'s Life stack to 0 cards.\n2. Land ONE MORE successful attack against their Leader when they have 0 Life to deliver the Final Blow!\n\nYou also win automatically if the opponent\'s deck runs out of cards.\n\nYou are now ready for the high seas! Enjoy the game!',
    targetHighlight: 'opponent',
    instruction: 'Tap Exit or Next to complete the tutorial and continue playing freely.',
  },
];
