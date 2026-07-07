import React, {useState} from 'react';
import {
 Button, Card, Input, Badge, Skeleton, Avatar, Switch, 
 Tabs, ProgressBar, EmptyState, HeroBanner, SectionHeader, Carousel, BookCard 
} from '../components/ui';

export default function DesignSystem() {
 const [theme, setTheme] = useState('light');
 const [toggle, setToggle] = useState(false);

 const toggleTheme = () => {
 setTheme(prev => prev === 'light' ? 'dark' : 'light');
 if (theme === 'light') {
 document.documentElement.classList.add('dark');
} else {
 document.documentElement.classList.remove('dark');
}
};

 const dummyBook = {
 title:"Le Petit Prince et le Renard",
 cover_image_url:"https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=400",
 age_group:"6-8",
 duration_minutes: 15
};

 return (
 <div className={`min-h-screen ${theme === 'dark' ? 'dark' : ''}`}>
 <div className="bg-background text-foreground min-h-screen p-8 transition-colors duration-300">
 
 <div className="max-w-7xl mx-auto space-y-16">
 <div className="flex justify-between items-center">
 <div>
 <h1 className="text-4xl font-black mb-2">HKids Design System</h1>
 <p className="text-foreground-muted">Composants reutillisables v2.0</p>
 </div>
 <Button onClick={toggleTheme} variant="secondary">
 Toggle {theme === 'light' ? 'Dark' : 'Light'} Mode
 </Button>
 </div>

 {/* Typography */}
 <section>
 <SectionHeader title="Typography" subtitle="Hierarchie textuelle" />
 <div className="space-y-4 p-8 bg-card rounded-3xl shadow-soft">
 <h1 className="text-5xl md:text-6xl font-black">Display Large</h1>
 <h1 className="text-4xl md:text-5xl font-black">Heading 1</h1>
 <h2 className="text-3xl md:text-4xl font-bold">Heading 2</h2>
 <h3 className="text-2xl md:text-3xl font-bold">Heading 3</h3>
 <h4 className="text-xl md:text-2xl font-bold">Heading 4</h4>
 <p className="text-lg">Body Large: The quick brown fox jumps over the lazy dog.</p>
 <p className="text-base">Body Medium: The quick brown fox jumps over the lazy dog.</p>
 <p className="text-sm">Body Small: The quick brown fox jumps over the lazy dog.</p>
 <p className="text-xs text-foreground-muted">Caption: The quick brown fox jumps over the lazy dog.</p>
 </div>
 </section>

 {/* Colors */}
 <section>
 <SectionHeader title="Color Palette" subtitle="Variables CSS sémantiques" />
 <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
 <div className="h-24 bg-primary-500 rounded-2xl flex items-end p-4 text-white font-bold shadow-soft">Primary</div>
 <div className="h-24 bg-secondary-500 rounded-2xl flex items-end p-4 text-white font-bold shadow-soft">Secondary</div>
 <div className="h-24 bg-accent-500 rounded-2xl flex items-end p-4 text-white font-bold shadow-soft">Accent</div>
 <div className="h-24 bg-success-500 rounded-2xl flex items-end p-4 text-white font-bold shadow-soft">Success</div>
 <div className="h-24 bg-warning-500 rounded-2xl flex items-end p-4 text-white font-bold shadow-soft">Warning</div>
 <div className="h-24 bg-danger-500 rounded-2xl flex items-end p-4 text-white font-bold shadow-soft">Danger</div>
 </div>
 </section>

 {/* Buttons */}
 <section>
 <SectionHeader title="Buttons" subtitle="Interactions primaires et secondaires" />
 <div className="flex flex-wrap gap-4 p-8 bg-card rounded-3xl shadow-soft">
 <Button variant="primary">Primary Button</Button>
 <Button variant="secondary">Secondary Button</Button>
 <Button variant="danger">Danger Button</Button>
 <Button variant="ghost">Ghost Button</Button>
 <Button loading>Loading...</Button>
 </div>
 </section>

 {/* Badges */}
 <section>
 <SectionHeader title="Badges & Avatars" subtitle="Indicateurs visuels" />
 <div className="flex items-center flex-wrap gap-6 p-8 bg-card rounded-3xl shadow-soft">
 <Badge variant="primary">Primary</Badge>
 <Badge variant="secondary">Secondary</Badge>
 <Badge variant="success">Success</Badge>
 <Badge variant="warning">Warning</Badge>
 <Badge variant="danger">Danger</Badge>
 <Badge variant="premium">Premium Pro</Badge>
 
 <div className="w-px h-8 bg-surface-200 mx-4"></div>
 
 <Avatar initials="OM" size="md" />
 <Avatar initials="A" size="lg" />
 <Avatar src="https://i.pravatar.cc/150?u=a042581f4e29026024d" size="xl" />
 </div>
 </section>

 {/* Form Elements */}
 <section>
 <SectionHeader title="Form Elements" subtitle="Inputs, toggles et champs de texte" />
 <div className="grid md:grid-cols-2 gap-8 p-8 bg-card rounded-3xl shadow-soft">
 <div className="space-y-4">
 <Input label="Email address" placeholder="hello@hkids.com" />
 <Input label="Password" type="password" placeholder="••••••••" error="Le mot de passe est trop court" />
 </div>
 <div className="space-y-6 flex flex-col justify-center">
 <Switch checked={toggle} onChange={setToggle} label="Activer le mode hors-ligne" />
 <ProgressBar progress={65} label="Progression de lecture" />
 </div>
 </div>
 </section>

 {/* Cards & Complex */}
 <section>
 <SectionHeader title="Cards & Complex Elements" subtitle="Structures de donnees" />
 <div className="grid md:grid-cols-3 gap-8">
 <Card className="p-6">
 <h3 className="font-bold text-lg mb-2">Default Card</h3>
 <p className="text-foreground-secondary">Une carte simple avec une ombre legere.</p>
 </Card>
 <Card variant="premium" className="p-6">
 <h3 className="font-bold text-lg mb-2 text-white">Premium Card</h3>
 <p className="text-white/90">Carte avec degradé pour mettre en valeur un contenu important.</p>
 </Card>
 <div className="bg-primary-900 p-6 rounded-3xl relative overflow-hidden">
 <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1534447677768-be436bb09401')] opacity-20 bg-cover bg-center"></div>
 <Card variant="glass" className="p-6 relative z-10">
 <h3 className="font-bold text-lg mb-2">Glass Card</h3>
 <p className="text-white/90">Effet de verre poli sur fond colore.</p>
 </Card>
 </div>
 </div>
 </section>

 {/* Book Cards Carousel */}
 <section>
 <SectionHeader title="Book Cards & Carousel" subtitle="Experience bibliotheque" />
 <Carousel>
 {[1, 2, 3, 4, 5, 6].map(i => (
 <BookCard 
 key={i} 
 book={{...dummyBook, title: `Histoire ${i}`}} 
 progress={i % 2 === 0 ? 45 : null}
 isNew={i === 1}
 isRecommended={i === 2}
 />
 ))}
 </Carousel>
 </section>

 {/* Empty & Loading States */}
 <section>
 <SectionHeader title="States" subtitle="Vides et chargements" />
 <div className="grid md:grid-cols-2 gap-8">
 <EmptyState 
 title="Aucune histoire trouvee"
 description="Modifiez vos filtres ou effectuez une nouvelle recherche pour trouver de nouvelles aventures."
 actionLabel="Voir toutes les histoires"
 onAction={() => {}}
 />
 <div className="p-8 bg-card rounded-3xl shadow-soft space-y-4">
 <Skeleton className="h-8 w-1/2" />
 <Skeleton className="h-4 w-3/4" />
 <Skeleton className="h-4 w-full" />
 <div className="flex gap-4 mt-8">
 <Skeleton className="h-40 w-32 rounded-3xl" />
 <Skeleton className="h-40 w-32 rounded-3xl" />
 <Skeleton className="h-40 w-32 rounded-3xl" />
 </div>
 </div>
 </div>
 </section>

 {/* Hero Banner */}
 <section>
 <SectionHeader title="Hero Banner" subtitle="Header immersif" />
 <HeroBanner 
 title="L'Île aux Trésors"
 subtitle="Une aventure extraordinaire avec des pirates et des mystères à résoudre. Parfait pour les explorateurs de 8 ans."
 image="https://images.unsplash.com/photo-1519074069444-1ba4fff66d16?auto=format&fit=crop&q=80&w=1200"
 badge={<Badge variant="glass">Selection de la semaine</Badge>}
 actions={<Button variant="primary" size="lg">Commencer la lecture</Button>}
 />
 </section>

 </div>
 </div>
 </div>
 );
}
