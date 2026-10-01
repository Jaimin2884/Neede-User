import { images } from '@/constants/images';
import type { BannerItem, CategoryItem, DealItem, StoreItem } from '@/types/home';

export const homeBanners: BannerItem[] = [
  {
    id: 'banner-1',
    tag: 'Minimalist',
    subtag: 'Hide nothing.',
    title: 'Active-Based\nHair Care',
    subtitle: 'Healthy hair starts here',
    ctaText: 'Shop now',
    image: images.bannerHaircare,
    bgTint: '#F3F4F6',
  },
  {
    id: 'banner-2',
    tag: 'NEEDE Fresh',
    subtag: 'Farm to table',
    title: 'Freshness For\nEvery Meal!',
    subtitle: 'Handpicked fruits & vegetables',
    ctaText: 'Shop fresh',
    image: images.bannerGrocery,
    bgTint: '#F7FAF7',
  },
  {
    id: 'banner-3',
    tag: 'NEEDE Express',
    subtag: 'Superfast delivery',
    title: 'Delivered In\n8 Minutes',
    subtitle: 'Daily essentials at your doorstep',
    ctaText: 'Explore deals',
    image: images.bannerHaircare,
    bgTint: '#F0F7FD',
  },
];

export const topStores: StoreItem[] = [
  {
    id: 'store-1',
    name: 'Star Bazaar',
    rating: 4.5,
    distance: '1.2 km',
    time: '10-15 mins',
    tag: 'OPEN',
    isOpen: true,
    image: images.storeStarBazaar,
    logoText: 'SB',
  },
  {
    id: 'store-2',
    name: 'More Supermarket',
    rating: 4.2,
    distance: '0.8 km',
    time: '8-12 mins',
    tag: 'OPEN',
    isOpen: true,
    image: images.storeMore,
    logoText: 'MORE',
  },
  {
    id: 'store-3',
    name: 'Star Bazaar',
    rating: 4.5,
    distance: '1.2 km',
    time: '10-15 mins',
    tag: 'OPEN',
    isOpen: true,
    image: images.storeStarBazaar,
    logoText: 'SB',
  },
  {
    id: 'store-4',
    name: "Nature's Basket",
    rating: 4.6,
    distance: '1.8 km',
    time: '12-16 mins',
    tag: 'OPEN',
    isOpen: true,
    image: images.storeMore,
    logoText: 'NB',
  },
];

export const dealsNearYou: DealItem[] = [
  {
    id: 'deal-1',
    title: 'Amul Taaza Milk',
    weight: '500 ml',
    price: 28,
    originalPrice: 30,
    discount: '15% OFF',
    image: images.dealMilk,
  },
  {
    id: 'deal-2',
    title: "Lay's Classic Salted",
    weight: '52 g',
    price: 17,
    originalPrice: 20,
    discount: '15% OFF',
    image: images.dealChips,
  },
  {
    id: 'deal-3',
    title: 'Aashirvaad Atta',
    weight: '5 kg',
    price: 220,
    originalPrice: 245,
    discount: '10% OFF',
    image: images.dealAtta,
  },
  {
    id: 'deal-4',
    title: 'Fortune Sunflower Oil',
    weight: '1 L',
    price: 135,
    originalPrice: 155,
    discount: '12% OFF',
    image: images.dealOil,
  },
  {
    id: 'deal-5',
    title: 'Britannia Good Day',
    weight: '200 g',
    price: 35,
    originalPrice: 40,
    discount: '12% OFF',
    image: images.catBakeryBiscuits,
  },
];

export const groceryKitchenCategories: CategoryItem[] = [
  {
    id: 'gk-1',
    name: 'Vegetables &\nFruits',
    image: images.catVegFruits,
  },
  {
    id: 'gk-2',
    name: 'Atta, Rice &\nDal',
    image: images.catAttaRiceDal,
  },
  {
    id: 'gk-3',
    name: 'Oil, Ghee &\nMasala',
    image: images.catOilGheeMasala,
  },
  {
    id: 'gk-4',
    name: 'Dairy, Bread &\nEggs',
    image: images.catDairyBreadEggs,
  },
  {
    id: 'gk-5',
    name: 'Bakery &\nBiscuits',
    image: images.catBakeryBiscuits,
  },
  {
    id: 'gk-6',
    name: 'Dry Fruits &\nCereals',
    remoteImageUrl:
      'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=300&q=80',
    iconFallback: 'nutrition-outline',
  },
  {
    id: 'gk-7',
    name: 'Chicken, Meat &\nFish',
    remoteImageUrl:
      'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=300&q=80',
    iconFallback: 'restaurant-outline',
  },
  {
    id: 'gk-8',
    name: 'Kitchenware &\nAppliances',
    remoteImageUrl:
      'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=300&q=80',
    iconFallback: 'hardware-chip-outline',
  },
];

export const snacksDrinksCategories: CategoryItem[] = [
  {
    id: 'sd-1',
    name: 'Chips &\nNamkeen',
    image: images.dealChips,
    iconFallback: 'fast-food-outline',
  },
  {
    id: 'sd-2',
    name: 'Sweets &\nChocolates',
    remoteImageUrl:
      'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=300&q=80',
    iconFallback: 'gift-outline',
  },
  {
    id: 'sd-3',
    name: 'Drinks &\nJuices',
    remoteImageUrl:
      'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=300&q=80',
    iconFallback: 'wine-outline',
  },
  {
    id: 'sd-4',
    name: 'Tea, Coffee &\nMilk Drinks',
    remoteImageUrl:
      'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=300&q=80',
    iconFallback: 'cafe-outline',
  },
  {
    id: 'sd-5',
    name: 'Instant Food',
    remoteImageUrl:
      'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=300&q=80',
    iconFallback: 'timer-outline',
  },
  {
    id: 'sd-6',
    name: 'Sauces &\nSpreads',
    remoteImageUrl:
      'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=300&q=80',
    iconFallback: 'flask-outline',
  },
  {
    id: 'sd-7',
    name: 'Paan Corner',
    remoteImageUrl:
      'https://images.unsplash.com/photo-1628088062854-d1870b4553da?auto=format&fit=crop&w=300&q=80',
    iconFallback: 'sparkles-outline',
  },
  {
    id: 'sd-8',
    name: 'Ice Creams &\nMore',
    remoteImageUrl:
      'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?auto=format&fit=crop&w=300&q=80',
    iconFallback: 'ice-cream-outline',
  },
];
