import { describe, expect, test } from 'bun:test';
import { App } from './App';

describe('App', () => {
  test('is exported as a function component', () => {
    expect(typeof App).toBe('function');
  });
});
