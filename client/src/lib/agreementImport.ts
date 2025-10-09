
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

export interface AgreementImportRow {
  clientName: string;
  agreementName: string;
  startDate: string;
  endDate: string;
  paymentTerms?: string;
  implementFees?: string;
  monthlySubscriptionFees?: string;
  changeRequestFees?: string;
  year1Fee: string;
  year2Fee?: string;
  year3Fee?: string;
  currency: string;
  status: string;
  autoRenewal?: string;
}

export const generateSampleAgreementSheet = () => {
  const sampleData = [
    {
      clientName: 'Sample Airlines Ltd',
      agreementName: 'Annual Service Agreement 2024',
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      paymentTerms: 'Net 30',
      implementFees: '50000',
      monthlySubscriptionFees: '5000',
      changeRequestFees: '2000',
      year1Fee: '120000',
      year2Fee: '130000',
      year3Fee: '140000',
      currency: 'USD',
      status: 'active',
      autoRenewal: 'false'
    },
    {
      clientName: 'Demo Travel Agency',
      agreementName: 'Platform Subscription Agreement',
      startDate: '2024-06-01',
      endDate: '2025-05-31',
      paymentTerms: 'Net 45',
      implementFees: '25000',
      monthlySubscriptionFees: '3000',
      changeRequestFees: '1500',
      year1Fee: '60000',
      year2Fee: '',
      year3Fee: '',
      currency: 'USD',
      status: 'active',
      autoRenewal: 'true'
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Agreements');
  
  XLSX.writeFile(workbook, 'agreement_import_template.xlsx');
};

export const parseAgreementFile = (file: File): Promise<AgreementImportRow[]> => {
  return new Promise((resolve, reject) => {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    if (fileExtension === 'csv') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          resolve(results.data as AgreementImportRow[]);
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
          const jsonData = XLSX.utils.sheet_to_json(worksheet) as AgreementImportRow[];
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

export const validateAgreementRow = (row: AgreementImportRow): string | null => {
  if (!row.clientName || row.clientName.trim() === '') {
    return 'Client name is required';
  }
  
  if (!row.agreementName || row.agreementName.trim() === '') {
    return 'Agreement name is required';
  }
  
  if (!row.startDate) {
    return 'Start date is required';
  }
  
  if (!row.endDate) {
    return 'End date is required';
  }
  
  if (!row.year1Fee || isNaN(Number(row.year1Fee))) {
    return 'Valid Year 1 fee is required';
  }
  
  if (!row.currency) {
    return 'Currency is required';
  }
  
  const validCurrencies = ['INR', 'USD', 'EUR'];
  if (!validCurrencies.includes(row.currency.toUpperCase())) {
    return `Invalid currency. Must be one of: ${validCurrencies.join(', ')}`;
  }
  
  const validStatuses = ['active', 'inactive'];
  if (row.status && !validStatuses.includes(row.status.toLowerCase())) {
    return `Invalid status. Must be one of: ${validStatuses.join(', ')}`;
  }
  
  if (row.autoRenewal && !['true', 'false'].includes(row.autoRenewal.toLowerCase())) {
    return 'autoRenewal must be true or false';
  }
  
  return null;
};
