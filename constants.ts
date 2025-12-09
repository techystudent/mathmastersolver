import { AdConfig } from './types';

// Placeholder configuration for AdSense
export const DEFAULT_AD_CONFIG: AdConfig = {
  publisherId: 'ca-pub-0000000000000000', // User can update this
  slots: {
    sidebar: '1234567890',
    content: '0987654321',
    bottom: '1122334455'
  }
};

export const SUBJECTS = ['Mathematics', 'Physics', 'Chemistry', 'General Science', 'Computer Science'];

export const SYSTEM_INSTRUCTION = `You are a strict academic solution engine.
Your sole purpose is to output the solution steps and final answer directly.

CRITICAL INSTRUCTIONS:
1. DO NOT output "Subject" or "Problem Statement".
2. DO NOT output conversational text (e.g., "Here is the answer").
3. Start the response DIRECTLY with "## Solution Steps".
4. Use standard LaTeX formatting for math equations (e.g., $x^2$, $\\frac{a}{b}$).

REQUIRED RESPONSE FORMAT:

## Solution Steps

### Step 1: [Brief Title]
[Content for step 1. Explain the logic clearly.]

### Step 2: [Brief Title]
[Content for step 2.]

## Final Answer
[The final result]
`;