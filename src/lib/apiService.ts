import { Customer, Employee, Loan, Task, InventoryItem, Payment, HRDocument } from '../types';

const API_URL = './api.php'; // Path to your PHP script relative to index.html

interface DB {
  customers: Customer[];
  employees: Employee[];
  loans: Loan[];
  tasks: Task[];
  inventory: InventoryItem[];
  hrDocuments: HRDocument[];
}

export const apiService = {
  getDB: async (): Promise<DB> => {
    const res = await fetch(`${API_URL}?action=get_db`);
    return res.json();
  },

  // Auth (Note: In a real app, this should be handled server-side)
  login: async (email: string, pass: string): Promise<Employee | null> => {
    const db = await apiService.getDB();
    return db.employees.find(e => e.email === email && e.password === pass) || null;
  },

  // Customers
  addCustomer: async (customer: Customer) => {
    await fetch(`${API_URL}?action=add_customer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(customer)
    });
  },

  bulkAddCustomers: async (customers: Customer[]) => {
    for (const customer of customers) {
      await apiService.addCustomer(customer);
    }
  },

  updateCustomer: async (customer: Customer) => {
    await fetch(`${API_URL}?action=update_customer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(customer)
    });
  },

  // Loans
  addLoan: async (loan: Loan) => {
    await fetch(`${API_URL}?action=add_loan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loan)
    });
  },

  updateLoan: async (loan: Loan) => {
    await fetch(`${API_URL}?action=update_loan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loan)
    });
  },

  // Payments
  addPayment: async (payment: Payment) => {
    await fetch(`${API_URL}?action=add_payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payment)
    });
  },

  // Tasks
  addTask: async (task: Task) => {
    await fetch(`${API_URL}?action=add_task`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task)
    });
  },

  updateTask: async (task: Task) => {
    await fetch(`${API_URL}?action=update_task`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task)
    });
  },

  // Inventory
  updateInventory: async (item: InventoryItem) => {
    await fetch(`${API_URL}?action=update_inventory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
  },

  // HR Management
  addEmployee: async (employee: Employee) => {
    await fetch(`${API_URL}?action=add_employee`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(employee)
    });
  },

  updateEmployee: async (employee: Employee) => {
    await fetch(`${API_URL}?action=update_employee`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(employee)
    });
  },

  deleteEmployee: async (id: string) => {
    await fetch(`${API_URL}?action=delete_employee&id=${id}`, {
      method: 'DELETE'
    });
  },

  addHRDocument: async (doc: HRDocument) => {
    await fetch(`${API_URL}?action=add_hr_document`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(doc)
    });
  }
};
