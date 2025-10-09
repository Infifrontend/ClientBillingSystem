
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

export interface ClientImportRow {
  name: string;
  employeeName?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  gstTaxId?: string;
  industry: string;
  region?: string;
  status: string;
}

export const generateSampleClientSheet = () => {
  const sampleData = [
    {
      name: 'Sample Airlines Ltd',
      employeeName: 'John Doe',
      contactPerson: 'Jane Smith',
      email: 'contact@sampleairlines.com',
      phone: '+1-234-567-8900',
      address: '123 Airport Road, City, Country',
      gstTaxId: 'GST123456789',
      industry: 'airlines',
      region: 'North America',
      status: 'active'
    },
    {
      name: 'Demo Travel Agency',
      employeeName: 'Alice Johnson',
      contactPerson: 'Bob Williams',
      email: 'info@demotravel.com',
      phone: '+1-234-567-8901',
      address: '456 Main Street, City, Country',
      gstTaxId: 'GST987654321',
      industry: 'travel_agency',
      region: 'Europe',
      status: 'active'
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Clients');
  
  // Generate and download the file
  XLSX.writeFile(workbook, 'client_import_template.xlsx');
};

export const parseClientFile = (file: File): Promise<ClientImportRow[]> => {
  return new Promise((resolve, reject) => {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    if (fileExtension === 'csv') {
      // Parse CSV file
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          resolve(results.data as ClientImportRow[]);
        },
        error: (error) => {
          reject(error);
        }
      });
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      // Parse Excel file
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet) as ClientImportRow[];
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

export const validateClientRow = (row: ClientImportRow, allRows?: ClientImportRow[], currentIndex?: number): string | null => {
  if (!row.name || row.name.trim() === '') {
    return 'Client name is required';
  }
  
  if (!row.industry) {
    return 'Industry is required';
  }
  
  const validIndustries = ['airlines', 'travel_agency', 'gds', 'ota', 'aviation_services'];
  if (!validIndustries.includes(row.industry)) {
    return `Invalid industry. Must be one of: ${validIndustries.join(', ')}`;
  }
  
  const validStatuses = ['active', 'inactive'];
  if (row.status && !validStatuses.includes(row.status)) {
    return `Invalid status. Must be one of: ${validStatuses.join(', ')}`;
  }
  
  if (row.email && !row.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    return 'Invalid email format';
  }
  
  // Check for duplicates within the same import file
  if (allRows && currentIndex !== undefined) {
    // Check for duplicate name in file
    const duplicateName = allRows.findIndex((r, idx) => 
      idx !== currentIndex && r.name.trim().toLowerCase() === row.name.trim().toLowerCase()
    );
    if (duplicateName !== -1) {
      return `Duplicate name found in row ${duplicateName + 2}`;
    }
    
    // Check for duplicate email in file
    if (row.email) {
      const duplicateEmail = allRows.findIndex((r, idx) => 
        idx !== currentIndex && r.email?.trim().toLowerCase() === row.email.trim().toLowerCase()
      );
      if (duplicateEmail !== -1) {
        return `Duplicate email found in row ${duplicateEmail + 2}`;
      }
    }
    
    // Check for duplicate GST/Tax ID in file
    if (row.gstTaxId) {
      const duplicateGstTaxId = allRows.findIndex((r, idx) => 
        idx !== currentIndex && r.gstTaxId?.trim() === row.gstTaxId.trim()
      );
      if (duplicateGstTaxId !== -1) {
        return `Duplicate GST/Tax ID found in row ${duplicateGstTaxId + 2}`;
      }
    }
  }
  
  return null;
};
