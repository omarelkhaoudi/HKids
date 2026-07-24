import { beforeEach, describe, expect, it } from 'vitest';
import {
  buildPremiumDiscoverySections,
  canAccessFeature,
  canAccessPack,
  getPackAccessState,
  getSubscriptionComparisonRows,
  hasActiveSubscription,
  normalizeSubscription,
} from '../premiumAccess';
import {
  createCustomPack,
  getFeatureFlags,
  listPremiumPacks,
  publishPack,
  setFeatureFlag,
} from '../premiumPackStore';
import { DEFAULT_PREMIUM_PACKS } from '../../constants/premiumPacks';

beforeEach(() => {
  localStorage.clear();
});

describe('premiumAccess', () => {
  it('normalizes nested subscription payloads', () => {
    expect(normalizeSubscription({ subscription: { status: 'active' } })?.status).toBe('active');
    expect(normalizeSubscription({ status: 'trialing' })?.status).toBe('trialing');
    expect(normalizeSubscription({ subscription: null })).toBeNull();
  });

  it('detects active and expired subscriptions', () => {
    expect(hasActiveSubscription({ status: 'active', current_period_end: '2099-01-01' })).toBe(true);
    expect(hasActiveSubscription({ status: 'trialing' })).toBe(true);
    expect(hasActiveSubscription({ status: 'canceled' })).toBe(false);
    expect(hasActiveSubscription({ status: 'active', current_period_end: '2020-01-01' })).toBe(false);
  });

  it('gates premium features behind subscription + flags', () => {
    expect(canAccessFeature('ai_stories', { subscription: null })).toBe(false);
    expect(canAccessFeature('ai_stories', { subscription: { status: 'active' } })).toBe(true);
    setFeatureFlag('ai_stories', false);
    expect(canAccessFeature('ai_stories', { subscription: { status: 'active' } })).toBe(false);
  });

  it('locks packs until subscribed and respects feature flags', () => {
    const pack = DEFAULT_PREMIUM_PACKS.find((p) => p.id === 'dinosaurs');
    expect(canAccessPack(pack, { subscription: null })).toBe(false);
    expect(getPackAccessState(pack, { subscription: null }).locked).toBe(true);
    expect(canAccessPack(pack, { subscription: { status: 'active' } })).toBe(true);
    setFeatureFlag('premium_books', false);
    expect(canAccessPack(pack, { subscription: { status: 'active' } })).toBe(false);
  });

  it('builds discovery sections from config packs', () => {
    const sections = buildPremiumDiscoverySections({
      books: [{ id: 1, title: 'Space Rocket', theme: 'space', is_premium: 1 }],
      subscription: null,
    });
    expect(sections.popular.length).toBeGreaterThan(0);
    expect(sections.seasonal.length).toBeGreaterThan(0);
    expect(sections.aiStories.some((p) => p.ai)).toBe(true);
    expect(sections.collections.length).toBeGreaterThan(0);
    expect(sections.all.every((p) => p.access)).toBe(true);
  });

  it('returns free vs premium comparison rows', () => {
    const rows = getSubscriptionComparisonRows((k) => k);
    expect(rows.some((r) => r.id === 'ai')).toBe(true);
    expect(rows.find((r) => r.id === 'library')?.free).toBe(true);
  });
});

describe('premiumPackStore', () => {
  it('lists published default packs and merges overrides', () => {
    const packs = listPremiumPacks();
    expect(packs.length).toBeGreaterThanOrEqual(DEFAULT_PREMIUM_PACKS.length);
    const custom = createCustomPack({ title: 'Test Pack', themes: ['robots'], published: false });
    expect(listPremiumPacks({ onlyPublished: true }).some((p) => p.id === custom.id)).toBe(false);
    publishPack(custom.id);
    expect(listPremiumPacks().some((p) => p.id === custom.id)).toBe(true);
  });

  it('persists feature flags', () => {
    expect(getFeatureFlags().premium_games).toBe(true);
    setFeatureFlag('premium_games', false);
    expect(getFeatureFlags().premium_games).toBe(false);
  });
});
