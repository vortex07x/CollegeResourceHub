import { useState, useRef } from 'react';
import { X, Upload, FileText, File, AlertCircle } from 'lucide-react';

const UploadModal = ({ isOpen, onClose, onUpload, uploadPosition }) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'assignment',
    subject: '',
    semester: '',
  });
  const [errors, setErrors] = useState({});
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const categories = [
    { value: 'assignment', label: 'Assignment' },
    { value: 'question_paper', label: 'Question Paper' },
    { value: 'syllabus', label: 'Syllabus' },
    { value: 'notes', label: 'Notes' },
    { value: 'other', label: 'Other' },
  ];

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      validateFile(selectedFile);
    }
  };

  const validateFile = (selectedFile) => {
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const maxSize = 10 * 1024 * 1024;

    if (!validTypes.includes(selectedFile.type)) {
      setErrors({ file: 'Only PDF and DOCX files are allowed' });
      return;
    }

    if (selectedFile.size > maxSize) {
      setErrors({ file: 'File size must be less than 10MB' });
      return;
    }

    setFile(selectedFile);
    setErrors({});
    
    if (!formData.title) {
      const fileName = selectedFile.name.replace(/\.[^/.]+$/, '');
      setFormData(prev => ({ ...prev, title: fileName }));
    }

    if (selectedFile.type === 'application/pdf') {
      setPreview({ type: 'pdf', name: selectedFile.name });
    } else {
      setPreview({ type: 'docx', name: selectedFile.name });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!file) {
      newErrors.file = 'Please select a file';
    }
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

    setIsUploading(true);

    const uploadFormData = new FormData();
    uploadFormData.append('file', file);
    uploadFormData.append('title', formData.title);
    uploadFormData.append('description', formData.description);
    uploadFormData.append('category', formData.category);
    uploadFormData.append('subject', formData.subject);
    uploadFormData.append('semester', formData.semester);
    uploadFormData.append('position_x', uploadPosition.x);
    uploadFormData.append('position_y', uploadPosition.y);

    try {
      await onUpload(uploadFormData);
      handleClose();
    } catch (error) {
      setErrors({ submit: error.message || 'Upload failed. Please try again.' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setPreview(null);
    setFormData({
      title: '',
      description: '',
      category: 'assignment',
      subject: '',
      semester: '',
    });
    setErrors({});
    setIsUploading(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-container fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
      <div className="modal-content bg-[#0A0A0A] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-modalSlideIn">
        <div className="modal-header flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
              <Upload size={20} className="text-white" />
            </div>
            <div>
              <h2 className="modal-title text-xl font-bold text-white">Upload File</h2>
              <p className="modal-subtitle text-sm text-gray-400">Add a new resource to the canvas</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
            disabled={isUploading}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body flex-1 overflow-y-auto p-6">
          <div className="upload-modal-grid grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-400 mb-3">
                File Preview
              </label>
              
              {!file ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="upload-preview-area h-full min-h-[400px] border-2 border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center p-8 cursor-pointer hover:border-purple-500 hover:bg-purple-500/5 transition-all"
                >
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mb-4">
                    <Upload size={32} className="text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Drop your file here</h3>
                  <p className="text-sm text-gray-400 mb-1">or click to browse</p>
                  <p className="text-xs text-gray-500">Supports PDF and DOCX (Max 10MB)</p>
                </div>
              ) : (
                <div className="upload-file-info h-full min-h-[400px] border border-white/10 rounded-xl p-6 flex flex-col items-center justify-center bg-[#1A1A1A]">
                  <div className="w-32 h-32 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mb-6">
                    {preview.type === 'pdf' ? (
                      <FileText size={64} className="text-white" />
                    ) : (
                      <File size={64} className="text-white" />
                    )}
                  </div>
                  <h4 className="text-lg font-semibold text-white mb-2 text-center break-all px-4">
                    {preview.name}
                  </h4>
                  <p className="text-sm text-gray-400 mb-1">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                  <p className="text-xs text-gray-500 uppercase mb-6">
                    {preview.type}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setFile(null);
                      setPreview(null);
                    }}
                    className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg text-sm font-medium hover:bg-red-500/30 transition-colors"
                  >
                    Remove File
                  </button>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              {errors.file && (
                <div className="mt-3 flex items-center gap-2 text-red-400 text-sm">
                  <AlertCircle size={16} />
                  <span>{errors.file}</span>
                </div>
              )}
            </div>

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
                  disabled={isUploading}
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
                  disabled={isUploading}
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
                  disabled={isUploading}
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
                  disabled={isUploading}
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
                  disabled={isUploading}
                />
              </div>

              {errors.submit && (
                <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                  <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                  <span>{errors.submit}</span>
                </div>
              )}
            </div>
          </div>
        </form>

        <div className="modal-footer flex items-center justify-end gap-3 p-6 border-t border-white/10">
          <button
            type="button"
            onClick={handleClose}
            className="modal-button px-6 h-11 bg-white/5 border border-white/10 rounded-lg text-white font-medium hover:bg-white/10 transition-colors"
            disabled={isUploading}
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isUploading || !file}
            className="modal-button px-6 h-11 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isUploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload size={18} />
                Upload File
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadModal;