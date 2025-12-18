import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function calculateMedian(numbers: number[]): number {
  if (numbers.length === 0) {
    return 0;
  }

  const sorted = [...numbers].sort((a, b) => a - b);
  const middleIndex = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    // Even number of elements, return the average of the two middle elements
    return (sorted[middleIndex - 1] + sorted[middleIndex]) / 2;
  } else {
    // Odd number of elements, return the middle element
    return sorted[middleIndex];
  }
}

export function calculateStandardDeviation(numbers: number[]): number {
  if (numbers.length < 2) {
    return 0;
  }

  const mean = numbers.reduce((acc, val) => acc + val, 0) / numbers.length;
  
  const variance = numbers.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / numbers.length;
  
  return Math.sqrt(variance);
}
