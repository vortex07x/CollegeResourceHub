import { Grid3x3, Upload, Move, ChevronDown, ChevronUp, X, SlidersHorizontal, RotateCcw } from 'lucide-react';
import { useState, useMemo } from 'react';
import useFileStore from '../../store/useFileStore';

const Sidebar = ({ allFiles = [] }) => {
  const { currentMode, setMode, filters, setFilters, clearFilters } = useFileStore();
  const [isOpen, setIsOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    fileType: true,
    category: true,
    uploadDate: false,
  });

  const modes = [
    { id: 'browse', label: 'Browse', icon: Grid3x3, color: 'purple' },
    { id: 'upload', label: 'Upload', icon: Upload, color: 'blue' },
    { id: 'organize', label: 'Organize', icon: Move, color: 'green' },
  ];

  const fileCounts = useMemo(() => {
    const counts = {
      fileTypes: {
        all: allFiles.length,
        pdf: allFiles.filter(f => f.type === 'pdf').length,
        docx: allFiles.filter(f => f.type === 'docx').length,
      },
      categories: {
        all: allFiles.length,
        assignment: allFiles.filter(f => f.rawCategory === 'assignment').length,
        question_paper: allFiles.filter(f => f.rawCategory === 'question_paper').length,
        syllabus: allFiles.filter(f => f.rawCategory === 'syllabus').length,
        notes: allFiles.filter(f => f.rawCategory === 'notes').length,
        other: allFiles.filter(f => f.rawCategory === 'other').length,
      }
    };
    return counts;
  }, [allFiles]);

  const fileTypes = [
    { value: 'all', label: 'All Files', count: fileCounts.fileTypes.all },
    { value: 'pdf', label: 'PDF', count: fileCounts.fileTypes.pdf },
    { value: 'docx', label: 'DOCX', count: fileCounts.fileTypes.docx },
  ];

  const categories = [
    { value: 'all', label: 'All', count: fileCounts.categories.all },
    { value: 'assignment', label: 'Assignments', count: fileCounts.categories.assignment },
    { value: 'question-paper', label: 'Question Papers', count: fileCounts.categories.question_paper },
    { value: 'syllabus', label: 'Syllabus', count: fileCounts.categories.syllabus },
    { value: 'notes', label: 'Notes', count: fileCounts.categories.notes },
    { value: 'other', label: 'Other', count: fileCounts.categories.other },
  ];

  const dateRanges = [
    { value: 'all', label: 'All Time' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'year', label: 'This Year' },
  ];

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleModeChange = (modeId) => {
    setMode(modeId);
    setTimeout(() => setIsOpen(false), 200);
  };

  const hasActiveFilters = filters.fileType !== 'all' || filters.category !== 'all' || filters.dateRange !== 'all' || filters.searchQuery;

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="sidebar-toggle-button fixed top-36 left-8 z-[96] w-12 h-12 bg-gradient-to-br from-purple-500 via-purple-600 to-blue-600 rounded-xl flex items-center justify-center text-white shadow-xl shadow-purple-500/30 hover:shadow-2xl hover:shadow-purple-500/40 hover:scale-110 transition-all duration-300"
        title="Open Filters"
      >
        <SlidersHorizontal size={20} />
        {hasActiveFilters && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-black"></span>
        )}
      </button>
    );
  }

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[97] animate-fadeIn"
        onClick={() => setIsOpen(false)}
      />

      <div className="sidebar-container fixed top-36 left-8 bottom-8 w-80 bg-gradient-to-br from-[#0A0A0A] to-[#121212] backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-[98] flex flex-col overflow-hidden animate-slideInLeft">
        <div className="sidebar-header flex items-center justify-between p-5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
              <SlidersHorizontal size={16} className="text-white" />
            </div>
            <h2 className="sidebar-title text-lg font-bold text-white">Filters</h2>
          </div>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="w-8 h-8 flex items-center justify-center text-purple-400 hover:text-purple-300 hover:bg-white/10 rounded-lg transition-all"
                title="Clear all filters"
              >
                <RotateCcw size={16} />
              </button>
            )}
            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="sidebar-content flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
          <div>
            <h3 className="sidebar-section-title text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Mode
            </h3>
            <div className="space-y-2">
              {modes.map((modeItem) => {
                const Icon = modeItem.icon;
                const isActive = currentMode === modeItem.id;
                
                return (
                  <button
                    key={modeItem.id}
                    onClick={() => handleModeChange(modeItem.id)}
                    className={`sidebar-mode-button w-full p-3 rounded-xl flex items-center gap-3 transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg shadow-purple-500/25'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <div className={`sidebar-mode-icon w-8 h-8 rounded-lg flex items-center justify-center ${
                      isActive ? 'bg-white/20' : 'bg-white/10'
                    }`}>
                      <Icon size={16} />
                    </div>
                    <span className="sidebar-mode-text text-sm font-semibold">{modeItem.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="h-px bg-white/10" />

          <div>
            <button
              onClick={() => toggleSection('fileType')}
              className="w-full flex items-center justify-between text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 hover:text-gray-300 transition-colors"
            >
              <span>File Type</span>
              {expandedSections.fileType ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            {expandedSections.fileType && (
              <div className="space-y-1.5 animate-fadeIn">
                {fileTypes.map((type) => {
                  const isActive = filters.fileType === type.value;
                  return (
                    <button
                      key={type.value}
                      onClick={() => setFilters({ ...filters, fileType: type.value })}
                      className={`sidebar-filter-button w-full px-3 py-2.5 rounded-lg text-left text-sm transition-all flex items-center justify-between ${
                        isActive
                          ? 'bg-purple-500/15 text-purple-400 font-medium'
                          : 'text-gray-400 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <span>{type.label}</span>
                      <span className={`sidebar-filter-count text-xs px-2 py-0.5 rounded-full ${
                        isActive ? 'bg-purple-500/20 text-purple-300' : 'bg-white/5 text-gray-500'
                      }`}>
                        {type.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <button
              onClick={() => toggleSection('category')}
              className="w-full flex items-center justify-between text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 hover:text-gray-300 transition-colors"
            >
              <span>Category</span>
              {expandedSections.category ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            {expandedSections.category && (
              <div className="space-y-1.5 animate-fadeIn">
                {categories.map((category) => {
                  const isActive = filters.category === category.value;
                  return (
                    <button
                      key={category.value}
                      onClick={() => setFilters({ ...filters, category: category.value })}
                      className={`sidebar-filter-button w-full px-3 py-2.5 rounded-lg text-left text-sm transition-all flex items-center justify-between ${
                        isActive
                          ? 'bg-purple-500/15 text-purple-400 font-medium'
                          : 'text-gray-400 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <span>{category.label}</span>
                      <span className={`sidebar-filter-count text-xs px-2 py-0.5 rounded-full ${
                        isActive ? 'bg-purple-500/20 text-purple-300' : 'bg-white/5 text-gray-500'
                      }`}>
                        {category.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <button
              onClick={() => toggleSection('uploadDate')}
              className="w-full flex items-center justify-between text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 hover:text-gray-300 transition-colors"
            >
              <span>Upload Date</span>
              {expandedSections.uploadDate ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            {expandedSections.uploadDate && (
              <div className="space-y-1.5 animate-fadeIn">
                {dateRanges.map((range) => {
                  const isActive = filters.dateRange === range.value;
                  return (
                    <button
                      key={range.value}
                      onClick={() => setFilters({ ...filters, dateRange: range.value })}
                      className={`sidebar-filter-button w-full px-3 py-2.5 rounded-lg text-left text-sm transition-all ${
                        isActive
                          ? 'bg-purple-500/15 text-purple-400 font-medium'
                          : 'text-gray-400 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      {range.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;