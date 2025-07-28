'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ProblemInterface } from '@/components/editor';
import { CodingProblem } from '@/types';
import { LoadingSkeleton } from '@/components/ui';

// Sample template code for different languages
const templateCode: Record<string, string> = {
  'Python': '# Write your Python solution here\n\ndef solution(input_data):\n    # Your code here\n    return "output"\n\n# Example usage\nprint(solution("example input"))',
  'JavaScript': '// Write your JavaScript solution here\n\nfunction solution(input) {\n    // Your code here\n    return "output";\n}\n\n// Example usage\nconsole.log(solution("example input"));',
  'Java': 'import java.util.*;\n\npublic class Solution {\n    public static void main(String[] args) {\n        System.out.println(solution("example input"));\n    }\n    \n    public static String solution(String input) {\n        // Your code here\n        return "output";\n    }\n}',
  'C++': '#include <iostream>\n#include <string>\n\nusing namespace std;\n\nstring solution(string input) {\n    // Your code here\n    return "output";\n}\n\nint main() {\n    cout << solution("example input") << endl;\n    return 0;\n}\n',
  'C': '#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nchar* solution(char* input) {\n    // Your code here\n    return "output";\n}\n\nint main() {\n    printf("%s\\n", solution("example input"));\n    return 0;\n}\n'
};

export default function ChallengePage() {
  const { id } = useParams();
  const [problem, setProblem] = useState<CodingProblem | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // In a real app, fetch the problem data from the API
    // For now, we'll use a mock problem
    const fetchProblem = async () => {
      try {
        setIsLoading(true);
        
        // In a real implementation, this would be an API call
        // const response = await fetch(`/api/problems/${id}`);
        // const data = await response.json();
        
        // Mock data for demonstration
        const mockProblem: CodingProblem = {
          id: id as string,
          title: "Two Sum",
          description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.",
          difficulty: "Basic",
          topic: "Arrays",
          examples: [
            {
              input: "nums = [2,7,11,15], target = 9",
              output: "[0,1]",
              explanation: "Because nums[0] + nums[1] == 9, we return [0, 1]."
            },
            {
              input: "nums = [3,2,4], target = 6",
              output: "[1,2]"
            }
          ],
          constraints: [
            "2 <= nums.length <= 10^4",
            "-10^9 <= nums[i] <= 10^9",
            "-10^9 <= target <= 10^9",
            "Only one valid answer exists."
          ],
          testCases: [],
          isAI: false,
          createdAt: new Date().toISOString()
        };
        
        // Simulate API delay
        setTimeout(() => {
          setProblem(mockProblem);
          setIsLoading(false);
        }, 500);
      } catch (err) {
        setError('Failed to fetch problem data');
        setIsLoading(false);
        console.error('Error fetching problem:', err);
      }
    };

    fetchProblem();
  }, [id]);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error || !problem) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-2">Error</h1>
          <p className="text-gray-700 dark:text-gray-300">{error || 'Problem not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col p-4">
      <div className="flex-1 overflow-hidden">
        <ProblemInterface 
          problem={problem} 
          initialCode={templateCode['JavaScript']} 
        />
      </div>
    </div>
  );
} 