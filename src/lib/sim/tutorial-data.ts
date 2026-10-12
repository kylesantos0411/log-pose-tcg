/**
 * tutorial-data.ts
 * Step-by-step interactive tutorial matching OPlayTCG and official Bandai One Piece Card Game rules.
 */

export interface TutorialStep {
  id: number;
  chapter: number;
  title: string;
  bannerPrompt: string; // The floating pill prompt (e.g. "✦ Attach a DON!!")
  subtitle: string;
  body: string;
  targetHighlight: 'leader' | 'characters' | 'hand' | 'costArea' | 'donDeck' | 'life' | 'opponent' | 'endTurn' | 'none';
  instruction: string;
}

export const OPTCG_TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 1,
    chapter: 1,
    title: 'Basics: The Table',
    bannerPrompt: '✦ Welcome to the Match',
    subtitle: 'Battlefield Overview & Objective',
    body:
      'Welcome! Your goal in the One Piece Card Game is to reduce your opponent\'s Life to zero and land one final battle against their Leader to win the match. You also win if their deck runs out of cards.\n\nNotice the two playmats: You are at the bottom (Straw Hat Crew led by Monkey D. Luffy) and your opponent is at the top (Animal Kingdom Pirates led by Kaido).',
    targetHighlight: 'leader',
    instruction: 'Review your Leader in the center and the table layout. Tap Next to continue.',
  },
  {
    id: 2,
    chapter: 1,
    title: 'DON!! Deck & Cost Area',
    bannerPrompt: '✦ DON!! Resources',
    subtitle: 'Your Main Resource',
    body:
      'On the left is your DON!! deck (10 cards). In the middle is your Cost Area, where DON!! land. At the start of every turn, you place 2 DON!! cards into your Cost Area as Active (whoever goes first places 1 on Turn 1).\n\nDON!! is your only resource: you turn them sideways (rested) to pay costs, and you can attach them to your Leader or Characters to make them stronger!',
    targetHighlight: 'costArea',
    instruction: 'Check your Cost Area with 5 active DON!! cards ready to use.',
  },
  {
    id: 3,
    chapter: 2,
    title: 'Your First Action',
    bannerPrompt: '✦ Attach a DON!!',
    subtitle: 'Powering Up for Battle',
    body:
      'Now you try! Tap your Leader (Monkey D. Luffy) and select "Attach DON (+1000)".\n\nYour Leader gains +1000 power for each attached DON!! during your turn. This is how you spend your active DON!! to prepare for combat!',
    targetHighlight: 'leader',
    instruction: 'Tap on Luffy → Tap "Attach DON (+1000)" to increase his power to 6000.',
  },
  {
    id: 4,
    chapter: 3,
    title: 'Playing a Character',
    bannerPrompt: '✦ Play a Character',
    subtitle: 'Paying DON!! Costs to Summon',
    body:
      'To play a Character from your hand, you pay its Cost with DON!!: the cost is the number printed in the top-left circle of the card. When paid, that many active DON!! turn sideways (rested) in your Cost Area.\n\nTry tapping Tony Tony.Chopper (Cost 1, Blocker) or Roronoa Zoro (Cost 3) in your hand, and select "Play Card".',
    targetHighlight: 'hand',
    instruction: 'Tap a card in your hand → Tap "Play Card" to summon it to your frontline.',
  },
  {
    id: 5,
    chapter: 4,
    title: 'Declaring an Attack',
    bannerPrompt: '✦ Attack Opponent\'s Leader',
    subtitle: 'Combat Declaration & Power Rules',
    body:
      'You can attack using an active Leader or active Character (characters cannot attack the turn they are played, unless they have [Rush]).\n\nWhen attacking, your card turns sideways (rested). You can target the opponent\'s Leader or any of their rested Characters. If the attacker\'s power equals or exceeds the defender\'s power, the attack hits!',
    targetHighlight: 'opponent',
    instruction: 'Tap your Leader or active character → Tap "Attack Leader" to strike Kaido!',
  },
  {
    id: 6,
    chapter: 5,
    title: 'Defending: Blockers',
    bannerPrompt: '✦ Defense: [Blocker]',
    subtitle: 'Intercepting Enemy Attacks',
    body:
      'When your opponent declares an attack, you enter the Blocker Step.\n\nIf you have an active character with [Blocker] (such as Tony Tony.Chopper on your side, or Queen on the opponent\'s side), you can rest that character to make it the new target of the attack, protecting your Leader from taking damage!',
    targetHighlight: 'characters',
    instruction: 'Keep [Blocker] characters on field to safeguard your life total.',
  },
  {
    id: 7,
    chapter: 6,
    title: 'Defending: Counters',
    bannerPrompt: '✦ Defense: [Counter]',
    subtitle: 'Counter Step & Hand Discards',
    body:
      'After the Blocker step comes the Counter Step! You can discard cards from your hand with a printed Counter value (like +1000 or +2000 on the left edge of character cards) to temporarily increase your defender\'s power to survive the attack!\n\nYou can also play Counter Event cards like Guard Point (+3000) by paying their active DON!! cost.',
    targetHighlight: 'hand',
    instruction: 'Hold counter cards in hand to defend during opponent turns.',
  },
  {
    id: 8,
    chapter: 7,
    title: 'Life Damage & [Trigger]',
    bannerPrompt: '✦ Life Stack & [Trigger]',
    subtitle: 'Taking Hits & Free Effects',
    body:
      'When your Leader takes damage, you take the top card from your Life stack into your hand.\n\nIf that card has a yellow [Trigger] badge at the bottom, you can reveal it and activate its effect immediately for FREE (such as K.O.\'ing an opponent\'s character or playing a character to the field)!',
    targetHighlight: 'life',
    instruction: 'Check your Life stack on the left of your mat.',
  },
  {
    id: 9,
    chapter: 8,
    title: 'Keywords & Victory',
    bannerPrompt: '✦ End Turn & Victory',
    subtitle: 'Rush, Double Attack, and Final Blow',
    body:
      'Key traits in OPTCG:\n• [Rush]: Can attack the turn it is played.\n• [Double Attack]: Deals 2 damage to Leader instead of 1.\n• [Banish]: Damaged Life cards go straight to Trash with NO trigger.\n\nWhen the opponent\'s Life reaches 0, land one final successful attack against their Leader to win the match! Tap "End turn ▷" when ready.',
    targetHighlight: 'endTurn',
    instruction: 'Tap the amber "End turn ▷" button to pass turn to opponent.',
  },
];
