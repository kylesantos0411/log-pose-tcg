import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme.dart';
import '../../shared/card_image.dart';

class DecksScreen extends StatelessWidget {
  const DecksScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Decks', style: TextStyle(fontWeight: FontWeight.bold)),
      ),
      body: ListView.separated(
        padding: const EdgeInsets.all(16.0),
        itemCount: 5, // Mock number of decks
        separatorBuilder: (context, index) => const SizedBox(height: 16),
        itemBuilder: (context, index) {
          return InkWell(
            onTap: () {},
            borderRadius: BorderRadius.circular(12),
            child: Container(
              height: 100,
              decoration: BoxDecoration(
                color: AppTheme.charcoal,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppTheme.dividerColor),
              ),
              child: Row(
                children: [
                  // Leader Image Section
                  ClipRRect(
                    borderRadius: const BorderRadius.horizontal(left: Radius.circular(12)),
                    child: SizedBox(
                      width: 80,
                      height: 100,
                      child: Stack(
                        fit: StackFit.expand,
                        children: [
                          const CardImage(
                            imageUrl: 'https://via.placeholder.com/200x280.png?text=Leader',
                            borderRadius: 0,
                          ),
                          // Color gradient overlay for aesthetics
                          Container(
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                colors: [Colors.black.withOpacity(0.1), AppTheme.charcoal],
                                begin: Alignment.centerLeft,
                                end: Alignment.centerRight,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  // Deck Details Section
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          'Straw Hat Crew $index',
                          style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 4),
                        const Text(
                          'Red • Aggro',
                          style: TextStyle(color: AppTheme.accentRed, fontSize: 12, fontWeight: FontWeight.w600),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          '50/50 Cards',
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppTheme.textMuted),
                        ),
                      ],
                    ),
                  ),
                  const Padding(
                    padding: EdgeInsets.all(16.0),
                    child: Icon(Icons.chevron_right, color: AppTheme.textMuted),
                  )
                ],
              ),
            ),
          );
        },
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {
          context.push('/decks/builder');
        },
        backgroundColor: AppTheme.accentRed,
        foregroundColor: AppTheme.textWhite,
        icon: const Icon(Icons.add),
        label: const Text('NEW DECK', style: TextStyle(fontWeight: FontWeight.bold)),
      ),
    );
  }
}
