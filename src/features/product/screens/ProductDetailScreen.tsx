import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
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

import { Skeleton, SkeletonGroup } from '@/components/ui/Skeleton';
import { CartDock } from '@/features/cart/components/CartDock';
import { QtyStepper } from '@/features/cart/components/QtyStepper';
import { useCart } from '@/features/cart/hooks/useCart';
import { getProductDetail } from '@/features/product/api/productDetailApi';
import { CategoryProductCard } from '@/features/product/components/CategoryProductCard';
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

function isBooleanValue(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return normalized === 'true' || normalized === 'false';
}

function parseAbout(raw: string): {
  summary: string;
  features: string[];
  specs: { label: string; value: string }[];
} {
  const blocks = raw
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);
  let summary = '';
  const features: string[] = [];
  const specs: { label: string; value: string }[] = [];

  blocks.forEach((block) => {
    const match = block.match(/^([^:\n]{1,48}):\s*([\s\S]+)$/);
    if (!match) {
      if (!isBooleanValue(block)) {
        summary = summary ? `${summary}\n\n${block}` : block;
      }
      return;
    }

    const label = match[1].trim();
    const value = match[2].trim();
    const key = label.toLowerCase();

    if (key === 'description' || key === 'about') {
      summary = summary ? `${summary}\n\n${value}` : value;
      return;
    }

    if (key === 'key features' || key === 'key_features') {
      value
        .split('\n')
        .map((item) => item.trim())
        .filter((item) => item && !isBooleanValue(item))
        .forEach((item) => features.push(item));
      return;
    }

    if (isBooleanValue(value)) {
      return;
    }

    specs.push({ label, value: value.replace(/\s*\n\s*/g, ', ') });
  });

  if (!summary && features.length === 0 && specs.length === 0) {
    summary = raw.trim();
  }

  return { summary, features, specs };
}

function AboutSection({ about, open, onToggle }: { about: string; open: boolean; onToggle: () => void }) {
  const parsed = parseAbout(about);
  const summary = parsed.summary;
  const canToggle = summary.length > 110 || parsed.features.length > 0 || parsed.specs.length > 4;
  const visibleSpecs = open ? parsed.specs : parsed.specs.slice(0, 4);
  const showFeatures = parsed.features.length > 0 && (open || summary.length === 0);

  return (
    <View style={styles.aboutCard}>
      <Text style={styles.sectionTitle}>About this product</Text>
      {summary ? (
        <Text style={styles.about} numberOfLines={open ? undefined : 3}>
          {summary}
        </Text>
      ) : null}
      {showFeatures ? (
        <View style={styles.featureList}>
          {parsed.features.map((item, index) => (
            <View key={`${item}-${index}`} style={styles.featureRow}>
              <View style={styles.featureDot} />
              <Text style={styles.featureText}>{item}</Text>
            </View>
          ))}
        </View>
      ) : null}
      {visibleSpecs.length > 0 ? (
        <View style={styles.specList}>
          {visibleSpecs.map((row, index) => (
            <View key={`${row.label}-${index}`} style={styles.specRow}>
              <Text style={styles.specLabel}>{row.label}</Text>
              <Text style={[styles.specValue, row.value.length > 72 && styles.specValueLong]}>{row.value}</Text>
            </View>
          ))}
        </View>
      ) : null}
      {canToggle ? (
        <TouchableOpacity onPress={onToggle} hitSlop={8}>
          <Text style={styles.link}>{open ? 'Show less' : 'Read more'}</Text>
        </TouchableOpacity>
      ) : null}
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
  const sliderRef = useRef<ScrollView>(null);
  const sliderReady = useRef(false);
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
  const heroHeight = Math.min(320, Math.round(width * 0.78));
  const quantity = cart.quantityFor(selectedStore?.id, selectedVariantId);
  const unitLabel =
    selectedOffer?.unitLabel || product?.variants.find((size) => size.id === selectedVariantId)?.unitLabel || '';
  const relatedWidth = Math.floor((width - 32 - 16) / 3);
  const footerLift = 78;

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

  const loopSlides = images.length > 1;
  const slides = loopSlides ? [images[images.length - 1], ...images, images[0]] : images;

  useEffect(() => {
    setImageIndex(0);
    sliderReady.current = false;
  }, [selectedVariantId]);

  const settleSlide = (page: number) => {
    const count = images.length;
    if (count < 2) {
      setImageIndex(0);
      return;
    }

    if (page <= 0) {
      requestAnimationFrame(() => {
        sliderRef.current?.scrollTo({ x: count * width, animated: false });
      });
      setImageIndex(count - 1);
      return;
    }

    if (page >= count + 1) {
      requestAnimationFrame(() => {
        sliderRef.current?.scrollTo({ x: width, animated: false });
      });
      setImageIndex(0);
      return;
    }

    setImageIndex(page - 1);
  };

  const showImage = (index: number) => {
    if (images.length < 1) {
      return;
    }

    const next = ((index % images.length) + images.length) % images.length;
    setImageIndex(next);
    sliderRef.current?.scrollTo({ x: (loopSlides ? next + 1 : next) * width, animated: true });
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
      <View style={styles.root}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.white} />
        <SkeletonGroup>
          <Skeleton width={width} height={heroHeight + insets.top} radius={0} />
          <View style={styles.skeletonCopy}>
            <Skeleton width="62%" height={16} />
            <Skeleton width="28%" height={12} style={{ marginTop: 8 }} />
            <Skeleton width="36%" height={18} style={{ marginTop: 12 }} />
            <Skeleton width="100%" height={74} radius={16} style={{ marginTop: 18 }} />
            <Skeleton width="100%" height={74} radius={16} style={{ marginTop: 10 }} />
            <Skeleton width="48%" height={14} style={{ marginTop: 22 }} />
            <Skeleton width="100%" height={12} style={{ marginTop: 12 }} />
            <Skeleton width="92%" height={12} style={{ marginTop: 8 }} />
            <Skeleton width="70%" height={12} style={{ marginTop: 8 }} />
          </View>
        </SkeletonGroup>
        <TouchableOpacity
          style={[styles.iconButton, { top: Math.max(insets.top, 8) + 8 }]}
          onPress={goBack}
          activeOpacity={0.75}
        >
          <Ionicons name="chevron-down" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
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

  const dotCount = Math.min(7, images.length);
  const dotStart = Math.max(0, Math.min(imageIndex - 3, images.length - dotCount));

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: (cart.bill.itemCount > 0 ? 150 : 96) + Math.max(insets.bottom, 12),
        }}
      >
        <View style={styles.hero}>
          <View collapsable={false} style={[styles.imageFrame, { height: heroHeight, marginTop: insets.top }]}>
            {images.length > 0 ? (
              <ScrollView
                key={selectedVariantId}
                ref={sliderRef}
                horizontal
                pagingEnabled
                nestedScrollEnabled
                directionalLockEnabled
                showsHorizontalScrollIndicator={false}
                style={{ width, height: heroHeight }}
                contentOffset={{ x: loopSlides ? width : 0, y: 0 }}
                onLayout={() => {
                  if (!loopSlides || sliderReady.current) {
                    return;
                  }

                  sliderReady.current = true;
                  sliderRef.current?.scrollTo({ x: width, animated: false });
                }}
                onMomentumScrollEnd={(event) => {
                  settleSlide(Math.round(event.nativeEvent.contentOffset.x / width));
                }}
              >
                {slides.map((uri, index) => (
                  <Image
                    key={`${selectedVariantId}-${uri}-${index}`}
                    source={{ uri }}
                    style={{ width, height: heroHeight }}
                    resizeMode="contain"
                  />
                ))}
              </ScrollView>
            ) : (
              <Ionicons name="basket-outline" size={64} color={colors.primary} />
            )}
          </View>

          {images.length > 1 ? (
            <View style={styles.sliderMeta}>
              <View style={styles.dots}>
                {images.slice(dotStart, dotStart + dotCount).map((uri, offset) => {
                  const index = dotStart + offset;
                  return (
                    <TouchableOpacity key={`${uri}-${index}`} hitSlop={8} onPress={() => showImage(index)}>
                      <View style={[styles.dot, index === imageIndex && styles.dotActive]} />
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Text style={styles.sliderCount}>
                {imageIndex + 1}/{images.length}
              </Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.iconButton, { top: Math.max(insets.top, 8) + 8 }]}
            onPress={goBack}
            activeOpacity={0.75}
          >
            <Ionicons name="chevron-down" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <View style={styles.body}>
          <Text style={styles.name}>{product.name}</Text>
          {unitLabel ? <Text style={styles.unitLabel}>{unitLabel}</Text> : null}

          <View style={styles.priceRow}>
            <Text style={styles.price}>{selectedOffer ? formatRupee(selectedOffer.price) : '—'}</Text>
            {selectedOffer?.mrp != null ? <Text style={styles.mrp}>MRP {formatRupee(selectedOffer.mrp)}</Text> : null}
          </View>
          {selectedOffer && selectedOffer.discountPercent > 0 ? (
            <Text style={styles.discount}>{selectedOffer.discountPercent}% OFF on MRP</Text>
          ) : null}
          {product.brand ? <Text style={styles.brand}>{product.brand}</Text> : null}

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
                      onPress={() => setSelectedVariantId(size.id)}
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

          {product.about ? <AboutSection about={product.about} open={aboutOpen} onToggle={() => setAboutOpen((open) => !open)} /> : null}

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
              <Text style={styles.sectionTitle}>Similar products</Text>
              <View style={styles.relatedGrid}>
                {detail.related.map((item) => {
                  const relatedQty = cart.quantityFor(item.storeId, item.id);

                  return (
                    <CategoryProductCard
                      key={item.id}
                      product={item}
                      width={relatedWidth}
                      quantity={relatedQty}
                      onPress={() => openRelated(item)}
                      onAdd={() => {
                        if (!item.storeId) {
                          openRelated(item);
                          return;
                        }

                        if (relatedQty === 0) {
                          void cart.add(item.storeId, item.id);
                          return;
                        }

                        void cart.setQuantity(item.storeId, item.id, relatedQty + 1);
                      }}
                      onRemove={() => {
                        if (!item.storeId) {
                          return;
                        }

                        void cart.setQuantity(item.storeId, item.id, relatedQty - 1);
                      }}
                    />
                  );
                })}
              </View>
            </View>
          ) : null}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View style={styles.footerCopy}>
          {unitLabel ? <Text style={styles.footerUnit}>{unitLabel}</Text> : null}
          <View style={styles.footerPriceRow}>
            <Text style={styles.footerPrice}>{selectedOffer ? formatRupee(selectedOffer.price) : '—'}</Text>
            {selectedOffer?.mrp != null ? <Text style={styles.footerMrp}>MRP {formatRupee(selectedOffer.mrp)}</Text> : null}
          </View>
          <Text style={styles.footerTax}>Inclusive of all taxes</Text>
        </View>
        {quantity > 0 ? (
          <QtyStepper
            quantity={quantity}
            minWidth={148}
            disabled={!selectedOffer}
            onAdd={() => changeQty(quantity + 1)}
            onRemove={() => changeQty(quantity - 1)}
          />
        ) : (
          <TouchableOpacity
            style={[styles.addCart, !selectedOffer && styles.addCartDisabled]}
            activeOpacity={0.9}
            disabled={!selectedOffer}
            onPress={() => changeQty(1)}
          >
            <Text style={styles.addCartText}>Add to cart</Text>
          </TouchableOpacity>
        )}
      </View>
      <CartDock lifted={footerLift} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.page,
  },
  skeletonCopy: {
    paddingHorizontal: 16,
    paddingTop: 16,
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
    position: 'relative',
  },
  iconButton: {
    position: 'absolute',
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.92)',
    shadowColor: '#0F2744',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  imageFrame: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F7F8FA',
  },
  sliderMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 10,
    paddingBottom: 12,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  sliderCount: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
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
    paddingTop: 12,
  },
  name: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  unitLabel: {
    marginTop: 4,
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  brand: {
    marginTop: 6,
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginTop: 8,
  },
  price: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  mrp: {
    fontSize: 12,
    color: colors.placeholder,
    textDecorationLine: 'line-through',
    fontWeight: '500',
  },
  discount: {
    marginTop: 2,
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
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
    fontSize: 15,
    fontWeight: '700',
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
  aboutCard: {
    marginTop: 18,
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 12,
  },
  about: {
    marginTop: 8,
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
  },
  featureList: {
    marginTop: 10,
    gap: 6,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  featureDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginTop: 6,
    backgroundColor: colors.primary,
  },
  featureText: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  specList: {
    marginTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  specRow: {
    paddingVertical: 9,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    gap: 2,
  },
  specLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  specValue: {
    color: colors.textPrimary,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  specValueLong: {
    fontWeight: '500',
    color: colors.textSecondary,
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
  relatedGrid: {
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingHorizontal: 16,
    paddingTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  footerCopy: {
    flex: 1,
  },
  footerUnit: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  footerPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginTop: 2,
  },
  footerPrice: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  footerMrp: {
    color: colors.placeholder,
    fontSize: 12,
    fontWeight: '600',
    textDecorationLine: 'line-through',
  },
  footerTax: {
    marginTop: 2,
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  addCart: {
    minWidth: 148,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  addCartDisabled: {
    opacity: 0.45,
  },
  addCartText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '800',
  },
});
