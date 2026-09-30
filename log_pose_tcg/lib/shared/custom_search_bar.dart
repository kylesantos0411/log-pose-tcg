import 'package:flutter/material.dart';
import '../core/theme.dart';

class CustomSearchBar extends StatelessWidget {
  final String hintText;
  final ValueChanged<String>? onChanged;
  final VoidCallback? onFilterTap;

  const CustomSearchBar({
    super.key,
    this.hintText = 'Search cards...',
    this.onChanged,
    this.onFilterTap,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppTheme.charcoal,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.dividerColor),
      ),
      child: Row(
        children: [
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 16.0),
            child: Icon(Icons.search, color: AppTheme.textMuted),
          ),
          Expanded(
            child: TextField(
              onChanged: onChanged,
              style: const TextStyle(color: AppTheme.textWhite),
              decoration: InputDecoration(
                hintText: hintText,
                hintStyle: const TextStyle(color: AppTheme.textMuted),
                border: InputBorder.none,
                isDense: true,
                contentPadding: const EdgeInsets.symmetric(vertical: 14.0),
              ),
            ),
          ),
          if (onFilterTap != null)
            Material(
              color: Colors.transparent,
              child: InkWell(
                borderRadius: const BorderRadius.horizontal(right: Radius.circular(12)),
                onTap: onFilterTap,
                child: const Padding(
                  padding: EdgeInsets.all(14.0),
                  child: Icon(Icons.tune, color: AppTheme.accentRed),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
