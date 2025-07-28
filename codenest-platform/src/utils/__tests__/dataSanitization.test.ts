import { describe, it, expect } from '@jest/globals';
import {
  HtmlSanitizer,
  SqlSanitizer,
  XssSanitizer,
  CodeSanitizer,
  InputSanitizer,
  DomainSanitizer
} from '../dataSanitization';

describe('HtmlSanitizer', () => {
  describe('sanitizeHtml', () => {
    it('should allow safe HTML tags', () => {
      const input = '<b>Bold</b> <i>Italic</i> <code>Code</code>';
      const result = HtmlSanitizer.sanitizeHtml(input);
      expect(result).toBe('<b>Bold</b> <i>Italic</i> <code>Code</code>');
    });

    it('should remove dangerous script tags', () => {
      const input = '<script>alert("xss")</script>Hello';
      const result = HtmlSanitizer.sanitizeHtml(input);
      expect(result).toBe('Hello');
    });

    it('should remove iframe tags', () => {
      const input = '<iframe src="evil.com"></iframe>Content';
      const result = HtmlSanitizer.sanitizeHtml(input);
      expect(result).toBe('Content');
    });

    it('should remove dangerous attributes', () => {
      const input = '<p onclick="alert()">Text</p>';
      const result = HtmlSanitizer.sanitizeHtml(input);
      expect(result).not.toContain('onclick');
      expect(result).toContain('Text');
    });

    it('should remove javascript: URLs', () => {
      const input = '<a href="javascript:alert()">Link</a>';
      const result = HtmlSanitizer.sanitizeHtml(input);
      expect(result).toBe('Link');
    });

    it('should handle non-string input', () => {
      expect(HtmlSanitizer.sanitizeHtml(123 as any)).toBe('');
      expect(HtmlSanitizer.sanitizeHtml(null as any)).toBe('');
      expect(HtmlSanitizer.sanitizeHtml(undefined as any)).toBe('');
    });
  });

  describe('stripAllHtml', () => {
    it('should remove all HTML tags', () => {
      const input = '<b>Bold</b> <i>Italic</i> <script>alert()</script>';
      const result = HtmlSanitizer.stripAllHtml(input);
      expect(result).toBe('Bold Italic alert()');
    });

    it('should handle nested tags', () => {
      const input = '<div><p><b>Nested</b> content</p></div>';
      const result = HtmlSanitizer.stripAllHtml(input);
      expect(result).toBe('Nested content');
    });
  });
});

describe('SqlSanitizer', () => {
  describe('sanitizeSqlInput', () => {
    it('should remove SQL keywords', () => {
      const input = "'; DROP TABLE users; --";
      const result = SqlSanitizer.sanitizeSqlInput(input);
      expect(result).not.toContain('DROP');
      expect(result).not.toContain('--');
    });

    it('should remove UNION attacks', () => {
      const input = "1 UNION SELECT * FROM users";
      const result = SqlSanitizer.sanitizeSqlInput(input);
      expect(result).not.toContain('UNION');
      expect(result).not.toContain('SELECT');
    });

    it('should escape single quotes', () => {
      const input = "O'Reilly";
      const result = SqlSanitizer.sanitizeSqlInput(input);
      expect(result).toBe("O''Reilly");
    });

    it('should remove SQL injection patterns', () => {
      const input = "1=1 OR 2=2";
      const result = SqlSanitizer.sanitizeSqlInput(input);
      expect(result).not.toContain('OR');
    });

    it('should handle non-string input', () => {
      expect(SqlSanitizer.sanitizeSqlInput(123 as any)).toBe('');
    });
  });
});

describe('XssSanitizer', () => {
  describe('sanitizeXss', () => {
    it('should encode HTML entities', () => {
      const input = '<script>alert("xss")</script>';
      const result = XssSanitizer.sanitizeXss(input);
      expect(result).toContain('&lt;');
      expect(result).toContain('&gt;');
      expect(result).not.toContain('<script>');
    });

    it('should remove javascript: URLs', () => {
      const input = 'javascript:alert()';
      const result = XssSanitizer.sanitizeXss(input);
      expect(result).not.toContain('javascript:');
    });

    it('should remove event handlers', () => {
      const input = 'onload=alert()';
      const result = XssSanitizer.sanitizeXss(input);
      expect(result).not.toContain('onload=');
    });

    it('should encode quotes and slashes', () => {
      const input = '"Hello" & \'World\' / Test';
      const result = XssSanitizer.sanitizeXss(input);
      expect(result).toContain('&quot;');
      expect(result).toContain('&#x27;');
      expect(result).toContain('&#x2F;');
    });

    it('should handle non-string input', () => {
      expect(XssSanitizer.sanitizeXss(123 as any)).toBe('');
    });
  });

  describe('decodeHtmlEntities', () => {
    it('should decode HTML entities', () => {
      const input = '&lt;script&gt;alert(&quot;test&quot;)&lt;&#x2F;script&gt;';
      const result = XssSanitizer.decodeHtmlEntities(input);
      expect(result).toBe('<script>alert("test")</script>');
    });

    it('should handle non-string input', () => {
      expect(XssSanitizer.decodeHtmlEntities(123 as any)).toBe('');
    });
  });
});

describe('CodeSanitizer', () => {
  describe('sanitizeCode', () => {
    it('should sanitize Python code', () => {
      const code = 'import os\nos.system("rm -rf /")';
      const result = CodeSanitizer.sanitizeCode(code, 'Python');
      expect(result).toContain('REMOVED_DANGEROUS_CODE');
      expect(result).not.toContain('import os');
    });

    it('should sanitize JavaScript code', () => {
      const code = 'eval("malicious code")';
      const result = CodeSanitizer.sanitizeCode(code, 'JavaScript');
      expect(result).toContain('REMOVED_DANGEROUS_CODE');
      expect(result).not.toContain('eval(');
    });

    it('should sanitize Java code', () => {
      const code = 'Runtime.getRuntime().exec("rm -rf /")';
      const result = CodeSanitizer.sanitizeCode(code, 'Java');
      expect(result).toContain('REMOVED_DANGEROUS_CODE');
      expect(result).not.toContain('Runtime.getRuntime()');
    });

    it('should sanitize C code', () => {
      const code = '#include <stdlib.h>\nsystem("rm -rf /");';
      const result = CodeSanitizer.sanitizeCode(code, 'C');
      expect(result).toContain('REMOVED_DANGEROUS_CODE');
      expect(result).not.toContain('system(');
    });

    it('should handle unknown language', () => {
      const code = 'some code';
      const result = CodeSanitizer.sanitizeCode(code, 'Unknown');
      expect(result).toBe('some code');
    });

    it('should handle non-string input', () => {
      expect(CodeSanitizer.sanitizeCode(123 as any, 'Python')).toBe('');
    });
  });

  describe('validateCodeLength', () => {
    it('should validate code within length limit', () => {
      const code = 'def hello(): return "world"';
      expect(CodeSanitizer.validateCodeLength(code)).toBe(true);
    });

    it('should reject code exceeding length limit', () => {
      const code = 'a'.repeat(50001);
      expect(CodeSanitizer.validateCodeLength(code)).toBe(false);
    });

    it('should accept custom length limit', () => {
      const code = 'hello world';
      expect(CodeSanitizer.validateCodeLength(code, 5)).toBe(false);
      expect(CodeSanitizer.validateCodeLength(code, 20)).toBe(true);
    });

    it('should handle non-string input', () => {
      expect(CodeSanitizer.validateCodeLength(123 as any)).toBe(false);
    });
  });

  describe('normalizeWhitespace', () => {
    it('should normalize line endings', () => {
      const code = 'line1\r\nline2\rline3\nline4';
      const result = CodeSanitizer.normalizeWhitespace(code);
      expect(result).toBe('line1\nline2\nline3\nline4');
    });

    it('should handle non-string input', () => {
      expect(CodeSanitizer.normalizeWhitespace(123 as any)).toBe('');
    });
  });
});

describe('InputSanitizer', () => {
  describe('sanitizeUserInput', () => {
    it('should sanitize string input', () => {
      const input = '  hello world  ';
      const result = InputSanitizer.sanitizeUserInput(input, 'string');
      expect(result).toBe('hello world');
    });

    it('should sanitize number input', () => {
      expect(InputSanitizer.sanitizeUserInput('123.45', 'number')).toBe(123.45);
      expect(InputSanitizer.sanitizeUserInput(67.89, 'number')).toBe(67.89);
      expect(InputSanitizer.sanitizeUserInput('invalid', 'number')).toBe(null);
    });

    it('should sanitize boolean input', () => {
      expect(InputSanitizer.sanitizeUserInput(true, 'boolean')).toBe(true);
      expect(InputSanitizer.sanitizeUserInput('true', 'boolean')).toBe(true);
      expect(InputSanitizer.sanitizeUserInput('1', 'boolean')).toBe(true);
      expect(InputSanitizer.sanitizeUserInput('false', 'boolean')).toBe(false);
      expect(InputSanitizer.sanitizeUserInput('0', 'boolean')).toBe(false);
      expect(InputSanitizer.sanitizeUserInput(1, 'boolean')).toBe(true);
      expect(InputSanitizer.sanitizeUserInput(0, 'boolean')).toBe(false);
    });

    it('should sanitize array input', () => {
      const input = ['hello', 123, true, null, undefined];
      const result = InputSanitizer.sanitizeUserInput(input, 'array');
      expect(result).toEqual(['hello', 123, true]);
    });

    it('should sanitize object input', () => {
      const input = {
        name: '  John  ',
        age: '25',
        active: 'true',
        invalid: null
      };
      const result = InputSanitizer.sanitizeUserInput(input, 'object');
      expect(result).toEqual({
        name: 'John',
        age: '25',
        active: 'true'
      });
    });

    it('should handle invalid type', () => {
      const result = InputSanitizer.sanitizeUserInput('test', 'invalid' as any);
      expect(result).toBe(null);
    });
  });

  it('should remove control characters from strings', () => {
    const input = 'hello\x00\x01world\x7f';
    const result = InputSanitizer.sanitizeUserInput(input, 'string');
    expect(result).toBe('helloworld');
  });

  it('should limit string length', () => {
    const input = 'a'.repeat(10001);
    const result = InputSanitizer.sanitizeUserInput(input, 'string');
    expect(result?.length).toBe(10000);
  });

  it('should limit array length', () => {
    const input = new Array(1001).fill('item');
    const result = InputSanitizer.sanitizeUserInput(input, 'array') as any[];
    expect(result.length).toBe(1000);
  });

  it('should limit object properties', () => {
    const input: Record<string, any> = {};
    for (let i = 0; i < 101; i++) {
      input[`prop${i}`] = `value${i}`;
    }
    const result = InputSanitizer.sanitizeUserInput(input, 'object') as Record<string, any>;
    expect(Object.keys(result).length).toBe(100);
  });
});

describe('DomainSanitizer', () => {
  describe('sanitizeUserProfile', () => {
    it('should sanitize valid user profile', () => {
      const profile = {
        uid: '  user123  ',
        level: 'Intermediate',
        preferredLanguage: 'Python',
        theme: 'dark',
        streak: 5.7,
        totalXP: 1000.9,
        lastActiveDate: '2023-12-25T10:30:00.000Z',
        solvedProblems: ['problem1', '', 'problem2']
      };

      const result = DomainSanitizer.sanitizeUserProfile(profile);
      
      expect(result.uid).toBe('user123');
      expect(result.level).toBe('Intermediate');
      expect(result.preferredLanguage).toBe('Python');
      expect(result.theme).toBe('dark');
      expect(result.streak).toBe(5);
      expect(result.totalXP).toBe(1000);
      expect(result.lastActiveDate).toBe('2023-12-25T10:30:00.000Z');
      expect(result.solvedProblems).toEqual(['problem1', 'problem2']);
    });

    it('should filter invalid profile data', () => {
      const profile = {
        level: 'Expert', // Invalid
        preferredLanguage: 'Ruby', // Invalid
        streak: -1, // Invalid
        totalXP: 'invalid', // Invalid
        lastActiveDate: '2023-12-25', // Invalid format
        solvedProblems: 'not-array' // Invalid
      };

      const result = DomainSanitizer.sanitizeUserProfile(profile);
      
      expect(result.level).toBeUndefined();
      expect(result.preferredLanguage).toBeUndefined();
      expect(result.streak).toBeUndefined();
      expect(result.totalXP).toBeUndefined();
      expect(result.lastActiveDate).toBeUndefined();
      expect(result.solvedProblems).toBeUndefined();
    });
  });

  describe('sanitizeQuestion', () => {
    it('should sanitize valid question', () => {
      const question = {
        title: '  <b>Two Sum</b>  ',
        description: '<p>Find two numbers that add up to target</p><script>alert()</script>',
        difficulty: 'Basic',
        topic: '  <i>Arrays</i>  ',
        examples: [
          {
            input: '<code>[2,7,11,15]</code>',
            output: '<b>[0,1]</b>',
            explanation: '<p>2 + 7 = 9</p>'
          }
        ],
        constraints: ['<b>1 &lt;= nums.length &lt;= 10^4</b>'],
        testCases: [
          {
            input: '[2,7,11,15]',
            expectedOutput: '[0,1]',
            isHidden: false
          }
        ],
        isAI: true,
        createdBy: '  user123  ',
        tags: ['  ARRAY  ', '  hash-table  ']
      };

      const result = DomainSanitizer.sanitizeQuestion(question);
      
      expect(result.title).toBe('Two Sum');
      expect(result.description).toBe('<p>Find two numbers that add up to target</p>');
      expect(result.difficulty).toBe('Basic');
      expect(result.topic).toBe('Arrays');
      expect(result.examples[0].input).toBe('[2,7,11,15]');
      expect(result.examples[0].output).toBe('[0,1]');
      expect(result.examples[0].explanation).toBe('<p>2 + 7 = 9</p>');
      expect(result.constraints).toEqual(['1 &lt;= nums.length &lt;= 10^4']);
      expect(result.testCases[0].isHidden).toBe(false);
      expect(result.isAI).toBe(true);
      expect(result.createdBy).toBe('user123');
      expect(result.tags).toEqual(['array', 'hash-table']);
    });

    it('should filter invalid question data', () => {
      const question = {
        difficulty: 'Expert', // Invalid
        examples: [
          { input: '', output: 'valid' }, // Invalid - empty input
          { input: 'valid', output: 'valid' } // Valid
        ],
        testCases: [
          { input: '', expectedOutput: 'valid', isHidden: true }, // Invalid - empty input
          { input: 'valid', expectedOutput: 'valid', isHidden: true } // Valid
        ]
      };

      const result = DomainSanitizer.sanitizeQuestion(question);
      
      expect(result.difficulty).toBeUndefined();
      expect(result.examples).toHaveLength(1);
      expect(result.testCases).toHaveLength(1);
    });
  });

  describe('sanitizeSubmission', () => {
    it('should sanitize valid submission', () => {
      const submission = {
        uid: '  user123  ',
        problemId: '  problem456  ',
        code: 'def solution():\n    return []',
        language: 'Python',
        status: 'Accepted',
        executionTime: 0.567,
        memoryUsage: 1024.8,
        testResults: [
          {
            passed: 'true',
            input: 123,
            expectedOutput: null,
            actualOutput: 'result',
            executionTime: '0.1',
            memoryUsage: '512'
          }
        ]
      };

      const result = DomainSanitizer.sanitizeSubmission(submission);
      
      expect(result.uid).toBe('user123');
      expect(result.problemId).toBe('problem456');
      expect(result.code).toContain('def solution()');
      expect(result.language).toBe('Python');
      expect(result.status).toBe('Accepted');
      expect(result.executionTime).toBe(0.567);
      expect(result.memoryUsage).toBe(1024.8);
      expect(result.testResults[0].passed).toBe(true);
      expect(result.testResults[0].input).toBe('123');
      expect(result.testResults[0].expectedOutput).toBe('');
      expect(result.testResults[0].executionTime).toBe(0.1);
      expect(result.testResults[0].memoryUsage).toBe(512);
    });

    it('should sanitize dangerous code', () => {
      const submission = {
        code: 'import os\nos.system("rm -rf /")',
        language: 'Python'
      };

      const result = DomainSanitizer.sanitizeSubmission(submission);
      
      expect(result.code).toContain('REMOVED_DANGEROUS_CODE');
      expect(result.code).not.toContain('import os');
    });

    it('should filter invalid submission data', () => {
      const submission = {
        language: 'Ruby', // Invalid
        status: 'Pending', // Invalid
        executionTime: -1, // Invalid
        code: 'a'.repeat(50001) // Too long
      };

      const result = DomainSanitizer.sanitizeSubmission(submission);
      
      expect(result.language).toBeUndefined();
      expect(result.status).toBeUndefined();
      expect(result.executionTime).toBeUndefined();
      expect(result.code).toBeUndefined();
    });
  });
});