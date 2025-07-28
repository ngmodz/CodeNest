'use client';

import React, { useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import { ProgrammingLanguage } from '@/types';
import { useTheme } from '@/context/ThemeContext';

interface CodeEditorProps {
  language: ProgrammingLanguage;
  code: string;
  onChange: (value: string | undefined) => void;
  height?: string;
  readOnly?: boolean;
}

// Map our app's language types to Monaco's language identifiers
const languageMap: Record<ProgrammingLanguage, string> = {
  'Python': 'python',
  'JavaScript': 'javascript',
  'Java': 'java',
  'C++': 'cpp',
  'C': 'c',
};

export default function CodeEditor({ 
  language, 
  code, 
  onChange, 
  height = '500px',
  readOnly = false 
}: CodeEditorProps) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration issues by only rendering after mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle editor mounting
  const handleEditorDidMount = (editor: any) => {
    editor.focus();
  };

  if (!mounted) {
    return <div style={{ height }} className="bg-gray-100 dark:bg-gray-800 rounded-md animate-pulse" />;
  }

  return (
    <div className="w-full border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
      <Editor
        height={height}
        language={languageMap[language]}
        value={code}
        onChange={onChange}
        theme={theme === 'dark' ? 'vs-dark' : 'light'}
        options={{
          readOnly,
          minimap: { enabled: true },
          scrollBeyondLastLine: false,
          fontSize: 14,
          wordWrap: 'on',
          automaticLayout: true,
          fontFamily: 'Menlo, Monaco, "Courier New", monospace',
          tabSize: 2,
          lineNumbers: 'on',
        }}
        onMount={handleEditorDidMount}
        className="monaco-editor-container"
      />
    </div>
  );
} 