import React, { useState } from "react";
import { RetroWindow } from "../../components/RetroWindow";
import { PixelArtStudio } from "../../components/PixelArtStudio";
import { LedMatrixPreview } from "../../components/LedMatrixPreview";
import {
  DESIGNER_MEMBERS,
  useCommissionStore,
} from "../../stores/CommissionStore";

export const DesignerWorkspacePage: React.FC = () => {
  const { commissions, submitDesignerDraft } = useCommissionStore();
  const [activeDesignerId, setActiveDesignerId] = useState<string>("ALL");

  // Only tickets that have been assigned to a Designer (BR-FL3-01)
  const assignedCommissions = commissions.filter(
    (c) =>
      Boolean(c.assignedDesignerId) &&
      (activeDesignerId === "ALL" || c.assignedDesignerId === activeDesignerId)
  );

  const [selectedId, setSelectedId] = useState<string>(
    assignedCommissions[0]?.id || ""
  );

  const activeCom =
    assignedCommissions.find((c) => c.id === selectedId) ||
    assignedCommissions[0];

  const latestSubmission =
    activeCom?.submissions[activeCom.submissions.length - 1];

  return (
    <RetroWindow className="h-full min-h-[calc(100vh-2rem)]">
      <div className="space-y-5 font-mono text-dark">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b-2 border-dark pb-3">
          <div>
            <h1 className="text-xl font-extrabold uppercase">
              🎨 Designer Creation Studio & Ticket Queue (Steps 4–6)
            </h1>
            <p className="text-[11px] text-dark/70">
              72h First-Draft SLA (BR-FL3-05) • Customer Chat Isolated (BR-FL3-03) • Embedded Pixel Studio + Aseprite PNG/GIF Import (&le;150KB, &le;30FPS)
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold">Filter Designer:</span>
            <select
              value={activeDesignerId}
              onChange={(e) => setActiveDesignerId(e.target.value)}
              className="border-2 border-dark px-2 py-1 bg-white font-bold"
            >
              <option value="ALL">All Assigned Designers ({assignedCommissions.length})</option>
              {DESIGNER_MEMBERS.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {assignedCommissions.length === 0 ? (
          <div className="bg-white border-2 border-dark p-8 text-center text-xs text-dark/60">
            No paid commissions assigned to this Designer yet. Per <strong>BR-FL3-01</strong>, a commission appears here only after Customer pays 100% into Escrow and Staff assigns a Designer.
          </div>
        ) : (
          <>
            {/* Ticket Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {assignedCommissions.map((com) => {
                const isSelected = com.id === activeCom?.id;
                return (
                  <button
                    key={com.id}
                    type="button"
                    onClick={() => setSelectedId(com.id)}
                    className={`text-left border-2 border-dark p-3 transition-all cursor-pointer ${
                      isSelected
                        ? "bg-mint shadow-[4px_4px_0px_0px_#23261F]"
                        : "bg-white hover:bg-sage/20"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-bold">
                      <span>{com.requestCode}</span>
                      <span className="bg-cream border border-dark px-1.5">
                        {com.targetMatrixSize} • {com.animationType}
                      </span>
                    </div>
                    <div className="font-extrabold text-xs mt-1 truncate">
                      {com.title}
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[10px]">
                      <span className="bg-dark text-cream px-1.5 py-0.5 font-bold">
                        {com.status}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 border border-dark font-bold ${
                          com.isSlaOverdue ? "bg-red-500 text-white" : "bg-cream"
                        }`}
                      >
                        {com.isSlaOverdue ? "⚠️ SLA OVERDUE" : "⏱ 72h SLA Active"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {activeCom && (
              <div className="space-y-6">
                {/* Technical Brief & Staff Instructions Box (BR-FL3-03 Isolation) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                  <div className="lg:col-span-7 bg-white border-2 border-dark p-4 shadow-[3px_3px_0px_0px_#23261F] space-y-2.5 text-xs">
                    <div className="flex items-center justify-between border-b-2 border-dark pb-2">
                      <span className="font-extrabold uppercase">
                        📋 Technical Assignment Brief ({activeCom.requestCode})
                      </span>
                      <span className="bg-dark text-mint px-2 py-0.5 text-[10px] font-bold">
                        🔒 BR-FL3-03: Customer Identity & Chat Hidden
                      </span>
                    </div>

                    <div className="font-extrabold text-sm">{activeCom.title}</div>
                    <p className="text-dark/80 leading-relaxed">
                      {activeCom.description}
                    </p>

                    <div className="bg-mint/30 border-2 border-dark p-2.5 space-y-1">
                      <div className="font-extrabold text-[11px] uppercase">
                        🛠 Staff Coordinator Instructions ({activeCom.assignedStaffName}):
                      </div>
                      <p className="text-dark">
                        {activeCom.staffInstructions ||
                          "Follow target matrix resolution and keep animation smooth."}
                      </p>
                    </div>

                    {latestSubmission?.reviewStatus === "STAFF_REJECTED" && (
                      <div className="bg-red-100 border-2 border-dark p-2.5 text-red-900 space-y-1">
                        <div className="font-extrabold">
                          ⚠️ Internal QA Rejection on v{latestSubmission.versionNumber}:
                        </div>
                        <p>{latestSubmission.staffFeedback}</p>
                      </div>
                    )}
                  </div>

                  {/* Version History Sidebar */}
                  <div className="lg:col-span-5 bg-white border-2 border-dark p-4 shadow-[3px_3px_0px_0px_#23261F] space-y-2.5 text-xs">
                    <div className="font-extrabold uppercase border-b-2 border-dark pb-2">
                      🗂 Submitted Version History ({activeCom.submissions.length})
                    </div>
                    {activeCom.submissions.length === 0 ? (
                      <div className="py-6 text-center text-dark/50">
                        No versions submitted yet. Submit v1 within 72 hours (BR-FL3-05).
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {activeCom.submissions.map((sub) => (
                          <div
                            key={sub.id}
                            className="bg-cream border border-dark p-2 flex items-center justify-between gap-2"
                          >
                            <div className="space-y-0.5">
                              <div className="font-extrabold">
                                Version v{sub.versionNumber} ({sub.sourceType}) • {sub.fps} FPS
                              </div>
                              <div className="text-[10px] text-dark/70">
                                {sub.releaseNotes}
                              </div>
                              {sub.staffFeedback && (
                                <div className="text-[10px] font-bold text-moss">
                                  Staff QA: "{sub.staffFeedback}"
                                </div>
                              )}
                            </div>
                            <span className="px-1.5 py-0.5 bg-white border border-dark text-[9px] font-bold shrink-0">
                              {sub.reviewStatus}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Step 5 & 6: Embedded Pixel Art Studio + External File Importer */}
                {activeCom.status !== "COMPLETED" ? (
                  <PixelArtStudio
                    targetMatrixSize={activeCom.targetMatrixSize}
                    nextVersionNumber={activeCom.submissions.length + 1}
                    initialFrames={latestSubmission?.pixelFrames}
                    onSubmitDraft={(payload) => {
                      submitDesignerDraft(activeCom.id, {
                        designerId: activeCom.assignedDesignerId || "des-01",
                        designerName:
                          activeCom.assignedDesignerName || "Le Hoang Tuan",
                        ...payload,
                      });
                    }}
                  />
                ) : (
                  <div className="bg-mint/30 border-2 border-dark p-6 text-center space-y-3">
                    <div className="font-extrabold text-sm">
                      ✅ Commission Completed & Approved by Customer!
                    </div>
                    {latestSubmission && (
                      <div className="max-w-xs mx-auto">
                        <LedMatrixPreview
                          pixelFrames={latestSubmission.pixelFrames}
                          externalDataUrl={latestSubmission.externalDataUrl}
                          matrixSize={latestSubmission.matrixSize}
                          fps={latestSubmission.fps}
                          compact
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </RetroWindow>
  );
};
