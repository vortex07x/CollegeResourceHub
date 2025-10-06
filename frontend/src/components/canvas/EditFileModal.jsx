import { useState, useEffect } from 'react';
import { X, Edit2, AlertCircle } from 'lucide-react';

const EditFileModal = ({ isOpen, onClose, onUpdate, fileData }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'assignment',
    subject: '',
    semester: '',
  });
  const [errors, setErrors] = useState({});
  const [isUpdating, setIsUpdating] = useState(false);

  const categories = [
    { value: 'assignment', label: 'Assignment' },
    { value: 'question_paper', label: 'Question Paper' },
    { value: 'syllabus', label: 'Syllabus' },
    { value: 'notes', label: 'Notes' },
    { value: 'other', label: 'Other' },
  ];

  useEffect(() => {
    if (isOpen && fileData) {
      setFormData({
        title: fileData.title || '',
        description: fileData.description || '',
        category: fileData.rawCategory || fileData.category || 'assignment',
        subject: fileData.subject || '',
        semester: fileData.semester || '',
      });
    }
  }, [isOpen, fileData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsUpdating(true);

    try {
      await onUpdate(fileData.id, formData);
      handleClose();
    } catch (error) {
      setErrors({ submit: error.message || 'Update failed. Please try again.' });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      category: 'assignment',
      subject: '',
      semester: '',
    });
    setErrors({});
    setIsUpdating(false);
    onClose();
  };

  if (!isOpen || !fileData) return null;

  return (
    <div className="modal-container fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
      <div className="modal-content bg-[#0A0A0A] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-modalSlideIn">
        <div className="modal-header flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
              <Edit2 size={20} className="text-white" />
            </div>
            <div>
              <h2 className="modal-title text-xl font-bold text-white">Edit File Details</h2>
              <p className="modal-subtitle text-sm text-gray-400">Update information for {fileData.name}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
            disabled={isUpdating}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            <div>
              <label className="edit-modal-label block text-sm font-semibold text-gray-400 mb-2">
                Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., Data Structures Assignment"
                className="edit-modal-input w-full h-11 px-4 bg-[#1A1A1A] border border-white/10 rounded-lg text-white placeholder:text-gray-600 focus:border-purple-500 focus:outline-none transition-colors"
                disabled={isUpdating}
              />
              {errors.title && (
                <p className="mt-1 text-xs text-red-400">{errors.title}</p>
              )}
            </div>

            <div>
              <label className="edit-modal-label block text-sm font-semibold text-gray-400 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Brief description of the file..."
                rows={3}
                className="edit-modal-textarea w-full px-4 py-3 bg-[#1A1A1A] border border-white/10 rounded-lg text-white placeholder:text-gray-600 focus:border-purple-500 focus:outline-none transition-colors resize-none"
                disabled={isUpdating}
              />
            </div>

            <div>
              <label className="edit-modal-label block text-sm font-semibold text-gray-400 mb-2">
                Category <span className="text-red-400">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="edit-modal-input w-full h-11 px-4 bg-[#1A1A1A] border border-white/10 rounded-lg text-white focus:border-purple-500 focus:outline-none transition-colors"
                disabled={isUpdating}
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="edit-modal-label block text-sm font-semibold text-gray-400 mb-2">
                Subject <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                placeholder="e.g., Computer Science"
                className="edit-modal-input w-full h-11 px-4 bg-[#1A1A1A] border border-white/10 rounded-lg text-white placeholder:text-gray-600 focus:border-purple-500 focus:outline-none transition-colors"
                disabled={isUpdating}
              />
              {errors.subject && (
                <p className="mt-1 text-xs text-red-400">{errors.subject}</p>
              )}
            </div>

            <div>
              <label className="edit-modal-label block text-sm font-semibold text-gray-400 mb-2">
                Semester
              </label>
              <input
                type="text"
                name="semester"
                value={formData.semester}
                onChange={handleChange}
                placeholder="e.g., 3rd Semester"
                className="edit-modal-input w-full h-11 px-4 bg-[#1A1A1A] border border-white/10 rounded-lg text-white placeholder:text-gray-600 focus:border-purple-500 focus:outline-none transition-colors"
                disabled={isUpdating}
              />
            </div>

            {errors.submit && (
              <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                <span>{errors.submit}</span>
              </div>
            )}
          </div>
        </form>

        <div className="modal-footer flex items-center justify-end gap-3 p-6 border-t border-white/10">
          <button
            type="button"
            onClick={handleClose}
            className="modal-button px-6 h-11 bg-white/5 border border-white/10 rounded-lg text-white font-medium hover:bg-white/10 transition-colors"
            disabled={isUpdating}
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isUpdating}
            className="modal-button px-6 h-11 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isUpdating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <Edit2 size={18} />
                Update File
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditFileModal;