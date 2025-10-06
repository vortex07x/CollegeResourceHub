import { useEffect, useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { TrendingUp, Download, FileText, File, ArrowRight } from 'lucide-react';
import { fileService } from '../../services/fileService';
import { Link } from 'react-router-dom';

const TopDownloadedSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const [topFiles, setTopFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTopFiles();
  }, []);

  const loadTopFiles = async () => {
    try {
      setIsLoading(true);
      const response = await fileService.getTopDownloadedFiles();
      setTopFiles(response.data || []);
    } catch (error) {
      console.error('Failed to load top files:', error);
      setTopFiles([]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const getFileIcon = (type) => {
    return type === 'pdf' ? FileText : File;
  };

  const getFileIconColor = (type) => {
    return type === 'pdf' 
      ? 'from-red-500 to-red-600' 
      : 'from-blue-500 to-blue-600';
  };

  const getCategoryColor = (category) => {
    const colors = {
      assignment: 'from-purple-500 to-purple-600',
      question_paper: 'from-blue-500 to-blue-600',
      syllabus: 'from-green-500 to-green-600',
      notes: 'from-yellow-500 to-yellow-600',
      other: 'from-gray-500 to-gray-600',
    };
    return colors[category] || colors.other;
  };

  if (isLoading) {
    return (
      <section ref={ref} className="section-padding py-20 px-4 sm:px-8 bg-gradient-to-b from-[#0A0A0A] to-black">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-gray-400 mt-4">Loading top files...</p>
          </div>
        </div>
      </section>
    );
  }

  if (topFiles.length === 0) {
    return null;
  }

  return (
    <section ref={ref} className="section-padding py-20 px-4 sm:px-8 bg-gradient-to-b from-[#0A0A0A] to-black">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center section-margin mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-full mb-6">
            <TrendingUp size={20} className="text-purple-400" />
            <span className="text-purple-400 font-semibold text-sm">Trending Now</span>
          </div>
          <h2 className="section-title text-4xl sm:text-5xl font-bold text-white mb-4">
            Most Downloaded Resources
          </h2>
          <p className="section-subtitle text-gray-400 text-lg max-w-2xl mx-auto">
            Check out what is popular among students this month
          </p>
        </motion.div>

        <div className="top-downloaded-grid grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {topFiles.map((file, index) => {
            const Icon = getFileIcon(file.file_type);
            const iconColorClass = getFileIconColor(file.file_type);
            const categoryColor = getCategoryColor(file.category);
            
            return (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, y: 50 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="relative group"
              >
                <div className="top-downloaded-rank absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-black font-bold text-lg shadow-lg z-10">
                  #{index + 1}
                </div>

                <div className="top-downloaded-card h-full bg-[#0A0A0A] border border-white/10 rounded-2xl p-6 hover:border-purple-500/50 transition-all duration-300">
                  <div className={`w-16 h-16 bg-gradient-to-br ${iconColorClass} rounded-xl flex items-center justify-center mb-4`}>
                    <Icon size={32} className="text-white" />
                  </div>

                  <h3 className="top-downloaded-title text-xl font-bold text-white mb-3 line-clamp-2 leading-tight min-h-[3.5rem]">
                    {file.title}
                  </h3>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Type</span>
                      <span className="text-gray-300 font-medium">{file.file_type.toUpperCase()}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Size</span>
                      <span className="text-gray-300 font-medium">{formatFileSize(file.file_size)}</span>
                    </div>
                    {file.subject && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Subject</span>
                        <span className="text-gray-300 font-medium truncate ml-2">{file.subject}</span>
                      </div>
                    )}
                  </div>

                  <div className={`inline-flex items-center px-3 py-1 bg-gradient-to-r ${categoryColor} rounded-full text-white text-xs font-semibold mb-4`}>
                    {file.category.replace('_', ' ').toUpperCase()}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-white/5 mb-4">
                    <div className="flex items-center gap-2">
                      <Download size={18} className="text-purple-400" />
                      <span className="text-2xl font-bold text-white">{file.download_count}</span>
                    </div>
                    <span className="text-sm text-gray-500">downloads</span>
                  </div>

                  <div className="pt-4 border-t border-white/5">
                    <p className="text-xs text-gray-500 mb-1">Uploaded by</p>
                    <p className="text-sm text-gray-400 font-medium truncate">{file.uploaded_by}</p>
                  </div>

                  <div className={`absolute inset-0 bg-gradient-to-br ${categoryColor} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity duration-300`} />
                </div>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-center"
        >
          <Link
            to="/browse"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-full font-semibold text-base shadow-[0_8px_32px_rgba(139,92,246,0.3)] hover:shadow-[0_12px_48px_rgba(139,92,246,0.4)] hover:scale-105 transition-all duration-300"
          >
            Browse All Files
            <ArrowRight size={20} />
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default TopDownloadedSection;