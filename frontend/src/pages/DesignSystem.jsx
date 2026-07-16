import React, { useState } from 'react';
import {
  Button,
  Card,
  Input,
  Badge,
  Chip,
  Skeleton,
  Avatar,
  Switch,
  Tabs,
  ProgressBar,
  EmptyState,
  HeroBanner,
  SectionHeader,
  BookCard,
  CategoryCard,
  StoryCard,
  Navbar,
  SearchBar,
  Dialog,
  FloatingButton,
  Modal,
} from '../components/ui';
import {
  DS_PALETTE,
  DS_TYPOGRAPHY,
  DS_RADIUS,
  DS_SPACING,
  DS_SHADOWS,
} from '../constants/designTokens';

export default function DesignSystem() {
  const [theme, setTheme] = useState('light');
  const [toggle, setToggle] = useState(false);
  const [chipOn, setChipOn] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      document.documentElement.classList.toggle('dark', next === 'dark');
      return next;
    });
  };

  const dummyBook = {
    title: 'Le Petit Prince et le Renard',
    cover_image_url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=400',
    age_group: '6-8',
    duration_minutes: 15,
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-24 py-40 space-y-64">
        <div className="flex flex-wrap justify-between items-center gap-16">
          <div>
            <p className="text-caption uppercase tracking-widest text-primary-600 mb-8">HKids Design System</p>
            <h1 className="text-hero mb-8">Bibliothèque magique</h1>
            <p className="text-body-lg max-w-xl">
              Tokens CSS + Tailwind. Identité premium pour enfants — chaleureuse, lisible, accessible.
            </p>
          </div>
          <Button onClick={toggleTheme} variant="secondary">
            Mode {theme === 'light' ? 'sombre' : 'clair'}
          </Button>
        </div>

        <section>
          <SectionHeader title="Palette" subtitle="Rôles sémantiques — aucune couleur hardcodée dans les composants" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-16">
            {DS_PALETTE.map((swatch) => (
              <div key={swatch.id} className="rounded-20 overflow-hidden shadow-card border border-border">
                <div className={`h-80 ${swatch.swatch}`} />
                <div className="p-12 bg-surface">
                  <p className="font-bold text-foreground text-sm">{swatch.label}</p>
                  <p className="text-caption mt-4">{swatch.role}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <SectionHeader title="Typography" subtitle="Hiérarchie moderne Nunito" />
          <Card hover={false} className="p-32 space-y-20">
            {DS_TYPOGRAPHY.map((row) => (
              <div key={row.id} className="border-b border-border pb-16 last:border-0">
                <p className="text-caption mb-8">{row.label}</p>
                <p className={row.className}>{row.sample}</p>
              </div>
            ))}
          </Card>
        </section>

        <section>
          <SectionHeader title="Radius" subtitle="8 · 12 · 16 · 20 · 24 · 32" />
          <div className="flex flex-wrap gap-16 items-end">
            {DS_RADIUS.map((r) => (
              <div key={r} className="text-center">
                <div
                  className={`w-64 h-64 bg-primary-500 shadow-soft rounded-${r}`}
                  style={{ borderRadius: `var(--radius-${r})` }}
                />
                <p className="text-caption mt-8">{r}px</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <SectionHeader title="Spacing" subtitle="Échelle 4 → 64" />
          <div className="flex flex-wrap items-end gap-8">
            {DS_SPACING.map((s) => (
              <div key={s} className="flex flex-col items-center gap-8">
                <div className="bg-magic-400 rounded-8" style={{ width: s, height: 48 }} />
                <span className="text-caption">{s}</span>
              </div>
            ))}
          </div>
        </section>

        <section>
          <SectionHeader title="Shadows" subtitle="Soft · Card · Floating" />
          <div className="grid md:grid-cols-3 gap-24">
            {DS_SHADOWS.map((s) => (
              <div key={s.id} className={`bg-surface rounded-24 p-32 ${s.className}`}>
                <p className="text-heading-m">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <SectionHeader title="Buttons" subtitle="Primary · Secondary · Ghost" />
          <Card hover={false} className="p-32 flex flex-wrap gap-16">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="orange">Orange</Button>
            <Button variant="magic">Magic</Button>
            <Button variant="success">Success</Button>
            <Button loading>Loading</Button>
          </Card>
        </section>

        <section>
          <SectionHeader title="Chips & Badges" />
          <Card hover={false} className="p-32 flex flex-wrap gap-16 items-center">
            <Chip selected={chipOn} onClick={() => setChipOn((v) => !v)} emoji="📚">Livres</Chip>
            <Chip tone="orange" emoji="🎧">Audio</Chip>
            <Chip tone="success" emoji="🎮">Apprendre</Chip>
            <Chip tone="magic" selected emoji="✨">Créer</Chip>
            <Badge variant="primary">Primary</Badge>
            <Badge variant="secondary">Yellow</Badge>
            <Badge variant="orange">Orange</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="magic">Magic</Badge>
            <Avatar initials="HK" size="md" />
            <Avatar initials="A" size="lg" />
          </Card>
        </section>

        <section>
          <SectionHeader title="Search · Progress · Forms" />
          <div className="grid md:grid-cols-2 gap-24">
            <Card hover={false} className="p-24 space-y-20">
              <SearchBar value={search} onChange={setSearch} placeholder="Chercher une histoire…" />
              <Input label="Email" placeholder="hello@hkids.com" />
              <Switch checked={toggle} onChange={setToggle} label="Mode hors-ligne" />
              <ProgressBar progress={68} label="Progression" tone="primary" />
              <ProgressBar progress={42} label="Apprendre" tone="success" />
            </Card>
            <Card hover={false} className="p-24 space-y-16">
              <Tabs
                tabs={[
                  { id: 'a', label: 'Livres', content: <p className="text-body">Contenu livres</p> },
                  { id: 'b', label: 'Audio', content: <p className="text-body">Contenu audio</p> },
                ]}
                defaultTab="a"
              />
              <Skeleton className="h-40 w-full rounded-16" />
              <EmptyState title="Rien ici" description="Ajoute un livre pour commencer." />
            </Card>
          </div>
        </section>

        <section>
          <SectionHeader title="Cards" subtitle="Card · Book · Category · Story" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-24">
            <Card className="p-24">
              <p className="text-heading-m mb-8">Card</p>
              <p className="text-body">Surface + shadow-card</p>
            </Card>
            <BookCard book={dummyBook} progress={55} isNew />
            <CategoryCard emoji="🦕" title="Dinosaures" tone="success" />
            <StoryCard title="Une nuit magique" badge="IA" meta="Créée pour toi · 8 min" />
          </div>
        </section>

        <section>
          <SectionHeader title="Navbar · Modal · Dialog · FAB" />
          <Card hover={false} className="overflow-hidden mb-24">
            <Navbar
              title="Bibliothèque"
              emoji="📚"
              backTo="/kids"
              trailing={<Badge variant="primary">DS</Badge>}
            />
          </Card>
          <div className="flex flex-wrap gap-16">
            <Button onClick={() => setModalOpen(true)}>Ouvrir Modal</Button>
            <Button variant="secondary" onClick={() => setDialogOpen(true)}>Ouvrir Dialog</Button>
          </div>
          <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Modal HKids">
            <p className="text-body">Contenu accessible avec focus trap et backdrop.</p>
          </Modal>
          <Dialog
            isOpen={dialogOpen}
            onClose={() => setDialogOpen(false)}
            title="Confirmer ?"
            primaryLabel="Oui"
            secondaryLabel="Non"
            onPrimary={() => setDialogOpen(false)}
          >
            Action de confirmation avec boutons Primary / Ghost.
          </Dialog>
          <FloatingButton
            label="Ajouter"
            tone="magic"
            className="!relative !inset-auto mt-24"
            icon={<span aria-hidden="true">＋</span>}
            onClick={() => {}}
          />
        </section>

        <section>
          <SectionHeader title="Hero" />
          <HeroBanner
            title="Lis ce soir"
            subtitle="Une histoire chaude, douce, et magique."
            actions={<Button variant="secondary">Découvrir</Button>}
          />
        </section>
      </div>
    </div>
  );
}
