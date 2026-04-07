import { Customer, Employee, Loan, Task, InventoryItem, Payment, HRDocument } from '../types';

const STORAGE_KEY = 'agro_creast_erp_db_v2';

interface DB {
  customers: Customer[];
  employees: Employee[];
  loans: Loan[];
  tasks: Task[];
  inventory: InventoryItem[];
  hrDocuments: HRDocument[];
}

const INITIAL_DATA: DB = {
  customers: [],
  employees: [
    { id: 'emp-1', name: 'Admin Manager', designation: 'BranchManager', email: 'manager@agro.com', password: '123', branchId: 'B1' },
    { id: 'emp-2', name: 'Alice Junior', designation: 'JuniorExecutive', email: 'alice@agro.com', password: '123', branchId: 'B1' },
    { id: 'emp-3', name: 'Bob Senior', designation: 'SeniorExecutive', email: 'bob@agro.com', password: '123', branchId: 'B1' },
    { id: 'emp-4', name: 'Charlie Cashier', designation: 'Cashier', email: 'cashier@agro.com', password: '123', branchId: 'B1' },
    { id: 'emp-5', name: 'David CRO', designation: 'CustomerRelationOfficer', email: 'cro@agro.com', password: '123', branchId: 'B1' },
    { id: 'emp-6', name: 'Eve Regional', designation: 'RegionalManager', email: 'regional@agro.com', password: '123', branchId: 'B1' },
    { id: 'emp-7', name: 'Grace HR', designation: 'HRManager', email: 'hr@agro.com', password: '123', branchId: 'B1' },
  ],
  loans: [],
  tasks: [],
  inventory: [
    { id: 'i-1', name: 'Office Chairs', category: 'Furniture', quantity: 15, unitPrice: 5000, lastUpdated: new Date().toISOString() },
    { id: 'i-2', name: 'Laptops', category: 'Electronics', quantity: 8, unitPrice: 120000, lastUpdated: new Date().toISOString() },
  ],
  hrDocuments: [],
};

export const dbService = {
  getDB: (): DB => {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DATA));
      return INITIAL_DATA;
    }
    return JSON.parse(data);
  },

  saveDB: (db: DB) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  },

  // Auth
  login: (email: string, pass: string): Employee | null => {
    const db = dbService.getDB();
    return db.employees.find(e => e.email === email && e.password === pass) || null;
  },

  // Customers
  addCustomer: (customer: Customer) => {
    const db = dbService.getDB();
    db.customers.push(customer);
    dbService.saveDB(db);
  },
  bulkAddCustomers: (customers: Customer[]) => {
    const db = dbService.getDB();
    db.customers.push(...customers);
    dbService.saveDB(db);
  },
  updateCustomer: (customer: Customer) => {
    const db = dbService.getDB();
    const index = db.customers.findIndex(c => c.id === customer.id);
    if (index !== -1) {
      db.customers[index] = customer;
      dbService.saveDB(db);
    }
  },

  // Loans
  addLoan: (loan: Loan) => {
    const db = dbService.getDB();
    db.loans.push(loan);
    dbService.saveDB(db);
  },
  updateLoan: (loan: Loan) => {
    const db = dbService.getDB();
    const index = db.loans.findIndex(l => l.id === loan.id);
    if (index !== -1) {
      db.loans[index] = loan;
      dbService.saveDB(db);
    }
  },

  // Payments
  addPayment: (payment: Payment) => {
    const db = dbService.getDB();
    const loan = db.loans.find(l => l.id === payment.loanId);
    if (loan) {
      loan.payments.push(payment);
      // Update repayment schedule status
      const unpaidInstallment = loan.repaymentSchedule.find(s => s.status === 'Unpaid');
      if (unpaidInstallment) {
        unpaidInstallment.status = 'Paid';
      }
      dbService.saveDB(db);
    }
  },

  // Tasks
  addTask: (task: Task) => {
    const db = dbService.getDB();
    db.tasks.push(task);
    dbService.saveDB(db);
  },
  updateTask: (task: Task) => {
    const db = dbService.getDB();
    const index = db.tasks.findIndex(t => t.id === task.id);
    if (index !== -1) {
      db.tasks[index] = task;
      dbService.saveDB(db);
    }
  },

  // Inventory
  updateInventory: (item: InventoryItem) => {
    const db = dbService.getDB();
    const index = db.inventory.findIndex(i => i.id === item.id);
    if (index !== -1) {
      db.inventory[index] = item;
      dbService.saveDB(db);
    }
  },

  // HR Management
  addEmployee: (employee: Employee) => {
    const db = dbService.getDB();
    db.employees.push(employee);
    dbService.saveDB(db);
  },
  updateEmployee: (employee: Employee) => {
    const db = dbService.getDB();
    const index = db.employees.findIndex(e => e.id === employee.id);
    if (index !== -1) {
      db.employees[index] = employee;
      dbService.saveDB(db);
    }
  },
  deleteEmployee: (id: string) => {
    const db = dbService.getDB();
    db.employees = db.employees.filter(e => e.id !== id);
    dbService.saveDB(db);
  },
  addHRDocument: (doc: HRDocument) => {
    const db = dbService.getDB();
    db.hrDocuments.push(doc);
    dbService.saveDB(db);
  }
};
