
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

export interface ServiceImportRow {
  clientName: string;
  serviceType: string;
  description?: string;
  amount: string;
  currency: string;
  startDate?: string;
  goLiveDate?: string;
  billingCycle?: string;
  isRecurring?: string;
  assignedCsmEmail?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  status: string;
}

export const generateSampleServiceSheet = () => {
  const sampleData = [
    {
      clientName: 'Sample Airlines Ltd',
      serviceType: 'implementation',
      description: 'Initial system implementation',
      amount: '50000',
      currency: 'USD',
      startDate: '2024-01-01',
      goLiveDate: '2024-03-01',
      billingCycle: 'one-time',
      isRecurring: 'false',
      assignedCsmEmail: 'admin@example.com',
      invoiceNumber: 'INV-2024-001',
      invoiceDate: '2024-01-15',
      status: 'paid'
    },
    {
      clientName: 'Demo Travel Agency',
      serviceType: 'subscription',
      description: 'Monthly subscription service',
      amount: '1200',
      currency: 'USD',
      startDate: '2024-01-01',
      goLiveDate: '2024-01-01',
      billingCycle: 'monthly',
      isRecurring: 'true',
      assignedCsmEmail: 'admin@example.com',
      invoiceNumber: '',
      invoiceDate: '',
      status: 'pending'
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Services');
  
  XLSX.writeFile(workbook, 'service_import_template.xlsx');
};

export const parseServiceFile = (file: File): Promise<ServiceImportRow[]> => {
  return new Promise((resolve, reject) => {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    if (fileExtension === 'csv') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          resolve(results.data as ServiceImportRow[]);
        },
        error: (error) => {
          reject(error);
        }
      });
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet) as ServiceImportRow[];
          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsBinaryString(file);
    } else {
      reject(new Error('Unsupported file format. Please upload CSV or Excel file.'));
    }
  });
};

export const validateServiceRow = (row: ServiceImportRow): string | null => {
  if (!row.clientName || row.clientName.trim() === '') {
    return 'Client name is required';
  }
  
  if (!row.serviceType) {
    return 'Service type is required';
  }
  
  const validServiceTypes = ['implementation', 'cr', 'subscription', 'hosting', 'others'];
  if (!validServiceTypes.includes(row.serviceType.toLowerCase())) {
    return `Invalid service type. Must be one of: ${validServiceTypes.join(', ')}`;
  }
  
  if (!row.amount || isNaN(Number(row.amount))) {
    return 'Valid amount is required';
  }
  
  if (!row.currency) {
    return 'Currency is required';
  }
  
  const validCurrencies = ['INR', 'USD', 'EUR'];
  if (!validCurrencies.includes(row.currency.toUpperCase())) {
    return `Invalid currency. Must be one of: ${validCurrencies.join(', ')}`;
  }
  
  const validStatuses = ['pending', 'paid'];
  if (row.status && !validStatuses.includes(row.status.toLowerCase())) {
    return `Invalid status. Must be one of: ${validStatuses.join(', ')}`;
  }
  
  if (row.billingCycle) {
    const validBillingCycles = ['one-time', 'monthly', 'quarterly', 'semi-annual', 'annual'];
    if (!validBillingCycles.includes(row.billingCycle.toLowerCase())) {
      return `Invalid billing cycle. Must be one of: ${validBillingCycles.join(', ')}`;
    }
  }
  
  if (row.isRecurring && !['true', 'false'].includes(row.isRecurring.toLowerCase())) {
    return 'isRecurring must be true or false';
  }
  
  return null;
};
