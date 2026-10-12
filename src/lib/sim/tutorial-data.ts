/**
 * tutorial-data.ts
 * Step-by-step interactive tutorial definitions matching OPlayTCG and official Bandai One Piece Card Game rules.
 */

export interface TutorialStep {
  id: number;
  title: string;
  bannerPrompt: string; // The floating pill banner (e.g. "✦ Attach a DON!!")
  subtitle: string;
  description: string;
  targetHighlight: 'leader' | 'characters' | 'hand' | 'costArea' | 'donDeck' | 'life' | 'opponent' | 'endTurn' | 'none';
  instruction: string;
  recommendedAction?: string;
}

export const OPTCG_TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 1,
    title: 'Welcome to the One Piece Card Game!',
    bannerPrompt: '✦ Welcome to the Match',
    subtitle: 'Tabletop Overview & Victory Condition',
    description:
      'You are piloting the Red Straw Hat Crew led by Monkey D. Luffy against Emperor Kaido! Each player starts with their Leader on field, a 50-card Main Deck, 10 DON!! cards, and Life cards determined by their Leader. Your objective is to reduce the opponent Leader\'s Life to 0 and land one final direct attack to win the game!',
    targetHighlight: 'leader',
    instruction: 'Familiarize yourself with your Leader card and the battlefield, then tap Next to continue.',
    recommendedAction: 'Inspect Luffy Leader (5000 Power, 5 Life)',
  },
  {
    id: 2,
    title: 'The Phases of a Turn',
    bannerPrompt: '✦ Turn Phases: Refresh → Draw → DON!!',
    subtitle: 'Refresh, Draw & DON!! Phase',
    description:
      'At the beginning of your turn, three automatic phases occur:\n1. Refresh Phase: All rested cards stand up (Active), and attached DON!! return to your Cost Area.\n2. Draw Phase: Draw 1 card from your Deck.\n3. DON!! Phase: Place 2 DON!! cards into your Cost Area as Active (Player going 1st receives only 1 on Turn 1).',
    targetHighlight: 'costArea',
    instruction: 'Observe your Active DON!! cards in the Cost Area ready to pay costs or power up attacks.',
    recommendedAction: 'Check your Active DON!! in the Cost Area',
  },
  {
    id: 3,
    title: 'Playing a Character from Hand',
    bannerPrompt: '✦ Play a Character from Hand',
    subtitle: 'Paying DON!! Costs to Summon',
    description:
      'Each Character card in your hand displays its Cost inside the circle on the top-left corner. To summon a Character to your frontline, tap the card in your hand and pay its cost by resting that many Active DON!! cards in your Cost Area.',
    targetHighlight: 'hand',
    instruction: 'Tap Tony Tony.Chopper (Cost 1) or Roronoa Zoro (Cost 3) in your hand, then tap "Play Card".',
    recommendedAction: 'Tap a card in your hand to play it to the field',
  },
  {
    id: 4,
    title: 'Powering Up with DON!! (+1000 Power)',
    bannerPrompt: '✦ Attach a DON!!',
    subtitle: 'Equipping Active DON!! to Characters or Leader',
    description:
      'During your Main Phase, you can take Active DON!! from your Cost Area and attach them to your Leader or any Character on your field! Each attached DON!! gives that card +1000 Power for the duration of your turn.',
    targetHighlight: 'leader',
    instruction: 'Tap on your Leader (Luffy) or an active Character on field, and tap "Attach DON (+1000)".',
    recommendedAction: 'Tap Leader or Character → Attach DON',
  },
  {
    id: 5,
    title: 'Declaring an Attack (Battle Step)',
    bannerPrompt: '✦ Attack Opponent\'s Leader',
    subtitle: 'Combat Declaration & Power Comparison',
    description:
      'You can declare an attack using your Leader or an active Character (that was not played this turn, unless they have [Rush]). When attacking, your card rests (turns horizontal). You can target the Opponent\'s Leader OR any of their Rested Characters. Your Power must equal or exceed their Power to deal damage!',
    targetHighlight: 'opponent',
    instruction: 'Tap your Leader or an active Character on field, then tap "Attack Leader" to launch an assault on Kaido!',
    recommendedAction: 'Tap an active card → Attack Leader',
  },
  {
    id: 6,
    title: 'Defending: Blockers & Counters',
    bannerPrompt: '✦ Defense: Blockers & Counters',
    subtitle: 'Protecting Yourself on the Opponent\'s Turn',
    description:
      'When your opponent attacks you:\n1. [Blocker]: If you have an active Character with [Blocker] (like Tony Tony.Chopper or Queen), you can rest them to intercept the attack and protect your Leader!\n2. [Counter]: You can discard cards from your hand with +1000 or +2000 Counter values to temporarily boost your defending card\'s Power to survive!',
    targetHighlight: 'characters',
    instruction: 'Keep a Blocker on field or hold high-counter cards in hand to defend during enemy attacks.',
    recommendedAction: 'Review Blocker & Counter values on your cards',
  },
  {
    id: 7,
    title: 'Life Stack & [Trigger] Effects',
    bannerPrompt: '✦ Life Stack & Triggers',
    subtitle: 'Taking Damage & Activating Triggers',
    description:
      'When your Leader takes damage, you take 1 card from the top of your Life stack into your hand. If that card features a yellow [Trigger] badge at the bottom, you can reveal it and activate its powerful effect immediately for FREE (such as K.O. enemy characters or drawing cards)!',
    targetHighlight: 'life',
    instruction: 'Every point of Life lost gives you card advantage and potential Trigger swings!',
    recommendedAction: 'Check your Life stack on the left of your mat',
  },
  {
    id: 8,
    title: 'Ending Your Turn & Claiming Victory',
    bannerPrompt: '✦ End Your Turn ▷',
    subtitle: 'Passing the Turn & Win Conditions',
    description:
      'When you are done with your Main Phase actions, tap the bright amber "End turn ▷" button. All attached DON!! return to your Cost Area, temporary buffs expire, and the opponent takes their turn. When your opponent has 0 Life, landing one final attack against their Leader wins you the match!',
    targetHighlight: 'endTurn',
    instruction: 'Tap "End turn ▷" when ready to pass the turn to Kaido!',
    recommendedAction: 'Tap "End turn ▷" on bottom-right',
  },
];
