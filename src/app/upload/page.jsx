import { useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Upload, Download, FileText, AlertCircle, CheckCircle } from "lucide-react";
import { motion } from "motion/react";

export default function UploadPage() {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const fileInputRef = useRef(null);
  const queryClient = useQueryClient();

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file) => {
    if (!file.name.endsWith('.csv')) {
      setUploadResult({
        success: false,
        error: 'Please upload a CSV file'
      });
      return;
    }

    setUploading(true);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      setUploadResult(result);

      if (result.success) {
        // Invalidate queries to refresh data
        queryClient.invalidateQueries(['communities']);
        queryClient.invalidateQueries(['benchmark']);
        queryClient.invalidateQueries(['consumption']);
      }
    } catch (error) {
      setUploadResult({
        success: false,
        error: 'Upload failed. Please try again.'
      });
    } finally {
      setUploading(false);
    }
  };

  const downloadSampleCSV = () => {
    const sampleData = `unit_number,reading_date,water_usage,electricity_usage
A101,2024-01-01,245.5,180.2
A102,2024-01-01,189.2,145.6
A103,2024-01-01,267.8,205.3`;

    const blob = new Blob([sampleData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_consumption_data.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#F3F3F3] dark:bg-[#0A0A0A]">
      {/* Header */}
      <div className="h-16 bg-[#F3F3F3] dark:bg-[#1A1A1A] flex items-center justify-between px-4 md:px-6 flex-shrink-0 border-b border-[#E6E6E6] dark:border-[#333333]">
        <h1 className="text-xl md:text-2xl font-bold text-black dark:text-white tracking-tight font-inter">
          Upload Consumption Data
        </h1>
        <button
          onClick={() => window.history.back()}
          className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
        >
          ← Back to Dashboard
        </button>
      </div>

      <div className="p-4 md:p-8 max-w-4xl mx-auto">
        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#E6E6E6] dark:border-[#333333] p-6 mb-8"
        >
          <h2 className="text-lg font-bold text-black dark:text-white mb-4 font-sora">
            Upload Instructions
          </h2>
          <div className="space-y-3 text-gray-600 dark:text-gray-400">
            <p>• Upload a CSV file with consumption data for your community units</p>
            <p>• Required columns: unit_number, reading_date, water_usage</p>
            <p>• Optional columns: electricity_usage</p>
            <p>• Date format: YYYY-MM-DD (e.g., 2024-01-01)</p>
            <p>• Usage values should be numeric (gallons for water, kWh for electricity)</p>
          </div>
          
          <button
            onClick={downloadSampleCSV}
            className="flex items-center gap-2 mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download size={16} />
            Download Sample CSV
          </button>
        </motion.div>

        {/* Upload Area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#E6E6E6] dark:border-[#333333] p-6 mb-8"
        >
          <div
            className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
              dragActive
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileInput}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={uploading}
            />
            
            <div className="space-y-4">
              <div className="flex justify-center">
                <Upload size={48} className="text-gray-400 dark:text-gray-500" />
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-black dark:text-white mb-2">
                  {uploading ? 'Uploading...' : 'Drop your CSV file here'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  or click to browse files
                </p>
              </div>
              
              {!uploading && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Choose File
                </button>
              )}
              
              {uploading && (
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Upload Result */}
        {uploadResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-xl border p-6 ${
              uploadResult.success
                ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
                : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
            }`}
          >
            <div className="flex items-center gap-3 mb-4">
              {uploadResult.success ? (
                <CheckCircle size={24} className="text-green-600 dark:text-green-400" />
              ) : (
                <AlertCircle size={24} className="text-red-600 dark:text-red-400" />
              )}
              <h3 className={`text-lg font-semibold ${
                uploadResult.success
                  ? 'text-green-800 dark:text-green-200'
                  : 'text-red-800 dark:text-red-200'
              }`}>
                {uploadResult.success ? 'Upload Successful' : 'Upload Failed'}
              </h3>
            </div>
            
            {uploadResult.success ? (
              <div className="space-y-2 text-green-700 dark:text-green-300">
                <p>Successfully imported {uploadResult.importedCount} of {uploadResult.totalRows} rows</p>
                {uploadResult.errors && uploadResult.errors.length > 0 && (
                  <div>
                    <p className="font-semibold">Warnings:</p>
                    <ul className="list-disc list-inside space-y-1">
                      {uploadResult.errors.map((error, index) => (
                        <li key={index} className="text-sm">{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-red-700 dark:text-red-300">
                {uploadResult.error}
              </p>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}