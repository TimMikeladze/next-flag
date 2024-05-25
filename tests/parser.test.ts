import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { parseMarkdown } from '../src/parser';

const loadMarkdown = (filename: string) =>
  readFileSync(resolve(`tests/markdown/${filename}`), 'utf-8');

describe('parseMarkdown', () => {
  it('full-example.md', () => {
    const markdown = loadMarkdown('full-example.md');

    expect(parseMarkdown(markdown)).toMatchSnapshot();
  });
  it('only-features.md', () => {
    const markdown = loadMarkdown('only-features.md');

    expect(parseMarkdown(markdown)).toMatchSnapshot();
  });
  it('no-features-enabled.md', () => {
    const markdown = loadMarkdown('no-features-enabled.md');

    expect(parseMarkdown(markdown)).toMatchSnapshot();
  });
  it('several-features-multi-env.md', () => {
    const markdown = loadMarkdown('several-features-multi-env.md');

    expect(parseMarkdown(markdown)).toMatchSnapshot();
  });
});
