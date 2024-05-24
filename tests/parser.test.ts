import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { parseMarkdown } from '../src/parser';

const loadMarkdown = (filename: string) =>
  readFileSync(resolve(`tests/markdown/${filename}`), 'utf-8');

describe('parseMarkdown', () => {
  it('should parse valid markdown correctly', () => {
    const markdown = loadMarkdown('basic.md');

    expect(parseMarkdown(markdown)).toMatchSnapshot();
  });

  it('should parse markdown with enabled feature', () => {
    const markdown = loadMarkdown('enabled.md');
    expect(parseMarkdown(markdown)).toMatchSnapshot();
  });

  it('should parse markdown with disabled feature', () => {
    const markdown = loadMarkdown('disabled.md');
    expect(parseMarkdown(markdown)).toMatchSnapshot();
  });

  it('should parse markdown with one environment enabled', () => {
    const markdown = loadMarkdown('one-environment-enabled.md');
    expect(parseMarkdown(markdown)).toMatchSnapshot();
  });

  it('should parse markdown with two environments enabled in different features', () => {
    const markdown = loadMarkdown(
      'two-environments-enabled-in-different-features.md'
    );
    expect(parseMarkdown(markdown)).toMatchSnapshot();
  });

  it('another example', () => {
    const markdown = loadMarkdown('another-example.md');
    expect(parseMarkdown(markdown)).toMatchSnapshot();
  });

  it('another example with conditions', () => {
    const markdown = loadMarkdown('another-example-with-conditions.md');
    expect(parseMarkdown(markdown)).toMatchSnapshot();
  });
});
