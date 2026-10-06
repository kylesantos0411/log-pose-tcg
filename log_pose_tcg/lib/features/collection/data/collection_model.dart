import '../../cards/data/card_model.dart';

class CollectionItem {
  final String id;
  final String cardId;
  final CardModel card;
  final int quantity;
  final String condition;
  final String? notes;
  final double? purchasePrice;
  final DateTime? purchaseDate;
  final DateTime createdAt;
  final DateTime updatedAt;

  const CollectionItem({
    required this.id,
    required this.cardId,
    required this.card,
    this.quantity = 1,
    this.condition = 'Near Mint',
    this.notes,
    this.purchasePrice,
    this.purchaseDate,
    required this.createdAt,
    required this.updatedAt,
  });

  CollectionItem copyWith({
    String? id,
    String? cardId,
    CardModel? card,
    int? quantity,
    String? condition,
    String? notes,
    double? purchasePrice,
    DateTime? purchaseDate,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return CollectionItem(
      id: id ?? this.id,
      cardId: cardId ?? this.cardId,
      card: card ?? this.card,
      quantity: quantity ?? this.quantity,
      condition: condition ?? this.condition,
      notes: notes ?? this.notes,
      purchasePrice: purchasePrice ?? this.purchasePrice,
      purchaseDate: purchaseDate ?? this.purchaseDate,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  factory CollectionItem.fromJson(Map<String, dynamic> json, CardModel card) {
    return CollectionItem(
      id: json['id']?.toString() ?? '',
      cardId: json['card_id']?.toString() ?? card.id,
      card: card,
      quantity: (json['quantity'] as num?)?.toInt() ?? 1,
      condition: json['condition']?.toString() ?? 'Near Mint',
      notes: json['notes']?.toString(),
      purchasePrice: (json['purchase_price'] as num?)?.toDouble(),
      purchaseDate: json['purchase_date'] != null
          ? DateTime.tryParse(json['purchase_date'].toString())
          : null,
      createdAt: json['created_at'] != null
          ? DateTime.tryParse(json['created_at'].toString()) ?? DateTime.now()
          : DateTime.now(),
      updatedAt: json['updated_at'] != null
          ? DateTime.tryParse(json['updated_at'].toString()) ?? DateTime.now()
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson({required String userId}) {
    return {
      'user_id': userId,
      'card_id': cardId,
      'quantity': quantity,
      'condition': condition,
      if (notes != null) 'notes': notes,
      if (purchasePrice != null) 'purchase_price': purchasePrice,
      if (purchaseDate != null) 'purchase_date': purchaseDate!.toIso8601String().split('T').first,
    };
  }
}
