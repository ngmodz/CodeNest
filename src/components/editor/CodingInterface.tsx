'use client';

import React, { useState, useEffect } from 'react';
import CodeEditor from './CodeEditor';
import EditorToolbar from './EditorToolbar';
import OutputDisplay from './OutputDisplay';
import { ProgrammingLanguage, TestResult, SubmissionStatus } from '@/types';
import { useProfile } from '@/hooks/useProfile';

interface CodingInterfaceProps {
  initialCode?: string;
  problemId?: string;
  readOnly?: boolean;
}

export default function CodingInterface({
  initialCode = '',
  problemId,
  readOnly = false
}: CodingInterfaceProps) {
  const { profile } = useProfile();
  const [code, setCode] = useState(initialCode);
  const [language, setLanguage] = useState<ProgrammingLanguage>(profile?.preferredLanguage || 'JavaScript');
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<TestResult[] | null>(null);
  const [compilationError, setCompilationError] = useState<string | null>(null);
  const [executionStatus, setExecutionStatus] = useState<'idle' | 'compiling' | 'running' | 'completed' | 'error'>('idle');
  const [executionTime, setExecutionTime] = useState<number | undefined>(undefined);
  const [memoryUsage, setMemoryUsage] = useState<number | undefined>(undefined);
  const [submissionStatus, setSubmissionStatus] = useState<SubmissionStatus | undefined>(undefined);
  const [isSubmission, setIsSubmission] = useState(false);

  // Update language when profile loads
  useEffect(() => {
    if (profile?.preferredLanguage) {
      setLanguage(profile.preferredLanguage);
    }
  }, [profile]);

  const handleCodeChange = (value: string | undefined) => {
    if (value !== undefined) {
      setCode(value);
    }
  };

  const handleLanguageChange = (newLanguage: ProgrammingLanguage) => {
    setLanguage(newLanguage);
  };

  const handleRunCode = async () => {
    if (!code.trim()) return;
    
    setIsProcessing(true);
    setResults(null);
    setCompilationError(null);
    setExecutionStatus('compiling');
    setIsSubmission(false);
    setExecutionTime(undefined);
    setMemoryUsage(undefined);
    setSubmissionStatus(undefined);
    
    try {
      // First, set to compiling state
      setExecutionStatus('compiling');
      
      // Simulated delay to show compiling state (can remove in production)
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const response = await fetch('/api/compile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          language,
          problemId,
          action: 'run'
        }),
      });
      
      // Change to running state
      setExecutionStatus('running');
      
      // Another short delay to show running state (can remove in production)
      await new Promise(resolve => setTimeout(resolve, 700));
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'An error occurred during code execution');
      }
      
      if (data.compilationError) {
        setCompilationError(data.compilationError);
        setExecutionStatus('error');
      } else {
        setResults(data.results);
        
        // Calculate average execution time and memory usage from all test results
        if (data.results && data.results.length > 0) {
          const totalExecTime = data.results.reduce((sum: number, result: TestResult) => sum + result.executionTime, 0);
          const totalMemory = data.results.reduce((sum: number, result: TestResult) => sum + result.memoryUsage, 0);
          
          setExecutionTime(totalExecTime / data.results.length);
          setMemoryUsage(totalMemory / data.results.length);
        }
        
        setExecutionStatus('completed');
      }
    } catch (error) {
      console.error('Failed to run code:', error);
      setCompilationError(error instanceof Error ? error.message : 'Unknown error occurred');
      setExecutionStatus('error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmitCode = async () => {
    if (!code.trim() || !problemId) return;
    
    setIsProcessing(true);
    setResults(null);
    setCompilationError(null);
    setExecutionStatus('compiling');
    setIsSubmission(true);
    setExecutionTime(undefined);
    setMemoryUsage(undefined);
    setSubmissionStatus(undefined);
    
    try {
      // First, set to compiling state
      setExecutionStatus('compiling');
      
      // Simulated delay to show compiling state (can remove in production)
      await new Promise(resolve => setTimeout(resolve, 700));
      
      const response = await fetch('/api/compile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          language,
          problemId,
          action: 'submit'
        }),
      });
      
      // Change to running state
      setExecutionStatus('running');
      
      // Another delay to show running state (can remove in production)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'An error occurred during submission');
      }
      
      if (data.compilationError) {
        setCompilationError(data.compilationError);
        setExecutionStatus('error');
      } else {
        setResults(data.results);
        
        // Calculate average execution time and memory usage
        if (data.results && data.results.length > 0) {
          const totalExecTime = data.results.reduce((sum: number, result: TestResult) => sum + result.executionTime, 0);
          const totalMemory = data.results.reduce((sum: number, result: TestResult) => sum + result.memoryUsage, 0);
          
          setExecutionTime(totalExecTime / data.results.length);
          setMemoryUsage(totalMemory / data.results.length);
        }
        
        // Determine submission status
        const allPassed = data.results.every((result: TestResult) => result.passed);
        setSubmissionStatus(allPassed ? 'Accepted' : 'Wrong Answer');
        
        // Set execution status
        setExecutionStatus('completed');
        
        // If all tests passed, handle successful submission
        if (allPassed) {
          // Logic to handle successful submission can be added here
          console.log('All tests passed!');
          
          // Example: Call an API to update user progress
          // await fetch('/api/progress', {
          //   method: 'POST',
          //   headers: { 'Content-Type': 'application/json' },
          //   body: JSON.stringify({ problemId, completed: true })
          // });
        }
      }
    } catch (error) {
      console.error('Failed to submit code:', error);
      setCompilationError(error instanceof Error ? error.message : 'Unknown error occurred');
      setExecutionStatus('error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-full border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
      <EditorToolbar
        language={language}
        onLanguageChange={handleLanguageChange}
        onRun={handleRunCode}
        onSubmit={handleSubmitCode}
        isProcessing={isProcessing}
        readOnly={readOnly}
      />
      
      <div className="flex-grow">
        <CodeEditor
          language={language}
          code={code}
          onChange={handleCodeChange}
          height="400px"
          readOnly={readOnly || isProcessing}
        />
      </div>
      
      <OutputDisplay
        results={results}
        compilationError={compilationError}
        isLoading={isProcessing}
        executionTime={executionTime}
        memoryUsage={memoryUsage}
        status={submissionStatus}
        isSubmission={isSubmission}
        executionStatus={executionStatus}
        language={language}
      />
    </div>
  );
} 