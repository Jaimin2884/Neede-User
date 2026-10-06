import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CartDock } from '@/features/cart/components/CartDock';
import { QtyStepper } from '@/features/cart/components/QtyStepper';
import { useCart } from '@/features/cart/hooks/useCart';
import { getProductDetail } from '@/features/product/api/productDetailApi';
import { StorePinMap } from '@/features/product/components/StorePinMap';
import type { NearbyStoreOffer, ProductDetailResult, StoreOffer } from '@/features/product/types/productDetail';
import type { CategoryProduct } from '@/features/product/types/product';
import { colors } from '@/theme/colors';
import { formatKm, formatRupee } from '@/utils/money';

function firstParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }

  return value ?? '';
}

function offerFor(store: NearbyStoreOffer | undefined, variantId: string): StoreOffer | null {
  return store?.offers.find((offer) => offer.variantId === variantId) ?? null;
}

export default function ProductDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const params = useLocalSearchParams<{ variantId?: string; storeId?: string }>();
  const variantId = firstParam(params.variantId);
  const preferredStoreId = firstParam(params.storeId);
  const cart = useCart();

  const [detail, setDetail] = useState<ProductDetailResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedVariantId, setSelectedVariantId] = useState(variantId);
  const [selectedStoreId, setSelectedStoreId] = useState(preferredStoreId);
  const [imageIndex, setImageIndex] = useState(0);
  const [aboutOpen, setAboutOpen] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    getProductDetail(variantId)
      .then((result) => {
        if (!active) {
          return;
        }

        setDetail(result);
        setSelectedVariantId(result.product.variantId || variantId);
        const preferred = result.stores.find((store) => store.id === preferredStoreId);
        setSelectedStoreId(preferred?.id ?? result.stores[0]?.id ?? '');
      })
      .catch((err: unknown) => {
        if (active) {
          setError(err instanceof Error ? err.message : 'Unable to load this product.');
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [preferredStoreId, variantId]);

  const product = detail?.product;
  const stores = detail?.stores ?? [];
  const selectedStore = stores.find((store) => store.id === selectedStoreId) ?? stores[0];
  const selectedOffer = offerFor(selectedStore, selectedVariantId);
  const images = useMemo(() => {
    const all = product?.images ?? [];
    const matched = all.filter((image) => image.variantId === selectedVariantId || image.variantId === null);
    const list = matched.length > 0 ? matched : all;
    return list.map((image) => image.imageUrl);
  }, [product?.images, selectedVariantId]);
  const activeImage = images[imageIndex] ?? images[0];
  const quantity = cart.quantityFor(selectedStore?.id, selectedVariantId);
  const subtitle = [product?.subCategory || product?.category, selectedOffer?.unitLabel || product?.variants.find((size) => size.id === selectedVariantId)?.unitLabel]
    .filter(Boolean)
    .join(' · ');

  const cheapestFor = (sizeId: string): StoreOffer | null => {
    let best: StoreOffer | null = offerFor(selectedStore, sizeId);
    if (best) {
      return best;
    }

    stores.forEach((store) => {
      const offer = offerFor(store, sizeId);
      if (offer && (!best || offer.price < best.price)) {
        best = offer;
      }
    });

    return best;
  };

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/tabs');
  };

  const changeQty = (next: number) => {
    if (!selectedStore) {
      return;
    }

    if (next <= 0) {
      void cart.setQuantity(selectedStore.id, selectedVariantId, 0);
      return;
    }

    if (quantity === 0) {
      void cart.add(selectedStore.id, selectedVariantId);
      return;
    }

    void cart.setQuantity(selectedStore.id, selectedVariantId, next);
  };

  const openRelated = (item: CategoryProduct) => {
    router.push({
      pathname: '/product/id',
      params: { variantId: item.id, storeId: item.storeId ?? '' },
    });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!product || error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>{error || 'Product not found.'}</Text>
        <TouchableOpacity onPress={goBack}>
          <Text style={styles.link}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: cart.bill.itemCount > 0 ? 120 : 32 }}
      >
        <View style={[styles.hero, { paddingTop: Math.max(insets.top, 8) }]}>
          <View style={styles.heroBar}>
            <TouchableOpacity style={styles.iconButton} onPress={goBack} activeOpacity={0.75}>
              <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
            </TouchableOpacity>
            {selectedOffer && selectedOffer.discountPercent > 0 ? (
              <View style={styles.offBadge}>
                <Text style={styles.offText}>{selectedOffer.discountPercent}% OFF</Text>
              </View>
            ) : (
              <View />
            )}
          </View>

          <View style={[styles.imageFrame, { height: Math.min(320, width * 0.72) }]}>
            {activeImage ? (
              <Image source={{ uri: activeImage }} style={styles.heroImage} resizeMode="contain" />
            ) : (
              <Ionicons name="basket-outline" size={64} color={colors.primary} />
            )}
          </View>

          {images.length > 1 ? (
            <View style={styles.dots}>
              {images.map((uri, index) => (
                <TouchableOpacity key={uri + index} onPress={() => setImageIndex(index)}>
                  <View style={[styles.dot, index === imageIndex && styles.dotActive]} />
                </TouchableOpacity>
              ))}
            </View>
          ) : null}
        </View>

        <View style={styles.body}>
          <View style={styles.titleRow}>
            <View style={styles.titleCopy}>
              <Text style={styles.name}>{product.name}</Text>
              {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            </View>
            <QtyStepper
              quantity={quantity}
              disabled={!selectedOffer}
              onAdd={() => changeQty(quantity + 1)}
              onRemove={() => changeQty(quantity - 1)}
            />
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.price}>{selectedOffer ? formatRupee(selectedOffer.price) : '—'}</Text>
            {selectedOffer?.mrp != null ? <Text style={styles.mrp}>{formatRupee(selectedOffer.mrp)}</Text> : null}
            {selectedOffer && selectedOffer.discountPercent > 0 ? (
              <Text style={styles.discount}>{selectedOffer.discountPercent}% off</Text>
            ) : null}
          </View>

          {selectedStore ? (
            <View style={styles.deliveryCard}>
              <View style={styles.deliveryIcon}>
                <Ionicons name="flash" size={16} color={colors.primary} />
              </View>
              <View style={styles.deliveryCopy}>
                <Text style={styles.deliveryTitle}>Delivery in {selectedStore.deliveryMinutes} mins</Text>
                <Text style={styles.deliverySub}>
                  {selectedStore.name}
                  {selectedStore.city ? ` · ${selectedStore.city}` : ''} · {formatKm(selectedStore.distanceKm)}
                </Text>
              </View>
            </View>
          ) : null}

          {product.variants.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Choose size</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sizeRow}>
                {product.variants.map((size, index) => {
                  const offer = cheapestFor(size.id);
                  const selected = size.id === selectedVariantId;
                  const save =
                    offer?.mrp != null ? Math.max(0, Math.round((offer.mrp - offer.price) * 10) / 10) : 0;
                  const best = index === product.variants.length - 1 && product.variants.length > 1;

                  return (
                    <TouchableOpacity
                      key={size.id}
                      style={[styles.sizeCard, selected && styles.sizeCardActive]}
                      activeOpacity={0.85}
                      onPress={() => {
                        setSelectedVariantId(size.id);
                        setImageIndex(0);
                      }}
                    >
                      {save > 0 ? <Text style={styles.saveTag}>SAVE {formatRupee(save)}</Text> : null}
                      {best && save <= 0 ? <Text style={styles.bestTag}>BEST VALUE</Text> : null}
                      <Text style={[styles.sizeLabel, selected && styles.sizeLabelActive]}>
                        {size.unitLabel || size.name}
                      </Text>
                      <Text style={styles.sizePrice}>{offer ? formatRupee(offer.price) : '—'}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          ) : null}

          <View style={styles.trustRow}>
            <Trust icon="leaf-outline" label="Fresh quality" />
            <Trust icon="refresh-outline" label="Easy returns" />
            <Trust icon="lock-closed-outline" label="Secure delivery" />
          </View>

          {product.about ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About this product</Text>
              <Text style={styles.about} numberOfLines={aboutOpen ? undefined : 3}>
                {product.about}
              </Text>
              {product.about.length > 120 ? (
                <TouchableOpacity onPress={() => setAboutOpen((open) => !open)}>
                  <Text style={styles.link}>{aboutOpen ? 'Show less' : 'Read more'}</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Available within {detail?.radiusKm ?? 3} km</Text>
            <Text style={styles.sectionHint}>Each store shows its map and the price for this product.</Text>
            {detail?.needsAddress ? (
              <Text style={styles.emptyCopy}>Add a delivery address to see nearby stores.</Text>
            ) : null}
            {!detail?.needsAddress && stores.length === 0 ? (
              <Text style={styles.emptyCopy}>No store within 3 km has this product right now.</Text>
            ) : null}
            {stores.map((store) => {
              const offer = offerFor(store, selectedVariantId);
              const selected = store.id === selectedStore?.id;
              const storeQty = cart.quantityFor(store.id, selectedVariantId);

              return (
                <TouchableOpacity
                  key={store.id}
                  style={[styles.storeCard, selected && styles.storeCardActive]}
                  activeOpacity={0.9}
                  onPress={() => setSelectedStoreId(store.id)}
                >
                  <View style={styles.mapFrame}>
                    <StorePinMap latitude={store.latitude} longitude={store.longitude} />
                  </View>
                  <View style={styles.storeCopy}>
                    <Text style={styles.storeName} numberOfLines={1}>
                      {store.name}
                    </Text>
                    <Text style={styles.storeMeta} numberOfLines={1}>
                      {formatKm(store.distanceKm)} · {store.isOpen ? 'Open' : 'Closed'}
                    </Text>
                    <Text style={styles.storePrice}>{offer ? formatRupee(offer.price) : 'Size unavailable'}</Text>
                    {offer?.mrp != null ? <Text style={styles.storeMrp}>{formatRupee(offer.mrp)}</Text> : null}
                  </View>
                  <QtyStepper
                    quantity={storeQty}
                    disabled={!offer}
                    onAdd={() => {
                      setSelectedStoreId(store.id);
                      if (storeQty === 0) {
                        void cart.add(store.id, selectedVariantId);
                        return;
                      }
                      void cart.setQuantity(store.id, selectedVariantId, storeQty + 1);
                    }}
                    onRemove={() => {
                      setSelectedStoreId(store.id);
                      void cart.setQuantity(store.id, selectedVariantId, storeQty - 1);
                    }}
                  />
                </TouchableOpacity>
              );
            })}
          </View>

          {detail && detail.related.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Complete your basket</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.relatedRow}>
                {detail.related.map((item) => (
                  <TouchableOpacity key={item.id} style={styles.relatedCard} activeOpacity={0.9} onPress={() => openRelated(item)}>
                    <View style={styles.relatedImage}>
                      {item.imageUrl ? (
                        <Image source={{ uri: item.imageUrl }} style={styles.relatedPhoto} resizeMode="cover" />
                      ) : (
                        <Ionicons name="basket-outline" size={28} color={colors.primary} />
                      )}
                    </View>
                    <Text style={styles.relatedName} numberOfLines={2}>
                      {item.name}
                    </Text>
                    <Text style={styles.relatedUnit}>{item.unitLabel}</Text>
                    <View style={styles.relatedFoot}>
                      <Text style={styles.relatedPrice}>{formatRupee(item.price)}</Text>
                      <TouchableOpacity
                        style={styles.relatedAdd}
                        onPress={() => {
                          if (item.storeId) {
                            void cart.add(item.storeId, item.id);
                            return;
                          }
                          openRelated(item);
                        }}
                      >
                        <Ionicons name="add" size={16} color={colors.primary} />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          ) : null}
        </View>
      </ScrollView>
      <CartDock />
    </View>
  );
}

function Trust({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return (
    <View style={styles.trustItem}>
      <Ionicons name={icon} size={18} color={colors.primary} />
      <Text style={styles.trustLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.page,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: colors.white,
  },
  errorTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  hero: {
    backgroundColor: colors.white,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  heroBar: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.page,
  },
  offBadge: {
    backgroundColor: colors.discountBadge,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  offText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '800',
  },
  imageFrame: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroImage: {
    width: '86%',
    height: '86%',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    paddingBottom: 14,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#D5DEE8',
  },
  dotActive: {
    width: 16,
    backgroundColor: colors.primary,
  },
  body: {
    paddingHorizontal: 16,
    paddingTop: 18,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  titleCopy: {
    flex: 1,
  },
  name: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  subtitle: {
    marginTop: 4,
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginTop: 12,
  },
  price: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  mrp: {
    fontSize: 16,
    color: colors.placeholder,
    textDecorationLine: 'line-through',
    fontWeight: '600',
  },
  discount: {
    color: colors.discountBadge,
    fontSize: 14,
    fontWeight: '800',
  },
  deliveryCard: {
    marginTop: 16,
    backgroundColor: colors.primaryLight,
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  deliveryIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deliveryCopy: {
    flex: 1,
  },
  deliveryTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
  },
  deliverySub: {
    marginTop: 2,
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    marginTop: 22,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  sectionHint: {
    marginTop: 4,
    marginBottom: 12,
    color: colors.textSecondary,
    fontSize: 13,
  },
  sizeRow: {
    gap: 10,
    paddingTop: 12,
  },
  sizeCard: {
    width: 108,
    minHeight: 84,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
    padding: 12,
    justifyContent: 'flex-end',
  },
  sizeCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  sizeLabel: {
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: 14,
  },
  sizeLabelActive: {
    color: colors.primaryDark,
  },
  sizePrice: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  saveTag: {
    position: 'absolute',
    top: 8,
    left: 8,
    color: colors.savingsText,
    fontSize: 10,
    fontWeight: '800',
  },
  bestTag: {
    position: 'absolute',
    top: 8,
    left: 8,
    color: colors.primary,
    fontSize: 10,
    fontWeight: '800',
  },
  trustRow: {
    marginTop: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  trustItem: {
    alignItems: 'center',
    gap: 6,
    width: '30%',
  },
  trustLabel: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  about: {
    marginTop: 8,
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
  },
  link: {
    marginTop: 6,
    color: colors.primary,
    fontWeight: '800',
    fontSize: 14,
  },
  emptyCopy: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  storeCard: {
    marginBottom: 12,
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  storeCardActive: {
    borderColor: colors.primary,
  },
  mapFrame: {
    width: 92,
    height: 92,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#D9EEF8',
  },
  storeCopy: {
    flex: 1,
  },
  storeName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  storeMeta: {
    marginTop: 2,
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  storePrice: {
    marginTop: 6,
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  storeMrp: {
    color: colors.placeholder,
    fontSize: 12,
    textDecorationLine: 'line-through',
    fontWeight: '600',
  },
  relatedRow: {
    gap: 12,
    paddingTop: 12,
  },
  relatedCard: {
    width: 148,
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  relatedImage: {
    height: 96,
    borderRadius: 14,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  relatedPhoto: {
    width: '100%',
    height: '100%',
  },
  relatedName: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    minHeight: 34,
  },
  relatedUnit: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  relatedFoot: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  relatedPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  relatedAdd: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
