
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

export interface InvoiceImportRow {
  clientName: string;
  serviceType?: string;
  invoiceNumber: string;
  amount: string;
  currency: string;
  issueDate: string;
  dueDate: string;
  paidDate?: string;
  status: string;
  notes?: string;
}

export const generateSampleInvoiceSheet = () => {
  const sampleData = [
    {
      clientName: 'Sample Airlines Ltd',
      invoiceNumber: 'CR-2024-001',
      amount: 50000,
      currency: 'USD',
      issueDate: '2024-01-15',
      dueDate: '2024-02-15',
      status: 'pending',
      notes: 'Change request invoice'
    },
    {
      clientName: 'Demo Travel Agency',
      invoiceNumber: 'CR-2024-002',
      amount: 3000,
      currency: 'INR',
      issueDate: '2024-01-20',
      dueDate: '2024-02-20',
      status: 'approved',
      notes: 'Monthly CR invoice'
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'CR Invoices');
  
  XLSX.writeFile(workbook, 'cr_invoice_import_template.xlsx');
};

export const parseInvoiceFile = (file: File): Promise<InvoiceImportRow[]> => {
  return new Promise((resolve, reject) => {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    if (fileExtension === 'csv') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          resolve(results.data as InvoiceImportRow[]);
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
          const jsonData = XLSX.utils.sheet_to_json(worksheet) as InvoiceImportRow[];
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

export const validateInvoiceRow = (row: InvoiceImportRow): string | null => {
  if (!row.clientName || row.clientName.trim() === '') {
    return 'Client name is required';
  }
  
  if (!row.invoiceNumber || row.invoiceNumber.trim() === '') {
    return 'Invoice number is required';
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
  
  if (!row.issueDate) {
    return 'Issue date is required';
  }
  
  if (!row.dueDate) {
    return 'Due date is required';
  }
  
  const validStatuses = ['initiated', 'pending', 'approved'];
  if (row.status && !validStatuses.includes(row.status.toLowerCase())) {
    return `Invalid status. Must be one of: ${validStatuses.join(', ')}`;
  }
  
  return null;
};
