export type MaritalStatus = 'Single' | 'Married' | 'Divorced' | 'Widowed';
export type Role = 
  | 'JuniorExecutive' 
  | 'BusinessExecutive' 
  | 'SeniorExecutive' 
  | 'BranchManager' 
  | 'ZonalManager' 
  | 'RegionalManager' 
  | 'Cashier' 
  | 'CustomerRelationOfficer'
  | 'HRManager'
  | 'HROfficer';

export interface HRDocument {
  id: string;
  employeeId: string;
  type: 'Appointment' | 'Offer' | 'Resignation';
  date: string;
  content: string;
}

export interface Customer {
  id: string;
  membershipNo: string;
  name: string;
  address: string;
  telephone: string;
  idNo: string;
  age: number;
  birthday: string;
  email: string;
  maritalStatus: MaritalStatus;
  nationality: string;
  assignedExecutiveId: string;
  createdAt: string;
  status: 'Active' | 'PendingApproval';
  pendingChanges?: Partial<Customer>;
}

export interface Employee {
  id: string;
  name: string;
  designation: Role;
  email: string;
  password?: string; // For demo, we'll use simple passwords
  branchId: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assignedToId: string;
  customerId?: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  dueDate: string;
  createdAt: string;
}

export interface Loan {
  id: string;
  customerId: string;
  amount: number;
  interestRate: number;
  termMonths: number;
  startDate: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Active' | 'Closed';
  executiveId: string;
  approvedBy?: string;
  appraisalDetails: string;
  repaymentSchedule: RepaymentItem[];
  payments: Payment[];
  createdAt: string;
}

export interface RepaymentItem {
  dueDate: string;
  amount: number;
  principal: number;
  interest: number;
  status: 'Unpaid' | 'Paid';
}

export interface Payment {
  id: string;
  receiptNo: string;
  loanId: string;
  amount: number;
  date: string;
  method: string;
  balanceAfter: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unitPrice: number;
  lastUpdated: string;
}
