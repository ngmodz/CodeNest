/**
 * @jest-environment node
 */

// Mock Firebase Admin SDK before importing the middleware
jest.mock('firebase-admin/app', () => ({
  initializeApp: jest.fn(),
  getApps: jest.fn(() => []),
  cert: jest.fn(),
}));

jest.mock('firebase-admin/auth', () => ({
  getAuth: jest.fn(() => ({
    verifyIdToken: jest.fn(),
  })),
}));

// Mock Next.js server components
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn((data, options) => ({ data, status: options?.status || 200 })),
  },
}));

import {
  validateRequestBody,
  sanitizeInput,
} from '../api-middleware';

describe('API Security Functions', () => {
  describe('validateRequestBody', () => {
    interface TestRequest {
      name: string;
      age: number;
      email?: string;
    }

    it('should return error for non-object body', () => {
      const result = validateRequestBody<TestRequest>(
        'invalid',
        ['name', 'age']
      );
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Request body must be a valid JSON object');
    });

    it('should return error for missing required fields', () => {
      const result = validateRequestBody<TestRequest>(
        { name: 'John' },
        ['name', 'age']
      );
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Missing required field: age');
    });

    it('should return error for null required fields', () => {
      const result = validateRequestBody<TestRequest>(
        { name: 'John', age: null },
        ['name', 'age']
      );
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Missing required field: age');
    });

    it('should filter out unknown fields', () => {
      const result = validateRequestBody<TestRequest>(
        { name: 'John', age: 25, unknownField: 'value' },
        ['name', 'age']
      );
      
      expect(result.isValid).toBe(true);
      expect(result.data).toEqual({ name: 'John', age: 25 });
    });

    it('should include optional fields when present', () => {
      const result = validateRequestBody<TestRequest>(
        { name: 'John', age: 25, email: 'john@example.com' },
        ['name', 'age'],
        ['email']
      );
      
      expect(result.isValid).toBe(true);
      expect(result.data).toEqual({ name: 'John', age: 25, email: 'john@example.com' });
    });

    it('should handle empty optional fields array', () => {
      const result = validateRequestBody<TestRequest>(
        { name: 'John', age: 25 },
        ['name', 'age']
      );
      
      expect(result.isValid).toBe(true);
      expect(result.data).toEqual({ name: 'John', age: 25 });
    });
  });

  describe('sanitizeInput', () => {
    it('should remove HTML tags from strings', () => {
      const input = '<script>alert("xss")</script>Hello';
      const result = sanitizeInput(input);
      
      expect(result).toBe('scriptalert("xss")/scriptHello');
    });

    it('should remove angle brackets from strings', () => {
      const input = '<div>content</div>';
      const result = sanitizeInput(input);
      
      expect(result).toBe('divcontent/div');
    });

    it('should trim whitespace', () => {
      const input = '  hello world  ';
      const result = sanitizeInput(input);
      
      expect(result).toBe('hello world');
    });

    it('should limit string length to 10000 characters', () => {
      const input = 'a'.repeat(15000);
      const result = sanitizeInput(input);
      
      expect(result.length).toBe(10000);
      expect(result).toBe('a'.repeat(10000));
    });

    it('should sanitize arrays recursively', () => {
      const input = ['<script>test</script>', 'normal text', '<b>bold</b>'];
      const result = sanitizeInput(input);
      
      expect(result).toEqual(['scripttest/script', 'normal text', 'bbold/b']);
    });

    it('should sanitize objects recursively', () => {
      const input = {
        name: '<script>alert("xss")</script>John',
        description: '  <p>Test description</p>  ',
        data: ['<b>test</b>', 'normal'],
        nested: {
          value: '<span>nested</span>'
        }
      };
      const result = sanitizeInput(input);
      
      expect(result).toEqual({
        name: 'scriptalert("xss")/scriptJohn',
        description: 'pTest description/p',
        data: ['btest/b', 'normal'],
        nested: {
          value: 'spannested/span'
        }
      });
    });

    it('should handle non-string types without modification', () => {
      expect(sanitizeInput(123)).toBe(123);
      expect(sanitizeInput(true)).toBe(true);
      expect(sanitizeInput(false)).toBe(false);
      expect(sanitizeInput(null)).toBe(null);
      expect(sanitizeInput(undefined)).toBe(undefined);
    });

    it('should handle empty arrays and objects', () => {
      expect(sanitizeInput([])).toEqual([]);
      expect(sanitizeInput({})).toEqual({});
    });

    it('should handle deeply nested structures', () => {
      const input = {
        level1: {
          level2: {
            level3: ['<script>deep</script>', 'safe text']
          }
        }
      };
      const result = sanitizeInput(input);
      
      expect(result).toEqual({
        level1: {
          level2: {
            level3: ['scriptdeep/script', 'safe text']
          }
        }
      });
    });

    it('should handle mixed data types in arrays', () => {
      const input = ['<script>text</script>', 123, true, { key: '<b>value</b>' }];
      const result = sanitizeInput(input);
      
      expect(result).toEqual(['scripttext/script', 123, true, { key: 'bvalue/b' }]);
    });
  });

  describe('Security Edge Cases', () => {
    it('should handle malicious script injection attempts', () => {
      const maliciousInputs = [
        '<script>document.cookie</script>',
        '<img src="x" onerror="alert(1)">',
        '<svg onload="alert(1)">',
        '"><script>alert(1)</script>',
        'javascript:alert(1)',
      ];

      maliciousInputs.forEach(input => {
        const result = sanitizeInput(input);
        expect(result).not.toContain('<');
        expect(result).not.toContain('>');
      });
    });

    it('should handle extremely long inputs', () => {
      const longInput = 'x'.repeat(50000);
      const result = sanitizeInput(longInput);
      
      expect(result.length).toBe(10000);
      expect(typeof result).toBe('string');
    });

    it('should handle circular references safely', () => {
      const obj: any = { name: '<script>test</script>' };
      obj.self = obj; // Create circular reference
      
      // This should not throw an error or cause infinite recursion
      const result = sanitizeInput(obj);
      
      expect(result.name).toBe('scripttest/script');
      expect(result.self).toBe('[Circular Reference]');
    });

    it('should validate complex request structures', () => {
      interface ComplexRequest {
        user: {
          name: string;
          preferences: string[];
        };
        data: {
          items: Array<{ id: string; value: number }>;
        };
      }

      const complexBody = {
        user: {
          name: 'John',
          preferences: ['dark', 'notifications']
        },
        data: {
          items: [
            { id: 'item1', value: 100 },
            { id: 'item2', value: 200 }
          ]
        },
        extraField: 'should be filtered'
      };

      const result = validateRequestBody<ComplexRequest>(
        complexBody,
        ['user', 'data']
      );

      expect(result.isValid).toBe(true);
      expect(result.data).toEqual({
        user: {
          name: 'John',
          preferences: ['dark', 'notifications']
        },
        data: {
          items: [
            { id: 'item1', value: 100 },
            { id: 'item2', value: 200 }
          ]
        }
      });
    });
  });
});