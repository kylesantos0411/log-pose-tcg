enum CardColor { red, green, blue, purple, black, yellow }

class TcgCard {
  const TcgCard({
    required this.id,
    required this.number,
    required this.name,
    required this.setName,
    required this.setCode,
    required this.rarity,
    required this.color,
    required this.type,
    required this.cost,
    required this.power,
    required this.counter,
    required this.attribute,
    required this.effect,
    required this.trigger,
    required this.language,
    required this.region,
    required this.variant,
    required this.illustrator,
    required this.releaseDate,
    required this.imageUrl,
    required this.currentPrice,
    required this.priceChangePercent,
    this.owned = 0,
  });

  final String id;
  final String number;
  final String name;
  final String setName;
  final String setCode;
  final String rarity;
  final CardColor color;
  final String type;
  final int cost;
  final int power;
  final int counter;
  final String attribute;
  final String effect;
  final String trigger;
  final String language;
  final String region;
  final String variant;
  final String illustrator;
  final DateTime releaseDate;
  final String imageUrl;
  final double currentPrice;
  final double priceChangePercent;
  final int owned;
}

class DeckSummary {
  const DeckSummary({
    required this.name,
    required this.leader,
    required this.colors,
    required this.cardCount,
    required this.value,
    required this.completion,
  });

  final String name;
  final String leader;
  final String colors;
  final int cardCount;
  final double value;
  final double completion;
}
