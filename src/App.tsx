import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Briefcase, 
  CheckSquare, 
  Package, 
  Plus, 
  Search, 
  ChevronRight, 
  UserCircle,
  LogOut,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  DollarSign,
  Filter,
  Download
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { format, addMonths, isBefore, parseISO } from 'date-fns';
import Papa from 'papaparse';
import { cn, generateMembershipNumber, generateLoanId, generateReceiptNumber } from './lib/utils';
import { dbService } from './lib/db';
import { Customer, Employee, Loan, Task, InventoryItem, MaritalStatus, RepaymentItem, Role, Payment, HRDocument } from './types';

// --- Components ---

const SidebarItem = ({ icon: Icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) => (
  <button
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
      active 
        ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200" 
        : "text-slate-600 hover:bg-slate-100"
    )}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </button>
);

const Card = ({ children, className, title }: { children: React.ReactNode, className?: string, title?: string }) => (
  <div className={cn("bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden", className)}>
    {title && (
      <div className="px-6 py-4 border-b border-slate-100">
        <h3 className="font-semibold text-slate-800">{title}</h3>
      </div>
    )}
    <div className="p-6">
      {children}
    </div>
  </div>
);

const StatCard = ({ title, value, icon: Icon, color, trend }: { title: string, value: string | number, icon: any, color: string, trend?: string }) => (
  <Card className="relative overflow-hidden group">
    <div className={cn("absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity", color)}>
      <Icon size={64} />
    </div>
    <div className="flex flex-col gap-1">
      <span className="text-sm font-medium text-slate-500">{title}</span>
      <span className="text-2xl font-bold text-slate-900">{value}</span>
      {trend && (
        <span className="text-xs font-medium text-emerald-600 flex items-center gap-1">
          <TrendingUp size={12} /> {trend}
        </span>
      )}
    </div>
  </Card>
);

// --- Main App ---

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'customers' | 'loans' | 'staff' | 'tasks' | 'inventory' | 'collections' | 'hr'>('dashboard');
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const [db, setDb] = useState(dbService.getDB());
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [showAddLoan, setShowAddLoan] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddCollection, setShowAddCollection] = useState(false);
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [showHRDoc, setShowHRDoc] = useState<{ employee: Employee, type: 'Appointment' | 'Offer' | 'Resignation' } | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<Payment | null>(null);
  const [loginError, setLoginError] = useState('');

  const refreshData = () => {
    setDb(dbService.getDB());
  };

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const user = dbService.login(email, password);
    if (user) {
      setCurrentUser(user);
      setLoginError('');
    } else {
      setLoginError('Invalid email or password');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveTab('dashboard');
  };

  const canApproveLoan = currentUser?.designation === 'BranchManager' || currentUser?.designation === 'RegionalManager' || currentUser?.designation === 'ZonalManager';
  const isManager = canApproveLoan;
  const canEditCustomer = currentUser?.designation === 'BranchManager' || currentUser?.designation === 'RegionalManager' || currentUser?.designation === 'ZonalManager';
  const canCreateCustomer = currentUser?.designation === 'CustomerRelationOfficer' || canEditCustomer;
  const canCreateLoan = ['JuniorExecutive', 'BusinessExecutive', 'SeniorExecutive', 'BranchManager', 'CustomerRelationOfficer'].includes(currentUser?.designation || '');
  const canEditAppraisal = ['JuniorExecutive', 'BusinessExecutive', 'SeniorExecutive', 'CustomerRelationOfficer'].includes(currentUser?.designation || '');
  const canAddCollection = currentUser?.designation === 'Cashier';
  const canManageHR = currentUser?.designation === 'HRManager' || currentUser?.designation === 'HROfficer';

  // --- Handlers ---

  const handleBulkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const customers: Customer[] = results.data.map((row: any) => ({
          id: crypto.randomUUID(),
          membershipNo: generateMembershipNumber(),
          name: row.name || 'Unknown',
          address: row.address || 'N/A',
          telephone: row.telephone || 'N/A',
          idNo: row.idNo || 'N/A',
          age: parseInt(row.age) || 0,
          birthday: row.birthday || new Date().toISOString().split('T')[0],
          email: row.email || '',
          maritalStatus: (row.maritalStatus as MaritalStatus) || 'Single',
          nationality: row.nationality || 'Sri Lankan',
          assignedExecutiveId: currentUser?.id || 'emp-1',
          createdAt: new Date().toISOString(),
          status: 'Active'
        }));

        dbService.bulkAddCustomers(customers);
        refreshData();
        alert(`Successfully uploaded ${customers.length} customers.`);
      },
      error: (error) => {
        console.error('CSV Parsing Error:', error);
        alert('Failed to parse CSV file.');
      }
    });
  };

  const handleAddEmployee = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newEmployee: Employee = {
      id: `emp-${Date.now()}`,
      name: formData.get('name') as string,
      designation: formData.get('designation') as Role,
      email: formData.get('email') as string,
      password: '123', // Default password
      branchId: formData.get('branchId') as string,
    };
    dbService.addEmployee(newEmployee);
    refreshData();
    setShowAddEmployee(false);
  };

  const handleDeleteEmployee = (id: string) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      dbService.deleteEmployee(id);
      refreshData();
    }
  };

  const handleIssueDoc = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!showHRDoc) return;
    const formData = new FormData(e.currentTarget);
    const newDoc: HRDocument = {
      id: `doc-${Date.now()}`,
      employeeId: showHRDoc.employee.id,
      type: showHRDoc.type,
      date: new Date().toISOString(),
      content: formData.get('content') as string,
    };
    dbService.addHRDocument(newDoc);
    refreshData();
    setShowHRDoc(null);
    alert(`${showHRDoc.type} Letter issued successfully.`);
  };

  const handleAddCustomer = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newCustomer: Customer = {
      id: crypto.randomUUID(),
      membershipNo: generateMembershipNumber(),
      name: formData.get('name') as string,
      address: formData.get('address') as string,
      telephone: formData.get('telephone') as string,
      idNo: formData.get('idNo') as string,
      age: parseInt(formData.get('age') as string),
      birthday: formData.get('birthday') as string,
      email: formData.get('email') as string,
      maritalStatus: formData.get('maritalStatus') as MaritalStatus,
      nationality: formData.get('nationality') as string,
      assignedExecutiveId: currentUser?.id || '',
      createdAt: new Date().toISOString(),
      status: 'Active'
    };
    dbService.addCustomer(newCustomer);
    refreshData();
    setShowAddCustomer(false);
  };

  const handleAddLoan = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const amount = parseFloat(formData.get('amount') as string);
    const rate = parseFloat(formData.get('rate') as string);
    const term = parseInt(formData.get('term') as string);
    const startDate = formData.get('startDate') as string;
    const appraisal = formData.get('appraisal') as string;

    // Generate repayment schedule
    const schedule: RepaymentItem[] = [];
    const monthlyRate = (rate / 100) / 12;
    const monthlyPayment = (amount * monthlyRate * Math.pow(1 + monthlyRate, term)) / (Math.pow(1 + monthlyRate, term) - 1);

    for (let i = 1; i <= term; i++) {
      schedule.push({
        dueDate: format(addMonths(parseISO(startDate), i), 'yyyy-MM-dd'),
        amount: monthlyPayment,
        principal: monthlyPayment - (amount * monthlyRate), // Simplified
        interest: amount * monthlyRate,
        status: 'Unpaid'
      });
    }

    const newLoan: Loan = {
      id: generateLoanId(),
      customerId: formData.get('customerId') as string,
      amount,
      interestRate: rate,
      termMonths: term,
      startDate,
      status: 'Pending',
      executiveId: currentUser?.id || '',
      appraisalDetails: appraisal,
      repaymentSchedule: schedule,
      payments: [],
      createdAt: new Date().toISOString(),
    };
    dbService.addLoan(newLoan);
    refreshData();
    setShowAddLoan(false);
  };

  const handleAddPayment = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const loanId = formData.get('loanId') as string;
    const amount = parseFloat(formData.get('amount') as string);
    const loan = db.loans.find(l => l.id === loanId);
    if (!loan) return;

    const totalPaid = loan.payments.reduce((acc, p) => acc + p.amount, 0);
    const balanceAfter = loan.amount - (totalPaid + amount);

    const newPayment: Payment = {
      id: crypto.randomUUID(),
      receiptNo: generateReceiptNumber(),
      loanId,
      amount,
      date: new Date().toISOString(),
      method: formData.get('method') as string,
      balanceAfter: balanceAfter > 0 ? balanceAfter : 0
    };

    dbService.addPayment(newPayment);
    refreshData();
    setShowAddCollection(false);
    setSelectedReceipt(newPayment);
  };

  const handleApproveLoan = (loanId: string) => {
    if (!canApproveLoan) return;
    const loan = db.loans.find(l => l.id === loanId);
    if (loan) {
      loan.status = 'Approved';
      loan.approvedBy = currentUser?.id;
      dbService.updateLoan(loan);
      refreshData();
    }
  };

  const [sortConfig, setSortConfig] = useState<{ key: keyof Loan | 'customerName', direction: 'asc' | 'desc' }>({ key: 'createdAt', direction: 'desc' });
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const handleSort = (key: keyof Loan | 'customerName') => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleAddTask = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newTask: Task = {
      id: crypto.randomUUID(),
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      assignedToId: formData.get('assignedToId') as string,
      customerId: formData.get('customerId') as string || undefined,
      status: 'Pending',
      dueDate: formData.get('dueDate') as string,
      createdAt: new Date().toISOString(),
    };
    dbService.addTask(newTask);
    refreshData();
    setShowAddTask(false);
  };

  // --- Filtered Data ---

  const filteredCustomers = useMemo(() => {
    return db.customers.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.membershipNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.idNo.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [db.customers, searchQuery]);

  const filteredLoans = useMemo(() => {
    return db.loans.filter(l => {
      const customer = db.customers.find(c => c.id === l.customerId);
      return customer?.name.toLowerCase().includes(searchQuery.toLowerCase()) || l.id.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [db.loans, db.customers, searchQuery]);

  const handleUpdateCustomer = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingCustomer) return;
    const formData = new FormData(e.currentTarget);
    const updatedFields: Partial<Customer> = {
      name: formData.get('name') as string,
      address: formData.get('address') as string,
      telephone: formData.get('telephone') as string,
      email: formData.get('email') as string,
      maritalStatus: formData.get('maritalStatus') as MaritalStatus,
    };

    if (currentUser?.designation === 'CustomerRelationOfficer') {
      // Needs approval
      const updatedCustomer: Customer = {
        ...editingCustomer,
        status: 'PendingApproval',
        pendingChanges: updatedFields
      };
      dbService.updateCustomer(updatedCustomer);
    } else {
      // Direct update for managers
      const updatedCustomer: Customer = {
        ...editingCustomer,
        ...updatedFields,
        status: 'Active'
      };
      dbService.updateCustomer(updatedCustomer);
    }
    refreshData();
    setEditingCustomer(null);
    setSelectedCustomer(null);
  };

  const handleApproveCustomerEdit = (customerId: string) => {
    const customer = db.customers.find(c => c.id === customerId);
    if (!customer || !customer.pendingChanges) return;

    const updatedCustomer: Customer = {
      ...customer,
      ...customer.pendingChanges,
      status: 'Active',
      pendingChanges: undefined
    };

    dbService.updateCustomer(updatedCustomer);
    refreshData();
    setSelectedCustomer(null);
  };

  const sortedLoans = useMemo(() => {
    const items = [...filteredLoans];
    items.sort((a, b) => {
      let aValue: any = a[sortConfig.key as keyof Loan];
      let bValue: any = b[sortConfig.key as keyof Loan];

      if (sortConfig.key === 'customerName') {
        aValue = db.customers.find(c => c.id === a.customerId)?.name || '';
        bValue = db.customers.find(c => c.id === b.customerId)?.name || '';
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return items;
  }, [filteredLoans, sortConfig, db.customers]);

  // --- Views ---

  // --- Views ---

  const LoginView = () => (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-200">
            <Briefcase className="text-white" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">AGRO CREAST ERP</h1>
          <p className="text-slate-500">Sign in to your employee account</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
            <input 
              name="email"
              type="email" 
              required
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
              placeholder="employee@agrocreast.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input 
              name="password"
              type="password" 
              required
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
              placeholder="••••••••"
            />
          </div>
          {loginError && <p className="text-sm text-red-600 font-medium">{loginError}</p>}
          <button 
            type="submit"
            className="w-full py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all"
          >
            Sign In
          </button>
        </form>
        <div className="mt-6 pt-6 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-400">© 2026 AGRO CREAST PVT Ltd. All rights reserved.</p>
        </div>
      </div>
    </div>
  );

  const ReceiptModal = ({ payment, onClose }: { payment: Payment, onClose: () => void }) => {
    const loan = db.loans.find(l => l.id === payment.loanId);
    const customer = db.customers.find(c => c.id === loan?.customerId);

    return (
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
          <div className="p-8 space-y-6" id="receipt-content">
            <div className="text-center space-y-2 border-b border-dashed border-slate-200 pb-6">
              <h2 className="text-xl font-bold text-slate-900">AGRO CREAST PVT Ltd</h2>
              <p className="text-sm text-slate-500">Official Payment Receipt</p>
              <p className="text-xs font-mono text-slate-400">#{payment.receiptNo}</p>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Customer Name:</span>
                <span className="font-semibold text-slate-900">{customer?.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Loan ID:</span>
                <span className="font-semibold text-slate-900">{loan?.id}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Loan Amount:</span>
                <span className="font-semibold text-slate-900">Rs. {loan?.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Payment Amount:</span>
                <span className="font-semibold text-emerald-600 text-lg">Rs. {payment.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Loan Balance:</span>
                <span className="font-semibold text-slate-900">Rs. {payment.balanceAfter.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Date:</span>
                <span className="font-semibold text-slate-900">{format(parseISO(payment.date), 'PPP p')}</span>
              </div>
            </div>

            <div className="pt-6 border-t border-dashed border-slate-200 text-center">
              <p className="text-xs text-slate-400 italic">Thank you for your payment. This is a computer-generated receipt.</p>
            </div>
          </div>
          <div className="bg-slate-50 p-4 flex gap-3">
            <button 
              onClick={() => window.print()}
              className="flex-1 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
            >
              <Download size={18} /> Print Receipt
            </button>
            <button 
              onClick={onClose}
              className="flex-1 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg font-medium hover:bg-slate-50 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  const CollectionsView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">Collections & Payments</h2>
        <button 
          onClick={() => setShowAddCollection(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 font-medium shadow-sm transition-all"
        >
          <Plus size={18} /> Add Collection
        </button>
      </div>

      <Card title="Recent Collections">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Receipt #</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Customer</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Loan ID</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Amount</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Date</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {db.loans.flatMap(l => l.payments).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(payment => {
                const loan = db.loans.find(l => l.id === payment.loanId);
                const customer = db.customers.find(c => c.id === loan?.customerId);
                return (
                  <tr key={payment.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-mono text-slate-600">{payment.receiptNo}</td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{customer?.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{payment.loanId}</td>
                    <td className="px-6 py-4 text-sm font-bold text-emerald-600">Rs. {payment.amount.toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{format(parseISO(payment.date), 'MMM d, yyyy')}</td>
                    <td className="px-6 py-4 text-sm">
                      <button 
                        onClick={() => setSelectedReceipt(payment)}
                        className="text-emerald-600 hover:text-emerald-700 font-medium"
                      >
                        Print Receipt
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );

  const DashboardView = () => {
    const totalLoans = db.loans.reduce((acc, l) => acc + l.amount, 0);
    const activeLoans = db.loans.filter(l => l.status === 'Approved' || l.status === 'Active').length;
    const pendingApprovals = db.loans.filter(l => l.status === 'Pending').length;

    const chartData = [
      { name: 'Jan', value: 4000 },
      { name: 'Feb', value: 3000 },
      { name: 'Mar', value: 5000 },
      { name: 'Apr', value: 4500 },
      { name: 'May', value: 6000 },
      { name: 'Jun', value: 5500 },
    ];

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Customers" value={db.customers.length} icon={Users} color="text-blue-600" trend="+12% from last month" />
          <StatCard title="Total Loan Volume" value={`Rs. ${totalLoans.toLocaleString()}`} icon={DollarSign} color="text-emerald-600" trend="+8% from last month" />
          <StatCard title="Active Loans" value={activeLoans} icon={CheckCircle2} color="text-indigo-600" />
          <StatCard title="Pending Approvals" value={pendingApprovals} icon={Clock} color="text-amber-600" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="Loan Disbursement Trend">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                  <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card title="Recent Tasks">
            <div className="space-y-4">
              {db.tasks.slice(0, 5).map(task => {
                const employee = db.employees.find(e => e.id === task.assignedToId);
                return (
                  <div key={task.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="flex flex-col">
                      <span className="font-medium text-slate-800">{task.title}</span>
                      <span className="text-xs text-slate-500">Assigned to: {employee?.name}</span>
                    </div>
                    <span className={cn(
                      "px-2 py-1 rounded-full text-[10px] font-bold uppercase",
                      task.status === 'Completed' ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                    )}>
                      {task.status}
                    </span>
                  </div>
                );
              })}
              {db.tasks.length === 0 && <p className="text-center text-slate-400 py-8">No tasks assigned yet.</p>}
            </div>
          </Card>
        </div>
      </div>
    );
  };

  const CustomersView = () => (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by name, ID or membership #" 
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <label className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium cursor-pointer transition-all">
            <Plus size={18} /> Bulk Upload (CSV)
            <input type="file" accept=".csv" className="hidden" onChange={handleBulkUpload} />
          </label>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium transition-all">
            <Download size={18} /> Export Report
          </button>
          <button 
            onClick={() => setShowAddCustomer(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 font-medium shadow-sm transition-all"
          >
            <Plus size={18} /> New Customer
          </button>
        </div>
      </div>

      <Card className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Membership #</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">ID Number</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Telephone</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Executive</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.map(customer => {
                const executive = db.executives.find(e => e.id === customer.assignedExecutiveId);
                return (
                  <tr key={customer.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-sm text-emerald-600 font-semibold">{customer.membershipNo}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-900">{customer.name}</span>
                        <span className="text-xs text-slate-500">{customer.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{customer.idNo}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{customer.telephone}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{executive?.name || 'Unassigned'}</td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => setSelectedCustomer(customer)}
                        className="text-emerald-600 hover:text-emerald-700 font-medium text-sm flex items-center gap-1"
                      >
                        View Details <ChevronRight size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">No customers found matching your search.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );

  const LoansView = () => (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search loans by customer or ID" 
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowAddLoan(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 font-medium shadow-sm transition-all"
          >
            <Plus size={18} /> New Loan Application
          </button>
        </div>
      </div>

      <Card className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th onClick={() => handleSort('id')} className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-emerald-600">Loan ID</th>
                <th onClick={() => handleSort('customerName')} className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-emerald-600">Customer</th>
                <th onClick={() => handleSort('amount')} className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-emerald-600">Amount</th>
                <th onClick={() => handleSort('status')} className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-emerald-600">Status</th>
                <th onClick={() => handleSort('createdAt')} className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-emerald-600">Date</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedLoans.map(loan => {
                const customer = db.customers.find(c => c.id === loan.customerId);
                return (
                  <tr key={loan.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-sm font-semibold">{loan.id}</td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-slate-900">{customer?.name}</span>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-900">Rs. {loan.amount.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2 py-1 rounded-full text-[10px] font-bold uppercase",
                        loan.status === 'Approved' || loan.status === 'Active' ? "bg-emerald-100 text-emerald-700" : 
                        loan.status === 'Pending' ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"
                      )}>
                        {loan.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{format(parseISO(loan.createdAt), 'MMM dd, yyyy')}</td>
                    <td className="px-6 py-4 flex gap-3">
                      <button 
                        onClick={() => setSelectedLoan(loan)}
                        className="text-emerald-600 hover:text-emerald-700 font-medium text-sm"
                      >
                        Details
                      </button>
                      {isManager && loan.status === 'Pending' && (
                        <button 
                          onClick={() => handleApproveLoan(loan.id)}
                          className="text-indigo-600 hover:text-indigo-700 font-medium text-sm"
                        >
                          Approve
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredLoans.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">No loans found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );

  const InventoryView = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {db.inventory.map(item => (
          <div key={item.id}>
            <Card className="flex flex-col gap-2">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">{item.category}</span>
                <Package size={20} className="text-slate-300" />
              </div>
              <h4 className="font-bold text-lg text-slate-900">{item.name}</h4>
              <div className="flex justify-between items-end mt-2">
                <div className="flex flex-col">
                  <span className="text-xs text-slate-500">Quantity</span>
                  <span className="text-xl font-bold text-slate-900">{item.quantity}</span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-xs text-slate-500">Unit Price</span>
                  <span className="text-sm font-medium text-slate-700">Rs. {item.unitPrice.toLocaleString()}</span>
                </div>
              </div>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );

  const HRView = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Human Resource Management</h2>
        <button 
          onClick={() => setShowAddEmployee(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 font-medium shadow-sm transition-all"
        >
          <Plus size={18} /> New Employee
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {db.employees.map(emp => (
          <div key={emp.id}>
            <Card className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
                    {emp.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">{emp.name}</h4>
                    <p className="text-xs text-slate-500">{emp.designation}</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleDeleteEmployee(emp.id)}
                  className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                >
                  <AlertCircle size={18} />
                </button>
              </div>
              
              <div className="space-y-2 py-3 border-y border-slate-100">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Email</span>
                  <span className="font-medium text-slate-700">{emp.email}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Branch</span>
                  <span className="font-medium text-slate-700">{emp.branchId}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => setShowHRDoc({ employee: emp, type: 'Offer' })}
                  className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Offer
                </button>
                <button 
                  onClick={() => setShowHRDoc({ employee: emp, type: 'Appointment' })}
                  className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Appoint
                </button>
                <button 
                  onClick={() => setShowHRDoc({ employee: emp, type: 'Resignation' })}
                  className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Resign
                </button>
              </div>
            </Card>
          </div>
        ))}
      </div>

      <Card title="Issued Documents">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Employee</th>
                <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {db.hrDocuments.map(doc => {
                const emp = db.employees.find(e => e.id === doc.employeeId);
                return (
                  <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{emp?.name}</td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2 py-1 rounded-full text-[10px] font-bold uppercase",
                        doc.type === 'Appointment' ? "bg-emerald-100 text-emerald-700" :
                        doc.type === 'Offer' ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"
                      )}>
                        {doc.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{format(parseISO(doc.date), 'PPP')}</td>
                    <td className="px-6 py-4">
                      <button className="text-emerald-600 hover:text-emerald-700 font-medium text-sm">View</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );

  // --- Modals ---

  const AddCustomerModal = () => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-slate-900">Add New Customer</h2>
          <button onClick={() => setShowAddCustomer(false)} className="text-slate-400 hover:text-slate-600">
            <AlertCircle size={24} />
          </button>
        </div>
        <form onSubmit={handleAddCustomer} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Full Name</label>
            <input name="name" required className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Email Address</label>
            <input name="email" type="email" required className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Telephone</label>
            <input name="telephone" required className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">ID Number</label>
            <input name="idNo" required className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Age</label>
            <input name="age" type="number" required className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Birthday</label>
            <input name="birthday" type="date" required className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Marital Status</label>
            <select name="maritalStatus" className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none">
              <option>Single</option>
              <option>Married</option>
              <option>Divorced</option>
              <option>Widowed</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Nationality</label>
            <input name="nationality" required className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" />
          </div>
          <div className="md:col-span-2 space-y-1">
            <label className="text-sm font-medium text-slate-700">Address</label>
            <textarea name="address" required className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none h-20" />
          </div>
          <div className="md:col-span-2 pt-4">
            <button type="submit" className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100">
              Register Customer
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  const LoanDetailsModal = ({ loan }: { loan: Loan }) => {
    const customer = db.customers.find(c => c.id === loan.customerId);
    const executive = db.executives.find(e => e.id === loan.executiveId);

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Loan Dashboard: {loan.id}</h2>
              <p className="text-sm text-slate-500">Customer: {customer?.name}</p>
            </div>
            <button onClick={() => setSelectedLoan(null)} className="text-slate-400 hover:text-slate-600">
              <AlertCircle size={24} />
            </button>
          </div>
          
          <div className="p-6 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-xs font-medium text-slate-500 uppercase">Loan Amount</span>
                <p className="text-xl font-bold text-slate-900">Rs. {loan.amount.toLocaleString()}</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-xs font-medium text-slate-500 uppercase">Interest Rate</span>
                <p className="text-xl font-bold text-slate-900">{loan.interestRate}% P.A.</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-xs font-medium text-slate-500 uppercase">Status</span>
                <p className="text-xl font-bold text-emerald-600">{loan.status}</p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <FileText size={18} className="text-emerald-600" /> Repayment Schedule
              </h3>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Installment</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Due Date</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Amount</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loan.repaymentSchedule.map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-3 text-sm text-slate-600">#{idx + 1}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{item.dueDate}</td>
                        <td className="px-4 py-3 text-sm font-medium text-slate-900">Rs. {item.amount.toFixed(2)}</td>
                        <td className="px-4 py-3">
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                            item.status === 'Paid' ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                          )}>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (!currentUser) return <LoginView />;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
              <Briefcase className="text-white" size={20} />
            </div>
            <h1 className="font-bold text-slate-900 tracking-tight">AGRO CREAST</h1>
          </div>
          <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Finance Management</p>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <SidebarItem icon={LayoutDashboard} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <SidebarItem icon={Users} label="Customers" active={activeTab === 'customers'} onClick={() => setActiveTab('customers')} />
          <SidebarItem icon={FileText} label="Loans" active={activeTab === 'loans'} onClick={() => setActiveTab('loans')} />
          {canAddCollection && (
            <SidebarItem icon={DollarSign} label="Collections" active={activeTab === 'collections'} onClick={() => setActiveTab('collections')} />
          )}
          <SidebarItem icon={Briefcase} label="Staff" active={activeTab === 'staff'} onClick={() => setActiveTab('staff')} />
          <SidebarItem icon={CheckSquare} label="Tasks" active={activeTab === 'tasks'} onClick={() => setActiveTab('tasks')} />
          <SidebarItem icon={Package} label="Inventory" active={activeTab === 'inventory'} onClick={() => setActiveTab('inventory')} />
          {canManageHR && (
            <SidebarItem icon={Users} label="HR Management" active={activeTab === 'hr'} onClick={() => setActiveTab('hr')} />
          )}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 mb-2">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
              {currentUser.name.charAt(0)}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold text-slate-900 truncate">{currentUser.name}</span>
              <span className="text-[10px] text-slate-500 truncate">{currentUser.designation}</span>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
          >
            <LogOut size={18} />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8">
          <h2 className="text-xl font-bold text-slate-800 capitalize">{activeTab}</h2>
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="text-xs font-medium text-slate-500">{format(new Date(), 'EEEE, MMMM do')}</span>
              <span className="text-xs text-slate-400">Branch: {currentUser.branchId}</span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          {activeTab === 'dashboard' && <DashboardView />}
          {activeTab === 'customers' && <CustomersView />}
          {activeTab === 'loans' && <LoansView />}
          {activeTab === 'collections' && <CollectionsView />}
          {activeTab === 'staff' && <StaffView />}
          {activeTab === 'tasks' && <TasksView />}
          {activeTab === 'inventory' && <InventoryView />}
          {activeTab === 'hr' && <HRView />}
        </div>
      </main>

      {/* Modals */}
      {showAddCustomer && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-900">Register New Customer</h2>
              <button onClick={() => setShowAddCustomer(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <Plus className="rotate-45" size={20} />
              </button>
            </div>
            <form onSubmit={handleAddCustomer} className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Full Name</label>
                <input name="name" required className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">ID Number (NIC)</label>
                <input name="idNo" required className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 outline-none" />
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-sm font-semibold text-slate-700">Address</label>
                <input name="address" required className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Telephone</label>
                <input name="telephone" required className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Email</label>
                <input name="email" type="email" required className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Age</label>
                <input name="age" type="number" required className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Birthday</label>
                <input name="birthday" type="date" required className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Marital Status</label>
                <select name="maritalStatus" className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 outline-none">
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Divorced">Divorced</option>
                  <option value="Widowed">Widowed</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Nationality</label>
                <input name="nationality" required className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 outline-none" />
              </div>
              <div className="md:col-span-2 pt-4">
                <button type="submit" className="w-full py-3 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all">
                  Register Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddLoan && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-900">Create New Loan Application</h2>
              <button onClick={() => setShowAddLoan(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <Plus className="rotate-45" size={20} />
              </button>
            </div>
            <form onSubmit={handleAddLoan} className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Customer</label>
                <select name="customerId" required className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 outline-none">
                  {db.customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.membershipNo})</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Loan Amount (Rs.)</label>
                <input name="amount" type="number" required className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Interest Rate (%)</label>
                <input name="rate" type="number" step="0.1" required className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Term (Months)</label>
                <input name="term" type="number" required className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Start Date</label>
                <input name="startDate" type="date" required className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 outline-none" />
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-sm font-semibold text-slate-700">Appraisal Details</label>
                <textarea name="appraisal" required rows={3} className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 outline-none resize-none" placeholder="Enter loan appraisal notes..."></textarea>
              </div>
              <div className="md:col-span-2 pt-4">
                <button type="submit" className="w-full py-3 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all">
                  Submit Loan Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddCollection && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-900">Add Collection</h2>
              <button onClick={() => setShowAddCollection(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <Plus className="rotate-45" size={20} />
              </button>
            </div>
            <form onSubmit={handleAddPayment} className="p-8 space-y-6">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Select Loan</label>
                <select name="loanId" required className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 outline-none">
                  {db.loans.filter(l => l.status === 'Approved' || l.status === 'Active').map(l => {
                    const customer = db.customers.find(c => c.id === l.customerId);
                    return (
                      <option key={l.id} value={l.id}>{customer?.name} - {l.id} (Rs. {l.amount.toLocaleString()})</option>
                    );
                  })}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Payment Amount (Rs.)</label>
                <input name="amount" type="number" required className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Payment Method</label>
                <select name="method" className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 outline-none">
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>
              <div className="pt-4">
                <button type="submit" className="w-full py-3 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all">
                  Record Payment & Print Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedReceipt && (
        <ReceiptModal payment={selectedReceipt} onClose={() => setSelectedReceipt(null)} />
      )}

      {showAddEmployee && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-900">Add New Employee</h2>
              <button onClick={() => setShowAddEmployee(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <Plus className="rotate-45" size={20} />
              </button>
            </div>
            <form onSubmit={handleAddEmployee} className="p-8 space-y-6">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Full Name</label>
                <input name="name" required className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Email Address</label>
                <input name="email" type="email" required className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Designation</label>
                <select name="designation" required className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 outline-none">
                  <option value="JuniorExecutive">Junior Executive</option>
                  <option value="BusinessExecutive">Business Executive</option>
                  <option value="SeniorExecutive">Senior Executive</option>
                  <option value="BranchManager">Branch Manager</option>
                  <option value="Cashier">Cashier</option>
                  <option value="CustomerRelationOfficer">CRO</option>
                  <option value="HRManager">HR Manager</option>
                  <option value="HROfficer">HR Officer</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Branch ID</label>
                <input name="branchId" required defaultValue="B1" className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 outline-none" />
              </div>
              <button type="submit" className="w-full py-3 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all">
                Create Employee Account
              </button>
            </form>
          </div>
        </div>
      )}

      {showHRDoc && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-900">Issue {showHRDoc.type} Letter</h2>
              <button onClick={() => setShowHRDoc(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <Plus className="rotate-45" size={20} />
              </button>
            </div>
            <form onSubmit={handleIssueDoc} className="p-8 space-y-6">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-sm text-slate-600">Issuing document for: <span className="font-bold text-slate-900">{showHRDoc.employee.name}</span></p>
                <p className="text-xs text-slate-500">Designation: {showHRDoc.employee.designation}</p>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Document Content</label>
                <textarea 
                  name="content" 
                  required 
                  rows={10}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 outline-none font-serif"
                  placeholder={`Write the ${showHRDoc.type.toLowerCase()} letter content here...`}
                />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowHRDoc(null)} className="flex-1 py-3 border border-slate-200 text-slate-600 rounded-lg font-bold hover:bg-slate-50 transition-all">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-3 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all">
                  Issue & Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedCustomer && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-900">Customer Details</h2>
              <div className="flex gap-2">
                {canEditCustomer && (
                  <button 
                    onClick={() => setEditingCustomer(selectedCustomer)}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 transition-all"
                  >
                    Edit Details
                  </button>
                )}
                <button onClick={() => setSelectedCustomer(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                  <Plus className="rotate-45" size={20} />
                </button>
              </div>
            </div>
            <div className="p-8 grid grid-cols-2 gap-y-6 gap-x-8">
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Membership No</span>
                <p className="font-mono text-emerald-600 font-bold">{selectedCustomer.membershipNo}</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status</span>
                <span className={cn(
                  "px-2 py-1 rounded-full text-[10px] font-bold uppercase",
                  selectedCustomer.status === 'Active' ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                )}>
                  {selectedCustomer.status}
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Full Name</span>
                <p className="font-semibold text-slate-900">{selectedCustomer.name}</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">NIC Number</span>
                <p className="font-semibold text-slate-900">{selectedCustomer.idNo}</p>
              </div>
              <div className="space-y-1 col-span-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Address</span>
                <p className="text-slate-600">{selectedCustomer.address}</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Telephone</span>
                <p className="text-slate-600">{selectedCustomer.telephone}</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email</span>
                <p className="text-slate-600">{selectedCustomer.email}</p>
              </div>
              {selectedCustomer.status === 'PendingApproval' && canApproveLoan && (
                <div className="col-span-2 p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
                  <p className="text-sm font-bold text-amber-800">Pending Changes for Approval:</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {Object.entries(selectedCustomer.pendingChanges || {}).map(([key, value]) => (
                      <div key={key} className="flex justify-between border-b border-amber-100 pb-1">
                        <span className="capitalize text-amber-600">{key}:</span>
                        <span className="font-bold text-amber-900">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                  <button 
                    onClick={() => handleApproveCustomerEdit(selectedCustomer.id)}
                    className="w-full py-2 bg-amber-600 text-white rounded-lg text-sm font-bold hover:bg-amber-700 transition-all"
                  >
                    Approve These Changes
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {editingCustomer && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-900">Edit Customer Details</h2>
              <button onClick={() => setEditingCustomer(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <Plus className="rotate-45" size={20} />
              </button>
            </div>
            <form onSubmit={handleUpdateCustomer} className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Full Name</label>
                <input name="name" defaultValue={editingCustomer.name} required className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Telephone</label>
                <input name="telephone" defaultValue={editingCustomer.telephone} required className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 outline-none" />
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-sm font-semibold text-slate-700">Address</label>
                <input name="address" defaultValue={editingCustomer.address} required className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Email</label>
                <input name="email" type="email" defaultValue={editingCustomer.email} required className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Marital Status</label>
                <select name="maritalStatus" defaultValue={editingCustomer.maritalStatus} className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 outline-none">
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Divorced">Divorced</option>
                  <option value="Widowed">Widowed</option>
                </select>
              </div>
              <div className="md:col-span-2 pt-4">
                <button type="submit" className="w-full py-3 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all">
                  {currentUser?.designation === 'CustomerRelationOfficer' ? 'Submit for Approval' : 'Update Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedLoan && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Loan Details: {selectedLoan.id}</h2>
                <p className="text-sm text-slate-500">Customer: {db.customers.find(c => c.id === selectedLoan.customerId)?.name}</p>
              </div>
              <button onClick={() => setSelectedLoan(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <Plus className="rotate-45" size={20} />
              </button>
            </div>
            <div className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Amount</span>
                  <p className="text-lg font-bold text-slate-900">Rs. {selectedLoan.amount.toLocaleString()}</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rate</span>
                  <p className="text-lg font-bold text-slate-900">{selectedLoan.interestRate}%</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Term</span>
                  <p className="text-lg font-bold text-slate-900">{selectedLoan.termMonths} Months</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</span>
                  <p className="text-lg font-bold text-emerald-600">{selectedLoan.status}</p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-bold text-slate-800">Appraisal Details</h3>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-sm text-slate-600 whitespace-pre-wrap">
                  {selectedLoan.appraisalDetails || 'No appraisal details provided.'}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-bold text-slate-800">Repayment Schedule</h3>
                <div className="overflow-hidden rounded-xl border border-slate-200">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Due Date</th>
                        <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Amount</th>
                        <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedLoan.repaymentSchedule.map((item, idx) => (
                        <tr key={idx}>
                          <td className="px-6 py-3 text-sm text-slate-600">{item.dueDate}</td>
                          <td className="px-6 py-3 text-sm font-bold text-slate-900">Rs. {item.amount.toLocaleString()}</td>
                          <td className="px-6 py-3">
                            <span className={cn(
                              "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                              item.status === 'Paid' ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                            )}>
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddTask && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-900">Assign New Task</h2>
              <button onClick={() => setShowAddTask(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <Plus className="rotate-45" size={20} />
              </button>
            </div>
            <form onSubmit={handleAddTask} className="p-8 space-y-6">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Task Title</label>
                <input name="title" required className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Assigned To</label>
                <select name="assignedToId" required className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 outline-none">
                  {db.employees.map(e => (
                    <option key={e.id} value={e.id}>{e.name} ({e.designation})</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Due Date</label>
                <input name="dueDate" type="date" required className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Description</label>
                <textarea name="description" rows={3} className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 outline-none resize-none"></textarea>
              </div>
              <div className="pt-4">
                <button type="submit" className="w-full py-3 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all">
                  Assign Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const StaffView = () => {
  const db = dbService.getDB();
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {db.employees.map(emp => (
        <div key={emp.id}>
          <Card className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-lg">
                {emp.name.charAt(0)}
              </div>
              <div>
                <h4 className="font-bold text-slate-900">{emp.name}</h4>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">{emp.designation}</p>
              </div>
            </div>
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-slate-500">Branch</span>
                <span className="text-xs font-bold text-slate-900">{emp.branchId}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-slate-500">Email</span>
                <span className="text-xs font-bold text-slate-900">{emp.email}</span>
              </div>
            </div>
          </Card>
        </div>
      ))}
    </div>
  );
};

const TasksView = () => {
  const db = dbService.getDB();
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {db.tasks.map(task => {
        const employee = db.employees.find(e => e.id === task.assignedToId);
        return (
          <div key={task.id}>
            <Card className="flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <span className={cn(
                  "px-2 py-1 rounded-full text-[10px] font-bold uppercase",
                  task.status === 'Completed' ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                )}>
                  {task.status}
                </span>
                <Clock size={16} className="text-slate-300" />
              </div>
              <h4 className="font-bold text-slate-900">{task.title}</h4>
              <p className="text-sm text-slate-600 line-clamp-2">{task.description}</p>
              <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Assigned To</span>
                  <span className="text-xs font-bold text-slate-700">{employee?.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Due Date</span>
                  <p className="text-xs font-bold text-slate-700">{task.dueDate}</p>
                </div>
              </div>
            </Card>
          </div>
        );
      })}
      {db.tasks.length === 0 && (
        <div className="col-span-full py-20 text-center">
          <p className="text-slate-400">No tasks assigned yet.</p>
        </div>
      )}
    </div>
  );
};
