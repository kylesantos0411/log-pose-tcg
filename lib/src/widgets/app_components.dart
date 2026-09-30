import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../design/app_theme.dart';
import '../models/card_models.dart';

class StatCard extends StatelessWidget {
  const StatCard({
    super.key,
    required this.label,
    required this.value,
    this.detail,
    this.icon = LucideIcons.activity,
  });

  final String label;
  final String value;
  final String? detail;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.panel,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 18, color: AppColors.red),
          const Spacer(),
          Text(label, style: const TextStyle(color: AppColors.muted, fontSize: 12)),
          const SizedBox(height: 4),
          Text(value, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800)),
          if (detail != null) ...[
            const SizedBox(height: 4),
            Text(detail!, style: const TextStyle(color: AppColors.green, fontSize: 12)),
          ],
        ],
      ),
    );
  }
}

class CardTile extends StatelessWidget {
  const CardTile({super.key, required this.card, required this.onTap});

  final TcgCard card;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(8),
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.panel,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: AppColors.border),
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: CachedNetworkImage(
                imageUrl: card.imageUrl,
                fit: BoxFit.cover,
                width: double.infinity,
                placeholder: (_, __) => const LoadingState(),
                errorWidget: (_, __, ___) => const Icon(LucideIcons.imageOff),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(8),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          card.number,
                          style: const TextStyle(color: AppColors.muted, fontSize: 11),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      RarityBadge(label: card.rarity),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    card.name,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontWeight: FontWeight.w700),
                  ),
                  const SizedBox(height: 4),
                  PriceBadge(value: card.currentPrice, change: card.priceChangePercent),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class PriceBadge extends StatelessWidget {
  const PriceBadge({super.key, required this.value, required this.change});

  final double value;
  final double change;

  @override
  Widget build(BuildContext context) {
    final up = change >= 0;
    return Row(
      children: [
        Text(
          'PHP ${value.toStringAsFixed(0)}',
          style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 12),
        ),
        const SizedBox(width: 6),
        Icon(up ? LucideIcons.trendingUp : LucideIcons.trendingDown,
            size: 12, color: up ? AppColors.green : AppColors.red),
        Text(
          '${change.abs().toStringAsFixed(1)}%',
          style: TextStyle(color: up ? AppColors.green : AppColors.red, fontSize: 11),
        ),
      ],
    );
  }
}

class RarityBadge extends StatelessWidget {
  const RarityBadge({super.key, required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
      decoration: BoxDecoration(
        color: AppColors.red.withOpacity(0.16),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(label, style: const TextStyle(color: AppColors.red, fontSize: 11)),
    );
  }
}

class ProBadge extends StatelessWidget {
  const ProBadge({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: AppColors.gold.withOpacity(0.18),
        borderRadius: BorderRadius.circular(6),
      ),
      child: const Text('PRO', style: TextStyle(color: AppColors.gold, fontSize: 11)),
    );
  }
}

class LoadingState extends StatelessWidget {
  const LoadingState({super.key});

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: SizedBox.square(
        dimension: 22,
        child: CircularProgressIndicator(strokeWidth: 2),
      ),
    );
  }
}

class EmptyState extends StatelessWidget {
  const EmptyState({super.key, required this.title, required this.message});

  final String title;
  final String message;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(LucideIcons.compass, color: AppColors.red, size: 40),
            const SizedBox(height: 12),
            Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
            const SizedBox(height: 6),
            Text(message, textAlign: TextAlign.center, style: const TextStyle(color: AppColors.muted)),
          ],
        ),
      ),
    );
  }
}
