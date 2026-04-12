# BoatCheckin — Frontend Agent
# @FRONTEND

## Role
You are the frontend engineer for BoatCheckin.
You own all React components, pages, PWA setup,
animations, and the guest + operator UI.
Always reference @DESIGN.md for visual standards.
Always reference @SECURITY.md for XSS prevention.

---

## Stack

- Next.js 14 (App Router, TypeScript strict)
- Tailwind CSS (utility-first)
- next-pwa (PWA + service worker)
- i18next + react-i18next (multilingual)
- Leaflet.js (maps, no API key)
- qrcode.react (QR codes)
- Lucide React (icons)
- Framer Motion (transitions only)
- html2canvas (postcard generation)

---

## TypeScript Standards

```typescript
// Always strict mode
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  }
}

// Always type props explicitly
interface TripCardProps {
  trip: TripWithBoat
  onJoin: () => void
}

// Never use 'any'
// Use 'unknown' then narrow with type guards

// Type all API responses
interface ApiResponse<T> {
  data: T | null
  error: string | null
}
```

---

## Component Architecture

```
components/
  ui/                     # Atomic, reusable
    Button.tsx
    Card.tsx
    Badge.tsx
    Input.tsx
    Checkbox.tsx
    ProgressBar.tsx
    AnchorLoader.tsx       # Loading state
    WeatherPill.tsx
    LanguagePicker.tsx
    
  trip/                   # Guest trip page sections
    TripHero.tsx
    WeatherWidget.tsx
    DockFinder.tsx
    CaptainProfile.tsx
    PackingChecklist.tsx
    BoatRules.tsx
    SafetyBriefing.tsx
    RouteMap.tsx
    OnboardInfo.tsx
    CostBreakdown.tsx
    CancellationPolicy.tsx
    AddOnBrowser.tsx
    JoinCTA.tsx            # Sticky bottom button
    
  join/                   # Join flow steps
    JoinSheet.tsx          # Bottom sheet container
    StepCode.tsx           # Step 1: trip code
    StepDetails.tsx        # Step 2: personal info
    StepWaiver.tsx         # Step 3: waiver signing
    StepAddons.tsx         # Step 4: add-on ordering
    StepConfirmation.tsx   # QR boarding pass
    
  dashboard/              # Operator dashboard
    DashboardNav.tsx
    TripCard.tsx
    GuestListTable.tsx
    AddOnOrders.tsx
    RevenueChart.tsx
    ReviewCard.tsx
    WeatherAlert.tsx
    
  shared/
    PostcardGenerator.tsx
    PWAInstallBanner.tsx
    OfflineBanner.tsx
```

---

## The Anchor Loading Component

```typescript
// components/ui/AnchorLoader.tsx
interface AnchorLoaderProps {
  size?: 'sm' | 'md' | 'lg'
  color?: 'navy' | 'white'
}

export function AnchorLoader({
  size = 'md',
  color = 'navy'
}: AnchorLoaderProps) {
  const sizes = { sm: 16, md: 24, lg: 48 }
  const px = sizes[size]
  
  return (
    <span
      role="status"
      aria-label="Loading"
      className="inline-block"
      style={{
        fontSize: px,
        animation: 'anchorRock 1.2s ease-in-out infinite',
        transformOrigin: 'center bottom',
        display: 'inline-block',
        color: color === 'white' ? '#FFFFFF' : '#0C447C',
      }}
    >
      ⚓
    </span>
  )
}

// In globals.css:
// @keyframes anchorRock {
//   0%   { transform: rotate(-8deg); }
//   50%  { transform: rotate(8deg); }
//   100% { transform: rotate(-8deg); }
// }
```

---

## Page Transitions

```typescript
// components/shared/PageTransition.tsx
'use client'
import { motion, AnimatePresence } from 'framer-motion'

const variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction < 0 ? '100%' : '-100%',
    opacity: 0,
  }),
}

export function StepTransition({
  children,
  step,
  direction,
}: {
  children: React.ReactNode
  step: number
  direction: number
}) {
  return (
    <AnimatePresence mode="wait" custom={direction}>
      <motion.div
        key={step}
        custom={direction}
        variants={variants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{ duration: 0.25, ease: 'easeInOut' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
```

---

## PWA Setup

```typescript
// next.config.ts
import withPWA from 'next-pwa'

const config = withPWA({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
})

export default config
```

```json
// public/manifest.json
{
  "name": "BoatCheckin",
  "short_name": "BoatCheckin",
  "description": "Your charter trip, all in one link",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#0C447C",
  "background_color": "#FFFFFF",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable any"
    }
  ]
}
```

---

## Multilingual Setup

```typescript
// lib/i18n/config.ts
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    supportedLngs: ['en', 'es', 'pt', 'fr', 'de', 'it', 'ru'],
    detection: {
      order: ['querystring', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
    interpolation: { escapeValue: false },
    resources: {
      en: { translation: require('./locales/en.json') },
      es: { translation: require('./locales/es.json') },
      pt: { translation: require('./locales/pt.json') },
      fr: { translation: require('./locales/fr.json') },
      de: { translation: require('./locales/de.json') },
      it: { translation: require('./locales/it.json') },
      ru: { translation: require('./locales/ru.json') },
    },
  })

export default i18n
```

```json
// lib/i18n/locales/en.json
{
  "trip": {
    "joinButton": "Join this trip →",
    "joinSubtext": "Check in · Sign waiver · Order add-ons",
    "weather": {
      "perfect": "Perfect conditions",
      "good": "Good conditions",
      "advisory": "Weather advisory",
      "storm": "Storm warning"
    },
    "dock": {
      "title": "Find Your Dock",
      "openMaps": "Open in Maps →"
    },
    "captain": {
      "title": "Meet Your Captain",
      "licensed": "USCG Licensed"
    },
    "bring": {
      "title": "What to Bring",
      "notBring": "⚠️ What NOT to bring (tap to expand)"
    },
    "rules": { "title": "Boat Rules" },
    "safety": { "title": "Safety on Board" },
    "route": { "title": "Today's Route" },
    "cost": { "title": "Full Cost Breakdown" },
    "cancel": { "title": "Cancellation Policy" },
    "addons": { "title": "Add-Ons Available" }
  },
  "join": {
    "step1": {
      "title": "Enter your trip code",
      "subtitle": "Your organiser included this in their message",
      "hint": "4-letter code from your organiser",
      "example": "e.g. SUN4"
    },
    "step2": {
      "title": "Your information",
      "name": "Full name",
      "emergencyName": "Emergency contact name",
      "emergencyPhone": "Emergency contact phone",
      "dietary": "Dietary requirements / allergies",
      "dietaryPlaceholder": "None",
      "language": "Language preference"
    },
    "step3": {
      "title": "Liability waiver",
      "agree": "I have read and agree to the terms above",
      "signPrompt": "Type your full name to sign"
    },
    "step4": {
      "title": "Enhance your experience",
      "subtitle": "Optional — you can skip this",
      "completeBtn": "Complete Check-in",
      "skip": "Skip"
    },
    "confirm": {
      "title": "You're checked in!",
      "subtitle": "See you at the dock, {{name}}",
      "addHome": "Add BoatCheckin to your home screen",
      "addHomeSub": "Get weather updates and dock alerts"
    }
  },
  "post": {
    "title": "Hope you had an amazing time! 🌊",
    "rate": "How was your experience?",
    "rebook": "Ready for another adventure?",
    "rebookBtn": "Book {{boatName}} again →",
    "share": "Share with a friend",
    "shareSub": "You both get 10% off your next charter",
    "shareBtn": "Share referral link",
    "postcard": "Download your trip postcard",
    "reviewGoogle": "Review on Google →",
    "reviewBoatsetter": "Review on Boatsetter →"
  },
  "loading": "Loading...",
  "error": {
    "generic": "Something went wrong. Please try again.",
    "invalidCode": "Incorrect trip code. Please check and try again.",
    "tripNotFound": "Trip not found or no longer available.",
    "tripFull": "This trip is now full."
  }
}
```

---

## Weather Widget Component

```typescript
// components/trip/WeatherWidget.tsx
'use client'
import { WeatherData } from '@/types/weather'

interface WeatherWidgetProps {
  weather: WeatherData | null
  loading?: boolean
}

export function WeatherWidget({ weather, loading }: WeatherWidgetProps) {
  if (loading) {
    return (
      <div className="w-full h-16 bg-[#E8F2FB] rounded-2xl flex items-center
                      justify-center border border-[#D0E2F3]">
        <AnchorLoader size="sm" color="navy" />
      </div>
    )
  }
  
  if (!weather) return null
  
  const config = getWeatherConfig(weather.code)
  
  return (
    <div
      className="w-full rounded-2xl px-4 py-3 flex items-center gap-3
                 border transition-colors duration-400"
      style={{ backgroundColor: config.bg, borderColor: config.border }}
    >
      <span className="text-2xl">{config.icon}</span>
      <div className="flex-1">
        <p className="font-semibold text-base"
           style={{ color: config.textStrong }}>
          {config.label}
        </p>
        <p className="text-sm" style={{ color: config.text }}>
          Winds {weather.windspeed}mph
        </p>
      </div>
      <p className="text-3xl font-bold"
         style={{ color: config.textStrong }}>
        {weather.temperature}°F
      </p>
    </div>
  )
}

function getWeatherConfig(code: number) {
  if (code === 0)     return { icon: '☀️', label: 'Perfect conditions',
                               bg: '#E8F9F4', border: '#A7E6D0',
                               text: '#1D6B4A', textStrong: '#1D6B4A' }
  if (code <= 3)      return { icon: '⛅', label: 'Good conditions',
                               bg: '#E8F9F4', border: '#A7E6D0',
                               text: '#1D6B4A', textStrong: '#1D6B4A' }
  if (code <= 48)     return { icon: '🌫️', label: 'Low visibility',
                               bg: '#FEF3DC', border: '#F5D78A',
                               text: '#7A4F00', textStrong: '#7A4F00' }
  if (code <= 67)     return { icon: '🌧️', label: 'Rain expected',
                               bg: '#FEF3DC', border: '#F5D78A',
                               text: '#7A4F00', textStrong: '#7A4F00' }
  if (code <= 82)     return { icon: '🌦️', label: 'Showers possible',
                               bg: '#FEF3DC', border: '#F5D78A',
                               text: '#7A4F00', textStrong: '#7A4F00' }
  return              { icon: '⛈️', label: 'Storm warning',
                        bg: '#FDEAEA', border: '#F5A5A5',
                        text: '#8B2A1A', textStrong: '#8B2A1A' }
}
```

---

## Join Flow State Machine

```typescript
// hooks/useJoinFlow.ts
import { useState } from 'react'

type Step = 'code' | 'details' | 'waiver' | 'addons' | 'confirmation'

interface JoinFlowState {
  step: Step
  direction: number  // 1 = forward, -1 = backward
  data: {
    tripCode?: string
    fullName?: string
    emergencyContactName?: string
    emergencyContactPhone?: string
    dietaryRequirements?: string
    languagePreference?: string
    dateOfBirth?: string
    waiverSigned?: boolean
    waiverSignatureText?: string
    selectedAddons?: Array<{ addonId: string; quantity: number }>
    guestId?: string  // set after registration
    qrToken?: string  // set after registration
  }
}

const STEPS: Step[] = ['code', 'details', 'waiver', 'addons', 'confirmation']

export function useJoinFlow() {
  const [state, setState] = useState<JoinFlowState>({
    step: 'code',
    direction: 1,
    data: {},
  })
  
  const goNext = (newData?: Partial<JoinFlowState['data']>) => {
    const currentIndex = STEPS.indexOf(state.step)
    if (currentIndex < STEPS.length - 1) {
      setState(prev => ({
        step: STEPS[currentIndex + 1]!,
        direction: 1,
        data: { ...prev.data, ...newData },
      }))
    }
  }
  
  const goBack = () => {
    const currentIndex = STEPS.indexOf(state.step)
    if (currentIndex > 0) {
      setState(prev => ({
        ...prev,
        step: STEPS[currentIndex - 1]!,
        direction: -1,
      }))
    }
  }
  
  const stepNumber = STEPS.indexOf(state.step) + 1
  const totalSteps = STEPS.length
  
  return { state, goNext, goBack, stepNumber, totalSteps }
}
```

---

## Postcard Generator

```typescript
// components/shared/PostcardGenerator.tsx
'use client'
import html2canvas from 'html2canvas'
import { useRef } from 'react'

export function PostcardGenerator({ trip, guest, style }: PostcardProps) {
  const ref = useRef<HTMLDivElement>(null)
  
  const download = async () => {
    if (!ref.current) return
    const canvas = await html2canvas(ref.current, {
      width: 1080,
      height: 1080,
      scale: 1,
      useCORS: true,
    })
    const url = canvas.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = url
    a.download = `dockpass-miami-${trip.tripDate}.png`
    a.click()
  }
  
  return (
    <>
      {/* Hidden div rendered at 1080x1080 for capture */}
      <div
        ref={ref}
        style={{ width: 1080, height: 1080, position: 'absolute',
                 left: -9999, top: -9999 }}
      >
        <PostcardCanvas trip={trip} guest={guest} style={style} />
      </div>
      
      {/* Preview at screen size */}
      <div className="aspect-square w-full max-w-xs mx-auto rounded-2xl
                      overflow-hidden shadow-lg">
        <PostcardCanvas trip={trip} guest={guest} style={style} />
      </div>
      
      <button onClick={download}
        className="w-full mt-4 bg-[#0C447C] text-white py-3 rounded-xl
                   font-medium text-base">
        Download postcard
      </button>
    </>
  )
}
```

---

## Accessibility Standards

```
- All interactive elements: min 44px tap target
- Colour never sole indicator of state
- ARIA labels on icon-only buttons
- Focus indicators visible (navy outline)
- Screen reader announcements for step changes
- Language attribute set dynamically
- Alt text on all images
- Keyboard navigable join flow
```

---

## Performance Rules

```
- Images: next/image with lazy loading
- No client-side fetching on trip page (SSR)
- Weather: cached in Redis, not re-fetched per user
- Maps: loaded dynamically (heavy library)
- QR: generated client-side (no server round-trip)
- Postcard: generated client-side
- Fonts: Inter via next/font (auto-optimised)
- No unused dependencies
```
