import {
  describe,
  it,
  expect,
  beforeEach,
} from 'vitest';
import {
  initFeatureFlags,
  getFeatureFlag,
  isFeatureEnabled,
  setFeatureFlag,
  resetFeatureFlags,
  getAllFeatureFlags,
} from '../helpers';
import {
  useFeatureFlag,
  useFeatureFlags,
} from '../composables';
import type { FeatureFlagDefinition } from '../types';

describe('FeatureFlags helpers & composables', () => {
  const sampleFlags: FeatureFlagDefinition[] = [
    {
      key: 'new_table',
      name: 'New Table',
      defaultValue: false,
    },
    {
      key: 'instant_payout',
      name: 'Instant Payout',
      defaultValue: true,
    },
    {
      key: 'pricing_variant',
      name: 'Pricing A/B Test',
      defaultValue: 'control',
      type: 'string',
      options: [
        { label: 'Control', value: 'control' },
        { label: 'Variant A', value: 'v1' },
      ],
    },
  ];

  beforeEach(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
  });

  it('correctly initializes flags with default values', () => {
    initFeatureFlags(sampleFlags);

    expect(getFeatureFlag('new_table')).toBe(
      false,
    );
    expect(isFeatureEnabled('new_table')).toBe(
      false,
    );
    expect(getFeatureFlag('instant_payout')).toBe(
      true,
    );
    expect(
      isFeatureEnabled('instant_payout'),
    ).toBe(true);
    expect(
      getFeatureFlag('pricing_variant'),
    ).toBe('control');
  });

  it('updates a flag with setFeatureFlag and is reactive', () => {
    initFeatureFlags(sampleFlags);

    setFeatureFlag('new_table', true);
    expect(getFeatureFlag('new_table')).toBe(
      true,
    );
    expect(isFeatureEnabled('new_table')).toBe(
      true,
    );

    const flagRef = useFeatureFlag('new_table');
    expect(flagRef.value).toBe(true);
  });

  it('returns fallback for unknown flag', () => {
    expect(
      getFeatureFlag(
        'non_existent',
        'my_default',
      ),
    ).toBe('my_default');
    expect(
      isFeatureEnabled('non_existent', false),
    ).toBe(false);
  });

  it('resets flags to default values', () => {
    initFeatureFlags(sampleFlags);
    setFeatureFlag('new_table', true);
    expect(getFeatureFlag('new_table')).toBe(
      true,
    );

    resetFeatureFlags(sampleFlags);
    expect(getFeatureFlag('new_table')).toBe(
      false,
    );
  });

  it('useFeatureFlags returns complete control object', () => {
    initFeatureFlags(sampleFlags);
    const { flags, isEnabled, getFlag } =
      useFeatureFlags();

    expect(isEnabled('instant_payout')).toBe(
      true,
    );
    expect(getFlag('pricing_variant')).toBe(
      'control',
    );
    expect(flags.value['instant_payout']).toBe(
      true,
    );
  });

  it('getAllFeatureFlags returns all active flags', () => {
    initFeatureFlags(sampleFlags);
    const all = getAllFeatureFlags();
    expect(all).toHaveProperty('new_table');
    expect(all).toHaveProperty('instant_payout');
    expect(all).toHaveProperty('pricing_variant');
  });
});
