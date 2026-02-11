# Design System - HKids

## Principes de Design

### Philosophie
- **Minimaliste et professionnel** : Design épuré sans emojis
- **Cohérence** : Système de design unifié
- **Accessibilité** : Contraste élevé, navigation claire
- **Performance** : Animations subtiles et fluides

---

## Palette de Couleurs

### Neutres (Principal)
- **Neutral-50**: `#fafafa` - Background principal
- **Neutral-100**: `#f5f5f5` - Background secondaire
- **Neutral-200**: `#e5e5e5` - Bordures
- **Neutral-300**: `#d4d4d4` - Bordures hover
- **Neutral-400**: `#a3a3a3` - Texte secondaire
- **Neutral-500**: `#737373` - Texte tertiaire
- **Neutral-600**: `#525252` - Texte secondaire
- **Neutral-700**: `#404040` - Texte principal
- **Neutral-900**: `#171717` - Texte principal, boutons

### Accents (Optionnel)
- Utilisés uniquement pour les catégories de livres
- Couleurs vives mais contrôlées

---

## Typographie

### Famille de Police
- **Primary**: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif
- **Font Smoothing**: Antialiased pour meilleure lisibilité

### Hiérarchie
- **H1**: `text-4xl` (36px) - Titres principaux
- **H2**: `text-2xl` (24px) - Sections
- **H3**: `text-xl` (20px) - Sous-sections
- **Body**: `text-base` (16px) - Texte principal
- **Small**: `text-sm` (14px) - Métadonnées
- **XSmall**: `text-xs` (12px) - Labels, badges

### Poids
- **Bold**: `font-bold` (700) - Titres
- **Semibold**: `font-semibold` (600) - Sous-titres
- **Medium**: `font-medium` (500) - Emphase
- **Regular**: `font-normal` (400) - Corps de texte

---

## Composants

### Boutons

#### Primary
```jsx
className="btn-primary"
// px-6 py-3 bg-neutral-900 text-white rounded-lg font-medium
```

#### Secondary
```jsx
className="btn-secondary"
// px-6 py-3 bg-white text-neutral-700 rounded-lg font-medium border
```

#### Ghost
```jsx
className="btn-ghost"
// px-4 py-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100
```

### Cartes

```jsx
className="bg-white rounded-lg border border-neutral-200 hover:border-neutral-300"
```

### Inputs

```jsx
className="px-4 py-2.5 bg-white border border-neutral-200 rounded-lg focus:ring-2 focus:ring-neutral-900"
```

---

## Espacements

### Scale
- **xs**: 0.5rem (8px)
- **sm**: 0.75rem (12px)
- **base**: 1rem (16px)
- **lg**: 1.5rem (24px)
- **xl**: 2rem (32px)
- **2xl**: 3rem (48px)

### Utilisation
- **Gap entre éléments**: `gap-2` à `gap-4`
- **Padding cartes**: `p-5`
- **Padding sections**: `px-6 py-12`

---

## Ombres

- **sm**: `shadow-sm` - Subtile, pour les bordures
- **md**: `shadow-md` - Standard, pour les cartes
- **lg**: `shadow-lg` - Prononcée, pour les modals

---

## Bordures

- **Radius standard**: `rounded-lg` (8px)
- **Radius petit**: `rounded-md` (6px)
- **Radius grand**: `rounded-xl` (12px)
- **Couleur**: `border-neutral-200`
- **Hover**: `hover:border-neutral-300`

---

## Animations

### Transitions
- **Durée standard**: `duration-200` (200ms)
- **Durée longue**: `duration-300` (300ms)
- **Easing**: `ease-in-out`

### Hover
- **Scale**: `hover:scale-105` (5% d'agrandissement)
- **Shadow**: `hover:shadow-md`
- **Color**: Transitions de couleur fluides

---

## Icônes

### Système d'Icônes
- **Format**: SVG inline
- **Taille standard**: `w-5 h-5` (20px)
- **Taille grande**: `w-6 h-6` (24px)
- **Couleur**: `text-neutral-600` par défaut
- **Hover**: `hover:text-neutral-900`

### Composants disponibles
- `BookIcon`, `SearchIcon`, `HeartIcon`, `HistoryIcon`
- `MoonIcon`, `SunIcon`, `LockIcon`
- `GridIcon`, `ListIcon`, `ChevronLeftIcon`, `ChevronRightIcon`
- `ZoomInIcon`, `ZoomOutIcon`, `MaximizeIcon`, `MinimizeIcon`

---

## États

### Hover
- Changement de couleur subtil
- Légère élévation (shadow)
- Scale minimal (1.05)

### Active
- Scale réduit (0.98)
- Feedback immédiat

### Disabled
- Opacité réduite (0.5)
- Cursor not-allowed
- Pas d'interaction

### Focus
- Ring visible (focus:ring-2)
- Couleur: neutral-900
- Accessibilité améliorée

---

## Responsive

### Breakpoints
- **sm**: 640px
- **md**: 768px
- **lg**: 1024px
- **xl**: 1280px

### Stratégie
- Mobile-first
- Grille adaptative
- Navigation simplifiée sur mobile

---

## Accessibilité

### Contraste
- Texte principal: ratio 7:1 minimum
- Texte secondaire: ratio 4.5:1 minimum

### Navigation
- Focus states visibles
- Navigation clavier complète
- ARIA labels où nécessaire

### Performance
- Animations GPU-accelerated
- Lazy loading des images
- Code splitting

---

## Exemples d'Utilisation

### Carte de Livre
```jsx
<div className="bg-white rounded-lg border border-neutral-200 overflow-hidden hover:border-neutral-300">
  <div className="h-64 bg-neutral-100">
    {/* Image */}
  </div>
  <div className="p-5">
    <h3 className="font-semibold text-lg text-neutral-900">Titre</h3>
    <p className="text-sm text-neutral-500">Auteur</p>
  </div>
</div>
```

### Bouton avec Icône
```jsx
<button className="btn-ghost flex items-center gap-2">
  <HeartIcon className="w-4 h-4" />
  <span>Favoris</span>
</button>
```

---

**Ce design system garantit une expérience cohérente et professionnelle à travers toute l'application.**

