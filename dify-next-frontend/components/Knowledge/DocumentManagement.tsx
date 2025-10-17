import React, { useState, useEffect, useCallback } from 'react';
import { formatDate } from '../../utils/dateUtils';
import { KnowledgeBase, Document, getDocuments, createDocumentFromText, createDocumentFromFile, deleteDocument } from '../../services/knowledgeAdmin';

interface DocumentManagementProps {
  knowledgeBase: KnowledgeBase;
  onBack: () => void;
}

const DocumentManagement: React.FC<DocumentManagementProps> = ({ knowledgeBase, onBack }) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [activeKeyword, setActiveKeyword] = useState('');

  const fetchDocuments = useCallback(async (keyword: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await getDocuments(knowledgeBase.id, { keyword });
      setDocuments(response.data || []);
      setActiveKeyword(keyword);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
      setError('Failed to fetch documents. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [knowledgeBase.id]);

  useEffect(() => {
    setSearchTerm('');
    fetchDocuments('');
  }, [knowledgeBase.id, fetchDocuments]);

  const handleSearch = () => {
    fetchDocuments(searchTerm);
  };

  const handleDelete = async (document: Document) => {
    if (!confirm(`Are you sure you want to delete “${document.name}”?`)) return;

    try {
      await deleteDocument(knowledgeBase.id, document.id);
      fetchDocuments(activeKeyword);
    } catch (error) {
      console.error('Failed to delete document:', error);
      alert('Failed to delete document. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'error': return 'bg-red-100 text-red-800';
      case 'indexing': return 'bg-yellow-100 text-yellow-800';
      case 'splitting': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button
            onClick={onBack}
            className="mr-4 text-gray-600 hover:text-gray-800"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Documents in “{knowledgeBase.name}”
            </h1>
            <p className="text-gray-600 mt-1">
              Manage documents and their content
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Document
        </button>
      </div>

      {/* Search */}
      <div className="mb-4 flex space-x-2">
        <input
          type="text"
          placeholder="Search documents..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button
          onClick={handleSearch}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg"
        >
          Search
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Documents Table */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Words
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hits
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {doc.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {doc.data_source_type}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(doc.indexing_status)}`}>
                        {doc.indexing_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {doc.word_count.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {doc.hit_count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(doc.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleDelete(doc)}
                        className="text-red-600 hover:text-red-800"
                        title="Delete"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {documents.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500">
                {searchTerm ? 'No documents found matching your search.' : 'No documents found.'}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Document Modal */}
      {showCreateModal && (
        <CreateDocumentModal
          knowledgeBaseId={knowledgeBase.id}
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchDocuments('');
          }}
        />
      )}
    </div>
  );
};

// Create Document Modal Component
interface CreateDocumentModalProps {
  knowledgeBaseId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateDocumentModal: React.FC<CreateDocumentModalProps> = ({
  knowledgeBaseId,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [activeTab, setActiveTab] = useState<'text' | 'file'>('text');
  const [formData, setFormData] = useState({
    name: '',
    text: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supportedFileTypes = [
    'txt', 'markdown', 'mdx', 'pdf', 'html', 'xlsx', 'xls',
    'docx', 'csv', 'vtt', 'properties', 'md', 'htm'
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (15MB limit)
      if (file.size > 15 * 1024 * 1024) {
        setError('File size must be less than 15MB');
        return;
      }

      // Check file type
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      if (fileExtension && !supportedFileTypes.includes(fileExtension)) {
        setError(`Unsupported file type. Supported types: ${supportedFileTypes.join(', ')}`);
        return;
      }

      setSelectedFile(file);
      setFormData({ ...formData, name: file.name });
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (activeTab === 'text') {
      if (!formData.name.trim() || !formData.text.trim()) return;
    } else {
      if (!selectedFile || !formData.name.trim()) return;
    }

    try {
      setLoading(true);
      setError(null);

      if (activeTab === 'text') {
        await createDocumentFromText(knowledgeBaseId, formData);
      } else {
        await createDocumentFromFile(knowledgeBaseId, {
          name: formData.name,
          file: selectedFile!
        });
      }

      onSuccess();
    } catch (error) {
      console.error('Failed to create document:', error);
      setError('Failed to create document. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-[600px] max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Add New Document</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex mb-6 border-b">
            <button
              onClick={() => setActiveTab('text')}
              className={`px-4 py-2 font-medium text-sm border-b-2 ${
                activeTab === 'text'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              From Text
            </button>
            <button
              onClick={() => setActiveTab('file')}
              className={`px-4 py-2 font-medium text-sm border-b-2 ${
                activeTab === 'file'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              From File
            </button>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Document Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter document name"
                required
              />
            </div>

            {activeTab === 'text' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content *
                </label>
                <textarea
                  value={formData.text}
                  onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                  rows={12}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter document content"
                  required
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload File *
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                    accept=".txt,.md,.markdown,.mdx,.pdf,.html,.htm,.xlsx,.xls,.docx,.csv,.vtt,.properties"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    {selectedFile ? (
                      <div>
                        <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                        <p className="text-xs text-gray-500">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm font-medium text-gray-900">Click to upload file</p>
                        <p className="text-xs text-gray-500">Maximum file size: 15MB</p>
                      </div>
                    )}
                  </label>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  <p className="font-medium">Supported formats:</p>
                  <p>TXT, MARKDOWN, MDX, PDF, HTML, XLSX, XLS, DOCX, CSV, VTT, PROPERTIES, MD, HTM</p>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || (activeTab === 'text' ? (!formData.name.trim() || !formData.text.trim()) : (!selectedFile || !formData.name.trim()))}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Document'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DocumentManagement;
