# Neede Mobile App — Production Architecture, Performance & Development Guidelines

## 1. Purpose

This document defines the recommended production architecture for the **Neede React Native mobile application**.

The goal is not only to keep the code clean, but also to make the application:

- Fast on low-end and mid-range Android devices
- Smooth while scrolling
- Fast when opening screens
- Efficient with API requests
- Efficient with images
- Resistant to unnecessary re-renders
- Easy to scale as Neede grows
- Easy for multiple developers to maintain
- Safe to modify without creating duplicate architecture

The project is based on:

- Expo SDK 57
- React Native 0.86
- TypeScript
- Expo Router
- Redux Toolkit
- Axios
- React Native Reanimated
- React Native Worklets
- React Native Gesture Handler
- EAS Build

> **Performance principle:** A fast app is not created by adding more libraries. It is created by reducing unnecessary work: unnecessary renders, API calls, memory usage, JavaScript execution, navigation work, image processing, and large payloads.

---

# 2. Core Architecture Principle

Use this order whenever implementing anything:

```text
Understand requirement
        ↓
Check existing feature/module
        ↓
Reuse existing component/service/hook
        ↓
Keep screen thin
        ↓
Keep server state outside Redux where possible
        ↓
Keep local UI state local
        ↓
Optimize data + images
        ↓
Measure performance
        ↓
Only then add new abstraction
```

### Golden rule

> **Reuse first → isolate feature logic → minimize renders → minimize network work → measure → optimize.**

Do not create architecture only because a feature is new.

---

# 3. Recommended Production Folder Structure

The existing structure is good as a starting point, but for a growing marketplace application, feature-specific code should not be mixed into one large global folder.

Use:

```text
neede/
│
├── src/
│   │
│   ├── app/                         # Expo Router only
│   │   ├── _layout.tsx
│   │   ├── index.tsx
│   │   │
│   │   ├── auth/
│   │   │   ├── login.tsx
│   │   │   ├── register.tsx
│   │   │   └── forgot-password.tsx
│   │   │
│   │   ├── (tabs)/
│   │   │   ├── _layout.tsx
│   │   │   ├── index.tsx
│   │   │   ├── shops.tsx
│   │   │   ├── orders.tsx
│   │   │   └── profile.tsx
│   │   │
│   │   ├── shop/
│   │   │   └── [id].tsx
│   │   │
│   │   ├── product/
│   │   │   └── [id].tsx
│   │   │
│   │   ├── cart/
│   │   │   └── index.tsx
│   │   │
│   │   └── checkout/
│   │       └── index.tsx
│   │
│   ├── features/
│   │   ├── auth/
│   │   │   ├── api/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── screens/
│   │   │   ├── types/
│   │   │   └── utils/
│   │   │
│   │   ├── home/
│   │   │   ├── api/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── types/
│   │   │
│   │   ├── shop/
│   │   │   ├── api/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── types/
│   │   │
│   │   ├── product/
│   │   │   ├── api/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── types/
│   │   │
│   │   ├── cart/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── store/
│   │   │   └── types/
│   │   │
│   │   ├── checkout/
│   │   │   ├── api/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── types/
│   │   │
│   │   ├── orders/
│   │   │   ├── api/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── types/
│   │   │
│   │   └── profile/
│   │       ├── api/
│   │       ├── components/
│   │       ├── hooks/
│   │       └── types/
│   │
│   ├── components/
│   │   ├── ui/
│   │   ├── layout/
│   │   ├── feedback/
│   │   └── forms/
│   │
│   ├── store/
│   │   ├── index.ts
│   │   └── slices/
│   │
│   ├── services/
│   │   ├── api/
│   │   │   ├── client.ts
│   │   │   ├── interceptors.ts
│   │   │   └── errors.ts
│   │   ├── storage/
│   │   └── analytics/
│   │
│   ├── hooks/
│   │   ├── useAppDispatch.ts
│   │   ├── useAppSelector.ts
│   │   └── useDebounce.ts
│   │
│   ├── theme/
│   │   ├── colors.ts
│   │   ├── spacing.ts
│   │   ├── typography.ts
│   │   └── radius.ts
│   │
│   ├── constants/
│   │   ├── config.ts
│   │   ├── endpoints.ts
│   │   └── queryKeys.ts
│   │
│   ├── types/
│   │   └── common.ts
│   │
│   └── utils/
│       ├── validation.ts
│       ├── formatting.ts
│       └── performance.ts
│
├── assets/
│   ├── images/
│   ├── icons/
│   └── fonts/
│
├── app.json
├── eas.json
├── package.json
├── tsconfig.json
├── babel.config.js
├── metro.config.js
└── .env
```

---

# 4. Why `features/` Is Important

The original architecture puts most reusable logic into global folders.

That works for a small application, but Neede is a marketplace application with multiple business domains.

As the application grows, a global structure can become:

```text
components/
services/
hooks/
types/
utils/
```

with hundreds of unrelated files.

Instead, business logic should live close to its feature:

```text
features/
    shop/
    product/
    cart/
    checkout/
    orders/
```

This makes it easier to:

- Find code
- Delete a feature
- Modify a feature
- Prevent cross-feature coupling
- Onboard developers
- Keep APIs and components organized

### Important

Do not create a feature folder for every tiny UI element.

Use features for meaningful business domains.

---

# 5. Expo Router Rules

`src/app/` should contain **routes and route composition**, not large business logic.

A route should be thin.

Bad:

```tsx
export default function ShopScreen() {
  // 500+ lines of API logic
  // cart calculations
  // filtering
  // business rules
  // UI
  // network handling
}
```

Preferred:

```tsx
export default function ShopScreen() {
  return <ShopScreenContainer />;
}
```

Business logic should live in:

```text
features/shop/
```

### Route responsibility

Routes should primarily handle:

- Route parameters
- Navigation
- Screen composition
- Authentication guards
- Linking

Avoid turning route files into huge components.

---

# 6. State Management Strategy

Use different tools for different types of state.

## Local UI State

Use React state for:

- Modal visibility
- Input text
- Toggle state
- Temporary UI state
- Animation state

Example:

```tsx
const [isVisible, setIsVisible] = useState(false);
```

Do not put this into Redux.

---

## Global Client State

Redux Toolkit is appropriate for:

- Authentication session
- User information required globally
- Cart state
- App-level preferences
- Important cross-screen client state

---

## Server State

Do not automatically put API responses into Redux.

For server data such as:

- Shops
- Products
- Categories
- Orders
- Search results
- Vendor catalogues

prefer a server-state/cache solution such as **TanStack Query** if the project adopts it.

The objective is:

```text
API
 ↓
Query Cache
 ↓
Screen
```

instead of:

```text
API
 ↓
Redux
 ↓
Manual loading state
 ↓
Manual cache
 ↓
Manual refetch
 ↓
Screen
```

This reduces duplicated state-management logic and makes caching/refetching easier.

If TanStack Query is not introduced, keep the existing Axios architecture but implement explicit caching and request deduplication instead of storing every response globally.

---

# 7. Redux Rules

Only store data in Redux when it genuinely needs global client-side ownership.

### Good candidates

```text
auth
cart
user
app preferences
```

### Avoid

```text
all products
all shops
every API response
temporary loading states
modal visibility
input values
screen-specific filters
```

### Important performance rule

Avoid selecting the entire Redux store:

```tsx
const state = useSelector(state => state);
```

Prefer:

```tsx
const cartCount = useAppSelector(state => state.cart.itemCount);
```

A component should subscribe only to the state it needs.

---

# 8. Component Architecture

Components should have one clear responsibility.

Recommended:

```text
ProductCard
ProductImage
ProductPrice
ProductQuantity
AddToCartButton
```

instead of one 500-line product component.

However, do not split every five lines into another component.

The goal is:

> **Reasonable component boundaries, not maximum component count.**

---

# 9. Rendering Performance

This is one of the most important sections for Neede.

## Avoid unnecessary re-renders

Do not create new objects unnecessarily inside large lists:

Bad:

```tsx
<ProductCard
  style={{ marginBottom: 10 }}
  product={{ ...product }}
/>
```

Prefer stable values and references.

Use:

```tsx
const styles = StyleSheet.create({
  card: {
    marginBottom: 10,
  },
});
```

---

# 10. `useMemo` and `useCallback`

Do not blindly use `useMemo` and `useCallback` everywhere.

Use them when they prevent meaningful work or stabilize props passed into memoized/list components.

Example:

```tsx
const filteredProducts = useMemo(
  () => products.filter(product => product.available),
  [products]
);
```

For callbacks passed to large lists:

```tsx
const handleAddToCart = useCallback(
  (productId: string) => {
    dispatch(addToCart(productId));
  },
  [dispatch]
);
```

Do not add memoization simply because it sounds faster.

Measure first when performance is unclear.

---

# 11. Memoize Expensive List Items

Large product lists should use memoized item components.

```tsx
const ProductCard = React.memo(function ProductCard({
  product,
}: ProductCardProps) {
  return (
    // UI
  );
});
```

Make sure the props passed to the component are stable.

---

# 12. Lists Are Critical

Neede will contain:

- Product lists
- Shop lists
- Categories
- Orders
- Search results
- Cart items

Never render large dynamic lists using:

```tsx
ScrollView
```

with hundreds of children.

Use:

```tsx
FlatList
```

or an appropriately optimized virtualized list implementation.

Example:

```tsx
<FlatList
  data={products}
  renderItem={renderProduct}
  keyExtractor={item => item.id.toString()}
  initialNumToRender={10}
  maxToRenderPerBatch={10}
  windowSize={7}
  removeClippedSubviews
/>
```

Tune these values based on actual device testing rather than copying values blindly.

---

# 13. FlatList Rules

For every important list:

- Always provide `keyExtractor`
- Keep `renderItem` stable
- Memoize expensive item components
- Avoid inline objects when possible
- Avoid inline functions for expensive children
- Avoid nested virtualized lists
- Avoid rendering huge data sets at once
- Use pagination/infinite loading
- Keep item components lightweight

---

# 14. Pagination

Never request thousands of products when the screen only displays the first 20–30.

Preferred:

```text
GET /products?page=1&limit=20
```

Then:

```text
scroll
 ↓
load next page
 ↓
append results
```

For search:

```text
search query
 ↓
debounce
 ↓
API request
 ↓
pagination
```

---

# 15. Search Debouncing

Never make an API request on every keystroke.

Bad:

```text
m
ma
mar
mark
market
```

= 5 API requests.

Preferred:

```text
User types
 ↓
wait ~300ms
 ↓
send one request
```

Use a reusable:

```text
useDebounce()
```

hook.

---

# 16. API Architecture

Use one shared Axios client.

```text
services/api/client.ts
```

The client should handle:

- Base URL
- Timeout
- Authentication headers
- Request configuration
- Common response handling
- Error normalization
- Token refresh if required

Never create Axios instances inside individual screens.

---

# 17. API Request Cancellation

Search, product and shop requests can become obsolete.

Example:

```text
User searches:
"milk"
then immediately:
"milk powder"
```

The first request should not overwrite the result of the second request.

Use request cancellation/AbortController where appropriate.

This prevents:

- Race conditions
- Stale UI
- Unnecessary network work

---

# 18. API Response Size

Backend performance directly affects mobile performance.

Do not return unnecessary fields.

Bad:

```json
{
  "id": 1,
  "name": "...",
  "description": "...",
  "supplier": "...",
  "created_by": "...",
  "internal_notes": "...",
  "full_metadata": "...",
  "all_images": [...]
}
```

when the product card needs only:

```json
{
  "id": 1,
  "name": "...",
  "price": 100,
  "discount": 10,
  "thumbnail": "..."
}
```

Use lightweight list endpoints and detailed endpoints separately.

---

# 19. API Caching

Frequently accessed data should not always be requested again.

Examples:

```text
Categories
Nearby shops
Product catalogue
User profile
```

Use appropriate caching with stale-time/invalidation rules.

For example:

```text
Categories
 ↓
cache
 ↓
reuse
```

Instead of:

```text
Open Home
 ↓
API

Open Shop
 ↓
API

Go Back
 ↓
API

Open Home Again
 ↓
API
```

Cache invalidation should happen when data actually changes.

---

# 20. Parallel API Requests

If two requests are independent, do not unnecessarily wait for one before starting the other.

Instead of:

```text
getCategories()
 ↓
getBanners()
 ↓
getNearbyShops()
```

prefer parallel requests:

```tsx
await Promise.all([
  getCategories(),
  getBanners(),
  getNearbyShops(),
]);
```

Only use sequential requests when the second request genuinely depends on the first.

---

# 21. Home Screen Performance

The Home screen is usually the most important screen for perceived performance.

Do not block the entire screen waiting for every API.

Preferred:

```text
Open Home
 ↓
Render shell immediately
 ↓
Show cached/previous data if available
 ↓
Load important data
 ↓
Load secondary sections
```

Example:

```text
Header
Location
Categories
Nearby shops
Offers
Recommended products
```

Do not make low-priority sections delay the entire page.

---

# 22. Skeleton Loading

Avoid showing a full-screen spinner for every API request.

Use skeleton/loading placeholders for content-heavy screens.

Example:

```text
Home
 ├── Header
 ├── Category Skeleton
 ├── Shop Skeleton
 └── Product Skeleton
```

The user should see the structure immediately.

Use full-screen loaders only when the application genuinely cannot display anything useful.

---

# 23. Navigation Performance

Do not perform expensive operations during navigation transitions.

Avoid:

```text
Navigate
 ↓
large synchronous calculation
 ↓
parse huge JSON
 ↓
render hundreds of components
```

Instead:

```text
Navigate
 ↓
render screen shell
 ↓
perform work asynchronously
 ↓
render data
```

---

# 24. Avoid Heavy Work on the JS Thread

The JavaScript thread should remain available for:

- Touch events
- Navigation
- Rendering
- Business logic

Avoid expensive synchronous operations such as:

- Large JSON transformations
- Huge array sorting
- Large filtering operations
- Heavy image processing
- Large synchronous loops

Move heavy work out of the critical interaction path.

---

# 25. Images — Major Performance Rule

Images can become one of the biggest performance problems in a grocery marketplace application.

Do not load original/high-resolution images into product cards.

Preferred:

```text
Product card
 ↓
thumbnail image
```

Product details:

```text
detail image
```

Use backend/CDN image transformations where possible.

For example:

```text
thumbnail: 300px
medium: 600px
detail: 1200px
```

Do not download a 3000px image when a 300px image is displayed.

---

# 26. Image Rules

Every product image should have:

- Appropriate dimensions
- Appropriate compression
- WebP/AVIF where supported by the delivery pipeline
- Placeholder/fallback
- Stable URL
- CDN delivery where possible

Avoid loading many large images simultaneously.

---

# 27. Image Caching

Use an image component/strategy that provides effective caching.

The goal:

```text
First visit
 ↓
download image

Second visit
 ↓
read cached image
 ↓
display quickly
```

Do not repeatedly download identical product images.

---

# 28. Assets

Static assets should be organized:

```text
assets/
├── images/
├── icons/
└── fonts/
```

Avoid bundling huge unused images.

Before adding an image:

- Resize it
- Compress it
- Use the correct format
- Confirm whether it really needs to be bundled

---

# 29. Fonts

Only bundle fonts that are actually required.

Do not include multiple unused font families and weights.

For Neede, keep typography centralized:

```text
theme/typography.ts
```

Do not repeatedly define font sizes and weights throughout the application.

---

# 30. Theme

Keep all design tokens centralized:

```text
theme/
├── colors.ts
├── spacing.ts
├── typography.ts
└── radius.ts
```

The Neede brand color should be defined once and reused.

Avoid hardcoding the same values across hundreds of files.

---

# 31. Storage Strategy

Separate storage responsibilities.

### Secure data

Use secure storage for:

- Authentication credentials/tokens where appropriate
- Sensitive user data

### Non-sensitive preferences

Use normal persistent storage for:

- Onboarding completion
- UI preferences
- Non-sensitive cached preferences

Never store secrets in:

```text
Redux persist
.env exposed to client
plain source code
console logs
```

---

# 32. Authentication

Authentication flow should be centralized.

Preferred:

```text
App starts
 ↓
Restore session
 ↓
Validate token/session
 ↓
Auth route OR main app
```

Do not make every screen independently check authentication.

---

# 33. Cart Architecture

Cart is critical for Neede.

Cart state should be designed carefully because multiple vendors can exist in one order.

Keep the cart normalized.

Example:

```text
cart
├── vendors
│   ├── vendorId
│   └── items[]
└── totals
```

Avoid repeatedly scanning large nested structures.

Keep derived values such as:

```text
itemCount
subtotal
deliveryFee
discount
grandTotal
```

efficiently calculated.

---

# 34. Product Availability

Do not continuously poll product availability from every screen.

Use:

```text
API
 ↓
cache
 ↓
invalidate when needed
```

For real-time requirements, use an appropriate push/event mechanism rather than aggressive polling.

---

# 35. Nearby Vendor Architecture

Neede's nearby-store logic should primarily be handled by the backend.

The mobile app should not download every vendor and calculate geographic distance for thousands of vendors.

Preferred:

```text
User location
 ↓
Backend geospatial query
 ↓
Nearby vendors
 ↓
Mobile app
```

This reduces:

- Network payload
- JS processing
- Memory usage
- Battery usage

---

# 36. Location Requests

Do not request location repeatedly.

Use location only when required.

Preferred:

```text
Get location
 ↓
Store current location
 ↓
Refresh only when necessary
```

Avoid continuous GPS tracking unless a genuine feature requires it.

---

# 37. Background Work

Do not perform unnecessary background tasks.

Background operations can consume:

- Battery
- Network
- Memory
- CPU

Only use background functionality for actual product requirements.

---

# 38. Reanimated / Worklets / Gesture Handler

These libraries should be used where they solve a real UI problem.

Good use cases:

- Bottom sheets
- Swipe interactions
- Animated headers
- Drag gestures
- Smooth transitions
- Scroll-linked animations

Do not use animation libraries for simple static UI.

Avoid JS-thread animation loops for performance-sensitive animations.

---

# 39. Avoid Excessive Animations

Animations should communicate interaction, not slow the application.

Avoid:

- Long screen transitions
- Continuous unnecessary animations
- Multiple simultaneous animated elements
- Heavy blur effects everywhere

The application should feel fast before it looks fancy.

---

# 40. Modals and Bottom Sheets

Do not mount dozens of hidden heavy modals on every screen.

Prefer:

```text
One reusable modal
or
Feature-level modal
```

Mount expensive content only when required.

---

# 41. Error Handling

Use centralized error normalization.

Example:

```text
Network Error
Authentication Error
Validation Error
Server Error
Timeout
Unknown Error
```

The UI should receive a predictable error structure.

Do not write custom error parsing in every screen.

---

# 42. Loading State Rules

Avoid:

```text
isLoading
isProductsLoading
isShopLoading
isCategoryLoading
isSomethingLoading
```

spread throughout unrelated components.

Loading state should belong to the operation/query that owns it.

---

# 43. Empty State Rules

Every data-driven screen should handle:

```text
Loading
Success
Empty
Error
```

Example:

```text
Loading
 ↓
Data
```

or:

```text
Loading
 ↓
Empty
```

or:

```text
Loading
 ↓
Error
```

Never leave the user with a blank screen.

---

# 44. TypeScript Rules

Avoid:

```tsx
any
```

unless there is a documented reason.

Prefer:

```tsx
type Product = {
  id: string;
  name: string;
  price: number;
};
```

API responses should be typed.

Redux state should be typed.

Navigation parameters should be typed.

Component props should be typed.

---

# 45. Avoid Circular Dependencies

Architecture should flow in one direction:

```text
Route
 ↓
Feature
 ↓
Shared UI / Services
 ↓
Utilities
```

Avoid:

```text
Feature A
 ↕
Feature B
 ↕
Feature C
```

where features directly depend heavily on each other.

If shared business logic is genuinely required, move only that logic to an appropriate shared module.

---

# 46. Import Rules

Prefer aliases:

```tsx
import ProductCard from '@/features/product/components/ProductCard';
```

instead of:

```tsx
import ProductCard from '../../../../features/product/components/ProductCard';
```

This makes refactoring safer and code easier to read.

---

# 47. Barrel Export Rule

Do not create huge `index.ts` barrel files that export hundreds of modules if they cause unnecessary module loading or circular dependencies.

Use barrels selectively.

For performance-sensitive modules, direct imports are acceptable and often clearer.

---

# 48. Code Splitting / Lazy Loading

Do not load large feature code before it is required.

Keep rarely used heavy functionality away from the initial application path where practical.

Examples:

- Advanced settings
- Large admin-like tools
- Rare checkout functionality
- Heavy map functionality

The initial launch path should remain lightweight.

---

# 49. App Startup Performance

The first few seconds are critical.

Avoid doing all of this during startup:

```text
Restore everything
 ↓
Load profile
 ↓
Load shops
 ↓
Load categories
 ↓
Load products
 ↓
Load orders
 ↓
Load banners
 ↓
Load analytics
 ↓
Initialize every feature
```

Instead:

```text
Start app
 ↓
Initialize minimum required services
 ↓
Restore auth
 ↓
Render initial screen
 ↓
Load screen-specific data
 ↓
Load secondary services lazily
```

---

# 50. Splash Screen

The splash screen should not remain visible until every API request completes.

Use the splash screen only while the minimum required initialization happens.

Bad:

```text
Splash
 ↓
wait for all APIs
 ↓
wait for images
 ↓
wait for profile
 ↓
wait for products
 ↓
open app
```

Preferred:

```text
Splash
 ↓
minimum initialization
 ↓
open app
 ↓
load content progressively
```

---

# 51. React Strict Mode

Do not disable development checks simply to hide duplicate development behavior.

Understand whether an operation is safe to execute more than once.

API calls should be controlled with proper query/cache logic rather than disabling useful development checks.

---

# 52. Console Logs

Avoid production logs such as:

```tsx
console.log(hugeObject);
```

especially inside:

- FlatList render functions
- API interceptors
- Redux reducers
- Navigation events
- Scroll handlers

Large logs can significantly affect development performance.

Use a controlled logger if required.

---

# 53. Production Build Testing

Never judge application performance only from:

```bash
npx expo start
```

Development mode is not representative of production performance.

Test release builds using EAS.

Example:

```bash
eas build --platform android --profile preview
```

and production profiles where appropriate.

---

# 54. Performance Testing Devices

Test at least:

```text
Low-end Android
Mid-range Android
High-end Android
iPhone
```

A phone that feels fast to the developer may hide serious problems on low-end Android hardware.

---

# 55. Performance Checklist

Before considering a screen complete:

### Rendering

- [ ] No unnecessary re-renders
- [ ] Large lists are virtualized
- [ ] Expensive list items are memoized
- [ ] No unnecessary state updates
- [ ] No large synchronous calculations during render

### API

- [ ] Requests are not duplicated
- [ ] Search is debounced
- [ ] Pagination is implemented
- [ ] Responses are small
- [ ] Requests can be cancelled where needed
- [ ] Appropriate caching is used

### Images

- [ ] Thumbnail sizes are used
- [ ] Images are compressed
- [ ] Images are cached
- [ ] No huge images inside lists

### Navigation

- [ ] Screens open quickly
- [ ] Heavy work is not blocking transitions
- [ ] Route files remain thin

### Memory

- [ ] Large arrays are not duplicated
- [ ] Event listeners are cleaned up
- [ ] Timers are cleaned up
- [ ] Subscriptions are cleaned up
- [ ] Images are not unnecessarily retained

---

# 56. Memory Leak Prevention

Always clean up:

```tsx
useEffect(() => {
  const subscription = subscribe();

  return () => {
    subscription.remove();
  };
}, []);
```

Also clean up:

- Timers
- Event listeners
- WebSocket connections
- Location subscriptions
- Keyboard listeners
- AppState listeners

---

# 57. Avoid Storing Duplicate Data

Do not store the same product object in:

```text
Redux
screen state
local state
query cache
another feature state
```

without a clear reason.

Duplicate data increases:

- Memory
- Synchronization complexity
- Re-rendering
- Bugs

Prefer normalized/shared data where practical.

---

# 58. Data Normalization

For frequently updated entities such as products and shops, consider normalized state:

```text
productsById
productIds
```

instead of repeatedly duplicating the same full product object.

This becomes especially useful when the same product appears in:

- Home
- Shop
- Search
- Cart
- Recommendations

---

# 59. Prevent Race Conditions

Example:

```text
User opens Shop A
 ↓
request A

User quickly opens Shop B
 ↓
request B
```

If request A finishes after request B, it must not overwrite Shop B.

Use:

- Query keys
- Request cancellation
- Request identity
- Proper screen lifecycle handling

---

# 60. Backend + Mobile Performance

Mobile performance cannot be solved entirely in React Native.

The backend must also provide:

- Pagination
- Efficient SQL queries
- Proper indexes
- Geospatial queries
- Small response payloads
- CDN image delivery
- Caching
- Appropriate API endpoints

The mobile application and Laravel API should be treated as one performance system.

---

# 61. Recommended API Pattern for Neede

Use lightweight endpoints.

Example:

```text
GET /home
GET /shops/nearby
GET /shops/{id}
GET /shops/{id}/products
GET /products/{id}
GET /categories
GET /orders
```

Do not make the home screen download every possible piece of application data.

---

# 62. Recommended Home API Strategy

For maximum perceived speed, the backend can provide a consolidated lightweight home response when appropriate:

```json
{
  "location": {},
  "categories": [],
  "offers": [],
  "nearby_shops": [],
  "recommended_products": []
}
```

The response must remain small and optimized.

If the payload becomes too large, split it into independent cached queries.

The correct choice should be based on actual payload size and API latency.

---

# 63. Network Strategy

Prefer:

```text
Small request
+
Cache
+
Pagination
+
Compression
+
CDN
```

Avoid:

```text
Huge request
+
No cache
+
No pagination
+
Repeated requests
```

---

# 64. Offline / Poor Network Handling

Neede should remain usable on unstable mobile networks.

At minimum:

- Show cached content when safe
- Retry transient requests
- Provide clear offline/error states
- Avoid losing cart state
- Avoid blocking the entire app because one API failed

Do not retry failed requests aggressively.

Use bounded retry strategies.

---

# 65. Cart Persistence

Cart should survive:

```text
App background
App restart
Temporary network failure
```

Persist the minimum required cart state.

Do not persist unnecessary API responses.

---

# 66. Analytics

Analytics should not block UI.

Bad:

```text
User taps button
 ↓
wait for analytics
 ↓
navigate
```

Preferred:

```text
User taps button
 ↓
navigate immediately
 ↓
analytics event is recorded asynchronously
```

Never put analytics code into critical render paths.

---

# 67. Feature Boundary Rules

A feature owns its business logic.

Example:

```text
features/product/
    api/
    components/
    hooks/
    types/
```

The product feature can use shared:

```text
components/ui
services/api
theme
utils
```

But shared modules should not depend on product-specific modules.

---

# 68. Shared Component Rules

Use `src/components/ui/` for genuinely generic components:

```text
Button
Text
IconButton
Input
Card
Divider
Loader
Skeleton
```

Do not put business-specific components there.

For example:

```text
ProductCard
ShopCard
OrderCard
```

belong to their respective features.

---

# 69. Screen Naming

Expo Router dynamic routes should use:

```text
[id].tsx
```

Example:

```text
shop/[id].tsx
product/[id].tsx
```

Avoid custom route naming patterns unless required.

---

# 70. File Naming

Components:

```text
ProductCard.tsx
ShopCard.tsx
PrimaryButton.tsx
```

Hooks:

```text
useCart.ts
useShop.ts
useProducts.ts
```

API:

```text
productApi.ts
shopApi.ts
orderApi.ts
```

Types:

```text
product.ts
shop.ts
order.ts
```

Redux:

```text
cartSlice.ts
authSlice.ts
```

---

# 71. Do Not Create Duplicate Versions

Avoid:

```text
ProductCard.tsx
ProductCardNew.tsx
ProductCardV2.tsx
ProductCardLatest.tsx
```

Instead:

```text
ProductCard.tsx
```

Improve the original component.

If two components genuinely represent different concepts, use meaningful names.

---

# 72. Do Not Over-Engineer

Avoid creating:

```text
Manager
Factory
Repository
Provider
Wrapper
Adapter
Service
Helper
```

without a real problem to solve.

More abstraction does not automatically mean better architecture.

---

# 73. Dependency Rules

Before adding a package, ask:

1. Does React Native/Expo already provide this?
2. Can existing project code solve it?
3. Does the package add meaningful value?
4. Is it compatible with Expo SDK 57?
5. Does it increase bundle size?
6. Does it increase native complexity?
7. Does it affect startup time?

A dependency should solve a real problem.

---

# 74. Package Hygiene

Regularly review:

```bash
npm outdated
npx expo-doctor
```

Remove packages that are no longer required.

Do not keep dependencies simply because they were used in an old implementation.

---

# 75. Environment Configuration

Keep environment-specific values outside source code.

Use appropriate Expo environment configuration.

Never commit:

```text
API secrets
Private keys
Passwords
Production credentials
Private tokens
```

Remember that values shipped to a mobile application cannot be treated as true server-side secrets.

---

# 76. Security Rule

Anything inside a React Native application can potentially be extracted by a determined user.

Therefore:

```text
Mobile app
= public client
```

Sensitive business secrets must remain on the backend.

---

# 77. Code Quality

Before commit:

```bash
npx expo-doctor
```

Also verify:

```text
No unused imports
No duplicate code
No debug logs
No accidental secrets
No unnecessary API calls
No TypeScript errors
No obvious performance regressions
```

---

# 78. Development Workflow

For every feature:

```text
1. Understand requirement
        ↓
2. Identify feature
        ↓
3. Check existing code
        ↓
4. Reuse components
        ↓
5. Add/modify API
        ↓
6. Add state only if required
        ↓
7. Implement UI
        ↓
8. Optimize lists/images/network
        ↓
9. Test low-end device
        ↓
10. Test release build
        ↓
11. Run expo-doctor
        ↓
12. Commit
```

---

# 79. Performance Priority Order

When a screen is slow, investigate in this order:

```text
1. Network/API latency
2. API response size
3. Image size/loading
4. Number of rendered items
5. Unnecessary re-renders
6. Expensive JS calculations
7. Navigation/startup work
8. Memory usage
9. Animations
10. Micro-optimizations
```

Do not start by adding `useMemo()` everywhere.

---

# 80. Performance Measurement

Performance improvements must be measurable.

Track:

- Cold app startup
- Warm app startup
- Home screen load
- Shop screen load
- Product screen load
- API response time
- Image load time
- Scroll smoothness
- Memory usage
- Crash rate

Do not claim that a change made the app faster without measuring it.

---

# 81. Development Performance vs Production Performance

Always distinguish:

```text
Development performance
```

from:

```text
Release performance
```

Development mode can contain extra checks and debugging overhead.

Final performance decisions should be validated using release builds on real devices.

---

# 82. Recommended Neede Architecture

The final conceptual architecture should look like:

```text
                    ┌──────────────────┐
                    │    Expo Router   │
                    │    src/app/      │
                    └────────┬─────────┘
                             │
                             ↓
                    ┌──────────────────┐
                    │     Features     │
                    │                  │
                    │ Auth             │
                    │ Home             │
                    │ Shop             │
                    │ Product          │
                    │ Cart             │
                    │ Checkout         │
                    │ Orders           │
                    │ Profile          │
                    └───────┬──────────┘
                            │
              ┌─────────────┼─────────────┐
              ↓             ↓             ↓
       ┌────────────┐ ┌────────────┐ ┌────────────┐
       │ API/Query  │ │   Redux    │ │ Shared UI  │
       │ Server     │ │ Client     │ │ Components │
       │ State      │ │ State      │ │            │
       └──────┬─────┘ └──────┬─────┘ └────────────┘
              │              │
              └───────┬──────┘
                      ↓
              ┌───────────────┐
              │ Laravel API   │
              └───────┬───────┘
                      ↓
              ┌───────────────┐
              │ Cache / DB    │
              └───────────────┘
```

---

# 83. What Should Be Kept in Redux

Keep only important global client state.

Recommended:

```text
auth
cart
user
app preferences
```

Potentially:

```text
location
```

only if it is genuinely shared and frequently required.

Avoid using Redux as a universal API cache.

---

# 84. What Should NOT Be in Redux

Avoid storing:

```text
Every product response
Every shop response
Every category response
Search results
Temporary loading state
Modal visibility
Text input values
Screen-specific UI state
```

unless there is a specific architectural reason.

---

# 85. What Should Be Cached

Good candidates:

```text
Categories
Nearby shops
Shop catalogue
Product details
User profile
Order history
```

Cache duration should depend on how frequently the data changes.

---

# 86. Critical Neede Screens

Give extra performance attention to:

```text
Home
Nearby Shops
Shop Details
Product Listing
Search
Cart
Checkout
Orders
```

These screens directly affect the core customer journey.

---

# 87. Home Screen Golden Rule

The Home screen should never wait for non-critical content before becoming interactive.

Preferred:

```text
App opens
 ↓
Home shell
 ↓
Location / essential content
 ↓
Nearby shops
 ↓
Products/offers
 ↓
Secondary content
```

The exact sequence should be determined by real API timing and UX testing.

---

# 88. Shop Screen Golden Rule

Do not load every product variation at once.

Use:

```text
Shop information
 ↓
Categories
 ↓
Paginated products
```

If the catalogue is large:

```text
Category filter
+
Pagination
+
Cached results
```

---

# 89. Search Golden Rule

Search should be:

```text
Input
 ↓
300ms debounce
 ↓
Cancel previous request
 ↓
Paginated API
 ↓
Cached result
```

Do not search every keystroke.

---

# 90. Checkout Golden Rule

Checkout should avoid unnecessary API calls.

Load required data once and update only what changed.

Do not:

```text
change quantity
 ↓
reload entire checkout
 ↓
reload profile
 ↓
reload shop
 ↓
reload product
```

Update only the required totals/data.

---

# 91. Order Screen Golden Rule

Use pagination:

```text
20 orders
 ↓
scroll
 ↓
next 20
```

Do not load the entire order history.

---

# 92. Performance Anti-Patterns

Avoid:

```text
❌ API call inside render
❌ API call on every keystroke
❌ ScrollView for huge lists
❌ Huge images in lists
❌ Full Redux store selector
❌ Duplicate API responses in multiple states
❌ Huge JSON parsing during navigation
❌ Continuous location tracking without need
❌ Excessive polling
❌ Hundreds of mounted hidden components
❌ Long startup initialization
❌ Unnecessary animations
❌ console.log of large objects
❌ Uncontrolled retries
❌ Duplicate Axios clients
❌ Duplicate components
❌ Duplicate state layers
```

---

# 93. Performance Patterns

Prefer:

```text
✅ Pagination
✅ Query caching
✅ Request cancellation
✅ Debounced search
✅ Memoized expensive list items
✅ Virtualized lists
✅ Small API responses
✅ CDN images
✅ Image thumbnails
✅ Lazy loading
✅ Thin route files
✅ Feature-based architecture
✅ Local UI state
✅ Minimal Redux state
✅ Release-build testing
✅ Real-device profiling
```

---

# 94. Final Development Rule

Every developer should ask:

### Before adding code

```text
Does this already exist?
```

### Before adding state

```text
Does this really need to be global?
```

### Before adding an API call

```text
Can this be cached?
Can it be combined?
Can it be paginated?
```

### Before adding an image

```text
Is this image optimized for its display size?
```

### Before adding a dependency

```text
Do we actually need it?
```

### Before optimizing

```text
Do we have evidence that this is the bottleneck?
```

---

# 95. Final Architecture Principle

> **Keep routes thin.**
>
> **Keep features isolated.**
>
> **Keep global state minimal.**
>
> **Keep server data cached.**
>
> **Keep API payloads small.**
>
> **Keep images optimized.**
>
> **Keep lists virtualized.**
>
> **Keep the JS thread free.**
>
> **Keep startup lightweight.**
>
> **Measure before micro-optimizing.**

The objective is not to make the codebase complicated.

The objective is to make Neede:

```text
Fast
+
Stable
+
Scalable
+
Maintainable
+
Easy to debug
+
Easy to extend
```

---

# 96. Quick Reference

| Responsibility | Location |
|---|---|
| Expo Router routes | `src/app/` |
| Business features | `src/features/` |
| Generic UI | `src/components/ui/` |
| Global client state | `src/store/` |
| API client | `src/services/api/` |
| Server-state/cache | Query layer / feature API |
| Shared hooks | `src/hooks/` |
| Feature hooks | `src/features/*/hooks/` |
| Feature types | `src/features/*/types/` |
| Shared types | `src/types/` |
| Theme | `src/theme/` |
| Constants | `src/constants/` |
| Utilities | `src/utils/` |
| Static assets | `assets/` |
| Environment config | `.env` / Expo config |
| Expo configuration | Root |

---

# 97. Final Rule for Future Development

When a new requirement arrives:

```text
Requirement
    ↓
Find existing feature
    ↓
Find existing component
    ↓
Find existing API/service
    ↓
Find existing state
    ↓
Reuse
    ↓
Extend
    ↓
Optimize
    ↓
Measure
    ↓
Only create something new if necessary
```

> **Architecture should evolve deliberately, not accidentally.**
