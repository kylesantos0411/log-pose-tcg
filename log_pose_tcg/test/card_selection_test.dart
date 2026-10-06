import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:log_pose_tcg/features/cards/cards_screen.dart';
import 'package:log_pose_tcg/features/cards/data/card_model.dart';
import 'package:log_pose_tcg/features/cards/data/card_repository.dart';
import 'package:log_pose_tcg/features/collection/data/collection_repository.dart';

void main() {
  final sampleCards = [
    CardModel(
      id: 'c-001',
      canonicalId: 'OPT_OP01_OP01-001_BASE_JP',
      cardNumber: 'OP01-001',
      name: 'Roronoa Zoro',
      rarity: 'L',
      color: 'Red',
      type: 'Leader',
      pricePhp: 105,
      priceStatus: 'AVAILABLE',
      imageUrl: null,
    ),
    CardModel(
      id: 'c-002',
      canonicalId: 'OPT_OP01_OP01-002_BASE_JP',
      cardNumber: 'OP01-002',
      name: 'Trafalgar Law',
      rarity: 'L',
      color: 'Green',
      type: 'Leader',
      pricePhp: 250,
      priceStatus: 'AVAILABLE',
      imageUrl: null,
    ),
    CardModel(
      id: 'c-003',
      canonicalId: 'OPT_OP01_OP01-003_BASE_JP',
      cardNumber: 'OP01-003',
      name: 'Monkey.D.Luffy',
      rarity: 'SR',
      color: 'Red',
      type: 'Character',
      pricePhp: 80,
      priceStatus: 'AVAILABLE',
      imageUrl: null,
    ),
  ];

  Widget createTestWidget({required WidgetRefCallback onRef}) {
    return ProviderScope(
      overrides: [
        cardsProvider.overrideWith((ref) => Future.value(sampleCards)),
      ],
      child: MaterialApp(
        home: Consumer(
          builder: (context, ref, child) {
            onRef(ref);
            return const CardsScreen();
          },
        ),
      ),
    );
  }

  Future<void> pumpScreen(WidgetTester tester) async {
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 300));
  }

  testWidgets('TEST 1 & 2: Select one and multiple cards updates selection state',
      (WidgetTester tester) async {
    late WidgetRef capturedRef;
    await tester.pumpWidget(createTestWidget(onRef: (ref) => capturedRef = ref));
    await pumpScreen(tester);

    // Verify initial state: 0 cards selected
    expect(capturedRef.read(selectedCardIdsProvider), isEmpty);
    expect(find.text('Add to Collection'), findsNothing);

    // Select first card
    await tester.tap(find.byKey(const ValueKey('card_select_c-001')));
    await pumpScreen(tester);

    expect(capturedRef.read(selectedCardIdsProvider), contains('c-001'));
    expect(capturedRef.read(selectedCardIdsProvider).length, 1);
    expect(find.text('1 card selected'), findsOneWidget);
    expect(find.text('Add to Collection'), findsOneWidget);

    // Select second card
    await tester.tap(find.byKey(const ValueKey('card_select_c-002')));
    await pumpScreen(tester);

    expect(capturedRef.read(selectedCardIdsProvider), contains('c-001'));
    expect(capturedRef.read(selectedCardIdsProvider), contains('c-002'));
    expect(capturedRef.read(selectedCardIdsProvider).length, 2);
    expect(find.text('2 cards selected'), findsOneWidget);
  });

  testWidgets('TEST 3 & 4: Deselect card and deselect all restores normal state',
      (WidgetTester tester) async {
    late WidgetRef capturedRef;
    await tester.pumpWidget(createTestWidget(onRef: (ref) => capturedRef = ref));
    await pumpScreen(tester);

    // Select card 1 and card 2
    await tester.tap(find.byKey(const ValueKey('card_select_c-001')));
    await pumpScreen(tester);
    await tester.tap(find.byKey(const ValueKey('card_select_c-002')));
    await pumpScreen(tester);
    expect(capturedRef.read(selectedCardIdsProvider).length, 2);

    // Deselect card 1
    await tester.tap(find.byKey(const ValueKey('card_select_c-001')));
    await pumpScreen(tester);
    expect(capturedRef.read(selectedCardIdsProvider).length, 1);
    expect(capturedRef.read(selectedCardIdsProvider), contains('c-002'));

    // Deselect card 2 (final card)
    await tester.tap(find.byKey(const ValueKey('card_select_c-002')));
    await pumpScreen(tester);
    expect(capturedRef.read(selectedCardIdsProvider), isEmpty);
    expect(find.text('Add to Collection'), findsNothing);
  });

  testWidgets('TEST 5 & 6: Add to Collection action adds cards, shows feedback, clears selection',
      (WidgetTester tester) async {
    late WidgetRef capturedRef;
    await tester.pumpWidget(createTestWidget(onRef: (ref) => capturedRef = ref));
    await pumpScreen(tester);

    // Select cards c-001 and c-002
    await tester.tap(find.byKey(const ValueKey('card_select_c-001')));
    await pumpScreen(tester);
    await tester.tap(find.byKey(const ValueKey('card_select_c-002')));
    await pumpScreen(tester);

    // Tap Add to Collection button
    final addBtn = find.text('Add to Collection');
    expect(addBtn, findsOneWidget);
    await tester.tap(addBtn);
    await pumpScreen(tester);

    // Verify selection is cleared
    expect(capturedRef.read(selectedCardIdsProvider), isEmpty);

    // Verify confirmation feedback
    expect(find.text('2 cards added to Collection'), findsOneWidget);

    // Verify cards are added to CollectionRepository
    final colRepo = capturedRef.read(collectionRepositoryProvider);
    final items = await colRepo.getCollection();
    expect(items.length, 2);
    expect(items.any((i) => i.cardId == 'c-001'), isTrue);
    expect(items.any((i) => i.cardId == 'c-002'), isTrue);
  });

  testWidgets('TEST 7: Adding existing card increments quantity instead of duplicating',
      (WidgetTester tester) async {
    final colRepo = CollectionRepository(null, CardRepository(null));
    await colRepo.addCards([sampleCards[0]]);
    var items = await colRepo.getCollection();
    expect(items.length, 1);
    expect(items.first.quantity, 1);

    // Add same card again
    await colRepo.addCards([sampleCards[0]]);
    items = await colRepo.getCollection();
    expect(items.length, 1);
    expect(items.first.quantity, 2);
  });

  testWidgets('TEST 8: Tapping card body opens card details modal',
      (WidgetTester tester) async {
    await tester.pumpWidget(createTestWidget(onRef: (_) {}));
    await pumpScreen(tester);

    // Tap InkWell for the first card (card body)
    await tester.tap(find.byKey(const ValueKey('card_item_c-001')));
    await pumpScreen(tester);

    // Details modal should open with card name and CLOSE button
    expect(find.text('CLOSE'), findsOneWidget);
    expect(find.text('YUYUTEI MARKET PRICE'), findsOneWidget);
  });
}

typedef WidgetRefCallback = void Function(WidgetRef ref);
