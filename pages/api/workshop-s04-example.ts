// Workshop S04 - Quality Gate Training Example
// This file intentionally contains violations for training purposes

import type { NextApiRequest, NextApiResponse } from 'next';

// VIOLATION 1: Unused variable (ESLint)
const unusedConfig = {
  timeout: 5000,
};

// VIOLATION 2: console.log in production (ESLint)
console.log('Workshop S04 - PageSpeed Training');

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // VIOLATION 3: Type mismatch (TypeScript strict)
  const response: string = 123;  // number assigned to string
  
  // VIOLATION 4: Missing error handling
  const data = JSON.parse(req.body);
  
  // VIOLATION 5: Unused parameter
  const { filter, ignored } = req.query;
  console.log(filter);
  
  res.status(200).json({
    message: 'Workshop API',
    response
  });
}
