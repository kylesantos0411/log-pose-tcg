import 'package:flutter/material.dart';
import '../../core/theme.dart';
import '../../shared/stat_card.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('LOG POSE TCG', style: TextStyle(letterSpacing: 1.5)),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_none),
            onPressed: () {},
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Dashboard Metrics Grid
            GridView.count(
              crossAxisCount: 2,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              mainAxisSpacing: 12,
              crossAxisSpacing: 12,
              childAspectRatio: 1.5,
              children: const [
                StatCard(
                  title: 'Collection Value',
                  value: '₱ 84,520',
                  subtitle: '+5.4% this month',
                  valueColor: AppTheme.mutedGold,
                  icon: Icons.trending_up,
                ),
                StatCard(
                  title: 'Total Cards',
                  value: '1,284',
                  subtitle: '921 Unique',
                  icon: Icons.style,
                ),
                StatCard(
                  title: 'My Decks',
                  value: '12',
                  icon: Icons.layers,
                ),
                StatCard(
                  title: 'Wishlist',
                  value: '45',
                  icon: Icons.favorite_border,
                ),
              ],
            ),
            
            const SizedBox(height: 24),
            
            // Quick Actions
            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () {},
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.accentRed,
                      foregroundColor: AppTheme.textWhite,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    icon: const Icon(Icons.add),
                    label: const Text('ADD CARD', style: TextStyle(fontWeight: FontWeight.bold)),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () {},
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppTheme.textWhite,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      side: const BorderSide(color: AppTheme.dividerColor),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    icon: const Icon(Icons.library_add),
                    label: const Text('CREATE DECK', style: TextStyle(fontWeight: FontWeight.bold)),
                  ),
                ),
              ],
            ),
            
            const SizedBox(height: 32),
            
            // Recent Activity Section
            Text(
              'Recent Activity',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: 3, // Mock data count
              separatorBuilder: (context, index) => const Divider(),
              itemBuilder: (context, index) {
                return ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: AppTheme.charcoal,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Icon(Icons.add_photo_alternate, color: AppTheme.textMuted),
                  ),
                  title: const Text('Added "Monkey.D.Luffy" to Collection'),
                  subtitle: const Text('OP01-024 • SR • 2 mins ago', style: TextStyle(color: AppTheme.textMuted)),
                  trailing: const Text('+1', style: TextStyle(color: AppTheme.accentRed, fontWeight: FontWeight.bold)),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}
