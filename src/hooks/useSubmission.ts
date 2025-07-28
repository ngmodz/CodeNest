// Hook for managing code submissions and evaluations
import { useState, useCallback } from 'react';
import { TestResult, TestCase } from '@/types';
import { 
  submissionEvaluationService, 
  SubmissionEvaluationRequest, 
  SubmissionEvaluationResult,
  CodeExecutionRequest,
  CodeExecutionResponse 
} from '@/lib/submissionEvaluation';
import { useAuth } from '@/hooks/useAuth';

export interface UseSubmissionState {
  // Execution state
  isRunning: boolean;
  isSubmitting: boolean;
  
  // Results
  runResults: TestResult[] | null;
  submissionResult: SubmissionEvaluationResult | null;
  
  // Error handling
  error: string | null;
  
  // Statistics
  executionTime: number | null;
  memoryUsage: number | null;
}

export interface UseSubmissionActions {
  runCode: (code: string, language: string, testCases: TestCase[]) => Promise<void>;
  submitCode: (code: string, language: string, problemId: string, testCases: TestCase[]) => Promise<void>;
  clearResults: () => void;
  clearError: () => void;
}

export function useSubmission(): UseSubmissionState & UseSubmissionActions {
  const { user } = useAuth();
  
  const [state, setState] = useState<UseSubmissionState>({
    isRunning: false,
    isSubmitting: false,
    runResults: null,
    submissionResult: null,
    error: null,
    executionTime: null,
    memoryUsage: null
  });

  const clearResults = useCallback(() => {
    setState(prev => ({
      ...prev,
      runResults: null,
      submissionResult: null,
      error: null,
      executionTime: null,
      memoryUsage: null
    }));
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: null
    }));
  }, []);

  const runCode = useCallback(async (
    code: string, 
    language: string, 
    testCases: TestCase[]
  ) => {
    if (!code.trim()) {
      setState(prev => ({
        ...prev,
        error: 'Please enter some code to run'
      }));
      return;
    }

    setState(prev => ({
      ...prev,
      isRunning: true,
      error: null,
      runResults: null
    }));

    try {
      const request: CodeExecutionRequest = {
        code,
        language,
        testCases,
        action: 'run'
      };

      const result: CodeExecutionResponse = await submissionEvaluationService.runCode(request);

      if (result.success) {
        setState(prev => ({
          ...prev,
          isRunning: false,
          runResults: result.testResults || [],
          executionTime: result.executionTime || null,
          memoryUsage: result.memoryUsage || null
        }));
      } else {
        setState(prev => ({
          ...prev,
          isRunning: false,
          error: result.error || 'Code execution failed'
        }));
      }
    } catch (error) {
      console.error('Run code error:', error);
      setState(prev => ({
        ...prev,
        isRunning: false,
        error: error instanceof Error ? error.message : 'Failed to run code'
      }));
    }
  }, []);

  const submitCode = useCallback(async (
    code: string, 
    language: string, 
    problemId: string, 
    testCases: TestCase[]
  ) => {
    if (!user) {
      setState(prev => ({
        ...prev,
        error: 'You must be signed in to submit code'
      }));
      return;
    }

    if (!code.trim()) {
      setState(prev => ({
        ...prev,
        error: 'Please enter some code to submit'
      }));
      return;
    }

    setState(prev => ({
      ...prev,
      isSubmitting: true,
      error: null,
      submissionResult: null
    }));

    try {
      const request: SubmissionEvaluationRequest = {
        uid: user.uid,
        problemId,
        code,
        language,
        testCases
      };

      const result: SubmissionEvaluationResult = await submissionEvaluationService.evaluateSubmission(request);

      if (result.success) {
        setState(prev => ({
          ...prev,
          isSubmitting: false,
          submissionResult: result,
          executionTime: result.executionStats?.averageExecutionTime || null,
          memoryUsage: result.executionStats?.averageMemoryUsage || null
        }));
      } else {
        setState(prev => ({
          ...prev,
          isSubmitting: false,
          error: result.error?.message || 'Submission failed'
        }));
      }
    } catch (error) {
      console.error('Submit code error:', error);
      setState(prev => ({
        ...prev,
        isSubmitting: false,
        error: error instanceof Error ? error.message : 'Failed to submit code'
      }));
    }
  }, [user]);

  return {
    ...state,
    runCode,
    submitCode,
    clearResults,
    clearError
  };
}

// Custom hook for submission history management
export function useSubmissionHistory(problemId?: string) {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshSubmissions = useCallback(async () => {
    if (!user) {
      setSubmissions([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // This would typically call the submission service
      // For now, we'll use a placeholder
      const result = await fetch(`/api/submissions?uid=${user.uid}${problemId ? `&problemId=${problemId}` : ''}`);

      if (result.ok) {
        const data = await result.json();
        setSubmissions(data.submissions || []);
      } else {
        setError('Failed to fetch submission history');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch submissions');
    } finally {
      setLoading(false);
    }
  }, [user, problemId]);

  return {
    submissions,
    loading,
    error,
    refreshSubmissions
  };
}

// Hook for submission statistics
export function useSubmissionStats(userId?: string) {
  const [stats, setStats] = useState({
    totalSubmissions: 0,
    acceptedSubmissions: 0,
    successRate: 0,
    languageDistribution: {} as Record<string, number>,
    recentActivity: [] as Array<{ date: string; count: number }>
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshStats = useCallback(async () => {
    if (!userId) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/submissions/stats?uid=${userId}`);
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        setError('Failed to fetch submission statistics');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch statistics');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  return {
    stats,
    loading,
    error,
    refreshStats
  };
}
