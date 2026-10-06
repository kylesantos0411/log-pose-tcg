import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme.dart';
import '../../shared/custom_search_bar.dart';
import '../../shared/card_image.dart';
import '../collection/data/collection_repository.dart';
import 'filter_bottom_sheet.dart';
import 'data/card_repository.dart';
import 'data/card_model.dart';

// Provider for tracking selected card IDs for quick multi-select
final selectedCardIdsProvider = StateProvider<Set<String>>((ref) => <String>{});

class CardsScreen extends ConsumerWidget {
  const CardsScreen({super.key});

  void _showCardDetailsModal(BuildContext context, CardModel card) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) {
        return Container(
          height: MediaQuery.of(context).size.height * 0.85,
          padding: const EdgeInsets.all(20.0),
          decoration: const BoxDecoration(
            color: AppTheme.charcoal,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  margin: const EdgeInsets.only(bottom: 16),
                  decoration: BoxDecoration(
                    color: AppTheme.dividerColor,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              Expanded(
                child: SingleChildScrollView(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Center(
                        child: SizedBox(
                          height: 260,
                          child: CardImage(
                            imageUrl: card.imageUrl ?? 'https://via.placeholder.com/200x280.png?text=No+Image',
                            borderRadius: 12,
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  card.name,
                                  style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
                                ),
                                if (card.nameJa != null) ...[
                                  const SizedBox(height: 2),
                                  Text(
                                    card.nameJa!,
                                    style: const TextStyle(color: AppTheme.textMuted, fontSize: 13),
                                  ),
                                ],
                              ],
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: AppTheme.accentRed.withValues(alpha: 0.15),
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: AppTheme.accentRed),
                            ),
                            child: Text(
                              card.rarity ?? 'C',
                              style: const TextStyle(color: AppTheme.accentRed, fontWeight: FontWeight.bold),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      // Market Pricing Box
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: AppTheme.primaryBlack,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: AppTheme.dividerColor),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text('YUYUTEI MARKET PRICE', style: TextStyle(color: AppTheme.textMuted, fontSize: 11, letterSpacing: 1.1)),
                                const SizedBox(height: 4),
                                Text(
                                  card.pricePhp != null ? '₱ ${card.pricePhp!.toStringAsFixed(0)}' : 'Unavailable',
                                  style: TextStyle(
                                    fontSize: 20,
                                    fontWeight: FontWeight.bold,
                                    color: card.pricePhp != null ? AppTheme.mutedGold : AppTheme.textMuted,
                                  ),
                                ),
                              ],
                            ),
                            if (card.priceJpy != null)
                              Text(
                                '¥ ${card.priceJpy!.toStringAsFixed(0)} JPY',
                                style: const TextStyle(color: AppTheme.textMuted, fontSize: 13),
                              ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),
                      // Card Stats Details
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: [
                          if (card.setCode != null)
                            _buildDetailPill('Set', '${card.setCode!}${card.setName != null ? ' (${card.setName!})' : ''}'),
                          _buildDetailPill('Number', card.cardNumber),
                          _buildDetailPill('Type', card.type ?? '-'),
                          _buildDetailPill('Color', card.color ?? '-'),
                          if (card.cost != null) _buildDetailPill('Cost', '${card.cost}'),
                          if (card.power != null) _buildDetailPill('Power', '${card.power}'),
                          if (card.counter != null) _buildDetailPill('Counter', '+${card.counter}'),
                          if (card.attribute != null) _buildDetailPill('Attribute', card.attribute!),
                          _buildDetailPill('Variant', card.variantType),
                        ],
                      ),
                      if (card.effect != null && card.effect!.isNotEmpty) ...[
                        const SizedBox(height: 16),
                        const Text('Card Effect', style: TextStyle(color: AppTheme.textMuted, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 6),
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: AppTheme.primaryBlack,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(card.effect!, style: const TextStyle(fontSize: 13, height: 1.4)),
                        ),
                      ],
                      if (card.triggerEffect != null && card.triggerEffect!.isNotEmpty) ...[
                        const SizedBox(height: 12),
                        const Text('Trigger Effect', style: TextStyle(color: AppTheme.textMuted, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 6),
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: AppTheme.primaryBlack,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(card.triggerEffect!, style: const TextStyle(fontSize: 13, height: 1.4, color: AppTheme.mutedGold)),
                        ),
                      ],
                      const SizedBox(height: 16),
                      Text(
                        'Canonical ID: ${card.canonicalId}',
                        style: const TextStyle(color: AppTheme.textMuted, fontSize: 10),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => Navigator.pop(context),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.accentRed,
                    foregroundColor: AppTheme.textWhite,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: const Text('CLOSE', style: TextStyle(fontWeight: FontWeight.bold)),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildDetailPill(String label, String value) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: AppTheme.primaryBlack,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppTheme.dividerColor),
      ),
      child: Text('$label: $value', style: const TextStyle(fontSize: 12)),
    );
  }

  Future<void> _addSelectedToCollection(
    BuildContext context,
    WidgetRef ref,
    List<CardModel> allCards,
    Set<String> selectedIds,
  ) async {
    final cardsToAdd = allCards.where((c) => selectedIds.contains(c.id)).toList();
    if (cardsToAdd.isEmpty) return;

    try {
      await ref.read(collectionNotifierProvider.notifier).addCards(cardsToAdd);

      if (!context.mounted) return;

      final count = cardsToAdd.length;
      ref.read(selectedCardIdsProvider.notifier).state = {};

      ScaffoldMessenger.of(context).hideCurrentSnackBar();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: AppTheme.charcoal,
          content: Text(
            '$count ${count == 1 ? "card" : "cards"} added to Collection',
            style: const TextStyle(color: AppTheme.textWhite, fontWeight: FontWeight.w600),
          ),
          action: SnackBarAction(
            label: 'View Collection',
            textColor: AppTheme.accentRed,
            onPressed: () {
              context.go('/collection');
            },
          ),
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(10),
            side: const BorderSide(color: AppTheme.dividerColor),
          ),
        ),
      );
    } catch (e) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).hideCurrentSnackBar();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: AppTheme.charcoal,
          content: Text(
            'Failed to add cards: $e',
            style: const TextStyle(color: Colors.redAccent),
          ),
          action: SnackBarAction(
            label: 'Retry',
            textColor: AppTheme.accentRed,
            onPressed: () {
              _addSelectedToCollection(context, ref, allCards, selectedIds);
            },
          ),
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(10),
            side: const BorderSide(color: AppTheme.dividerColor),
          ),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cardsAsyncValue = ref.watch(cardsProvider);
    final rarityFilters = ref.watch(rarityFilterProvider);
    final colorFilters = ref.watch(colorFilterProvider);
    final hasActiveFilters = rarityFilters.isNotEmpty || colorFilters.isNotEmpty;
    final selectedIds = ref.watch(selectedCardIdsProvider);
    final isSelectionActive = selectedIds.isNotEmpty;

    return Scaffold(
      bottomNavigationBar: isSelectionActive
          ? Container(
              padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
              decoration: BoxDecoration(
                color: AppTheme.charcoal,
                border: const Border(
                  top: BorderSide(color: AppTheme.dividerColor, width: 1.0),
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.5),
                    blurRadius: 10,
                    offset: const Offset(0, -2),
                  ),
                ],
              ),
              child: SafeArea(
                top: false,
                child: Row(
                  children: [
                    Text(
                      '${selectedIds.length} ${selectedIds.length == 1 ? "card" : "cards"} selected',
                      style: const TextStyle(
                        color: AppTheme.textWhite,
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                      ),
                    ),
                    const SizedBox(width: 8),
                    TextButton(
                      onPressed: () {
                        ref.read(selectedCardIdsProvider.notifier).state = {};
                      },
                      style: TextButton.styleFrom(
                        padding: const EdgeInsets.symmetric(horizontal: 8),
                        minimumSize: Size.zero,
                        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                      ),
                      child: const Text(
                        'Clear',
                        style: TextStyle(color: AppTheme.textMuted, fontSize: 13),
                      ),
                    ),
                    const Spacer(),
                    ElevatedButton.icon(
                      onPressed: () {
                        final cards = cardsAsyncValue.value ?? [];
                        _addSelectedToCollection(context, ref, cards, selectedIds);
                      },
                      icon: const Icon(Icons.bookmark_add_outlined, size: 18),
                      label: const Text(
                        'Add to Collection',
                        style: TextStyle(fontWeight: FontWeight.bold),
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.accentRed,
                        foregroundColor: AppTheme.textWhite,
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            )
          : null,
      body: SafeArea(
        child: CustomScrollView(
          slivers: [
            SliverAppBar(
              floating: true,
              pinned: true,
              title: const Text('Japanese Card Database', style: TextStyle(fontWeight: FontWeight.bold)),
              bottom: PreferredSize(
                preferredSize: const Size.fromHeight(70),
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16.0, 0, 16.0, 16.0),
                  child: CustomSearchBar(
                    hintText: 'Search by name, number (OP01-001)...',
                    onChanged: (val) {
                      ref.read(searchQueryProvider.notifier).state = val;
                    },
                    onFilterTap: () {
                      showModalBottomSheet(
                        context: context,
                        backgroundColor: Colors.transparent,
                        isScrollControlled: true,
                        builder: (context) => const FilterBottomSheet(),
                      );
                    },
                  ),
                ),
              ),
            ),
            if (hasActiveFilters)
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 4.0),
                  child: Row(
                    children: [
                      const Text('Active Filters: ', style: TextStyle(color: AppTheme.textMuted, fontSize: 12)),
                      if (rarityFilters.isNotEmpty)
                        Text('Rarity (${rarityFilters.join(",")}) ', style: const TextStyle(color: AppTheme.accentRed, fontSize: 12)),
                      if (colorFilters.isNotEmpty)
                        Text('Color (${colorFilters.join(",")})', style: const TextStyle(color: AppTheme.mutedGold, fontSize: 12)),
                    ],
                  ),
                ),
              ),
            cardsAsyncValue.when(
              data: (cards) {
                if (cards.isEmpty) {
                  return const SliverFillRemaining(
                    child: Center(child: Text('No cards found matching your query.')),
                  );
                }
                return SliverPadding(
                  padding: EdgeInsets.fromLTRB(16.0, 16.0, 16.0, isSelectionActive ? 80.0 : 16.0),
                  sliver: SliverGrid(
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 3,
                      mainAxisSpacing: 12.0,
                      crossAxisSpacing: 12.0,
                      childAspectRatio: 0.68,
                    ),
                    delegate: SliverChildBuilderDelegate(
                      (BuildContext context, int index) {
                        final card = cards[index];
                        final isSpecial = card.variantType != 'BASE';
                        final isSelected = selectedIds.contains(card.id);

                        return AnimatedOpacity(
                          duration: const Duration(milliseconds: 180),
                          opacity: isSelectionActive ? (isSelected ? 1.0 : 0.45) : 1.0,
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 180),
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(8),
                              border: isSelected
                                  ? Border.all(color: AppTheme.accentRed, width: 2)
                                  : null,
                              boxShadow: isSelected
                                  ? [
                                      BoxShadow(
                                        color: AppTheme.accentRed.withValues(alpha: 0.4),
                                        blurRadius: 8,
                                        spreadRadius: 1,
                                      ),
                                    ]
                                  : null,
                            ),
                            child: InkWell(
                              key: ValueKey('card_item_${card.id}'),
                              onTap: () => _showCardDetailsModal(context, card),
                              borderRadius: BorderRadius.circular(8),
                              child: Stack(
                                children: [
                                  CardImage(
                                    imageUrl: card.imageUrl ?? 'https://via.placeholder.com/200x280.png?text=No+Image',
                                  ),
                                  // Top variant badge (Parallel, Manga, SP)
                                  if (isSpecial)
                                    Positioned(
                                      top: 4,
                                      left: 4,
                                      child: Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                                        decoration: BoxDecoration(
                                          color: card.variantType == 'MANGA'
                                              ? Colors.purple.withValues(alpha: 0.9)
                                              : AppTheme.mutedGold.withValues(alpha: 0.9),
                                          borderRadius: BorderRadius.circular(4),
                                        ),
                                        child: Text(
                                          card.variantType == 'MANGA' ? 'MANGA' : 'AA',
                                          style: const TextStyle(fontSize: 8, fontWeight: FontWeight.bold, color: Colors.black),
                                        ),
                                      ),
                                    ),
                                  // Selection toggle control (Top-Right)
                                  Positioned(
                                    top: 4,
                                    right: 4,
                                    child: GestureDetector(
                                      key: ValueKey('card_select_${card.id}'),
                                      behavior: HitTestBehavior.opaque,
                                      onTap: () {
                                        final current = Set<String>.from(selectedIds);
                                        if (current.contains(card.id)) {
                                          current.remove(card.id);
                                        } else {
                                          current.add(card.id);
                                        }
                                        ref.read(selectedCardIdsProvider.notifier).state = current;
                                      },
                                      child: Padding(
                                        padding: const EdgeInsets.all(4.0),
                                        child: Container(
                                          width: 24,
                                          height: 24,
                                          decoration: BoxDecoration(
                                            shape: BoxShape.circle,
                                            color: isSelected
                                                ? AppTheme.accentRed
                                                : Colors.black.withValues(alpha: 0.5),
                                            border: Border.all(
                                              color: isSelected
                                                  ? Colors.white
                                                  : Colors.white.withValues(alpha: isSelectionActive ? 0.6 : 0.85),
                                              width: 2,
                                            ),
                                          ),
                                          child: isSelected
                                              ? const Icon(
                                                  Icons.check,
                                                  size: 14,
                                                  color: Colors.white,
                                                )
                                              : null,
                                        ),
                                      ),
                                    ),
                                  ),
                                  // Bottom rarity badge
                                  if (card.rarity != null)
                                    Positioned(
                                      bottom: 4,
                                      right: 4,
                                      child: Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                                        decoration: BoxDecoration(
                                          color: Colors.black.withValues(alpha: 0.75),
                                          borderRadius: BorderRadius.circular(4),
                                        ),
                                        child: Text(card.rarity!, style: const TextStyle(fontSize: 9, fontWeight: FontWeight.bold)),
                                      ),
                                    ),
                                  // Bottom price pill
                                  Positioned(
                                    bottom: 4,
                                    left: 4,
                                    child: Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                                      decoration: BoxDecoration(
                                        color: Colors.black.withValues(alpha: 0.75),
                                        borderRadius: BorderRadius.circular(4),
                                      ),
                                      child: Text(
                                        card.displayPrice,
                                        style: TextStyle(
                                          fontSize: 9,
                                          fontWeight: FontWeight.bold,
                                          color: card.pricePhp != null ? AppTheme.mutedGold : AppTheme.textMuted,
                                        ),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        );
                      },
                      childCount: cards.length,
                    ),
                  ),
                );
              },
              loading: () => const SliverFillRemaining(
                child: Center(child: CircularProgressIndicator(color: AppTheme.accentRed)),
              ),
              error: (err, stack) => SliverFillRemaining(
                child: Center(child: Text('Error loading cards: $err')),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

