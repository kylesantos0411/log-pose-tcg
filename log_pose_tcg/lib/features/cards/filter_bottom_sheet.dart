import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/theme.dart';
import 'data/card_repository.dart';

class FilterBottomSheet extends ConsumerWidget {
  const FilterBottomSheet({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final selectedRarities = ref.watch(rarityFilterProvider);
    final selectedColors = ref.watch(colorFilterProvider);

    return Container(
      padding: const EdgeInsets.all(24.0),
      decoration: const BoxDecoration(
        color: AppTheme.charcoal,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Filter Cards',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
              ),
              Row(
                children: [
                  TextButton(
                    onPressed: () {
                      ref.read(rarityFilterProvider.notifier).state = {};
                      ref.read(colorFilterProvider.notifier).state = {};
                    },
                    child: const Text('Reset', style: TextStyle(color: AppTheme.textMuted)),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => Navigator.pop(context),
                  )
                ],
              ),
            ],
          ),
          const SizedBox(height: 16),
          const Text('Rarity', style: TextStyle(color: AppTheme.textMuted, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            children: ['L', 'C', 'UC', 'R', 'SR', 'SEC', 'SP'].map((rarity) {
              final isSelected = selectedRarities.contains(rarity);
              return FilterChip(
                label: Text(rarity),
                selected: isSelected,
                onSelected: (bool selected) {
                  final updated = Set<String>.from(selectedRarities);
                  if (selected) {
                    updated.add(rarity);
                  } else {
                    updated.remove(rarity);
                  }
                  ref.read(rarityFilterProvider.notifier).state = updated;
                },
                backgroundColor: AppTheme.primaryBlack,
                selectedColor: AppTheme.accentRed.withOpacity(0.2),
                checkmarkColor: AppTheme.accentRed,
              );
            }).toList(),
          ),
          const SizedBox(height: 24),
          const Text('Color', style: TextStyle(color: AppTheme.textMuted, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            children: ['Red', 'Green', 'Blue', 'Purple', 'Black', 'Yellow'].map((color) {
              final isSelected = selectedColors.contains(color);
              return FilterChip(
                label: Text(color),
                selected: isSelected,
                onSelected: (bool selected) {
                  final updated = Set<String>.from(selectedColors);
                  if (selected) {
                    updated.add(color);
                  } else {
                    updated.remove(color);
                  }
                  ref.read(colorFilterProvider.notifier).state = updated;
                },
                backgroundColor: AppTheme.primaryBlack,
                selectedColor: AppTheme.accentRed.withOpacity(0.2),
                checkmarkColor: AppTheme.accentRed,
              );
            }).toList(),
          ),
          const SizedBox(height: 32),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () => Navigator.pop(context),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.accentRed,
                foregroundColor: AppTheme.textWhite,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: const Text('APPLY FILTERS', style: TextStyle(fontWeight: FontWeight.bold)),
            ),
          ),
          const SizedBox(height: 16),
        ],
      ),
    );
  }
}
