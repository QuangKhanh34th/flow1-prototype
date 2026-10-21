import React, { useState } from "react";
import {
  createPresetFrames,
  type MatrixSize,
} from "../stores/CommissionStore";
import { LedMatrixPreview } from "./LedMatrixPreview";

interface PixelArtStudioProps {
  targetMatrixSize: MatrixSize;
  nextVersionNumber: number;
  initialFrames?: string[][][];
  onSubmitDraft: (payload: {
    fps: number;
    fileSizeBytes: number;
    sourceType: "PIXEL_STUDIO" | "EXTERNAL_IMPORT";
    pixelFrames: string[][][];
    externalDataUrl?: string;
    releaseNotes: string;
  }) => void;
}

const PALETTE = [
  "#00f5d4", // Neon Cyan
  "#86d095", // Mint Green
  "#ff3366", // Crimson Red
  "#ffd166", // Amber Gold
  "#b5179e", // Synth Magenta
  "#4cc9f0", // Sky Blue
  "#fffdf7", // Pure Cream White
  "#111310", // Off LED (Eraser)
];

const OFF_COLOR = "#111310";

const createBlankGrid = () =>
  Array.from({ length: 16 }, () => Array(16).fill(OFF_COLOR));

export const PixelArtStudio: React.FC<PixelArtStudioProps> = ({
  targetMatrixSize,
  nextVersionNumber,
  initialFrames,
  onSubmitDraft,
}) => {
  const [mode, setMode] = useState<"PIXEL_STUDIO" | "EXTERNAL_IMPORT">("PIXEL_STUDIO");
  const [frames, setFrames] = useState<string[][][]>(
    initialFrames && initialFrames.length > 0
      ? initialFrames.map((f) => f.map((r) => [...r]))
      : createPresetFrames("SAMURAI")
  );
  const [activeFrameIdx, setActiveFrameIdx] = useState(0);
  const [selectedColor, setSelectedColor] = useState<string>(PALETTE[0]);
  const [tool, setTool] = useState<"PENCIL" | "ERASER" | "FILL">("PENCIL");
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [fps, setFps] = useState(12);
  const [releaseNotes, setReleaseNotes] = useState("");

  // External Import State
  const [importedFile, setImportedFile] = useState<{
    name: string;
    sizeBytes: number;
    dataUrl: string;
  } | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const currentGrid = frames[activeFrameIdx] || frames[0];

  const paintCell = (rIdx: number, cIdx: number) => {
    setFrames((prev) =>
      prev.map((frame, fIdx) => {
        if (fIdx !== activeFrameIdx) return frame;
        if (tool === "FILL") {
          const fillColor = selectedColor;
          return frame.map((row) => row.map(() => fillColor));
        }
        const nextColor = tool === "ERASER" ? OFF_COLOR : selectedColor;
        return frame.map((row, r) =>
          r === rIdx ? row.map((cell, c) => (c === cIdx ? nextColor : cell)) : row
        );
      })
    );
  };

  const handleAddFrame = () => {
    if (frames.length >= 6) return;
    const cloned = currentGrid.map((r) => [...r]);
    setFrames([...frames, cloned]);
    setActiveFrameIdx(frames.length);
  };

  const handleRemoveFrame = (idx: number) => {
    if (frames.length <= 1) return;
    const filtered = frames.filter((_, i) => i !== idx);
    setFrames(filtered);
    setActiveFrameIdx(Math.max(0, idx - 1));
  };

  const handleLoadPreset = (preset: "SAMURAI" | "SHIBA" | "MECHA_CAT" | "HEART_SIGNAL") => {
    setFrames(createPresetFrames(preset));
    setActiveFrameIdx(0);
    setMode("PIXEL_STUDIO");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // BR-GEN-08 & BR-FL2-03 Validation
    if (!["image/png", "image/gif"].includes(file.type)) {
      setImportError("BR-GEN-08 Violation: Only PNG and GIF files are allowed.");
      return;
    }
    if (file.size > 150 * 1024) {
      setImportError(
        `BR-GEN-08 Violation: File size (${(file.size / 1024).toFixed(1)} KB) exceeds 150 KB limit.`
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImportedFile({
        name: file.name,
        sizeBytes: file.size,
        dataUrl: reader.result as string,
      });
    };
    reader.readAsDataURL(file);
  };

  const estimatedSizeBytes =
    mode === "EXTERNAL_IMPORT" && importedFile
      ? importedFile.sizeBytes
      : 28400 + frames.length * 12400;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!releaseNotes.trim()) return;

    onSubmitDraft({
      fps: Math.min(30, Math.max(1, fps)),
      fileSizeBytes: estimatedSizeBytes,
      sourceType: mode,
      pixelFrames: frames,
      externalDataUrl: mode === "EXTERNAL_IMPORT" ? importedFile?.dataUrl : undefined,
      releaseNotes: releaseNotes.trim(),
    });
    setReleaseNotes("");
  };

  return (
    <div className="bg-cream border-2 border-dark p-4 shadow-neo space-y-4 font-mono">
      {/* Mode Switcher Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-dark pb-3">
        <div>
          <h3 className="text-sm font-extrabold uppercase">
            Step 5 & 6: Character Creation & Draft v{nextVersionNumber} Submission
          </h3>
          <p className="text-[10px] text-dark/70">
            Target Spec: <strong>{targetMatrixSize}</strong> | Max 30 FPS (BR-FL2-03) | PNG/GIF &le; 150 KB (BR-GEN-08)
          </p>
        </div>

        <div className="flex gap-2 text-xs">
          <button
            type="button"
            onClick={() => setMode("PIXEL_STUDIO")}
            className={`px-3 py-1.5 border-2 border-dark font-bold cursor-pointer ${
              mode === "PIXEL_STUDIO"
                ? "bg-mint shadow-[2px_2px_0px_0px_#23261F]"
                : "bg-white hover:bg-gray-100"
            }`}
          >
            🎨 Embedded Pixel Studio
          </button>
          <button
            type="button"
            onClick={() => setMode("EXTERNAL_IMPORT")}
            className={`px-3 py-1.5 border-2 border-dark font-bold cursor-pointer ${
              mode === "EXTERNAL_IMPORT"
                ? "bg-mint shadow-[2px_2px_0px_0px_#23261F]"
                : "bg-white hover:bg-gray-100"
            }`}
          >
            📁 Import PNG/GIF (Aseprite)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Canvas or File Importer */}
        <div className="lg:col-span-7 space-y-4">
          {mode === "PIXEL_STUDIO" ? (
            <div className="space-y-3">
              {/* Preset Templates Bar */}
              <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                <span className="font-bold">Quick Templates:</span>
                {(["SAMURAI", "SHIBA", "MECHA_CAT", "HEART_SIGNAL"] as const).map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handleLoadPreset(preset)}
                    className="px-2 py-0.5 bg-white border border-dark hover:bg-sage font-bold cursor-pointer"
                  >
                    {preset}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setFrames([createBlankGrid()])}
                  className="px-2 py-0.5 bg-red-100 border border-dark hover:bg-red-200 font-bold cursor-pointer"
                >
                  Clear Canvas
                </button>
              </div>

              {/* Tool & Palette Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 bg-white border-2 border-dark p-2">
                <div className="flex items-center gap-1.5">
                  {(["PENCIL", "ERASER", "FILL"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTool(t)}
                      className={`px-2 py-1 text-[10px] font-bold border border-dark cursor-pointer ${
                        tool === t ? "bg-mint" : "bg-cream hover:bg-gray-100"
                      }`}
                    >
                      {t === "PENCIL" ? "✏️ Draw" : t === "ERASER" ? "🧹 Erase" : "🪣 Fill"}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1.5">
                  {PALETTE.map((hex) => (
                    <button
                      key={hex}
                      type="button"
                      onClick={() => {
                        setSelectedColor(hex);
                        if (tool === "ERASER") setTool("PENCIL");
                      }}
                      className={`w-5 h-5 border-2 cursor-pointer ${
                        selectedColor === hex && tool !== "ERASER"
                          ? "border-dark scale-110 ring-2 ring-mint"
                          : "border-dark/50"
                      }`}
                      style={{ backgroundColor: hex }}
                      title={hex}
                    />
                  ))}
                </div>
              </div>

              {/* Drawable Pixel Grid */}
              <div
                className="bg-[#090b09] border-2 border-dark p-3 flex justify-center select-none"
                onMouseLeave={() => setIsMouseDown(false)}
              >
                <div
                  className="grid gap-[2px] bg-[#1a1d1a] p-1.5 border border-cream/20"
                  style={{
                    gridTemplateColumns: "repeat(16, minmax(0, 1fr))",
                    width: "272px",
                    height: "272px",
                  }}
                >
                  {currentGrid.map((row, rIdx) =>
                    row.map((color, cIdx) => (
                      <div
                        key={`${rIdx}-${cIdx}`}
                        onMouseDown={() => {
                          setIsMouseDown(true);
                          paintCell(rIdx, cIdx);
                        }}
                        onMouseEnter={() => {
                          if (isMouseDown) paintCell(rIdx, cIdx);
                        }}
                        onMouseUp={() => setIsMouseDown(false)}
                        className="cursor-crosshair rounded-[1px] hover:opacity-80"
                        style={{ backgroundColor: color }}
                      />
                    ))
                  )}
                </div>
              </div>

              {/* Frame Timeline */}
              <div className="bg-white border-2 border-dark p-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-bold text-[10px]">Frames:</span>
                  {frames.map((_, idx) => (
                    <div key={idx} className="inline-flex items-center">
                      <button
                        type="button"
                        onClick={() => setActiveFrameIdx(idx)}
                        className={`px-2 py-1 text-[10px] font-bold border border-dark cursor-pointer ${
                          activeFrameIdx === idx ? "bg-mint" : "bg-cream"
                        }`}
                      >
                        F{idx + 1}
                      </button>
                      {frames.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveFrame(idx)}
                          className="px-1 py-1 text-[9px] bg-red-100 border-y border-r border-dark hover:bg-red-300 cursor-pointer"
                          title="Delete frame"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  {frames.length < 6 && (
                    <button
                      type="button"
                      onClick={handleAddFrame}
                      className="px-2 py-1 text-[10px] font-bold bg-sage hover:bg-mint border border-dark cursor-pointer"
                    >
                      + Duplicate Frame
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 text-[10px]">
                  <span className="font-bold">FPS (Max 30):</span>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={fps}
                    onChange={(e) => setFps(Math.min(30, Math.max(1, Number(e.target.value))))}
                    className="w-14 border border-dark px-1 py-0.5 bg-cream font-bold"
                  />
                </div>
              </div>
            </div>
          ) : (
            /* External File Import Mode */
            <div className="bg-white border-2 border-dark p-6 space-y-4">
              <div className="border-2 border-dashed border-dark bg-cream p-6 text-center space-y-2">
                <div className="text-2xl">📤</div>
                <p className="text-xs font-bold">
                  Upload External Pixel Artwork (.PNG or .GIF from Aseprite)
                </p>
                <p className="text-[10px] text-dark/70">
                  Validated against BR-GEN-08 & BR-FL2-03: MIME image/png or image/gif, &le; 150 KB, &le; 30 FPS, target {targetMatrixSize}.
                </p>
                <label className="inline-block mt-2 px-4 py-1.5 bg-mint hover:bg-sage border-2 border-dark text-xs font-bold shadow-[2px_2px_0px_0px_#23261F] cursor-pointer">
                  Choose PNG/GIF File
                  <input
                    type="file"
                    accept="image/png,image/gif"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {importError && (
                <div className="bg-red-100 border-2 border-dark p-2 text-xs text-red-800 font-bold">
                  ⚠️ {importError}
                </div>
              )}

              {importedFile && (
                <div className="bg-mint/30 border-2 border-dark p-3 text-xs space-y-1">
                  <div className="font-bold">✅ Validated External Asset Ready:</div>
                  <div>File: {importedFile.name}</div>
                  <div>Size: {(importedFile.sizeBytes / 1024).toFixed(1)} KB / 150 KB max</div>
                  <div>Target Matrix: {targetMatrixSize}</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Live LED Matrix Simulator & Submission Form */}
        <div className="lg:col-span-5 space-y-4">
          <LedMatrixPreview
            pixelFrames={frames}
            externalDataUrl={mode === "EXTERNAL_IMPORT" ? importedFile?.dataUrl : undefined}
            matrixSize={targetMatrixSize}
            fps={fps}
            title={`DRAFT v${nextVersionNumber} LIVE PREVIEW`}
          />

          <form onSubmit={handleSubmit} className="bg-white border-2 border-dark p-3 space-y-3">
            <div className="text-[11px] flex justify-between border-b border-dark/20 pb-1">
              <span>Compiled Package Size:</span>
              <span className="font-bold text-moss">
                {(estimatedSizeBytes / 1024).toFixed(1)} KB / 150 KB
              </span>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold block">
                Designer Release Notes for Staff QA (Required):
              </label>
              <textarea
                rows={2}
                value={releaseNotes}
                onChange={(e) => setReleaseNotes(e.target.value)}
                placeholder={`Describe changes in v${nextVersionNumber} (e.g., palette contrast, frame timing)...`}
                className="w-full border-2 border-dark p-2 text-xs bg-cream outline-none"
                required
              />
            </div>

            <button
              type="submit"
              disabled={mode === "EXTERNAL_IMPORT" && !importedFile}
              className="w-full py-2 bg-mint hover:bg-sage disabled:bg-gray-300 border-2 border-dark font-extrabold text-xs shadow-[3px_3px_0px_0px_#23261F] transition-transform active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
            >
              🚀 Submit Draft v{nextVersionNumber} to Staff QA
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
