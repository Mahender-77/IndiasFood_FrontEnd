import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import Papa from 'papaparse';

interface ExportButtonProps {
  dataFetcher: () => Promise<any>;
  fileName: string;
  label: string;
}

const ExportButton: React.FC<ExportButtonProps> = ({
  dataFetcher,
  fileName,
  label,
}) => {
  const [loading, setLoading] = useState(false);

  const downloadJson = (data: any) => {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadCsv = (data: any) => {
    // Flatten nested objects/arrays for CSV if necessary. 
    // This is a basic flattening; complex objects might need more sophisticated handling.
    const flattenedData = data.map((item: any) => {
      const newItem: { [key: string]: any } = {};
      for (const key in item) {
        if (typeof item[key] === 'object' && item[key] !== null) {
          // For nested objects (e.g., user.username), flatten them
          if (!Array.isArray(item[key])) {
            for (const subKey in item[key]) {
              newItem[`${key}.${subKey}`] = item[key][subKey];
            }
          } else {
            // For arrays, stringify them or handle them specifically
            newItem[key] = JSON.stringify(item[key]);
          }
        } else {
          newItem[key] = item[key];
        }
      }
      return newItem;
    });

    const csv = Papa.unparse(flattenedData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExport = async (format: 'json' | 'csv') => {
    setLoading(true);
    try {
      const data = await dataFetcher();
      if (format === 'json') {
        downloadJson(data);
      } else {
        downloadCsv(data);
      }
    } catch (error) {
      console.error(`Failed to export ${fileName}:`, error);
      // Optionally show a toast error
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col space-y-2">
      <Button onClick={() => handleExport('json')} disabled={loading} className="w-full justify-start gap-2">
        <Download className="h-4 w-4" /> {label} (JSON)
      </Button>
      <Button onClick={() => handleExport('csv')} disabled={loading} className="w-full justify-start gap-2" variant="outline">
        <Download className="h-4 w-4" /> {label} (CSV)
      </Button>
    </div>
  );
};

export default ExportButton;

