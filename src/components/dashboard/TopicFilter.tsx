'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useProfile } from '@/hooks/useProfile';
import { SkillLevel, DifficultyLevel } from '@/types';

interface Topic {
  id: string;
  name: string;
  description: string;
  skillLevel: SkillLevel;
  icon: string;
  problemCount: number;
}

interface TopicFilterProps {
  className?: string;
  onTopicSelect?: (topic: Topic) => void;
  onDifficultySelect?: (difficulty: DifficultyLevel) => void;
}

export function TopicFilter({ 
  className = '', 
  onTopicSelect,
  onDifficultySelect 
}: TopicFilterProps) {
  const { profile } = useProfile();
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel | null>(null);

  // Topics organized by skill level
  const allTopics: Topic[] = [
    // Beginner topics
    { id: 'loops', name: 'Loops', description: 'For loops, while loops, iteration', skillLevel: 'Beginner', icon: '🔄', problemCount: 15 },
    { id: 'strings', name: 'Strings', description: 'String manipulation and methods', skillLevel: 'Beginner', icon: '📝', problemCount: 12 },
    { id: 'lists', name: 'Lists', description: 'Arrays and list operations', skillLevel: 'Beginner', icon: '📋', problemCount: 18 },
    { id: 'conditionals', name: 'Conditionals', description: 'If statements and logic', skillLevel: 'Beginner', icon: '🤔', problemCount: 10 },
    
    // Intermediate topics
    { id: 'recursion', name: 'Recursion', description: 'Recursive algorithms and thinking', skillLevel: 'Intermediate', icon: '🌀', problemCount: 20 },
    { id: 'dictionaries', name: 'Dictionaries', description: 'Hash maps and key-value pairs', skillLevel: 'Intermediate', icon: '📚', problemCount: 16 },
    { id: 'sorting', name: 'Sorting', description: 'Sorting algorithms and techniques', skillLevel: 'Intermediate', icon: '📊', problemCount: 14 },
    { id: 'searching', name: 'Searching', description: 'Binary search and algorithms', skillLevel: 'Intermediate', icon: '🔍', problemCount: 12 },
    
    // Advanced topics
    { id: 'trees', name: 'Trees', description: 'Binary trees and tree traversal', skillLevel: 'Advanced', icon: '🌳', problemCount: 25 },
    { id: 'dynamic-programming', name: 'Dynamic Programming', description: 'DP patterns and optimization', skillLevel: 'Advanced', icon: '⚡', problemCount: 30 },
    { id: 'graphs', name: 'Graphs', description: 'Graph algorithms and traversal', skillLevel: 'Advanced', icon: '🕸️', problemCount: 22 },
    { id: 'backtracking', name: 'Backtracking', description: 'Backtracking algorithms', skillLevel: 'Advanced', icon: '↩️', problemCount: 18 }
  ];

  // Filter topics based on user's skill level and below
  const getAvailableTopics = () => {
    if (!profile) return allTopics.filter(t => t.skillLevel === 'Beginner');
    
    const skillLevels: SkillLevel[] = ['Beginner', 'Intermediate', 'Advanced'];
    const userLevelIndex = skillLevels.indexOf(profile.level);
    const availableLevels = skillLevels.slice(0, userLevelIndex + 1);
    
    return allTopics.filter(topic => availableLevels.includes(topic.skillLevel));
  };

  const availableTopics = getAvailableTopics();
  const difficulties: DifficultyLevel[] = ['Basic', 'Intermediate', 'Advanced'];

  const handleTopicClick = (topic: Topic) => {
    const newSelected = selectedTopic === topic.id ? null : topic.id;
    setSelectedTopic(newSelected);
    onTopicSelect?.(newSelected ? topic : null);
  };

  const handleDifficultyClick = (difficulty: DifficultyLevel) => {
    const newSelected = selectedDifficulty === difficulty ? null : difficulty;
    setSelectedDifficulty(newSelected);
    onDifficultySelect?.(newSelected);
  };

  return (
    <div className={`bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
        Practice Topics
      </h2>

      {/* Difficulty Filter */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Filter by Difficulty
        </h3>
        <div className="flex flex-wrap gap-2">
          {difficulties.map((difficulty) => (
            <motion.button
              key={difficulty}
              onClick={() => handleDifficultyClick(difficulty)}
              className={`
                px-3 py-2 rounded-lg text-sm font-medium transition-all
                ${selectedDifficulty === difficulty
                  ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-2 border-blue-300 dark:border-blue-600'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                }
              `}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {difficulty}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Topics Grid */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Available Topics for {profile?.level || 'Beginner'} Level
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {availableTopics.map((topic) => (
            <motion.button
              key={topic.id}
              onClick={() => handleTopicClick(topic)}
              className={`
                p-4 rounded-lg text-left transition-all border-2
                ${selectedTopic === topic.id
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600'
                  : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }
              `}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <span className="text-xl mr-2">{topic.icon}</span>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {topic.name}
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                    {topic.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className={`
                      text-xs px-2 py-1 rounded-full font-medium
                      ${topic.skillLevel === 'Beginner' ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' : ''}
                      ${topic.skillLevel === 'Intermediate' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400' : ''}
                      ${topic.skillLevel === 'Advanced' ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' : ''}
                    `}>
                      {topic.skillLevel}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {topic.problemCount} problems
                    </span>
                  </div>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Selected Filters Summary */}
      {(selectedTopic || selectedDifficulty) && (
        <motion.div
          className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">
            Active Filters:
          </h4>
          <div className="flex flex-wrap gap-2">
            {selectedTopic && (
              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded text-sm">
                Topic: {availableTopics.find(t => t.id === selectedTopic)?.name}
              </span>
            )}
            {selectedDifficulty && (
              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded text-sm">
                Difficulty: {selectedDifficulty}
              </span>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}