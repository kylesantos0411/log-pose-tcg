import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../cards/data/card_model.dart';
import '../../cards/data/card_repository.dart';
import 'collection_model.dart';

final collectionRepositoryProvider = Provider<CollectionRepository>((ref) {
  final supabase = ref.watch(supabaseProvider);
  final cardRepo = ref.watch(cardRepositoryProvider);
  return CollectionRepository(supabase, cardRepo);
});

final collectionNotifierProvider =
    StateNotifierProvider<CollectionNotifier, AsyncValue<List<CollectionItem>>>((ref) {
  final repo = ref.watch(collectionRepositoryProvider);
  return CollectionNotifier(repo);
});

class CollectionRepository {
  final SupabaseClient? _client;

  // Local collection storage for offline / guest mode and fast UI updates
  final List<CollectionItem> _localCollection = [];

  CollectionRepository(this._client, [CardRepository? _]);

  /// Fetch user collection items
  Future<List<CollectionItem>> getCollection() async {
    final client = _client;
    final user = client?.auth.currentUser;

    if (client != null && user != null) {
      try {
        final response = await client
            .from('collection_items')
            .select('*, cards(*)')
            .eq('user_id', user.id)
            .order('created_at', ascending: false);

        final items = <CollectionItem>[];
        for (final row in response) {
          final cardData = row['cards'];
          if (cardData != null) {
            final card = CardModel.fromJson(cardData);
            items.add(CollectionItem.fromJson(row, card));
          }
        }
        _syncLocalWithRemote(items);
        return List.unmodifiable(_localCollection);
      } catch (_) {
        // Fallback to local collection on network or query failure
      }
    }

    return List.unmodifiable(_localCollection);
  }

  /// Adds a list of cards to the collection with duplicate/quantity handling
  Future<void> addCards(List<CardModel> cards) async {
    if (cards.isEmpty) return;

    final client = _client;
    final user = client?.auth.currentUser;

    for (final card in cards) {
      final existingIndex = _localCollection.indexWhere(
        (item) => item.cardId == card.id || item.card.canonicalId == card.canonicalId,
      );

      if (existingIndex != -1) {
        // Increment quantity on duplicate
        final existingItem = _localCollection[existingIndex];
        final newQuantity = existingItem.quantity + 1;
        _localCollection[existingIndex] = existingItem.copyWith(
          quantity: newQuantity,
          updatedAt: DateTime.now(),
        );

        if (client != null && user != null) {
          try {
            await client.from('collection_items').update({
              'quantity': newQuantity,
              'updated_at': DateTime.now().toIso8601String(),
            }).eq('id', existingItem.id);
          } catch (_) {
            // Keep local change intact
          }
        }
      } else {
        // Insert new collection record
        final now = DateTime.now();
        final newItem = CollectionItem(
          id: 'col-${now.millisecondsSinceEpoch}-${card.id}',
          cardId: card.id,
          card: card,
          quantity: 1,
          condition: 'Near Mint',
          createdAt: now,
          updatedAt: now,
        );
        _localCollection.insert(0, newItem);

        if (client != null && user != null) {
          try {
            final inserted = await client
                .from('collection_items')
                .insert(newItem.toJson(userId: user.id))
                .select()
                .single();
            if (inserted['id'] != null) {
              _localCollection[0] = newItem.copyWith(id: inserted['id'].toString());
            }
          } catch (_) {
            // Keep local change intact
          }
        }
      }
    }
  }

  void _syncLocalWithRemote(List<CollectionItem> remoteItems) {
    _localCollection.clear();
    _localCollection.addAll(remoteItems);
  }
}

class CollectionNotifier extends StateNotifier<AsyncValue<List<CollectionItem>>> {
  final CollectionRepository _repository;

  CollectionNotifier(this._repository) : super(const AsyncValue.loading()) {
    loadCollection();
  }

  Future<void> loadCollection() async {
    state = const AsyncValue.loading();
    try {
      final items = await _repository.getCollection();
      state = AsyncValue.data(items);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> addCards(List<CardModel> cards) async {
    try {
      await _repository.addCards(cards);
      final updated = await _repository.getCollection();
      state = AsyncValue.data(updated);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
      rethrow;
    }
  }
}
