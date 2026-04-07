import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateMembershipNumber() {
  return `AC-${Math.floor(100000 + Math.random() * 900000)}`;
}

export function generateLoanId() {
  return `LN-${Math.floor(1000 + Math.random() * 9000)}`;
}

export function generateReceiptNumber() {
  return `REC-${Math.floor(100000 + Math.random() * 900000)}`;
}
