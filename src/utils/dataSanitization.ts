import { ValidationUtils } from './validationSchemas';
import { 
  SKILL_LEVELS, 
  PROGRAMMING_LANGUAGES, 
  THEMES, 
  DIFFICULTY_LEVELS, 
  SUBMISSION_STATUSES 
} from '@/types';

// HTML sanitization utilities
class HtmlSanitizer {
  private static readonly ALLOWED_TAGS = ['b', 'i', 'u', 'strong', 'em', 'code', 'pre', 'br', 'p'];
  private static readonly DANGEROUS_PATTERNS = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
    /<embed\b[^<]*>/gi,
    /<link\b[^<]*>/gi,
    /<meta\b[^<]*>/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /data:/gi,
    /on\w+\s*=/gi
  ];

  static sanitizeHtml(input: string): string {
    if (typeof input !== 'string') return '';
    
    let sanitized = input;
    
    // Remove dangerous patterns
    for (const pattern of this.DANGEROUS_PATTERNS) {
      sanitized = sanitized.replace(pattern, '');
    }
    
    // Remove dangerous attributes from all tags first
    sanitized = sanitized.replace(/\s+on\w+\s*=\s*[^>\s]*/gi, '');
    
    // Remove all HTML tags except allowed ones
    sanitized = sanitized.replace(/<(?!\/?(?:b|i|u|strong|em|code|pre|br|p)\b)[^>]*>/gi, '');
    
    return sanitized.trim();
  }

  static stripAllHtml(input: string): string {
    if (typeof input !== 'string') return '';
    return input.replace(/<[^>]*>/g, '').trim();
  }
}

// SQL injection prevention utilities
class SqlSanitizer {
  private static readonly SQL_INJECTION_PATTERNS = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|SCRIPT)\b)/gi,
    /(\b(OR|AND)\s+\d+\s*=\s*\d+)/gi,
    /(--|\/\*|\*\/|;)/g,
    /(\b(CHAR|NCHAR|VARCHAR|NVARCHAR)\s*\(\s*\d+\s*\))/gi,
    /(\bCAST\s*\()/gi,
    /(\bCONVERT\s*\()/gi
  ];

  static sanitizeSqlInput(input: string): string {
    if (typeof input !== 'string') return '';
    
    let sanitized = input;
    
    // Remove SQL injection patterns
    for (const pattern of this.SQL_INJECTION_PATTERNS) {
      sanitized = sanitized.replace(pattern, '');
    }
    
    // Escape single quotes
    sanitized = sanitized.replace(/'/g, "''");
    
    return sanitized.trim();
  }
}

// XSS prevention utilities
class XssSanitizer {
  private static readonly XSS_PATTERNS = [
    /<script[^>]*>.*?<\/script>/gi,
    /<iframe[^>]*>.*?<\/iframe>/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /onload=/gi,
    /onerror=/gi,
    /onclick=/gi,
    /onmouseover=/gi,
    /onfocus=/gi,
    /onblur=/gi,
    /onchange=/gi,
    /onsubmit=/gi,
    /expression\s*\(/gi,
    /url\s*\(/gi,
    /@import/gi
  ];

  static sanitizeXss(input: string): string {
    if (typeof input !== 'string') return '';
    
    let sanitized = input;
    
    // First encode HTML entities
    sanitized = sanitized
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
    
    // Then remove XSS patterns (after encoding)
    for (const pattern of this.XSS_PATTERNS) {
      sanitized = sanitized.replace(pattern, '');
    }
    
    return sanitized;
  }

  static decodeHtmlEntities(input: string): string {
    if (typeof input !== 'string') return '';
    
    return input
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'")
      .replace(/&#x2F;/g, '/');
  }
}

// Code sanitization utilities
class CodeSanitizer {
  private static readonly DANGEROUS_CODE_PATTERNS = [
    // System commands
    /\b(system|exec|eval|subprocess|os\.system|os\.popen|os\.spawn)/gi,
    // File operations
    /\b(open|file|read|write|delete|remove|unlink|rmdir|mkdir)/gi,
    // Network operations
    /\b(socket|urllib|requests|http|ftp|telnet)/gi,
    // Process operations
    /\b(fork|kill|signal|thread|multiprocessing)/gi,
    // Import dangerous modules
    /\b(import\s+(os|sys|subprocess|socket|urllib|requests|threading|multiprocessing))/gi
  ];

  static sanitizeCode(code: string, language: string): string {
    if (typeof code !== 'string') return '';
    
    let sanitized = code;
    
    // Language-specific sanitization
    switch (language.toLowerCase()) {
      case 'python':
        sanitized = this.sanitizePythonCode(sanitized);
        break;
      case 'javascript':
        sanitized = this.sanitizeJavaScriptCode(sanitized);
        break;
      case 'java':
        sanitized = this.sanitizeJavaCode(sanitized);
        break;
      case 'c':
      case 'c++':
        sanitized = this.sanitizeCCode(sanitized);
        break;
    }
    
    return sanitized;
  }

  private static sanitizePythonCode(code: string): string {
    let sanitized = code;
    
    // Remove dangerous imports and functions
    const pythonDangerousPatterns = [
      /import\s+(os|sys|subprocess|socket|urllib|requests|threading|multiprocessing|ctypes|pickle)/gi,
      /from\s+(os|sys|subprocess|socket|urllib|requests|threading|multiprocessing|ctypes|pickle)/gi,
      /\b(__import__|exec|eval|compile|globals|locals|vars|dir|getattr|setattr|delattr|hasattr)/gi,
      /\bopen\s*\(/gi,
      /\bfile\s*\(/gi
    ];
    
    for (const pattern of pythonDangerousPatterns) {
      sanitized = sanitized.replace(pattern, '# REMOVED_DANGEROUS_CODE');
    }
    
    return sanitized;
  }

  private static sanitizeJavaScriptCode(code: string): string {
    let sanitized = code;
    
    // Remove dangerous JavaScript patterns
    const jsDangerousPatterns = [
      /\beval\s*\(/gi,
      /\bFunction\s*\(/gi,
      /\bsetTimeout\s*\(/gi,
      /\bsetInterval\s*\(/gi,
      /\brequire\s*\(/gi,
      /\bprocess\./gi,
      /\bfs\./gi,
      /\bchild_process/gi,
      /document\./gi,
      /window\./gi,
      /location\./gi,
      /navigator\./gi
    ];
    
    for (const pattern of jsDangerousPatterns) {
      sanitized = sanitized.replace(pattern, '/* REMOVED_DANGEROUS_CODE */');
    }
    
    return sanitized;
  }

  private static sanitizeJavaCode(code: string): string {
    let sanitized = code;
    
    // Remove dangerous Java patterns
    const javaDangerousPatterns = [
      /\bRuntime\.getRuntime\(\)/gi,
      /\bProcessBuilder/gi,
      /\bSystem\.exit/gi,
      /\bSystem\.gc/gi,
      /\bThread\./gi,
      /\bClass\.forName/gi,
      /\bMethod\.invoke/gi,
      /\bReflection/gi,
      /\bjava\.io\.File/gi,
      /\bjava\.net\./gi,
      /\bjava\.lang\.reflect\./gi
    ];
    
    for (const pattern of javaDangerousPatterns) {
      sanitized = sanitized.replace(pattern, '/* REMOVED_DANGEROUS_CODE */');
    }
    
    return sanitized;
  }

  private static sanitizeCCode(code: string): string {
    let sanitized = code;
    
    // Remove dangerous C/C++ patterns
    const cDangerousPatterns = [
      /\bsystem\s*\(/gi,
      /\bexec\w*\s*\(/gi,
      /\bfork\s*\(/gi,
      /\bkill\s*\(/gi,
      /\bexit\s*\(/gi,
      /\babort\s*\(/gi,
      /#include\s*<(stdlib|unistd|sys\/|signal|process)\.h>/gi,
      /\bfopen\s*\(/gi,
      /\bfwrite\s*\(/gi,
      /\bfread\s*\(/gi,
      /\bremove\s*\(/gi,
      /\brename\s*\(/gi
    ];
    
    for (const pattern of cDangerousPatterns) {
      sanitized = sanitized.replace(pattern, '/* REMOVED_DANGEROUS_CODE */');
    }
    
    return sanitized;
  }

  static validateCodeLength(code: string, maxLength: number = 50000): boolean {
    return typeof code === 'string' && code.length <= maxLength;
  }

  static normalizeWhitespace(code: string): string {
    if (typeof code !== 'string') return '';
    
    // Normalize line endings to \n
    return code.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  }
}

// Input sanitization for different data types
class InputSanitizer {
  static sanitizeUserInput(input: unknown, type: 'string' | 'number' | 'boolean' | 'array' | 'object'): any {
    switch (type) {
      case 'string':
        return this.sanitizeStringInput(input);
      case 'number':
        return this.sanitizeNumberInput(input);
      case 'boolean':
        return this.sanitizeBooleanInput(input);
      case 'array':
        return this.sanitizeArrayInput(input);
      case 'object':
        return this.sanitizeObjectInput(input);
      default:
        return null;
    }
  }

  private static sanitizeStringInput(input: unknown): string | null {
    if (typeof input !== 'string') return null;
    
    // Remove null bytes and control characters
    let sanitized = input.replace(/\0/g, '').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    
    // Trim whitespace
    sanitized = sanitized.trim();
    
    // Limit length
    if (sanitized.length > 10000) {
      sanitized = sanitized.substring(0, 10000);
    }
    
    return sanitized;
  }

  private static sanitizeNumberInput(input: unknown): number | null {
    if (typeof input === 'number') {
      if (isNaN(input) || !isFinite(input)) return null;
      return input;
    }
    
    if (typeof input === 'string') {
      const num = parseFloat(input);
      if (isNaN(num) || !isFinite(num)) return null;
      return num;
    }
    
    return null;
  }

  private static sanitizeBooleanInput(input: unknown): boolean | null {
    if (typeof input === 'boolean') return input;
    
    if (typeof input === 'string') {
      const lower = input.toLowerCase().trim();
      if (lower === 'true' || lower === '1' || lower === 'yes') return true;
      if (lower === 'false' || lower === '0' || lower === 'no') return false;
    }
    
    if (typeof input === 'number') {
      return input !== 0;
    }
    
    return null;
  }

  private static sanitizeArrayInput(input: unknown): any[] | null {
    if (!Array.isArray(input)) return null;

    // Limit array length
    const arrayInput = input.length > 1000 ? input.slice(0, 1000) : input;

    // Recursively sanitize array elements
    return arrayInput.map(item => {
      if (typeof item === 'string') return this.sanitizeStringInput(item);
      if (typeof item === 'number') return this.sanitizeNumberInput(item);
      if (typeof item === 'boolean') return this.sanitizeBooleanInput(item);
      if (Array.isArray(item)) return this.sanitizeArrayInput(item);
      if (typeof item === 'object' && item !== null) return this.sanitizeObjectInput(item);
      return null;
    }).filter(item => item !== null);
  }

  private static sanitizeObjectInput(input: unknown): Record<string, any> | null {
    if (typeof input !== 'object' || input === null || Array.isArray(input)) return null;
    
    const sanitized: Record<string, any> = {};
    const obj = input as Record<string, unknown>;
    
    // Limit number of properties
    const keys = Object.keys(obj).slice(0, 100);
    
    for (const key of keys) {
      const sanitizedKey = this.sanitizeStringInput(key);
      if (!sanitizedKey || sanitizedKey.length > 100) continue;
      
      const value = obj[key];
      
      // Try to sanitize as different types
      const sanitizedString = this.sanitizeStringInput(value);
      const sanitizedNumber = this.sanitizeNumberInput(value);
      const sanitizedBoolean = this.sanitizeBooleanInput(value);
      
      if (typeof value === 'string') {
        if (sanitizedString !== null) sanitized[sanitizedKey] = sanitizedString;
      } else if (typeof value === 'number') {
        if (sanitizedNumber !== null) sanitized[sanitizedKey] = sanitizedNumber;
      } else if (typeof value === 'boolean') {
        if (sanitizedBoolean !== null) sanitized[sanitizedKey] = sanitizedBoolean;
      } else if (Array.isArray(value)) {
        const sanitizedValue = this.sanitizeArrayInput(value);
        if (sanitizedValue !== null) sanitized[sanitizedKey] = sanitizedValue;
      } else if (typeof value === 'object' && value !== null) {
        // Prevent deep nesting
        sanitized[sanitizedKey] = null;
      } else {
        // Try to convert string values to appropriate types
        if (typeof value === 'string') {
          if (sanitizedNumber !== null) {
            sanitized[sanitizedKey] = sanitizedNumber;
          } else if (sanitizedBoolean !== null) {
            sanitized[sanitizedKey] = sanitizedBoolean;
          } else if (sanitizedString !== null) {
            sanitized[sanitizedKey] = sanitizedString;
          }
        }
      }
    }
    
    return sanitized;
  }
}

// Comprehensive data sanitization for specific domain objects
class DomainSanitizer {
  static sanitizeUserProfile(profile: any): any {
    const sanitized: any = {};
    
    if (profile.uid) {
      sanitized.uid = ValidationUtils.sanitizeString(profile.uid, { maxLength: 128 });
    }
    
    if (profile.level && SKILL_LEVELS.includes(profile.level)) {
      sanitized.level = profile.level;
    }
    
    if (profile.preferredLanguage && PROGRAMMING_LANGUAGES.includes(profile.preferredLanguage)) {
      sanitized.preferredLanguage = profile.preferredLanguage;
    }
    
    if (profile.theme && THEMES.includes(profile.theme)) {
      sanitized.theme = profile.theme;
    }
    
    if (profile.streak !== undefined) {
      const streak = ValidationUtils.sanitizeNumber(profile.streak, { min: 0 });
      if (streak !== null) sanitized.streak = Math.floor(streak);
    }
    
    if (profile.totalXP !== undefined) {
      const totalXP = ValidationUtils.sanitizeNumber(profile.totalXP, { min: 0 });
      if (totalXP !== null) sanitized.totalXP = Math.floor(totalXP);
    }
    
    if (profile.lastActiveDate && ValidationUtils.isValidISODate(profile.lastActiveDate)) {
      sanitized.lastActiveDate = profile.lastActiveDate;
    }
    
    if (Array.isArray(profile.solvedProblems)) {
      sanitized.solvedProblems = ValidationUtils.sanitizeArray(
        profile.solvedProblems,
        (id) => ValidationUtils.sanitizeString(id, { minLength: 1, maxLength: 100 })
      );
    }
    
    return sanitized;
  }

  static sanitizeQuestion(question: any): any {
    const sanitized: any = {};
    
    if (question.title) {
      sanitized.title = HtmlSanitizer.stripAllHtml(
        ValidationUtils.sanitizeString(question.title, { maxLength: 200 }) || ''
      );
    }
    
    if (question.description) {
      sanitized.description = HtmlSanitizer.sanitizeHtml(
        ValidationUtils.sanitizeString(question.description, { maxLength: 5000 }) || ''
      );
    }
    
    if (question.difficulty && DIFFICULTY_LEVELS.includes(question.difficulty)) {
      sanitized.difficulty = question.difficulty;
    }
    
    if (question.topic) {
      sanitized.topic = HtmlSanitizer.stripAllHtml(
        ValidationUtils.sanitizeString(question.topic, { maxLength: 50 }) || ''
      );
    }
    
    if (Array.isArray(question.examples)) {
      sanitized.examples = question.examples
        .filter((ex: any) => ex.input && ex.output)
        .map((ex: any) => ({
          input: HtmlSanitizer.stripAllHtml(ValidationUtils.sanitizeString(ex.input) || ''),
          output: HtmlSanitizer.stripAllHtml(ValidationUtils.sanitizeString(ex.output) || ''),
          explanation: ex.explanation ? HtmlSanitizer.sanitizeHtml(ValidationUtils.sanitizeString(ex.explanation) || '') : undefined
        }));
    }
    
    if (Array.isArray(question.constraints)) {
      sanitized.constraints = question.constraints
        .map((constraint: any) => {
          const sanitizedConstraint = ValidationUtils.sanitizeString(constraint, { minLength: 1 });
          return sanitizedConstraint ? HtmlSanitizer.stripAllHtml(sanitizedConstraint) : null;
        })
        .filter((constraint: any) => constraint !== null && constraint.length > 0);
    }
    
    if (Array.isArray(question.testCases)) {
      sanitized.testCases = question.testCases
        .filter((tc: any) => tc.input && tc.expectedOutput)
        .map((tc: any) => ({
          input: ValidationUtils.sanitizeString(tc.input) || '',
          expectedOutput: ValidationUtils.sanitizeString(tc.expectedOutput) || '',
          isHidden: Boolean(tc.isHidden)
        }));
    }
    
    if (typeof question.isAI === 'boolean') {
      sanitized.isAI = question.isAI;
    }
    
    if (question.createdBy) {
      sanitized.createdBy = ValidationUtils.sanitizeString(question.createdBy, { maxLength: 128 });
    }
    
    if (Array.isArray(question.tags)) {
      sanitized.tags = ValidationUtils.sanitizeArray(
        question.tags,
        (tag) => HtmlSanitizer.stripAllHtml(ValidationUtils.sanitizeString(tag, { minLength: 1, maxLength: 50 }) || '').toLowerCase()
      );
    }
    
    return sanitized;
  }

  static sanitizeSubmission(submission: any): any {
    const sanitized: any = {};
    
    if (submission.uid) {
      sanitized.uid = ValidationUtils.sanitizeString(submission.uid, { maxLength: 128 });
    }
    
    if (submission.problemId) {
      sanitized.problemId = ValidationUtils.sanitizeString(submission.problemId, { maxLength: 128 });
    }
    
    if (submission.code && submission.language) {
      // Sanitize code based on language
      const normalizedCode = CodeSanitizer.normalizeWhitespace(submission.code);
      if (CodeSanitizer.validateCodeLength(normalizedCode)) {
        sanitized.code = CodeSanitizer.sanitizeCode(normalizedCode, submission.language);
      }
    }
    
    if (submission.language && PROGRAMMING_LANGUAGES.includes(submission.language)) {
      sanitized.language = submission.language;
    }
    
    if (submission.status && SUBMISSION_STATUSES.includes(submission.status)) {
      sanitized.status = submission.status;
    }
    
    const executionTime = ValidationUtils.sanitizeNumber(submission.executionTime, { min: 0 });
    if (executionTime !== null) sanitized.executionTime = executionTime;
    
    const memoryUsage = ValidationUtils.sanitizeNumber(submission.memoryUsage, { min: 0 });
    if (memoryUsage !== null) sanitized.memoryUsage = memoryUsage;
    
    if (Array.isArray(submission.testResults)) {
      sanitized.testResults = submission.testResults.map((result: any) => ({
        passed: Boolean(result.passed),
        input: result.input !== null && result.input !== undefined ? String(result.input) : '',
        expectedOutput: result.expectedOutput !== null && result.expectedOutput !== undefined ? String(result.expectedOutput) : '',
        actualOutput: result.actualOutput !== null && result.actualOutput !== undefined ? String(result.actualOutput) : '',
        executionTime: Math.max(0, Number(result.executionTime) || 0),
        memoryUsage: Math.max(0, Number(result.memoryUsage) || 0),
        error: result.error ? ValidationUtils.sanitizeString(result.error, { maxLength: 1000 }) : undefined
      }));
    }
    
    return sanitized;
  }
}

// Export all sanitization utilities
export {
  HtmlSanitizer,
  SqlSanitizer,
  XssSanitizer,
  CodeSanitizer,
  InputSanitizer,
  DomainSanitizer
};