import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Trash2, Eye, CheckCircle, Clock, XCircle } from 'lucide-react';

export default function Library() {
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  const { data: documents, isLoading } = useQuery('documents', () =>
    axios.get('/api/documents').then(res => res.data)
  );

  const uploadMutation = useMutation(
    (formData) => axios.post('/api/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('documents');
        setUploading(false);
      },
      onError: () => {
        setUploading(false);
      }
    }
  );

  const deleteMutation = useMutation(
    (documentId) => axios.delete(`/api/documents/${documentId}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('documents');
      }
    }
  );

  const onDrop = async (acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      setUploading(true);
      const formData = new FormData();
      formData.append('document', acceptedFiles[0]);
      uploadMutation.mutate(formData);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    maxFiles: 1,
    disabled: uploading
  });

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'processing':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading documents...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div className="card p-6">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          } ${uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <input {...getInputProps()} />
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {uploading ? 'Uploading...' : 'Upload Study Materials'}
          </h3>
          <p className="text-gray-600 mb-4">
            Drag and drop files here, or click to select files
          </p>
          <p className="text-sm text-gray-500">
            Supports PDF, DOCX, and TXT files (max 10MB)
          </p>
          {uploading && (
            <div className="mt-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
            </div>
          )}
        </div>
      </div>

      {/* Documents List */}
      <div className="card">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Your Documents</h2>
          <p className="text-sm text-gray-600">
            {documents?.length || 0} document(s) uploaded
          </p>
        </div>

        <div className="divide-y divide-gray-200">
          {documents?.map((doc) => (
            <div key={doc.id} className="p-6 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <FileText className="w-8 h-8 text-blue-500" />
                <div>
                  <h3 className="font-medium text-gray-900">{doc.original_name}</h3>
                  <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                    <span>{formatFileSize(doc.file_size)}</span>
                    <span>•</span>
                    <span>{new Date(doc.upload_date).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(doc.processing_status)}
                  <span className="text-sm text-gray-600 capitalize">
                    {doc.processing_status}
                  </span>
                </div>
                
                <button
                  onClick={() => deleteMutation.mutate(doc.id)}
                  disabled={deleteMutation.isLoading}
                  className="text-red-600 hover:text-red-800 p-2 rounded-md hover:bg-red-50"
                  title="Delete document"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {(!documents || documents.length === 0) && (
            <div className="p-8 text-center">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Documents Yet</h3>
              <p className="text-gray-600">
                Upload your first study material to get started with AI-powered learning
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}