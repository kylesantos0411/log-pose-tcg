class CardModel {
  final String id;
  final String canonicalId;
  final String cardNumber;
  final String name;
  final String? nameJa;
  final String? rarity;
  final String? color;
  final String? type;
  final int? cost;
  final int? power;
  final int? counter;
  final String? attribute;
  final String? effect;
  final String? triggerEffect;
  final String? illustrator;
  final String? imageUrl;
  final String variantType;
  final String language;
  final bool isAlternateArt;
  final String? setCode;
  final String? setName;
  final double? priceJpy;
  final double? pricePhp;
  final String priceStatus;

  CardModel({
    required this.id,
    required this.canonicalId,
    required this.cardNumber,
    required this.name,
    this.nameJa,
    this.rarity,
    this.color,
    this.type,
    this.cost,
    this.power,
    this.counter,
    this.attribute,
    this.effect,
    this.triggerEffect,
    this.illustrator,
    this.imageUrl,
    this.variantType = 'BASE',
    this.language = 'JP',
    this.isAlternateArt = false,
    this.setCode,
    this.setName,
    this.priceJpy,
    this.pricePhp,
    this.priceStatus = 'NOT_CHECKED',
  });

  String get displayPrice {
    if (priceStatus == 'AVAILABLE' && pricePhp != null) {
      return '₱ ${pricePhp!.toStringAsFixed(0)}';
    }
    if (priceStatus == 'UNAVAILABLE') {
      return 'Unavail';
    }
    return '--';
  }

  factory CardModel.fromJson(Map<String, dynamic> json) {
    return CardModel(
      id: json['id'] ?? '',
      canonicalId: json['canonical_id'] ?? json['id'] ?? '',
      cardNumber: json['card_number'] ?? '',
      name: json['name'] ?? '',
      nameJa: json['name_ja'],
      rarity: json['rarity'],
      color: json['color'],
      type: json['type'],
      cost: json['cost'],
      power: json['power'],
      counter: json['counter'],
      attribute: json['attribute'],
      effect: json['effect'],
      triggerEffect: json['trigger_effect'],
      illustrator: json['illustrator'],
      imageUrl: json['image_url'],
      variantType: json['variant_type'] ?? 'BASE',
      language: json['language'] ?? 'JP',
      isAlternateArt: json['is_alternate_art'] ?? false,
      setCode: json['set_code'],
      setName: json['set_name'],
      priceJpy: json['yuyutei_price_jpy'] != null
          ? (json['yuyutei_price_jpy'] as num).toDouble()
          : (json['price_raw'] != null ? (json['price_raw'] as num).toDouble() : null),
      pricePhp: json['yuyutei_price_php'] != null
          ? (json['yuyutei_price_php'] as num).toDouble()
          : (json['price_php'] != null ? (json['price_php'] as num).toDouble() : null),
      priceStatus: json['yuyutei_status'] ?? json['status'] ?? 'NOT_CHECKED',
    );
  }
}
