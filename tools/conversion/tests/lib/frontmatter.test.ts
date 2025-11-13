import { describe, it, expect } from 'vitest';
import {
  parseFrontmatter,
  validateRequiredFields,
  validateEnumField,
  countWords,
} from '../../lib/frontmatter.js';
import { Logger } from '../../lib/log.js';

describe('parseFrontmatter', () => {
  it('should parse valid YAML frontmatter', () => {
    const markdown = `---
variation_id: arch-L1-001
variation_type: initial
word_count: 1000
---
This is the content.`;

    const result = parseFrontmatter(markdown);
    expect(result).not.toBeNull();
    expect(result?.frontmatter).toMatchObject({
      variation_id: 'arch-L1-001',
      variation_type: 'initial',
      word_count: 1000,
    });
    expect(result?.content).toBe('This is the content.');
  });

  it('should handle complex nested YAML', () => {
    const markdown = `---
variation_id: test
conditions:
  visit_count: 2
  awareness: 40-60%
  visited_nodes: [node1, node2]
themes:
  - theme1
  - theme2
---
Content here.`;

    const result = parseFrontmatter(markdown);
    expect(result?.frontmatter).toHaveProperty('conditions');
    expect(result?.frontmatter).toHaveProperty('themes');
  });

  it('should return null for missing frontmatter', () => {
    const logger = new Logger();
    const markdown = 'Just content without frontmatter';
    const result = parseFrontmatter(markdown, logger);
    expect(result).toBeNull();
    expect(logger.hasBlockers()).toBe(true);
  });

  it('should return null for invalid YAML', () => {
    const logger = new Logger();
    const markdown = `---
invalid: yaml: syntax
---
Content`;
    const result = parseFrontmatter(markdown, logger);
    expect(result).toBeNull();
    expect(logger.hasBlockers()).toBe(true);
  });

  it('should trim content whitespace', () => {
    const markdown = `---
key: value
---

  Content with leading/trailing whitespace
`;
    const result = parseFrontmatter(markdown);
    expect(result?.content).toBe('Content with leading/trailing whitespace');
  });
});

describe('validateRequiredFields', () => {
  it('should pass when all required fields present', () => {
    const frontmatter = {
      field1: 'value1',
      field2: 'value2',
      field3: 123,
    };
    const logger = new Logger();
    const result = validateRequiredFields(frontmatter, ['field1', 'field2', 'field3'], logger);
    expect(result).toBe(true);
    expect(logger.hasBlockers()).toBe(false);
  });

  it('should fail when required field missing', () => {
    const frontmatter = {
      field1: 'value1',
    };
    const logger = new Logger();
    const result = validateRequiredFields(frontmatter, ['field1', 'field2'], logger);
    expect(result).toBe(false);
    expect(logger.hasBlockers()).toBe(true);
  });

  it('should fail when field is null or undefined', () => {
    const frontmatter = {
      field1: null,
      field2: undefined,
    };
    const logger = new Logger();
    const result = validateRequiredFields(frontmatter, ['field1', 'field2'], logger);
    expect(result).toBe(false);
    expect(logger.hasBlockers()).toBe(true);
  });
});

describe('validateEnumField', () => {
  it('should pass for valid enum value', () => {
    const frontmatter = { type: 'initial' };
    const logger = new Logger();
    const result = validateEnumField(
      frontmatter,
      'type',
      ['initial', 'firstRevisit'] as const,
      logger,
    );
    expect(result).toBe(true);
    expect(logger.hasBlockers()).toBe(false);
  });

  it('should fail for invalid enum value', () => {
    const frontmatter = { type: 'invalid' };
    const logger = new Logger();
    const result = validateEnumField(
      frontmatter,
      'type',
      ['initial', 'firstRevisit'] as const,
      logger,
    );
    expect(result).toBe(false);
    expect(logger.hasBlockers()).toBe(true);
  });

  it('should pass for missing field (let validateRequiredFields handle it)', () => {
    const frontmatter = {};
    const logger = new Logger();
    const result = validateEnumField(frontmatter, 'type', ['initial'] as const, logger);
    expect(result).toBe(true);
  });
});

describe('countWords', () => {
  it('should count simple words', () => {
    expect(countWords('Hello world')).toBe(2);
    expect(countWords('One two three four five')).toBe(5);
  });

  it('should ignore markdown formatting', () => {
    expect(countWords('**Bold** and *italic* text')).toBe(4);
  });

  it('should ignore code blocks', () => {
    const text = `Text before
\`\`\`
code block content
multiple lines
\`\`\`
Text after`;
    expect(countWords(text)).toBe(4); // "Text before" + "Text after"
  });

  it('should ignore inline code', () => {
    expect(countWords('Use `console.log()` for debugging')).toBe(3);
  });

  it('should ignore links', () => {
    expect(countWords('[link text](http://example.com) and more')).toBe(4);
  });

  it('should handle multiple spaces', () => {
    expect(countWords('Multiple    spaces    between')).toBe(3);
  });

  it('should handle empty or whitespace-only strings', () => {
    expect(countWords('')).toBe(0);
    expect(countWords('   ')).toBe(0);
  });
});
