import 'package:flutter/material.dart';
import '../../core/theme.dart';
import '../../shared/custom_search_bar.dart';
import '../../shared/card_image.dart';

class DeckBuilderScreen extends StatelessWidget {
  const DeckBuilderScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Deck Builder', style: TextStyle(fontWeight: FontWeight.bold)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('SAVE', style: TextStyle(color: AppTheme.accentRed, fontWeight: FontWeight.bold)),
          )
        ],
      ),
      body: Column(
        children: [
          // Deck Stats Top Bar
          Container(
            padding: const EdgeInsets.all(16),
            color: AppTheme.charcoal,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Container(
                      width: 40,
                      height: 40,
                      decoration: const BoxDecoration(shape: BoxShape.circle, color: AppTheme.dividerColor),
                      child: const Center(child: Text('L', style: TextStyle(fontWeight: FontWeight.bold))),
                    ),
                    const SizedBox(width: 12),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: const [
                        Text('No Leader Selected', style: TextStyle(fontWeight: FontWeight.bold)),
                        Text('Tap to select', style: TextStyle(color: AppTheme.accentRed, fontSize: 12)),
                      ],
                    ),
                  ],
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: const [
                    Text('0 / 50', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                    Text('Cards', style: TextStyle(color: AppTheme.textMuted, fontSize: 12)),
                  ],
                )
              ],
            ),
          ),
          
          // Current Deck Horizontal List
          Container(
            height: 140,
            decoration: const BoxDecoration(
              border: Border(bottom: BorderSide(color: AppTheme.dividerColor)),
            ),
            child: ListView.builder(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              scrollDirection: Axis.horizontal,
              itemCount: 1, // Mock empty state mostly
              itemBuilder: (context, index) {
                return Container(
                  width: 80,
                  margin: const EdgeInsets.only(right: 8),
                  decoration: BoxDecoration(
                    color: AppTheme.charcoal,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: AppTheme.dividerColor, style: BorderStyle.solid),
                  ),
                  child: const Center(
                    child: Icon(Icons.add, color: AppTheme.textMuted),
                  ),
                );
              },
            ),
          ),
          
          // Searchable Card Pool
          Expanded(
            child: Column(
              children: [
                const Padding(
                  padding: EdgeInsets.all(16.0),
                  child: CustomSearchBar(hintText: 'Search cards to add...'),
                ),
                Expanded(
                  child: GridView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 16.0),
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 4,
                      mainAxisSpacing: 8.0,
                      crossAxisSpacing: 8.0,
                      childAspectRatio: 0.71,
                    ),
                    itemCount: 20, // Mock
                    itemBuilder: (context, index) {
                      return const CardImage(
                        imageUrl: 'https://via.placeholder.com/100x140.png?text=Card',
                        borderRadius: 4,
                      );
                    },
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
