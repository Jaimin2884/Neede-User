# Neede Mobile App — Project Structure & Development Guidelines

## 1. Project Overview

This document defines the standard folder structure and development rules for the **Neede React Native mobile application**.

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

The main purpose of this document is to keep the project **clean, scalable, maintainable, and consistent** throughout development.

---

# 2. Core Rule — Do Not Create Unnecessary Folders

> **IMPORTANT:** As development progresses, use the existing project structure first.

### Rules

1. **Do not create a new top-level folder** unless there is a genuine architectural requirement.
2. **Do not create duplicate folders** for the same purpose.
3. Before creating a new folder or file, check whether an existing folder already fits the requirement.
4. New screens should normally be added inside the existing `src/app/` structure.
5. Reusable UI should go inside the existing `src/components/` structure.
6. API-related code should go inside `src/services/`.
7. Redux-related code should go inside `src/store/`.
8. Types should go inside `src/types/`.
9. Shared constants should go inside `src/constants/`.
10. Utility/helper functions should go inside `src/utils/`.
11. Custom hooks should go inside `src/hooks/`.
12. Theme-related files should go inside `src/theme/`.
13. **Do not create a folder just because a new feature has been added.** Reuse the existing architecture wherever possible.

---

# 3. Standard Folder Structure

The project should follow this structure:

```text
neede/
│
├── src/
│   │
│   ├── app/
│   │   ├── _layout.tsx
│   │   ├── index.tsx
│   │   │
│   │   ├── (auth)/
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
│   ├── components/
│   │   ├── common/
│   │   ├── buttons/
│   │   ├── cards/
│   │   ├── inputs/
│   │   ├── modals/
│   │   └── loaders/
│   │
│   ├── store/
│   │   ├── index.ts
│   │   └── slices/
│   │       ├── authSlice.ts
│   │       ├── cartSlice.ts
│   │       ├── userSlice.ts
│   │       └── shopSlice.ts
│   │
│   ├── services/
│   │   ├── api.ts
│   │   ├── authApi.ts
│   │   ├── shopApi.ts
│   │   ├── productApi.ts
│   │   └── orderApi.ts
│   │
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   └── useAppSelector.ts
│   │
│   ├── types/
│   │   ├── auth.ts
│   │   ├── shop.ts
│   │   ├── product.ts
│   │   └── order.ts
│   │
│   ├── constants/
│   │   ├── colors.ts
│   │   ├── config.ts
│   │   └── endpoints.ts
│   │
│   ├── utils/
│   │   ├── storage.ts
│   │   ├── validation.ts
│   │   └── helpers.ts
│   │
│   └── theme/
│       ├── colors.ts
│       ├── spacing.ts
│       └── typography.ts
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
└── .env
```

---

# 4. Folder Responsibilities

## `src/app/`

Contains application screens and Expo Router routes.

Use this folder for:

- Login screen
- Register screen
- Home screen
- Shop screen
- Product details
- Cart
- Checkout
- Orders
- Profile
- Other application routes

### Rule

A new screen should be created here rather than creating a separate top-level `screens/` folder.

Example:

```text
src/app/shop/[id].tsx
src/app/product/[id].tsx
```

---

## `src/components/`

Contains reusable UI components.

Examples:

```text
Button
Input
ProductCard
ShopCard
ProductImage
Header
Modal
Loader
EmptyState
```

Use the existing component categories before creating a new folder.

For example:

```text
src/components/cards/ProductCard.tsx
```

Do not create:

```text
src/productComponents/
src/shopComponents/
src/uiComponents/
```

unless there is a clear architectural reason.

---

## `src/store/`

Contains Redux Toolkit configuration and slices.

Example:

```text
src/store/index.ts
src/store/slices/authSlice.ts
src/store/slices/cartSlice.ts
src/store/slices/shopSlice.ts
```

All global application state should be evaluated for placement here before introducing another state-management structure.

---

## `src/services/`

Contains API communication and external service logic.

Example:

```text
src/services/api.ts
src/services/authApi.ts
src/services/shopApi.ts
src/services/productApi.ts
src/services/orderApi.ts
```

`api.ts` should contain the common Axios configuration/interceptor setup.

Feature-specific API calls should remain in the existing `services/` directory.

Do not create:

```text
src/api/
src/network/
src/http/
```

for the same responsibility.

---

## `src/hooks/`

Contains reusable custom React hooks.

Examples:

```text
useAuth.ts
useAppSelector.ts
useAppDispatch.ts
useDebounce.ts
```

Add a hook here when it is reusable or logically belongs to shared application behavior.

---

## `src/types/`

Contains TypeScript interfaces, types, and shared data models.

Examples:

```text
auth.ts
shop.ts
product.ts
order.ts
```

Do not create separate duplicate folders such as:

```text
interfaces/
models/
interfaces/types/
```

unless specifically required by the architecture.

---

## `src/constants/`

Contains shared static values.

Examples:

```text
colors.ts
config.ts
endpoints.ts
```

Examples of suitable content:

- API endpoint constants
- Application configuration
- Shared constant values
- Static configuration keys

---

## `src/utils/`

Contains reusable helper functions.

Examples:

```text
storage.ts
validation.ts
helpers.ts
```

Use this folder for generic reusable logic that does not belong to a component, hook, API service, or Redux slice.

---

## `src/theme/`

Contains centralized styling/theme definitions.

Examples:

```text
colors.ts
spacing.ts
typography.ts
```

The Neede primary brand color should remain centralized instead of being repeated throughout components.

---

# 5. Assets

Use:

```text
assets/
├── images/
├── icons/
└── fonts/
```

for static assets.

Examples:

```text
assets/images/logo.png
assets/images/product-placeholder.png
assets/icons/cart.png
assets/fonts/...
```

Do not create feature-specific asset folders unless the number and organization of assets genuinely requires it.

---

# 6. Navigation Rules

The project uses **Expo Router**.

Routes belong inside:

```text
src/app/
```

Use route groups such as:

```text
(auth)
(tabs)
```

when screens belong to a specific navigation flow but should not affect the URL/path structure.

Dynamic routes should use Expo Router's standard format:

```text
shop/[id].tsx
product/[id].tsx
```

Do not introduce a second navigation architecture without a specific requirement.

---

# 7. Redux Rules

Use **Redux Toolkit** for application-wide state.

Recommended slices:

```text
authSlice
cartSlice
userSlice
shopSlice
```

Create a new slice only when the state represents a meaningful application-level concern.

Do not create Redux slices for simple local component state.

For example:

```tsx
const [isVisible, setIsVisible] = useState(false);
```

is usually better than creating a Redux slice for a local modal visibility state.

---

# 8. Axios / API Rules

Use a centralized Axios instance:

```text
src/services/api.ts
```

The common API layer should handle things such as:

- Base URL
- Authentication headers
- Request configuration
- Response handling
- Common error handling
- Token refresh logic, if required

Feature APIs should use the common instance:

```text
authApi.ts
shopApi.ts
productApi.ts
orderApi.ts
```

Avoid creating a new Axios instance in every screen.

---

# 9. Reanimated, Worklets & Gesture Handler

These libraries should be used only where their functionality is actually required.

### Reanimated

Use for:

- Smooth animations
- Bottom sheets
- Transitions
- Animated headers
- Animated product cards
- Scroll-based animations

### Worklets

Use where Reanimated/gesture-related logic requires worklet execution.

### Gesture Handler

Use for:

- Swipe
- Drag
- Pan
- Long press
- Pinch
- Other advanced gestures

Do not add these libraries or create extra architecture merely for simple static UI.

---

# 10. Naming Conventions

### Files

Use clear and consistent names.

Components:

```text
ProductCard.tsx
ShopCard.tsx
PrimaryButton.tsx
```

Hooks:

```text
useAuth.ts
useCart.ts
```

Redux:

```text
authSlice.ts
cartSlice.ts
```

API:

```text
authApi.ts
productApi.ts
```

Types:

```text
auth.ts
product.ts
shop.ts
```

---

# 11. Component Reuse Rule

Before creating a new component:

1. Check `src/components/`.
2. Check whether an existing component can be reused.
3. If necessary, extend the existing component.
4. Only create a new component when the UI/functionality is genuinely different.

Avoid duplicate components such as:

```text
ProductCard.tsx
ProductCardNew.tsx
ProductCardV2.tsx
ProductCardLatest.tsx
```

Instead, improve and reuse the original component where practical.

---

# 12. Screen Development Rule

When a new screen is required:

### First check:

```text
src/app/
```

Then determine the appropriate existing route.

For example, if a new shop-related screen is required:

```text
src/app/shop/
```

should be evaluated first.

Do not create:

```text
src/shopScreens/
src/shopPages/
src/shop/
```

at the root level simply because a new feature was introduced.

---

# 13. New Feature Rule

When implementing a new feature, follow this order:

```text
1. Check existing folders
        ↓
2. Check existing components
        ↓
3. Check existing services
        ↓
4. Check existing Redux slices
        ↓
5. Check existing types/hooks/utils
        ↓
6. Reuse existing code where possible
        ↓
7. Add only the required file
        ↓
8. Create a new folder only when genuinely necessary
```

The goal is to **extend the existing architecture, not continuously create new architecture.**

---

# 14. Avoid Over-Engineering

Do not create abstractions before they are required.

Avoid unnecessary:

- Managers
- Factories
- Providers
- Repositories
- Services
- Helpers
- Wrappers
- Duplicate API layers
- Duplicate state layers

If a simple existing structure solves the problem, use it.

---

# 15. Environment Variables

Environment-specific configuration should be kept outside source code where appropriate.

Example:

```text
.env
```

Do not hardcode:

```text
API keys
Private secrets
Production credentials
Tokens
Passwords
```

inside source files.

---

# 16. Git & Code Quality

Before committing code:

```bash
npx expo-doctor
```

and ensure the project builds correctly.

Keep:

- Unused files removed
- Unused imports removed
- Duplicate components avoided
- Duplicate functions avoided
- Console/debug code removed when not required
- Naming consistent
- Existing structure respected

---

# 17. Final Architecture Principle

The most important rule for this project is:

> **"Reuse first, extend second, create new only when necessary."**

As the Neede application grows, the folder structure should remain predictable.

### Do

```text
Existing folder
      ↓
Existing file/component
      ↓
Extend/reuse
      ↓
Add only required file
```

### Avoid

```text
New feature
      ↓
New folder
      ↓
New sub-folder
      ↓
Duplicate components
      ↓
Duplicate services
      ↓
Complex architecture
```

The project should grow **inside the defined architecture**, not by continuously adding new top-level folders.

---

# 18. Structure Changes

If a future requirement genuinely needs a new folder:

1. Confirm that the existing structure cannot reasonably support the requirement.
2. Use a clear and descriptive folder name.
3. Place it under the most appropriate existing parent folder.
4. Do not create a new top-level folder unless absolutely necessary.
5. Keep this document updated if the architectural structure changes.

---

# 19. Quick Reference

| Requirement | Location |
|---|---|
| Screen / Route | `src/app/` |
| Reusable UI | `src/components/` |
| Redux | `src/store/` |
| API / Axios | `src/services/` |
| Custom Hook | `src/hooks/` |
| TypeScript Types | `src/types/` |
| Constants | `src/constants/` |
| Helper Functions | `src/utils/` |
| Theme | `src/theme/` |
| Images / Icons / Fonts | `assets/` |
| Expo Configuration | Root |
| Environment Variables | `.env` |

---

# 20. Development Standard

Every developer working on the Neede application should follow this structure.

**Do not create additional folders or files without first checking whether the existing architecture already provides a suitable location.**

The purpose of this standard is to keep the codebase:

- Clean
- Scalable
- Maintainable
- Easy to understand
- Easy to onboard new developers
- Easy to debug
- Consistent across the entire application

**Architecture should evolve deliberately, not accidentally.**
