import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/theme.dart';
import '../../shared/stat_card.dart';
import '../../shared/card_image.dart';
import 'data/collection_repository.dart';

class CollectionScreen extends ConsumerWidget {
  const CollectionScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final collectionState = ref.watch(collectionNotifierProvider);
    final items = collectionState.value ?? [];

    final totalCardsOwned = items.fold<int>(0, (sum, item) => sum + item.quantity);
    final totalValuePhp = items.fold<double>(
      0.0,
      (sum, item) => sum + ((item.card.pricePhp ?? 0) * item.quantity),
    );

    final displayTotalValue = items.isEmpty ? '₱ 0' : '₱ ${totalValuePhp.toStringAsFixed(0)}';
    final displayCardsCount = totalCardsOwned.toString();

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Collection', style: TextStyle(fontWeight: FontWeight.bold)),
        actions: [
          IconButton(
            icon: const Icon(Icons.add_circle_outline),
            onPressed: () {
              // Open add to collection modal
            },
          )
        ],
      ),
      body: CustomScrollView(
        slivers: [
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Overview',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: StatCard(
                          title: 'Total Value',
                          value: displayTotalValue,
                          valueColor: AppTheme.mutedGold,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: StatCard(
                          title: 'Cards Owned',
                          value: displayCardsCount,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Recently Added',
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                      ),
                      TextButton(
                        onPressed: () {},
                        child: const Text('View All', style: TextStyle(color: AppTheme.accentRed)),
                      )
                    ],
                  ),
                ],
              ),
            ),
          ),
          if (items.isEmpty)
            const SliverFillRemaining(
              hasScrollBody: false,
              child: Center(
                child: Padding(
                  padding: EdgeInsets.all(24.0),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.style_outlined, size: 48, color: AppTheme.textMuted),
                      SizedBox(height: 12),
                      Text(
                        'No cards in your Collection yet.',
                        style: TextStyle(color: AppTheme.textMuted, fontSize: 14),
                      ),
                      SizedBox(height: 4),
                      Text(
                        'Select cards in the database to add them.',
                        style: TextStyle(color: AppTheme.textMuted, fontSize: 12),
                      ),
                    ],
                  ),
                ),
              ),
            )
          else
            SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0),
              sliver: SliverGrid(
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 3,
                  mainAxisSpacing: 12.0,
                  crossAxisSpacing: 12.0,
                  childAspectRatio: 0.71,
                ),
                delegate: SliverChildBuilderDelegate(
                  (BuildContext context, int index) {
                    final item = items[index];
                    return Stack(
                      children: [
                        CardImage(
                          imageUrl: item.card.imageUrl ?? 'https://via.placeholder.com/200x280.png?text=No+Image',
                        ),
                        // Owned quantity badge
                        Positioned(
                          top: 4,
                          right: 4,
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: AppTheme.accentRed,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(
                              'x${item.quantity}',
                              style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.white),
                            ),
                          ),
                        ),
                      ],
                    );
                  },
                  childCount: items.length,
                ),
              ),
            ),
          const SliverToBoxAdapter(child: SizedBox(height: 24)),
        ],
      ),
    );
  }
}

