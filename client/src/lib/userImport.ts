
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

export interface UserImportRow {
  email: string;
  username?: string;
  firstName: string;
  lastName: string;
  role: string;
  department?: string;
  status: string;
}

export const generateSampleUserSheet = () => {
  const sampleData = [
    {
      email: 'john.doe@example.com',
      username: 'johndoe',
      firstName: 'John',
      lastName: 'Doe',
      role: 'viewer',
      department: 'Sales',
      status: 'active'
    },
    {
      email: 'jane.smith@example.com',
      username: 'janesmith',
      firstName: 'Jane',
      lastName: 'Smith',
      role: 'csm',
      department: 'Customer Success',
      status: 'active'
    },
    {
      email: 'bob.wilson@example.com',
      username: 'bobwilson',
      firstName: 'Bob',
      lastName: 'Wilson',
      role: 'finance',
      department: 'Finance',
      status: 'active'
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Users');
  
  XLSX.writeFile(workbook, 'user_import_template.xlsx');
};

export const parseUserFile = (file: File): Promise<UserImportRow[]> => {
  return new Promise((resolve, reject) => {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    if (fileExtension === 'csv') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          resolve(results.data as UserImportRow[]);
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
          const jsonData = XLSX.utils.sheet_to_json(worksheet) as UserImportRow[];
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

export const validateUserRow = (row: UserImportRow, allRows?: UserImportRow[], currentIndex?: number): string | null => {
  if (!row.email || row.email.trim() === '') {
    return 'Email is required';
  }
  
  if (!row.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    return 'Invalid email format';
  }
  
  if (!row.firstName || row.firstName.trim() === '') {
    return 'First name is required';
  }
  
  if (!row.lastName || row.lastName.trim() === '') {
    return 'Last name is required';
  }
  
  if (!row.role) {
    return 'Role is required';
  }
  
  const validRoles = ['admin', 'csm', 'finance', 'viewer'];
  if (!validRoles.includes(row.role.toLowerCase())) {
    return `Invalid role. Must be one of: ${validRoles.join(', ')}`;
  }
  
  const validStatuses = ['active', 'inactive', 'pending'];
  if (row.status && !validStatuses.includes(row.status.toLowerCase())) {
    return `Invalid status. Must be one of: ${validStatuses.join(', ')}`;
  }
  
  // Check for duplicates within the same import file
  if (allRows && currentIndex !== undefined) {
    // Check for duplicate email in file
    const duplicateEmail = allRows.findIndex((r, idx) => 
      idx !== currentIndex && r.email.trim().toLowerCase() === row.email.trim().toLowerCase()
    );
    if (duplicateEmail !== -1) {
      return `Duplicate email found in row ${duplicateEmail + 2}`;
    }
    
    // Check for duplicate username in file
    if (row.username) {
      const duplicateUsername = allRows.findIndex((r, idx) => 
        idx !== currentIndex && r.username?.trim().toLowerCase() === row.username.trim().toLowerCase()
      );
      if (duplicateUsername !== -1) {
        return `Duplicate username found in row ${duplicateUsername + 2}`;
      }
    }
  }
  
  return null;
};
