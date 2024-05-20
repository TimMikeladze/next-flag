import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
  getEnabledFeaturesForEnvironment,
  getFlatFeatures,
  parseMarkdown,
} from '../src/parser';

const loadMarkdown = (filename: string) =>
  readFileSync(resolve(`tests/markdown/${filename}`), 'utf-8');

describe('parseMarkdown', () => {
  it('should parse valid markdown correctly', () => {
    const markdown = loadMarkdown('basic.md');

    expect(parseMarkdown(markdown)).toMatchSnapshot();
  });

  it('should parse markdown with enabled items', () => {
    const markdown = loadMarkdown('enabled.md');
    expect(parseMarkdown(markdown)).toMatchSnapshot();
  });
});

describe('getFlatFeatures', () => {
  it('should return a flat list of features', () => {
    const markdown = loadMarkdown('basic.md');
    const parsedData = parseMarkdown(markdown);

    expect(getFlatFeatures(parsedData)).toMatchSnapshot();
  });

  it('should return a flat list of features with enabled items', () => {
    const markdown = loadMarkdown('enabled.md');
    const parsedData = parseMarkdown(markdown);

    expect(getFlatFeatures(parsedData)).toMatchSnapshot();
  });
});

describe('getEnabledFeaturesForEnvironment', () => {
  it('should return only enabled features for a given environment', () => {
    const markdown = loadMarkdown('enabled.md');
    const parsedData = parseMarkdown(markdown);
    const flatFeatures = getFlatFeatures(parsedData);

    expect(
      getEnabledFeaturesForEnvironment(flatFeatures, 'production')
    ).toMatchSnapshot();
  });

  it("should return empty array if the environment doesn't exist", () => {
    const markdown = loadMarkdown('enabled.md');
    const parsedData = parseMarkdown(markdown);
    const flatFeatures = getFlatFeatures(parsedData);

    expect(
      getEnabledFeaturesForEnvironment(flatFeatures, 'non-existent')
    ).toEqual([]);
  });

  it("should return empty array if the environment doesn't have any enabled features", () => {
    const markdown = loadMarkdown('basic.md');
    const parsedData = parseMarkdown(markdown);
    const flatFeatures = getFlatFeatures(parsedData);

    expect(
      getEnabledFeaturesForEnvironment(flatFeatures, 'production')
    ).toEqual([]);
  });
});
