import 'package:flutter/material.dart';
import '../../core/theme.dart';
import '../../shared/stat_card.dart';
import '../../shared/card_image.dart';

class CollectionScreen extends StatelessWidget {
  const CollectionScreen({super.key});

  @override
  Widget build(BuildContext context) {
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
                    children: const [
                      Expanded(
                        child: StatCard(
                          title: 'Total Value',
                          value: '₱ 84,520',
                          valueColor: AppTheme.mutedGold,
                        ),
                      ),
                      SizedBox(width: 12),
                      Expanded(
                        child: StatCard(
                          title: 'Cards Owned',
                          value: '1,284',
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
                  return Stack(
                    children: [
                      CardImage(
                        imageUrl: 'https://via.placeholder.com/200x280.png?text=Owned+$index',
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
                          child: const Text('x4', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.white)),
                        ),
                      )
                    ],
                  );
                },
                childCount: 12, // Mock count
              ),
            ),
          ),
          const SliverToBoxAdapter(child: SizedBox(height: 24)),
        ],
      ),
    );
  }
}
