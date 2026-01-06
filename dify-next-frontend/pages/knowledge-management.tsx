import React, { useState, useEffect } from 'react';
import MainLayout from '../components/Layout/MainLayout';
import { useAuth } from '../contexts/AuthContext';
import { formatDate } from '../utils/dateUtils';
import {
  getKnowledgeBases,
  createKnowledgeBase,
  updateKnowledgeBase,
  deleteKnowledgeBase,
  type KnowledgeBase,
  type CreateKnowledgeBaseData,
  type UpdateKnowledgeBaseData
} from '../services/knowledgeAdmin';
import KnowledgeForm from '../components/Knowledge/KnowledgeForm';
import DocumentManagement from '../components/Knowledge/DocumentManagement';

const KnowledgeManagement: React.FC = () => {
  const { user } = useAuth();
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDocuments, setShowDocuments] = useState(false);
  const [currentKnowledge, setCurrentKnowledge] = useState<KnowledgeBase | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && ['admin', 'owner', 'Administrator'].includes(user.role)) {
      fetchKnowledgeBases();
    }
  }, [user]);

  const fetchKnowledgeBases = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getKnowledgeBases();
      setKnowledgeBases(response.data || []);
    } catch (error) {
      console.error('Failed to fetch knowledge bases:', error);
      setError('Failed to fetch knowledge bases. Please check your API configuration.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (data: CreateKnowledgeBaseData | UpdateKnowledgeBaseData) => {
    try {
      await createKnowledgeBase(data as CreateKnowledgeBaseData);
      setShowCreateModal(false);
      fetchKnowledgeBases();
    } catch (error) {
      console.error('Failed to create knowledge base:', error);
      throw error;
    }
  };

  const handleEdit = async (data: CreateKnowledgeBaseData | UpdateKnowledgeBaseData) => {
    if (!currentKnowledge) return;
    try {
      await updateKnowledgeBase(currentKnowledge.id, data as UpdateKnowledgeBaseData);
      setShowEditModal(false);
      setCurrentKnowledge(null);
      fetchKnowledgeBases();
    } catch (error) {
      console.error('Failed to update knowledge base:', error);
      throw error;
    }
  };

  const handleDelete = async (kb: KnowledgeBase) => {
    if (!confirm(`Are you sure you want to delete "${kb.name}"? This action cannot be undone.`)) return;
    try {
      await deleteKnowledgeBase(kb.id);
      fetchKnowledgeBases();
    } catch (error) {
      console.error('Failed to delete knowledge base:', error);
      alert('Failed to delete knowledge base. Please try again.');
    }
  };

  const filteredKnowledgeBases = knowledgeBases.filter(kb =>
    kb.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    kb.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (technique: string) => {
    switch (technique) {
      case 'high_quality': return 'bg-green-100 text-green-800';
      case 'economy': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Check if user has admin privileges
  // Accept 'admin', 'owner', and 'Administrator' roles
  if (!user || !['admin', 'owner', 'Administrator'].includes(user.role)) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Access denied. Admin privileges required.</p>
        </div>
      </MainLayout>
    );
  }

  if (showDocuments && currentKnowledge) {
    return (
      <MainLayout>
        <DocumentManagement
          knowledgeBase={currentKnowledge}
          onBack={() => {
            setShowDocuments(false);
            setCurrentKnowledge(null);
          }}
        />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Knowledge Base Management
            </h1>
            <p className="text-gray-600 mt-1">
              Manage all knowledge bases and their documents
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Knowledge Base
          </button>
        </div>

        <div className="mb-4">
          <input
            type="text"
            placeholder="Search knowledge bases..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

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
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Documents
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Apps
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Indexing
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
                  {filteredKnowledgeBases.map((kb) => (
                    <tr key={kb.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {kb.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {kb.id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {kb.description || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {kb.document_count} docs
                        </div>
                        <div className="text-sm text-gray-500">
                          {kb.word_count.toLocaleString()} words
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {kb.app_count} apps
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(kb.indexing_technique)}`}>
                          {kb.indexing_technique}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(kb.created_at)}
                        <div className="text-xs text-gray-400">
                          by {kb.created_by}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => {
                              setCurrentKnowledge(kb);
                              setShowDocuments(true);
                            }}
                            className="text-blue-600 hover:text-blue-800"
                            title="View Documents"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => {
                              setCurrentKnowledge(kb);
                              setShowEditModal(true);
                            }}
                            className="text-green-600 hover:text-green-800"
                            title="Edit"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(kb)}
                            className="text-red-600 hover:text-red-800"
                            title="Delete"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {filteredKnowledgeBases.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-500">
                  {searchTerm ? 'No knowledge bases found matching your search.' : 'No knowledge bases found.'}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <KnowledgeForm
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onSubmit={handleCreate}
            title="Create Knowledge Base"
          />
        )}

        {/* Edit Modal */}
        {showEditModal && currentKnowledge && (
          <KnowledgeForm
            isOpen={showEditModal}
            onClose={() => {
              setShowEditModal(false);
              setCurrentKnowledge(null);
            }}
            onSubmit={handleEdit}
            title="Edit Knowledge Base"
            initialData={currentKnowledge}
          />
        )}
      </div>
    </MainLayout>
  );
};

export default KnowledgeManagement;
