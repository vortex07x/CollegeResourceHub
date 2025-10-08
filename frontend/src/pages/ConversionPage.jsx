import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, File, Download, Save, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { fileService } from '../services/fileService';
import { toast } from 'react-hot-toast';

const ConversionPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const fileData = location.state?.file;

    const [conversionType, setConversionType] = useState('');
    const [isConverting, setIsConverting] = useState(false);
    const [convertedFile, setConvertedFile] = useState(null);
    const [conversionError, setConversionError] = useState(null);
    const [completedActions, setCompletedActions] = useState({
        downloaded: false,
        saved: false,
    });

    useEffect(() => {
        if (!fileData) {
            toast.error('No file selected for conversion');
            navigate('/my-files');
        }
    }, [fileData, navigate]);

    // Cleanup temp file when leaving the page
    useEffect(() => {
        return () => {
            if (convertedFile?.temp_file_path) {
                // Cleanup temp file when component unmounts
                fileService.cleanupTempFile(convertedFile.temp_file_path).catch(err => {
                    console.error('Cleanup failed:', err);
                });
            }
        };
    }, [convertedFile]);

    if (!fileData) return null;

    const handleConversionTypeSelect = (type) => {
        setConversionType(type);
        setConvertedFile(null);
        setConversionError(null);
        setCompletedActions({ downloaded: false, saved: false });
    };

    const handleConvert = async () => {
        if (!conversionType) {
            toast.error('Please select a conversion type');
            return;
        }

        try {
            setIsConverting(true);
            setConversionError(null);
            toast.loading('Converting file...', { id: 'conversion' });

            const response = await fileService.convertFile(fileData.id, conversionType);
            setConvertedFile(response.data);
            setCompletedActions({ downloaded: false, saved: false });

            toast.success('File converted successfully!', { id: 'conversion' });
        } catch (error) {
            console.error('Conversion failed:', error);
            const errorMessage = error.response?.data?.message || 'Conversion failed';
            setConversionError(errorMessage);
            toast.error(errorMessage, { id: 'conversion' });
        } finally {
            setIsConverting(false);
        }
    };

    const handleDownloadOnly = async () => {
        if (completedActions.downloaded) {
            toast.success('File already downloaded!');
            return;
        }

        try {
            toast.loading('Preparing download...', { id: 'download' });
            await fileService.downloadConvertedFile(convertedFile.temp_file_path, convertedFile.converted_file_name);

            setCompletedActions(prev => ({ ...prev, downloaded: true }));
            toast.success('Download started!', { id: 'download' });
        } catch (error) {
            console.error('Download failed:', error);
            toast.error('Failed to download file', { id: 'download' });
        }
    };

    const handleSaveAndDownload = async () => {
        try {
            toast.loading('Saving and downloading...', { id: 'save-download' });

            // 🔧 FIX: Download FIRST, then save
            // This ensures the temp file exists when we try to download it
            
            // Step 1: Download the file (if not already downloaded)
            if (!completedActions.downloaded) {
                await fileService.downloadConvertedFile(convertedFile.temp_file_path, convertedFile.converted_file_name);
                setCompletedActions(prev => ({ ...prev, downloaded: true }));
            }

            // Step 2: Save to database (if not already saved)
            if (!completedActions.saved) {
                await fileService.saveConvertedFile(fileData.id, convertedFile.temp_file_path);
                setCompletedActions(prev => ({ ...prev, saved: true }));
            }

            toast.success('File saved and downloaded!', { id: 'save-download' });

            // Step 3: Cleanup temp file
            await fileService.cleanupTempFile(convertedFile.temp_file_path);

            // Redirect after short delay
            setTimeout(() => navigate('/my-files'), 1500);
        } catch (error) {
            console.error('Save and download failed:', error);
            toast.error('Failed to save and download file', { id: 'save-download' });
        }
    };

    const handleSaveOnly = async () => {
        if (completedActions.saved) {
            toast.success('File already saved!');
            // Cleanup and redirect
            await fileService.cleanupTempFile(convertedFile.temp_file_path);
            setTimeout(() => navigate('/my-files'), 1500);
            return;
        }

        try {
            toast.loading('Saving file...', { id: 'save' });

            await fileService.saveConvertedFile(fileData.id, convertedFile.temp_file_path);
            setCompletedActions(prev => ({ ...prev, saved: true }));

            toast.success('File saved successfully!', { id: 'save' });

            // Cleanup temp file
            await fileService.cleanupTempFile(convertedFile.temp_file_path);

            // Redirect after short delay
            setTimeout(() => navigate('/my-files'), 1500);
        } catch (error) {
            console.error('Save failed:', error);
            toast.error('Failed to save file', { id: 'save' });
        }
    };

    const canConvertToPDF = fileData.file_type?.toLowerCase() === 'docx';
    const canConvertToDOCX = fileData.file_type?.toLowerCase() === 'pdf';

    return (
        <div className="min-h-screen bg-black pt-20 px-8 pb-16">
            <div className="max-w-5xl mx-auto">
                {/* Back Button */}
                <button
                    onClick={() => navigate('/my-files')}
                    className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors"
                >
                    <ArrowLeft size={20} />
                    Back to My Files
                </button>

                {/* Page Header */}
                <div className="mb-12">
                    <h1 className="text-4xl font-bold text-white mb-3">Document Conversion</h1>
                    <p className="text-gray-400">Convert your documents between PDF and DOCX formats</p>
                </div>

                {/* Source File Info */}
                <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6 mb-8">
                    <h2 className="text-xl font-semibold text-white mb-4">Source File</h2>
                    <div className="flex items-center gap-4">
                        <div className={`w-16 h-16 bg-gradient-to-br ${fileData.file_type?.toLowerCase() === 'pdf'
                                ? 'from-red-500 to-red-600'
                                : 'from-blue-500 to-blue-600'
                            } rounded-xl flex items-center justify-center`}>
                            {fileData.file_type?.toLowerCase() === 'pdf' ? (
                                <FileText size={32} className="text-white" />
                            ) : (
                                <File size={32} className="text-white" />
                            )}
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-white mb-1">{fileData.title}</h3>
                            <div className="flex items-center gap-4 text-sm text-gray-400">
                                <span className="uppercase font-medium">{fileData.file_type}</span>
                                <span>•</span>
                                <span>{fileData.size || formatFileSize(fileData.file_size)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Conversion Type Selection */}
                {!convertedFile && (
                    <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-8 mb-8">
                        <h2 className="text-xl font-semibold text-white mb-6">Select Conversion Type</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* PDF to DOCX */}
                            <button
                                onClick={() => handleConversionTypeSelect('pdf-to-docx')}
                                disabled={!canConvertToDOCX || isConverting}
                                className={`p-6 rounded-xl border-2 transition-all text-left ${!canConvertToDOCX
                                        ? 'border-white/5 bg-white/[0.02] opacity-50 cursor-not-allowed'
                                        : conversionType === 'pdf-to-docx'
                                            ? 'border-purple-500 bg-purple-500/10'
                                            : 'border-white/10 hover:border-purple-500/50 hover:bg-white/[0.02]'
                                    }`}
                            >
                                <div className="flex items-center gap-4 mb-3">
                                    <div className="w-12 h-12 bg-red-500/10 rounded-lg flex items-center justify-center">
                                        <FileText size={24} className="text-red-400" />
                                    </div>
                                    <div className="text-2xl font-bold text-white">→</div>
                                    <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                                        <File size={24} className="text-blue-400" />
                                    </div>
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-2">PDF to DOCX</h3>
                                <p className="text-sm text-gray-400">
                                    {canConvertToDOCX
                                        ? 'Convert your PDF file to an editable Word document'
                                        : 'Only PDF files can be converted to DOCX'}
                                </p>
                            </button>

                            {/* DOCX to PDF */}
                            <button
                                onClick={() => handleConversionTypeSelect('docx-to-pdf')}
                                disabled={!canConvertToPDF || isConverting}
                                className={`p-6 rounded-xl border-2 transition-all text-left ${!canConvertToPDF
                                        ? 'border-white/5 bg-white/[0.02] opacity-50 cursor-not-allowed'
                                        : conversionType === 'docx-to-pdf'
                                            ? 'border-blue-500 bg-blue-500/10'
                                            : 'border-white/10 hover:border-blue-500/50 hover:bg-white/[0.02]'
                                    }`}
                            >
                                <div className="flex items-center gap-4 mb-3">
                                    <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                                        <File size={24} className="text-blue-400" />
                                    </div>
                                    <div className="text-2xl font-bold text-white">→</div>
                                    <div className="w-12 h-12 bg-red-500/10 rounded-lg flex items-center justify-center">
                                        <FileText size={24} className="text-red-400" />
                                    </div>
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-2">DOCX to PDF</h3>
                                <p className="text-sm text-gray-400">
                                    {canConvertToPDF
                                        ? 'Convert your Word document to a portable PDF format'
                                        : 'Only DOCX files can be converted to PDF'}
                                </p>
                            </button>
                        </div>

                        {/* Convert Button */}
                        <div className="mt-8 flex justify-center">
                            <button
                                onClick={handleConvert}
                                disabled={!conversionType || isConverting}
                                className={`px-8 py-4 rounded-xl font-semibold text-white transition-all flex items-center gap-3 ${!conversionType || isConverting
                                        ? 'bg-white/5 cursor-not-allowed opacity-50'
                                        : 'bg-gradient-to-r from-purple-500 to-blue-500 hover:opacity-90'
                                    }`}
                            >
                                <RefreshCw size={20} className={isConverting ? 'animate-spin' : ''} />
                                {isConverting ? 'Converting...' : 'Start Conversion'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Conversion Error */}
                {conversionError && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 mb-8">
                        <div className="flex items-start gap-3">
                            <AlertCircle size={24} className="text-red-400 flex-shrink-0 mt-1" />
                            <div>
                                <h3 className="text-lg font-semibold text-red-400 mb-2">Conversion Failed</h3>
                                <p className="text-red-300">{conversionError}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Conversion Success */}
                {convertedFile && (
                    <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <CheckCircle size={32} className="text-green-400" />
                            <div>
                                <h2 className="text-2xl font-bold text-white">Conversion Successful!</h2>
                                <p className="text-gray-400">Your file has been converted successfully</p>
                            </div>
                        </div>

                        {/* Converted File Info */}
                        <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-6 mb-8">
                            <div className="flex items-center gap-4">
                                <div className={`w-16 h-16 bg-gradient-to-br ${convertedFile.file_type === 'pdf'
                                        ? 'from-red-500 to-red-600'
                                        : 'from-blue-500 to-blue-600'
                                    } rounded-xl flex items-center justify-center`}>
                                    {convertedFile.file_type === 'pdf' ? (
                                        <FileText size={32} className="text-white" />
                                    ) : (
                                        <File size={32} className="text-white" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-white mb-1">{convertedFile.converted_file_name}</h3>
                                    <div className="flex items-center gap-4 text-sm text-gray-400">
                                        <span className="uppercase font-medium">{convertedFile.file_type}</span>
                                        <span>•</span>
                                        <span>{formatFileSize(convertedFile.file_size)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action Status Indicators */}
                        {(completedActions.downloaded || completedActions.saved) && (
                            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-6">
                                <div className="flex items-center gap-2 text-sm text-green-400">
                                    <CheckCircle size={16} />
                                    <span>
                                        {completedActions.saved && completedActions.downloaded && 'File saved and downloaded'}
                                        {completedActions.saved && !completedActions.downloaded && 'File saved to your library'}
                                        {!completedActions.saved && completedActions.downloaded && 'File downloaded'}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <button
                                onClick={handleDownloadOnly}
                                disabled={completedActions.downloaded}
                                className={`px-6 py-4 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 ${completedActions.downloaded
                                        ? 'bg-white/5 border border-white/5 text-gray-500 cursor-not-allowed'
                                        : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
                                    }`}
                            >
                                <Download size={20} />
                                {completedActions.downloaded ? 'Downloaded' : 'Download Only'}
                            </button>
                            <button
                                onClick={handleSaveAndDownload}
                                className="px-6 py-4 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl text-white font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                            >
                                <Save size={20} />
                                Save & Download
                            </button>
                            <button
                                onClick={handleSaveOnly}
                                disabled={completedActions.saved}
                                className={`px-6 py-4 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 ${completedActions.saved
                                        ? 'bg-white/5 border border-white/5 text-gray-500 cursor-not-allowed'
                                        : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
                                    }`}
                            >
                                <Save size={20} />
                                {completedActions.saved ? 'Saved' : 'Save Only'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
};

export default ConversionPage;