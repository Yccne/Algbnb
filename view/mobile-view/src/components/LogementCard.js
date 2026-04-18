import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '../styles/theme';

export const LogementCard = ({ logement, onPress }) => {
  const [isFav, setIsFav] = useState(false);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={styles.card}>
      {/* Image Container */}
      <View style={styles.imageContainer}>
        <Image source={{ uri: logement.photos[0] }} style={styles.image} />

        {/* Rating Badge - glassmorphism */}
        <View style={styles.ratingBadge}>
          <Text style={styles.star}>★</Text>
          <Text style={styles.ratingText}>{logement.note}</Text>
        </View>

        {/* Favorite button */}
        <TouchableOpacity
          onPress={(e) => { e.stopPropagation && e.stopPropagation(); setIsFav(!isFav); }}
          style={styles.favButton}
          activeOpacity={0.8}
        >
          <Text style={{ color: isFav ? theme.colors.heart : theme.colors.onSurface, fontSize: 16 }}>
            {isFav ? '♥' : '♡'}
          </Text>
        </TouchableOpacity>

        {/* Price chip on image */}
        <View style={styles.priceChip}>
          <Text style={styles.priceText}>{logement.prix} DZD </Text>
          <Text style={styles.priceUnit}>/ nuit</Text>
        </View>
      </View>

      {/* Card Body */}
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>{logement.titre}</Text>
        <Text style={styles.subtitle}>{logement.ville}</Text>
        <Text style={styles.meta}>{logement.type} · {logement.voyageurs || 4} voyageurs</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surfaceLowest,
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    marginBottom: theme.spacing.m,
    ...theme.shadow.sm,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 4 / 3,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  ratingBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255,255,255,0.85)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radius.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  star: {
    color: theme.colors.star,
    fontSize: 12,
  },
  ratingText: {
    fontSize: theme.fontSize.labelSm,
    fontWeight: '700',
    color: theme.colors.onSurface,
  },
  favButton: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  priceChip: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: 'rgba(255,255,255,0.85)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: theme.radius.full,
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceText: {
    fontWeight: '700',
    fontSize: theme.fontSize.bodySm,
    color: theme.colors.onSurface,
  },
  priceUnit: {
    fontWeight: '400',
    fontSize: theme.fontSize.labelSm,
    color: theme.colors.onSurfaceVariant,
  },
  body: {
    padding: theme.spacing.m,
  },
  title: {
    fontSize: theme.fontSize.bodyMd,
    fontWeight: '700',
    color: theme.colors.onSurface,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: theme.fontSize.bodySm,
    color: theme.colors.onSurfaceVariant,
    marginBottom: theme.spacing.xs,
  },
  meta: {
    fontSize: theme.fontSize.labelSm,
    color: theme.colors.onSurfaceVariant,
  },
});
