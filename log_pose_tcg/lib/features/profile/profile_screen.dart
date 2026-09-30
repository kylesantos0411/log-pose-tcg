import 'package:flutter/material.dart';
import '../../core/theme.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Profile', style: TextStyle(fontWeight: FontWeight.bold)),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings),
            onPressed: () {
              // Open Settings
            },
          )
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            // User Identity Section
            Center(
              child: Column(
                children: [
                  const CircleAvatar(
                    radius: 50,
                    backgroundColor: AppTheme.charcoal,
                    child: Icon(Icons.person, size: 50, color: AppTheme.textMuted),
                    // backgroundImage: NetworkImage('url'),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'CollectorName',
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'Member since Aug 2026',
                    style: TextStyle(color: AppTheme.textMuted),
                  ),
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppTheme.mutedGold.withOpacity(0.2),
                      border: Border.all(color: AppTheme.mutedGold),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: const Text('LOG POSE PRO', style: TextStyle(color: AppTheme.mutedGold, fontWeight: FontWeight.bold, fontSize: 12)),
                  ),
                ],
              ),
            ),
            
            const SizedBox(height: 32),
            
            // Stats Summary
            Row(
              children: [
                _buildProfileStat(context, 'Collection Value', '₱ 84,520'),
                _buildProfileStat(context, 'Cards Owned', '1,284'),
                _buildProfileStat(context, 'Decks', '12'),
              ],
            ),
            
            const SizedBox(height: 32),
            
            // Actions / Links
            _buildActionTile(context, Icons.favorite, 'Favorites'),
            _buildActionTile(context, Icons.sync_alt, 'Trade List'),
            _buildActionTile(context, Icons.storefront, 'Marketplace Listings'),
            
            const SizedBox(height: 24),
            const Divider(),
            const SizedBox(height: 8),
            
            ListTile(
              leading: const Icon(Icons.logout, color: AppTheme.accentRed),
              title: const Text('Log Out', style: TextStyle(color: AppTheme.accentRed, fontWeight: FontWeight.bold)),
              onTap: () {
                // Handle logout
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildProfileStat(BuildContext context, String label, String value) {
    return Expanded(
      child: Column(
        children: [
          Text(value, style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
          const SizedBox(height: 4),
          Text(label, style: const TextStyle(color: AppTheme.textMuted, fontSize: 12), textAlign: TextAlign.center),
        ],
      ),
    );
  }

  Widget _buildActionTile(BuildContext context, IconData icon, String title) {
    return ListTile(
      contentPadding: EdgeInsets.zero,
      leading: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: AppTheme.charcoal,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Icon(icon, color: AppTheme.textWhite),
      ),
      title: Text(title, style: const TextStyle(fontWeight: FontWeight.w600)),
      trailing: const Icon(Icons.chevron_right, color: AppTheme.textMuted),
      onTap: () {},
    );
  }
}
