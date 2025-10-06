const MiniMap = ({ files, viewportPan, viewportZoom, canvasSize = { width: 2000, height: 1500 } }) => {
  const minimapWidth = 208;
  const minimapHeight = 128;
  
  const scaleX = minimapWidth / canvasSize.width;
  const scaleY = minimapHeight / canvasSize.height;
  const scale = Math.min(scaleX, scaleY);
  
  const viewportWidth = (typeof window !== 'undefined' ? window.innerWidth : 1920) / viewportZoom;
  const viewportHeight = (typeof window !== 'undefined' ? window.innerHeight : 1080) / viewportZoom;
  
  const minimapViewportWidth = viewportWidth * scale;
  const minimapViewportHeight = viewportHeight * scale;
  
  const minimapViewportX = -viewportPan.x * scale;
  const minimapViewportY = -viewportPan.y * scale;

  return (
    <div className="minimap-container fixed bottom-8 right-8 w-52 bg-[#0A0A0A]/95 backdrop-blur-lg border border-white/10 rounded-xl p-3 z-[98] shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
      <div className="minimap-title text-xs font-medium text-gray-500 mb-2 px-1 flex items-center justify-between">
        <span>Map Overview</span>
        <span className="text-[10px] text-gray-600">{files.length} files</span>
      </div>
      
      <div className="minimap-canvas relative w-full h-32 bg-black/40 rounded-lg overflow-hidden border border-white/5">
        <div
          className="absolute border-2 border-purple-500 bg-purple-500/10 rounded pointer-events-none transition-all duration-100 ease-out"
          style={{
            left: `${Math.max(0, Math.min(minimapWidth - minimapViewportWidth, minimapViewportX))}px`,
            top: `${Math.max(0, Math.min(minimapHeight - minimapViewportHeight, minimapViewportY))}px`,
            width: `${Math.min(minimapWidth, minimapViewportWidth)}px`,
            height: `${Math.min(minimapHeight, minimapViewportHeight)}px`,
          }}
        >
          <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-purple-400 rounded-full -translate-x-1/2 -translate-y-1/2" />
        </div>

        {files.map((file) => {
          const x = file.position.x * scale;
          const y = file.position.y * scale;
          
          if (x < -10 || x > minimapWidth + 10 || y < -10 || y > minimapHeight + 10) {
            return null;
          }
          
          const isInViewport = (
            file.position.x >= -viewportPan.x - 100 &&
            file.position.x <= -viewportPan.x + viewportWidth + 100 &&
            file.position.y >= -viewportPan.y - 100 &&
            file.position.y <= -viewportPan.y + viewportHeight + 100
          );
          
          return (
            <div
              key={file.id}
              className={`absolute rounded-full transition-all duration-150 ${
                isInViewport 
                  ? 'minimap-file-dot-active w-2 h-2 bg-blue-400 shadow-[0_0_6px_rgba(59,130,246,0.8)]' 
                  : 'minimap-file-dot w-1.5 h-1.5 bg-blue-500/60'
              }`}
              style={{
                left: `${x}px`,
                top: `${y}px`,
                transform: 'translate(-50%, -50%)',
              }}
              title={file.name}
            />
          );
        })}

        <div 
          className="absolute inset-0 pointer-events-none opacity-10"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />
        
        <div 
          className="absolute border border-white/10 pointer-events-none"
          style={{
            width: `${canvasSize.width * scale}px`,
            height: `${canvasSize.height * scale}px`,
            left: '0',
            top: '0',
          }}
        />
      </div>
    </div>
  );
};

export default MiniMap;