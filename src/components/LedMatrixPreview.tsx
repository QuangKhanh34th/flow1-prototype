import React, { useEffect, useState } from "react";
import type { MatrixSize } from "../stores/CommissionStore";

interface LedMatrixPreviewProps {
  pixelFrames?: string[][][];
  externalDataUrl?: string;
  matrixSize: MatrixSize;
  fps?: number;
  title?: string;
  compact?: boolean;
}

export const LedMatrixPreview: React.FC<LedMatrixPreviewProps> = ({
  pixelFrames = [],
  externalDataUrl,
  matrixSize,
  fps = 12,
  title,
  compact = false,
}) => {
  const [frameIndex, setFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [brightness, setBrightness] = useState(100);

  useEffect(() => {
    setFrameIndex(0);
  }, [pixelFrames]);

  useEffect(() => {
    if (!isPlaying || pixelFrames.length <= 1) return;
    const safeFps = Math.max(1, Math.min(30, fps));
    const interval = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % pixelFrames.length);
    }, Math.round(1000 / safeFps));
    return () => clearInterval(interval);
  }, [isPlaying, pixelFrames.length, fps]);

  const currentGrid = pixelFrames[frameIndex] || pixelFrames[0];
  const isWide = matrixSize === "32x64";

  return (
    <div className="bg-dark text-cream border-2 border-dark p-3 rounded-sm shadow-[4px_4px_0px_0px_#23261F] font-mono">
      {/* Top Bar */}
      <div className="flex items-center justify-between text-[10px] border-b border-cream/20 pb-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-mint animate-pulse" />
          <span className="font-bold uppercase tracking-wider">
            {title || "LED WINDSHIELD MATRIX SIMULATOR"}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="bg-moss text-cream px-1.5 py-0.5 font-bold border border-cream/30">
            {matrixSize}
          </span>
          <span className="bg-cream/10 px-1.5 py-0.5">
            {Math.min(30, fps)} FPS
          </span>
        </div>
      </div>

      {/* LED Matrix Housing */}
      <div className="flex flex-col items-center justify-center bg-[#0a0c0a] border-2 border-cream/20 p-3 relative overflow-hidden">
        {externalDataUrl ? (
          <div
            className={`relative bg-[#111310] p-1 border border-cream/20 ${
              compact ? "w-32 h-32" : isWide ? "w-64 h-36" : "w-48 h-48"
            } flex items-center justify-center`}
            style={{ filter: `brightness(${brightness}%)` }}
          >
            <img
              src={externalDataUrl}
              alt="Imported LED Asset"
              className="w-full h-full object-contain"
              style={{ imageRendering: "pixelated" }}
            />
            {/* Pixel mesh overlay */}
            <div
              className="absolute inset-0 pointer-events-none opacity-35"
              style={{
                backgroundImage:
                  "linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)",
                backgroundSize: "6px 6px",
              }}
            />
          </div>
        ) : currentGrid ? (
          <div
            className="grid gap-[2px] bg-[#070807] p-2 border border-cream/15"
            style={{
              gridTemplateColumns: `repeat(${currentGrid[0]?.length || 16}, minmax(0, 1fr))`,
              width: compact ? "140px" : isWide ? "256px" : "196px",
              height: compact ? "140px" : "196px",
              filter: `brightness(${brightness}%)`,
            }}
          >
            {currentGrid.map((row, rIdx) =>
              row.map((color, cIdx) => {
                const isLit = color !== "#111310" && color !== "#000000";
                return (
                  <div
                    key={`${rIdx}-${cIdx}`}
                    className="rounded-[1px] transition-colors duration-75"
                    style={{
                      backgroundColor: color,
                      boxShadow: isLit ? `0 0 4px ${color}` : "none",
                    }}
                  />
                );
              })
            )}
          </div>
        ) : (
          <div className="h-36 flex items-center justify-center text-xs text-cream/40">
            [No Pixel Data]
          </div>
        )}
      </div>

      {/* Controls Bar */}
      {!compact && (
        <div className="mt-3 pt-2 border-t border-cream/20 flex flex-wrap items-center justify-between gap-2 text-[10px]">
          <div className="flex items-center gap-2">
            {pixelFrames.length > 1 && (
              <button
                type="button"
                onClick={() => setIsPlaying(!isPlaying)}
                className="px-2 py-0.5 bg-mint text-dark font-bold border border-dark cursor-pointer hover:bg-sage"
              >
                {isPlaying ? "⏸ Pause" : "▶ Play"}
              </button>
            )}
            <span>
              Frame: {frameIndex + 1}/{Math.max(1, pixelFrames.length)}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span>LDR Dimmer:</span>
            <input
              type="range"
              min={40}
              max={120}
              value={brightness}
              onChange={(e) => setBrightness(Number(e.target.value))}
              className="w-16 accent-mint cursor-pointer"
            />
            <span>{brightness}%</span>
          </div>
        </div>
      )}
    </div>
  );
};
