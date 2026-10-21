import React, { useState } from "react";
import { RetroWindow } from "../../components/RetroWindow";
import { LedMatrixPreview } from "../../components/LedMatrixPreview";
import {
  DESIGNER_MEMBERS,
  useCommissionStore,
  type AnimationType,
  type MatrixSize,
  type ServiceTier,
} from "../../stores/CommissionStore";

export const DesignRequestsPage: React.FC = () => {
  const {
    commissions,
    updateBrief,
    sendChatMessage,
    issueQuotation,
    rejectOrRefundByStaff,
    assignDesigner,
    toggleSimulateSlaOverdue,
    reviewSubmissionByStaff,
    relayCustomerRevisionToDesigner,
    approveDeliverableVersion,
  } = useCommissionStore();

  const [filter, setFilter] = useState<
    "ALL" | "NEEDS_QUOTE" | "PAID_ASSIGN" | "INTERNAL_QA" | "REVISION_RELAY" | "OVERDUE"
  >("ALL");
  const [selectedId, setSelectedId] = useState<string>(commissions[0]?.id || "");

  // Quotation Builder State (Step 2)
  const [quotePrice, setQuotePrice] = useState<number>(300000);
  const [serviceTier, setServiceTier] = useState<ServiceTier>("BASIC");
  const [customMaxRevs, setCustomMaxRevs] = useState<number>(2);
  const [scopeSummary, setScopeSummary] = useState<string>(
    "Custom pixel character animation matching target LED matrix. Valid for 24 hours (BR-FL3-04)."
  );

  // Brief editing (Step 1-2)
  const [isEditingBrief, setIsEditingBrief] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editMatrix, setEditMatrix] = useState<MatrixSize>("64x64");
  const [editAnim, setEditAnim] = useState<AnimationType>("ANIMATED");

  // Designer Assignment State (Step 4)
  const [selectedDesignerId, setSelectedDesignerId] = useState<string>(
    DESIGNER_MEMBERS[0].id
  );
  const [staffInstructions, setStaffInstructions] = useState<string>(
    "Ensure high contrast palette and <30 FPS for ESP32 BLE sync."
  );

  // QA Review State (Step 7)
  const [inspectedSubId, setInspectedSubId] = useState<string>("");
  const [qaFeedback, setQaFeedback] = useState<string>("");

  // Relay Revision State (Step 8)
  const [relayNotes, setRelayNotes] = useState<string>("");

  // Reject / Refund State
  const [rejectReason, setRejectReason] = useState<string>("");
  const [showRejectBox, setShowRejectBox] = useState(false);

  // Chat input
  const [chatInput, setChatInput] = useState("");

  const filteredCommissions = commissions.filter((c) => {
    if (filter === "NEEDS_QUOTE")
      return c.status === "PENDING_REVIEW" || c.status === "PRICE_EXPIRED";
    if (filter === "PAID_ASSIGN") return c.status === "PAID_ESCROW";
    if (filter === "INTERNAL_QA") return c.status === "INTERNAL_REVIEW";
    if (filter === "REVISION_RELAY") return c.status === "CUSTOMER_REVISION_REQUESTED";
    if (filter === "OVERDUE") return c.isSlaOverdue;
    return true;
  });

  const activeCom =
    commissions.find((c) => c.id === selectedId) ||
    filteredCommissions[0] ||
    commissions[0];

  const inspectedSubmission =
    activeCom?.submissions.find((s) => s.id === inspectedSubId) ||
    activeCom?.submissions[activeCom.submissions.length - 1];

  // Calculate active workload per Designer
  const getDesignerWorkload = (designerId: string) =>
    commissions.filter(
      (c) =>
        c.assignedDesignerId === designerId &&
        ["IN_PROGRESS", "INTERNAL_REVISION_REQUIRED", "INTERNAL_REVIEW"].includes(c.status)
    ).length;

  const resolvedMaxRevs =
    serviceTier === "BASIC" ? 1 : serviceTier === "ADVANCED" ? 3 : customMaxRevs;

  const handleIssueQuote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCom || quotePrice <= 0) return;
    issueQuotation(activeCom.id, {
      quotePrice,
      serviceTier,
      maxRevisions: resolvedMaxRevs,
      scopeSummary,
    });
  };

  const handleAssignDesigner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCom) return;
    assignDesigner(activeCom.id, selectedDesignerId, staffInstructions);
  };

  const handleSendStaffChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCom || !chatInput.trim()) return;
    sendChatMessage(
      activeCom.id,
      {
        id: activeCom.assignedStaffId,
        name: `${activeCom.assignedStaffName} (Staff)`,
        role: "STAFF",
      },
      chatInput
    );
    setChatInput("");
  };

  return (
    <RetroWindow className="h-full min-h-[calc(100vh-2rem)]">
      <div className="space-y-5 font-mono text-dark">
        {/* Top Header & Filter Tabs */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b-2 border-dark pb-3">
          <div>
            <h1 className="text-xl font-extrabold uppercase">
              🛠 Staff Custom Design Requests (Flow 3 Coordinator)
            </h1>
            <p className="text-[11px] text-dark/70">
              Round-Robin Intake (BR-FL3-07) • 24h Quote TTL (BR-FL3-04) • 72h Designer SLA (BR-FL3-05) • Internal QA Gate (BR-FL3-03)
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5 text-[11px]">
            {(
              [
                { id: "ALL", label: `All (${commissions.length})` },
                { id: "NEEDS_QUOTE", label: "Step 1–2: Needs Quote" },
                { id: "PAID_ASSIGN", label: "Step 4: Paid / Assign" },
                { id: "INTERNAL_QA", label: "Step 7: Internal QA" },
                { id: "REVISION_RELAY", label: "Step 8: Relay Revision" },
                { id: "OVERDUE", label: "⚠️ SLA Overdue (>72h)" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={`px-2.5 py-1 border-2 border-dark font-bold cursor-pointer ${
                  filter === tab.id
                    ? "bg-mint shadow-[2px_2px_0px_0px_#23261F]"
                    : "bg-white hover:bg-gray-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Horizontal Ticket Queue Selector */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {filteredCommissions.map((com) => {
            const isSelected = com.id === activeCom?.id;
            return (
              <button
                key={com.id}
                type="button"
                onClick={() => {
                  setSelectedId(com.id);
                  setInspectedSubId("");
                  setIsEditingBrief(false);
                }}
                className={`text-left border-2 border-dark p-3 transition-all cursor-pointer ${
                  isSelected
                    ? "bg-mint shadow-[4px_4px_0px_0px_#23261F]"
                    : "bg-white hover:bg-sage/20"
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-bold">
                  <span>
                    {com.requestCode} • Staff: {com.assignedStaffName.split(" ").slice(-1)[0]}
                  </span>
                  <span className="bg-cream border border-dark px-1">
                    {com.targetMatrixSize}
                  </span>
                </div>
                <div className="font-extrabold text-xs mt-1 truncate">{com.title}</div>
                <div className="mt-2 flex items-center justify-between text-[10px]">
                  <span className="bg-dark text-cream px-1.5 py-0.5 font-bold">
                    {com.status}
                  </span>
                  {com.isSlaOverdue && (
                    <span className="bg-red-600 text-white px-1.5 py-0.5 font-extrabold animate-pulse">
                      ⚠️ &gt;72H SLA OVERDUE
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* 3-Panel Operations Workspace */}
        {activeCom && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start pt-2">
            {/* PANEL 1 (4 cols): Brief, Step 2 Quotation Builder & 3-Column Financials */}
            <div className="lg:col-span-4 space-y-4">
              {/* Customer Brief Card */}
              <div className="bg-white border-2 border-dark p-4 shadow-[3px_3px_0px_0px_#23261F] space-y-3 text-xs">
                <div className="flex items-center justify-between border-b-2 border-dark pb-2">
                  <span className="font-extrabold uppercase">
                    1. Customer Brief ({activeCom.requestCode})
                  </span>
                  {(activeCom.status === "PENDING_REVIEW" ||
                    activeCom.status === "PRICE_EXPIRED") && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditTitle(activeCom.title);
                        setEditDesc(activeCom.description);
                        setEditMatrix(activeCom.targetMatrixSize);
                        setEditAnim(activeCom.animationType);
                        setIsEditingBrief(!isEditingBrief);
                      }}
                      className="px-2 py-0.5 bg-mint border border-dark text-[10px] font-bold cursor-pointer"
                    >
                      ✏️ Edit Brief
                    </button>
                  )}
                </div>

                {isEditingBrief ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      updateBrief(activeCom.id, "STAFF", {
                        title: editTitle,
                        description: editDesc,
                        targetMatrixSize: editMatrix,
                        animationType: editAnim,
                      });
                      setIsEditingBrief(false);
                    }}
                    className="space-y-2"
                  >
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full border border-dark p-1.5 bg-cream"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={editMatrix}
                        onChange={(e) => setEditMatrix(e.target.value as MatrixSize)}
                        className="border border-dark p-1 bg-cream"
                      >
                        <option value="32x32">32x32</option>
                        <option value="32x64">32x64</option>
                        <option value="64x64">64x64</option>
                      </select>
                      <select
                        value={editAnim}
                        onChange={(e) => setEditAnim(e.target.value as AnimationType)}
                        className="border border-dark p-1 bg-cream"
                      >
                        <option value="ANIMATED">ANIMATED</option>
                        <option value="STATIC">STATIC</option>
                      </select>
                    </div>
                    <textarea
                      rows={2}
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      className="w-full border border-dark p-1.5 bg-cream"
                    />
                    <button
                      type="submit"
                      className="w-full py-1 bg-mint border border-dark font-bold cursor-pointer"
                    >
                      Save Brief Update
                    </button>
                  </form>
                ) : (
                  <div className="space-y-1.5">
                    <div className="font-extrabold">{activeCom.title}</div>
                    <p className="text-dark/80">{activeCom.description}</p>
                    <div className="text-[11px] pt-1 border-t border-dark/20 flex justify-between">
                      <span>Customer: <strong>{activeCom.customerName}</strong></span>
                      <span>Spec: <strong>{activeCom.targetMatrixSize} ({activeCom.animationType})</strong></span>
                    </div>
                  </div>
                )}
              </div>

              {/* Step 2: Quotation Builder (BR-FL3-02, BR-FL3-04) */}
              <div className="bg-white border-2 border-dark p-4 shadow-[3px_3px_0px_0px_#23261F] space-y-3 text-xs">
                <div className="border-b-2 border-dark pb-2 flex items-center justify-between">
                  <span className="font-extrabold uppercase">
                    2. Pricing & Quotation Card (Step 2)
                  </span>
                  <span className="text-[10px] bg-sage px-1.5 py-0.5 border border-dark font-bold">
                    24h TTL
                  </span>
                </div>

                {/* 3-Column Ledger Display */}
                <div className="grid grid-cols-3 gap-1.5 text-center bg-cream border border-dark p-2">
                  <div>
                    <div className="text-[9px] text-dark/60">Col 1: Initial</div>
                    <div className="font-extrabold">
                      {activeCom.initialPrice.toLocaleString()}₫
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] text-dark/60">Col 2: Extra (+10%)</div>
                    <div className="font-extrabold text-orange-700">
                      +{activeCom.extraRevisionFee.toLocaleString()}₫
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] font-bold">Col 3: Total</div>
                    <div className="font-extrabold text-moss">
                      {activeCom.totalPrice.toLocaleString()}₫
                    </div>
                  </div>
                </div>

                {["PENDING_REVIEW", "QUOTED", "PRICE_EXPIRED"].includes(
                  activeCom.status
                ) ? (
                  <form onSubmit={handleIssueQuote} className="space-y-2.5">
                    <div>
                      <label className="font-bold block mb-1">
                        Initial Quote Price (VND) *
                      </label>
                      <input
                        type="number"
                        step={10000}
                        value={quotePrice}
                        onChange={(e) => setQuotePrice(Number(e.target.value))}
                        className="w-full border-2 border-dark p-1.5 bg-cream font-bold"
                        required
                      />
                    </div>

                    <div>
                      <label className="font-bold block mb-1">
                        Revision Tier Package (BR-FL3-02)
                      </label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {(
                          [
                            { id: "BASIC", label: "Basic (1 Rev)" },
                            { id: "ADVANCED", label: "Adv (3 Revs)" },
                            { id: "CUSTOM", label: "Custom" },
                          ] as const
                        ).map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => setServiceTier(t.id)}
                            className={`py-1 border border-dark text-[10px] font-bold cursor-pointer ${
                              serviceTier === t.id ? "bg-mint" : "bg-cream"
                            }`}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>
                      {serviceTier === "CUSTOM" && (
                        <input
                          type="number"
                          min={0}
                          max={10}
                          value={customMaxRevs}
                          onChange={(e) => setCustomMaxRevs(Number(e.target.value))}
                          className="mt-1.5 w-full border border-dark p-1 bg-cream"
                          placeholder="Custom revision count"
                        />
                      )}
                    </div>

                    <div>
                      <label className="font-bold block mb-1">Quotation Scope Note</label>
                      <textarea
                        rows={2}
                        value={scopeSummary}
                        onChange={(e) => setScopeSummary(e.target.value)}
                        className="w-full border border-dark p-1.5 bg-cream text-[11px]"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2 bg-mint hover:bg-sage border-2 border-dark font-extrabold shadow-[2px_2px_0px_0px_#23261F] cursor-pointer"
                    >
                      📋 Send Interactive Quotation Card to Chat
                    </button>
                  </form>
                ) : (
                  <div className="bg-mint/20 border border-dark p-2 text-[11px]">
                    ✅ Quote locked in Escrow ({activeCom.serviceTier} Tier —{" "}
                    {activeCom.revisionsUsed}/{activeCom.maxRevisions} revisions used).
                  </div>
                )}

                {/* Reject or Cancel/Refund Escrow */}
                {!["COMPLETED", "CANCELLED", "REJECTED", "REFUNDED"].includes(
                  activeCom.status
                ) && (
                  <div className="pt-2 border-t border-dark/20">
                    {!showRejectBox ? (
                      <button
                        type="button"
                        onClick={() => setShowRejectBox(true)}
                        className="w-full py-1 bg-red-100 hover:bg-red-200 border border-dark text-red-900 font-bold text-[11px] cursor-pointer"
                      >
                        🚫 Reject Request / Cancel & Refund Escrow
                      </button>
                    ) : (
                      <div className="space-y-1.5 bg-red-50 border border-dark p-2">
                        <input
                          type="text"
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          placeholder="Mandatory rejection / refund reason..."
                          className="w-full border border-dark p-1 bg-white text-[11px]"
                        />
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              if (!rejectReason.trim()) return;
                              rejectOrRefundByStaff(activeCom.id, rejectReason.trim());
                              setShowRejectBox(false);
                              setRejectReason("");
                            }}
                            className="flex-1 py-1 bg-red-300 border border-dark font-bold text-[10px] cursor-pointer"
                          >
                            Confirm
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowRejectBox(false)}
                            className="px-2 py-1 bg-gray-200 border border-dark text-[10px] cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* PANEL 2 (4 cols): Step 4 Designer Assignment, Step 7 Internal QA, Step 8 Relay */}
            <div className="lg:col-span-4 space-y-4">
              {/* Step 4: Designer Assignment & 72h SLA Controls (BR-FL3-01, BR-FL3-05) */}
              <div className="bg-white border-2 border-dark p-4 shadow-[3px_3px_0px_0px_#23261F] space-y-3 text-xs">
                <div className="flex items-center justify-between border-b-2 border-dark pb-2">
                  <span className="font-extrabold uppercase">
                    3. Designer Assignment & 72h SLA (Step 4)
                  </span>
                  {activeCom.assignedDesignerName && (
                    <span className="text-[10px] bg-mint px-1.5 py-0.5 border border-dark font-bold">
                      {activeCom.assignedDesignerName.split(" ").slice(-1)[0]}
                    </span>
                  )}
                </div>

                {["PENDING_REVIEW", "QUOTED", "PRICE_EXPIRED"].includes(
                  activeCom.status
                ) ? (
                  <div className="bg-gray-100 border border-dark/40 p-3 text-[11px] text-dark/70">
                    🔒 <strong>BR-FL3-01 Enforcement:</strong> Designer assignment is locked until Customer pays 100% of the quotation into Escrow.
                  </div>
                ) : (
                  <form onSubmit={handleAssignDesigner} className="space-y-2.5">
                    <div>
                      <label className="font-bold block mb-1">
                        Select Internal Designer (Shows Active Workload):
                      </label>
                      <select
                        value={selectedDesignerId}
                        onChange={(e) => setSelectedDesignerId(e.target.value)}
                        className="w-full border-2 border-dark p-1.5 bg-cream font-bold text-[11px]"
                      >
                        {DESIGNER_MEMBERS.map((des) => (
                          <option key={des.id} value={des.id}>
                            {des.name} ({getDesignerWorkload(des.id)} active tickets) —{" "}
                            {des.specialty}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="font-bold block mb-1">
                        Internal Instructions to Designer (Hidden from Customer):
                      </label>
                      <textarea
                        rows={2}
                        value={staffInstructions}
                        onChange={(e) => setStaffInstructions(e.target.value)}
                        className="w-full border border-dark p-1.5 bg-cream text-[11px]"
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="flex-1 py-1.5 bg-mint hover:bg-sage border-2 border-dark font-extrabold text-[11px] shadow-[2px_2px_0px_0px_#23261F] cursor-pointer"
                      >
                        {activeCom.assignedDesignerId
                          ? "🔄 Reassign / Update Instructions"
                          : "🚀 Dispatch Ticket to Designer (Start 72h SLA)"}
                      </button>

                      {activeCom.assignedDesignerId && (
                        <button
                          type="button"
                          onClick={() => toggleSimulateSlaOverdue(activeCom.id)}
                          className="px-2 py-1.5 bg-orange-100 hover:bg-orange-200 border border-dark text-[10px] font-bold cursor-pointer"
                          title="Simulate 72h SLA overdue alert (BR-FL3-05)"
                        >
                          ⚡ Toggle &gt;72h Alert
                        </button>
                      )}
                    </div>
                  </form>
                )}
              </div>

              {/* Step 8a/8b: Relay Customer Revision to Designer */}
              {activeCom.status === "CUSTOMER_REVISION_REQUESTED" && (
                <div className="bg-yellow-50 border-2 border-dark p-4 shadow-[3px_3px_0px_0px_#23261F] space-y-2.5 text-xs">
                  <div className="font-extrabold uppercase border-b border-dark pb-1">
                    🔄 Relay Customer Revision to Designer (Step 8)
                  </div>
                  <p className="text-[11px]">
                    Customer requested a revision (Quota will increment to{" "}
                    <strong>
                      {activeCom.revisionsUsed + 1}/{activeCom.maxRevisions}
                    </strong>
                    ). Translate Customer feedback into technical instructions for{" "}
                    <strong>{activeCom.assignedDesignerName}</strong>:
                  </p>
                  <textarea
                    rows={2}
                    value={relayNotes}
                    onChange={(e) => setRelayNotes(e.target.value)}
                    placeholder="Structured revision instructions for Designer..."
                    className="w-full border border-dark p-1.5 bg-white text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      relayCustomerRevisionToDesigner(
                        activeCom.id,
                        relayNotes.trim() || "Apply customer's latest revision notes."
                      );
                      setRelayNotes("");
                    }}
                    className="w-full py-1.5 bg-mint border-2 border-dark font-extrabold cursor-pointer"
                  >
                    📤 Send Revision Brief to Designer
                  </button>
                </div>
              )}

              {/* Step 7: Internal QA Review & Version History (WBS C33-C34) */}
              <div className="bg-white border-2 border-dark p-4 shadow-[3px_3px_0px_0px_#23261F] space-y-3 text-xs">
                <div className="flex items-center justify-between border-b-2 border-dark pb-2">
                  <span className="font-extrabold uppercase">
                    4. Internal QA & Draft Versions (Step 7)
                  </span>
                  <div className="flex gap-1">
                    {activeCom.submissions.map((sub) => (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => setInspectedSubId(sub.id)}
                        className={`px-2 py-0.5 text-[10px] font-bold border border-dark cursor-pointer ${
                          inspectedSubmission?.id === sub.id ? "bg-mint" : "bg-cream"
                        }`}
                      >
                        v{sub.versionNumber}
                      </button>
                    ))}
                  </div>
                </div>

                {inspectedSubmission ? (
                  <div className="space-y-3">
                    <LedMatrixPreview
                      pixelFrames={inspectedSubmission.pixelFrames}
                      externalDataUrl={inspectedSubmission.externalDataUrl}
                      matrixSize={inspectedSubmission.matrixSize}
                      fps={inspectedSubmission.fps}
                      title={`QA INSPECTOR — v${inspectedSubmission.versionNumber} (${inspectedSubmission.reviewStatus})`}
                      compact
                    />

                    <div className="bg-cream border border-dark p-2 text-[11px] space-y-1">
                      <div className="flex justify-between">
                        <span>Designer: <strong>{inspectedSubmission.designerName}</strong></span>
                        <span>Size: <strong>{(inspectedSubmission.fileSizeBytes / 1024).toFixed(1)} KB</strong></span>
                      </div>
                      <div>
                        Notes: <em>"{inspectedSubmission.releaseNotes}"</em>
                      </div>
                      <div>
                        QA Status: <strong>{inspectedSubmission.reviewStatus}</strong>
                      </div>
                    </div>

                    {inspectedSubmission.reviewStatus === "PENDING_STAFF_QA" && (
                      <div className="space-y-2 pt-1">
                        <textarea
                          rows={2}
                          value={qaFeedback}
                          onChange={(e) => setQaFeedback(e.target.value)}
                          placeholder="Add QA note (for Customer Deliverable Card or internal Designer rejection)..."
                          className="w-full border border-dark p-1.5 bg-cream text-xs"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              reviewSubmissionByStaff(
                                activeCom.id,
                                inspectedSubmission.id,
                                "APPROVE_TO_CUSTOMER",
                                qaFeedback.trim()
                              );
                              setQaFeedback("");
                            }}
                            className="py-1.5 bg-mint hover:bg-sage border-2 border-dark font-extrabold text-[11px] cursor-pointer"
                          >
                            ✅ Approve & Post Deliverable Card
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              reviewSubmissionByStaff(
                                activeCom.id,
                                inspectedSubmission.id,
                                "REJECT_INTERNALLY",
                                qaFeedback.trim() ||
                                  "Does not meet internal quality standards. Please revise."
                              );
                              setQaFeedback("");
                            }}
                            className="py-1.5 bg-red-100 hover:bg-red-200 border-2 border-dark font-bold text-[11px] text-red-900 cursor-pointer"
                          >
                            ❌ Reject Internally (0 Customer Quota)
                          </button>
                        </div>
                      </div>
                    )}

                    {activeCom.status === "DELIVERED_PREVIEW" && (
                      <button
                        type="button"
                        onClick={() =>
                          approveDeliverableVersion(
                            activeCom.id,
                            inspectedSubmission.id,
                            "STAFF_AUTO_COMPLETE"
                          )
                        }
                        className="w-full py-1.5 bg-sage hover:bg-mint border-2 border-dark font-bold text-[10px] cursor-pointer"
                      >
                        ⚡ Finalize Delivery / Simulate 7-Day Auto-Complete (Step 8)
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="py-6 text-center text-dark/50">
                    No Designer submissions uploaded yet.
                  </div>
                )}
              </div>
            </div>

            {/* PANEL 3 (4 cols): Customer <-> Staff Real-Time Chat Room (BR-FL3-03) */}
            <div className="lg:col-span-4 bg-white border-2 border-dark shadow-[3px_3px_0px_0px_#23261F] flex flex-col h-[620px]">
              <div className="bg-dark text-cream px-3 py-2 border-b-2 border-dark flex items-center justify-between text-xs">
                <span className="font-extrabold">
                  💬 Customer &harr; Staff Chat (BR-FL3-03)
                </span>
                <span className="text-[10px] text-mint">{activeCom.customerName}</span>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-cream/50 text-xs">
                {activeCom.messages.map((msg) => {
                  if (msg.messageType === "SYSTEM_EVENT") {
                    return (
                      <div
                        key={msg.id}
                        className="bg-gray-200 border border-dark/30 p-1.5 text-[10px] text-center font-bold"
                      >
                        ⚙️ {msg.content}
                      </div>
                    );
                  }

                  const isStaff = msg.senderRole === "STAFF";
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${
                        isStaff ? "items-end" : "items-start"
                      }`}
                    >
                      <span className="text-[9px] text-dark/60">
                        {msg.senderName} • {msg.messageType}
                      </span>
                      <div
                        className={`max-w-[90%] border-2 border-dark p-2 shadow-[2px_2px_0px_0px_#23261F] ${
                          isStaff ? "bg-sage/40" : "bg-white"
                        }`}
                      >
                        <div>{msg.content}</div>
                        {msg.quotationMeta && (
                          <div className="mt-1 pt-1 border-t border-dark/20 text-[10px] font-bold">
                            Quote: {msg.quotationMeta.quotePrice.toLocaleString()}₫ (
                            {msg.quotationMeta.serviceTier} • {msg.quotationMeta.cardStatus})
                          </div>
                        )}
                        {msg.deliverableMeta && (
                          <div className="mt-1 pt-1 border-t border-dark/20 text-[10px] font-bold">
                            Deliverable Card: Draft v{msg.deliverableMeta.versionNumber}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <form
                onSubmit={handleSendStaffChat}
                className="p-2.5 border-t-2 border-dark bg-white flex gap-1.5"
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Reply to Customer as Staff..."
                  className="flex-1 border-2 border-dark px-2 py-1 text-xs bg-cream outline-none"
                />
                <button
                  type="submit"
                  className="px-3 py-1 bg-mint border-2 border-dark font-extrabold text-xs cursor-pointer"
                >
                  Send
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </RetroWindow>
  );
};
