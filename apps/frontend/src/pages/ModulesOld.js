import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import { useDropzone } from 'react-dropzone';
import { Plus, BookOpen, Calendar, User, Trash2, Clock, Target, FileText, Brain, ChevronDown, ChevronUp, MoreVertical, AlertCircle, Upload, Download, Search, Filter, Grid, List, Paperclip, CheckCircle, XCircle, Eye, Bookmark, Star } from 'lucide-react';

export default function Modules() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedModule, setSelectedModule] = useState(null);
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const [assignmentFormModule, setAssignmentFormModule] = useState(null);
  const [expandedModules, setExpandedModules] = useState(new Set());
  const [showDropdownFor, setShowDropdownFor] = useState(null);
  const [activeTab, setActiveTab] = useState({}); // Track active tab per module
  const [viewMode, setViewMode] = useState('grid'); // grid or list
  const [searchTerm, setSearchTerm] = useState('');
  const [uploading, setUploading] = useState({});
  const [formData, setFormData] = useState({
    module_code: '',
    module_name: '',
    description: '',
    academic_year: 'Year 1',
    semester: 'Semester 1',
    credits: 3,
    lecturer_name: ''
  });

  const [assignmentData, setAssignmentData] = useState({
    title: '',
    description: '',
    assignment_type: 'quiz',
    due_date: '',
    due_time: '',
    weight_percentage: '',
    notes: ''
  });

  const queryClient = useQueryClient();

  const { data: modules, isLoading } = useQuery('modules', () =>
    axios.get('/api/modules').then(res => res.data)
  );

  // Fetch assignments for all modules
  const { data: allAssignments } = useQuery('all-assignments', () =>
    axios.get('/api/assignments').then(res => res.data)
  );

  // Fetch all documents
  const { data: allDocuments } = useQuery('documents', () =>
    axios.get('/api/documents').then(res => res.data)
  );

  // Upload document mutation
  const uploadDocumentMutation = useMutation(
    (formData) => axios.post('/api/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('documents');
        queryClient.invalidateQueries('modules');
        setUploading({});
      },
      onError: () => {
        setUploading({});
      }
    }
  );

  // Delete document mutation
  const deleteDocumentMutation = useMutation(
    (documentId) => axios.delete(`/api/documents/${documentId}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('documents');
        queryClient.invalidateQueries('modules');
      }
    }
  );

  const { data: moduleAssignments } = useQuery(
    ['assignments', selectedModule?.id],
    () => selectedModule ? 
      axios.get(`/api/assignments/module/${selectedModule.id}`).then(res => res.data) : 
      Promise.resolve([]),
    { enabled: !!selectedModule }
  );

  const createModuleMutation = useMutation(
    (moduleData) => axios.post('/api/modules', moduleData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('modules');
        setShowAddForm(false);
        resetForm();
      }
    }
  );

  const deleteModuleMutation = useMutation(
    (moduleId) => axios.delete(`/api/modules/${moduleId}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('modules');
      }
    }
  );

  const createAssignmentMutation = useMutation(
    (assignmentData) => axios.post('/api/assignments', assignmentData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['assignments', assignmentFormModule?.id]);
        queryClient.invalidateQueries('modules');
        setShowAssignmentForm(false);
        resetAssignmentForm();
      }
    }
  );

  const updateAssignmentMutation = useMutation(
    ({ id, ...updateData }) => axios.put(`/api/assignments/${id}`, updateData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['assignments', selectedModule?.id]);
        queryClient.invalidateQueries('modules');
      }
    }
  );

  const resetForm = () => {
    setFormData({
      module_code: '',
      module_name: '',
      description: '',
      academic_year: 'Year 1',
      semester: 'Semester 1',
      credits: 3,
      lecturer_name: ''
    });
  };

  const resetAssignmentForm = () => {
    setAssignmentData({
      title: '',
      description: '',
      assignment_type: 'quiz',
      due_date: '',
      due_time: '',
      weight_percentage: '',
      notes: ''
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createModuleMutation.mutate(formData);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'credits' ? parseInt(value) : value
    }));
  };

  const handleAssignmentSubmit = (e) => {
    e.preventDefault();
    createAssignmentMutation.mutate({
      ...assignmentData,
      module_id: assignmentFormModule.id
    });
  };

  const handleAssignmentInputChange = (e) => {
    const { name, value } = e.target;
    setAssignmentData(prev => ({
      ...prev,
      [name]: name === 'weight_percentage' ? 
        (value === '' ? '' : parseFloat(value)) : value
    }));
  };

  const handleAssignmentStatusChange = (assignmentId, newStatus) => {
    updateAssignmentMutation.mutate({ id: assignmentId, status: newStatus });
  };

  const openAddAssignment = (module) => {
    setAssignmentFormModule(module);
    setShowAssignmentForm(true);
    resetAssignmentForm();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'in_progress': return 'text-yellow-600';
      case 'submitted': return 'text-blue-600';
      case 'graded': return 'text-purple-600';
      default: return 'text-muted-foreground';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'exam': return <FileText className="w-4 h-4" />;
      case 'quiz': return <Brain className="w-4 h-4" />;
      case 'project': return <Target className="w-4 h-4" />;
      default: return <Calendar className="w-4 h-4" />;
    }
  };

  const getAssignmentsForModule = (moduleId) => {
    return allAssignments?.filter(assignment => assignment.module_id === moduleId) || [];
  };

  const getDocumentsForModule = (moduleId) => {
    return allDocuments?.filter(document => document.module_id === moduleId) || [];
  };

  const getActiveTab = (moduleId) => {
    return activeTab[moduleId] || 'overview';
  };

  const setActiveTabForModule = (moduleId, tab) => {
    setActiveTab(prev => ({ ...prev, [moduleId]: tab }));
  };

  const toggleModuleExpansion = (moduleId) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId);
    } else {
      newExpanded.add(moduleId);
    }
    setExpandedModules(newExpanded);
  };

  const toggleDropdown = (moduleId) => {
    setShowDropdownFor(showDropdownFor === moduleId ? null : moduleId);
  };

  const getPriorityColor = (dueDate) => {
    if (!dueDate) return 'text-muted-foreground';
    const today = new Date();
    const due = new Date(dueDate);
    const daysUntilDue = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
    
    if (daysUntilDue < 0) return 'text-red-600'; // Overdue
    if (daysUntilDue <= 3) return 'text-orange-600'; // Due soon
    if (daysUntilDue <= 7) return 'text-yellow-600'; // Due this week
    return 'text-muted-foreground';
  };

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
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'processing':
        return <Clock className="w-4 h-4 text-yellow-500 animate-spin" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const handleDocumentUpload = (moduleId) => {
    return {
      onDrop: async (acceptedFiles) => {
        if (acceptedFiles.length > 0) {
          setUploading(prev => ({ ...prev, [moduleId]: true }));
          const formData = new FormData();
          formData.append('document', acceptedFiles[0]);
          formData.append('module_id', moduleId);
          uploadDocumentMutation.mutate(formData);
        }
      },
      accept: {
        'application/pdf': ['.pdf'],
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
        'text/plain': ['.txt']
      },
      maxFiles: 1,
      disabled: uploading[moduleId]
    };
  };

  const filteredModules = modules?.filter(module => 
    module.module_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    module.module_code.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:justify-between md:items-center md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Study Hub</h1>
          <p className="text-muted-foreground">Your complete learning workspace - modules, assignments, and study materials in one place</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search modules..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10 w-64"
            />
          </div>
          <div className="flex items-center border border-border rounded-md">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="btn btn-primary flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Module</span>
          </button>
        </div>
      </div>

      {/* Add Module Form */}
      {showAddForm && (
        <div className="bg-card rounded-lg border border-border p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-foreground">Add New Module</h3>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  resetForm();
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Module Code *
                </label>
                <input
                  type="text"
                  name="module_code"
                  value={formData.module_code}
                  onChange={handleInputChange}
                  placeholder="e.g., CS101"
                  className="input w-full"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Module Name *
                </label>
                <input
                  type="text"
                  name="module_name"
                  value={formData.module_name}
                  onChange={handleInputChange}
                  placeholder="e.g., Introduction to Computer Science"
                  className="input w-full"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Year
                </label>
                <select
                  name="academic_year"
                  value={formData.academic_year}
                  onChange={handleInputChange}
                  className="input w-full"
                >
                  <option value="Year 1">Year 1</option>
                  <option value="Year 2">Year 2</option>
                  <option value="Year 3">Year 3</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Semester
                </label>
                <select
                  name="semester"
                  value={formData.semester}
                  onChange={handleInputChange}
                  className="input w-full"
                >
                  <option value="Semester 1">Semester 1</option>
                  <option value="Semester 2">Semester 2</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Credits
                </label>
                <input
                  type="number"
                  name="credits"
                  value={formData.credits}
                  onChange={handleInputChange}
                  min="1"
                  max="20"
                  className="input w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Lecturer Name
                </label>
                <input
                  type="text"
                  name="lecturer_name"
                  value={formData.lecturer_name}
                  onChange={handleInputChange}
                  placeholder="e.g., Dr. John Smith"
                  className="input w-full"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Brief description of the module"
                className="input w-full h-24 resize-none"
              />
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="submit"
                disabled={createModuleMutation.isLoading}
                className="btn btn-primary"
              >
                {createModuleMutation.isLoading ? 'Adding...' : 'Add Module'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  resetForm();
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modules Grid */}
      {filteredModules && filteredModules.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredModules.map((module) => {
            const moduleAssignments = getAssignmentsForModule(module.id);
            const isExpanded = expandedModules.has(module.id);
            const overdueCount = moduleAssignments.filter(a => {
              if (!a.due_date) return false;
              return new Date(a.due_date) < new Date() && a.status !== 'completed' && a.status !== 'submitted' && a.status !== 'graded';
            }).length;
            const upcomingCount = moduleAssignments.filter(a => {
              if (!a.due_date) return false;
              const due = new Date(a.due_date);
              const today = new Date();
              const daysUntilDue = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
              return daysUntilDue >= 0 && daysUntilDue <= 7 && a.status !== 'completed' && a.status !== 'submitted' && a.status !== 'graded';
            }).length;
            
            return (
              <div
                key={module.id}
                className="bg-card rounded-lg border border-border p-6 hover:shadow-md transition-all duration-200"
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <BookOpen className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground text-lg">
                        {module.module_code}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {module.credits} Credits • {module.academic_year} • {module.semester}
                      </p>
                    </div>
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => toggleDropdown(module.id)}
                      className="text-muted-foreground hover:text-foreground transition-colors p-1"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    {showDropdownFor === module.id && (
                      <div className="absolute right-0 mt-1 w-48 bg-card border border-border rounded-md shadow-lg z-10">
                        <div className="py-1">
                          <button
                            onClick={() => {
                              setSelectedModule(module);
                              setShowDropdownFor(null);
                            }}
                            className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-foreground hover:bg-muted"
                          >
                            <BookOpen className="w-4 h-4" />
                            <span>View Details</span>
                          </button>
                          <button
                            onClick={() => {
                              openAddAssignment(module);
                              setShowDropdownFor(null);
                            }}
                            className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-foreground hover:bg-muted"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Add Assignment</span>
                          </button>
                          <hr className="my-1 border-border" />
                          <button
                            onClick={() => {
                              deleteModuleMutation.mutate(module.id);
                              setShowDropdownFor(null);
                            }}
                            className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-destructive hover:bg-muted"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Delete Module</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <h4 className="font-medium text-foreground mb-2 line-clamp-2">
                  {module.module_name}
                </h4>
                
                {module.description && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {module.description}
                  </p>
                )}

                {module.lecturer_name && (
                  <div className="flex items-center space-x-2 mb-4">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">{module.lecturer_name}</span>
                  </div>
                )}

                {/* Progress Bar */}
                {module.completion_percentage !== null && (
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Module Progress</span>
                      <span>{module.completion_percentage}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${module.completion_percentage || 0}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Assignment Summary */}
                <div className="bg-background/50 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-foreground font-medium">
                          {moduleAssignments.length} Assignment{moduleAssignments.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      {overdueCount > 0 && (
                        <div className="flex items-center space-x-1 text-red-600">
                          <AlertCircle className="w-4 h-4" />
                          <span className="text-xs font-medium">{overdueCount} Overdue</span>
                        </div>
                      )}
                      {upcomingCount > 0 && (
                        <div className="flex items-center space-x-1 text-orange-600">
                          <Clock className="w-4 h-4" />
                          <span className="text-xs font-medium">{upcomingCount} Due Soon</span>
                        </div>
                      )}
                    </div>
                    {moduleAssignments.length > 0 && (
                      <button
                        onClick={() => toggleModuleExpansion(module.id)}
                        className="flex items-center space-x-1 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <span className="text-xs">{isExpanded ? 'Hide' : 'Show'}</span>
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    )}
                  </div>

                  {/* Assignment List */}
                  {isExpanded && moduleAssignments.length > 0 && (
                    <div className="space-y-2">
                      {moduleAssignments.slice(0, 5).map((assignment) => (
                        <div
                          key={assignment.id}
                          className="flex items-center justify-between py-2 px-3 bg-card rounded border border-border/50"
                        >
                          <div className="flex items-center space-x-3">
                            {getTypeIcon(assignment.assignment_type)}
                            <div>
                              <p className="text-sm font-medium text-foreground line-clamp-1">
                                {assignment.title}
                              </p>
                              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                                <span className="capitalize">{assignment.assignment_type}</span>
                                {assignment.due_date && (
                                  <span className={getPriorityColor(assignment.due_date)}>
                                    Due: {new Date(assignment.due_date).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <select
                            value={assignment.status}
                            onChange={(e) => handleAssignmentStatusChange(assignment.id, e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            className={`text-xs border border-border rounded px-2 py-1 bg-card ${getStatusColor(assignment.status)}`}
                          >
                            <option value="pending">Pending</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Completed</option>
                            <option value="submitted">Submitted</option>
                            <option value="graded">Graded</option>
                          </select>
                        </div>
                      ))}
                      {moduleAssignments.length > 5 && (
                        <div className="text-center py-2">
                          <button
                            onClick={() => setSelectedModule(module)}
                            className="text-xs text-primary hover:text-primary/80"
                          >
                            View all {moduleAssignments.length} assignments
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* No assignments state */}
                  {moduleAssignments.length === 0 && (
                    <div className="text-center py-2">
                      <p className="text-sm text-muted-foreground mb-2">No assignments yet</p>
                      <button
                        onClick={() => openAddAssignment(module)}
                        className="btn btn-primary btn-sm flex items-center space-x-2 mx-auto"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add First Assignment</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => setSelectedModule(module)}
                    className="btn btn-secondary flex-1 text-sm"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => openAddAssignment(module)}
                    className="btn btn-primary flex items-center space-x-2 px-4"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Assignment</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No modules yet</h3>
          <p className="text-muted-foreground mb-6">
            Add your first module to start organizing your coursework
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="btn btn-primary"
          >
            Add Your First Module
          </button>
        </div>
      )}

      {/* Click outside handler for dropdown */}
      {showDropdownFor && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowDropdownFor(null)}
        />
      )}

      {/* Assignment Form Modal */}
      {showAssignmentForm && assignmentFormModule && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg border border-border max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-foreground">
                  Add Assignment - {assignmentFormModule.module_code}
                </h2>
                <button
                  onClick={() => {
                    setShowAssignmentForm(false);
                    resetAssignmentForm();
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAssignmentSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={assignmentData.title}
                    onChange={handleAssignmentInputChange}
                    placeholder="e.g., Quiz 1, Final Exam, Project Report"
                    className="input w-full"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Type
                  </label>
                  <select
                    name="assignment_type"
                    value={assignmentData.assignment_type}
                    onChange={handleAssignmentInputChange}
                    className="input w-full"
                  >
                    <option value="quiz">Quiz</option>
                    <option value="exam">Exam</option>
                    <option value="project">Project</option>
                    <option value="coursework">Coursework</option>
                    <option value="presentation">Presentation</option>
                    <option value="lab">Lab</option>
                    <option value="homework">Homework</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Due Date
                    </label>
                    <input
                      type="date"
                      name="due_date"
                      value={assignmentData.due_date}
                      onChange={handleAssignmentInputChange}
                      className="input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Due Time
                    </label>
                    <input
                      type="time"
                      name="due_time"
                      value={assignmentData.due_time}
                      onChange={handleAssignmentInputChange}
                      className="input w-full"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Weight (%)
                  </label>
                  <input
                    type="number"
                    name="weight_percentage"
                    value={assignmentData.weight_percentage}
                    onChange={handleAssignmentInputChange}
                    placeholder="20"
                    className="input w-full"
                    min="0"
                    max="100"
                    step="0.1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={assignmentData.description}
                    onChange={handleAssignmentInputChange}
                    placeholder="Assignment details..."
                    className="input w-full h-20 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    value={assignmentData.notes}
                    onChange={handleAssignmentInputChange}
                    placeholder="Additional notes..."
                    className="input w-full h-16 resize-none"
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    disabled={createAssignmentMutation.isLoading}
                    className="btn btn-primary flex-1"
                  >
                    {createAssignmentMutation.isLoading ? 'Adding...' : 'Add Assignment'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAssignmentForm(false);
                      resetAssignmentForm();
                    }}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Module Detail Modal */}
      {selectedModule && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg border border-border max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-bold text-foreground">
                    {selectedModule.module_code}
                  </h2>
                  <h3 className="text-lg text-muted-foreground">
                    {selectedModule.module_name}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedModule(null)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-muted-foreground">Year</span>
                    <p className="text-foreground">{selectedModule.academic_year}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Semester</span>
                    <p className="text-foreground">{selectedModule.semester}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Credits</span>
                    <p className="text-foreground">{selectedModule.credits}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {selectedModule.lecturer_name && (
                    <div>
                      <span className="text-sm text-muted-foreground">Lecturer</span>
                      <p className="text-foreground">{selectedModule.lecturer_name}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-sm text-muted-foreground">Assignments</span>
                    <p className="text-foreground">{selectedModule.assignment_count || 0}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Documents</span>
                    <p className="text-foreground">{selectedModule.document_count || 0}</p>
                  </div>
                </div>
              </div>

              {selectedModule.description && (
                <div className="mb-6">
                  <span className="text-sm text-muted-foreground">Description</span>
                  <p className="text-foreground mt-1">{selectedModule.description}</p>
                </div>
              )}

              {selectedModule.completion_percentage !== null && (
                <div className="mb-6">
                  <div className="flex justify-between text-sm text-muted-foreground mb-2">
                    <span>Module Progress</span>
                    <span>{selectedModule.completion_percentage}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3">
                    <div
                      className="bg-primary h-3 rounded-full transition-all duration-300"
                      style={{ width: `${selectedModule.completion_percentage || 0}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Assignments Section */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-semibold text-foreground">Assignments</h4>
                  <button
                    onClick={() => openAddAssignment(selectedModule)}
                    className="btn btn-primary btn-sm flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Assignment</span>
                  </button>
                </div>

                {moduleAssignments && moduleAssignments.length > 0 ? (
                  <div className="space-y-3">
                    {moduleAssignments.map((assignment) => (
                      <div
                        key={assignment.id}
                        className="bg-background rounded-lg border border-border p-4"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center space-x-3">
                            {getTypeIcon(assignment.assignment_type)}
                            <div>
                              <h5 className="font-medium text-foreground">{assignment.title}</h5>
                              <p className="text-sm text-muted-foreground capitalize">
                                {assignment.assignment_type}
                              </p>
                            </div>
                          </div>
                          <select
                            value={assignment.status}
                            onChange={(e) => handleAssignmentStatusChange(assignment.id, e.target.value)}
                            className={`text-sm border border-border rounded px-2 py-1 ${getStatusColor(assignment.status)}`}
                          >
                            <option value="pending">Pending</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Completed</option>
                            <option value="submitted">Submitted</option>
                            <option value="graded">Graded</option>
                          </select>
                        </div>

                        {assignment.description && (
                          <p className="text-sm text-muted-foreground mb-2">
                            {assignment.description}
                          </p>
                        )}

                        <div className="flex justify-between items-center text-xs text-muted-foreground">
                          <div className="flex space-x-4">
                            {assignment.due_date && (
                              <div className="flex items-center space-x-1">
                                <Calendar className="w-3 h-3" />
                                <span>
                                  Due: {new Date(assignment.due_date).toLocaleDateString()}
                                  {assignment.due_time && ` at ${assignment.due_time}`}
                                </span>
                              </div>
                            )}
                            {assignment.weight_percentage && (
                              <span>Weight: {assignment.weight_percentage}%</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">No assignments yet</p>
                    <button
                      onClick={() => openAddAssignment(selectedModule)}
                      className="text-primary hover:text-primary/80 text-sm mt-2"
                    >
                      Add your first assignment
                    </button>
                  </div>
                )}
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setSelectedModule(null)}
                  className="btn btn-secondary"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}