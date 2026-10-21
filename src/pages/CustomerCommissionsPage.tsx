import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CustomerHeader } from "../components/CustomerHeader";
import { CustomerFooter } from "../components/CustomerFooter";
import { OffsetHeading } from "../components/OffsetHeading";
import { LedMatrixPreview } from "../components/LedMatrixPreview";
import { useCartStore } from "../stores/CartStore";
import { useUserStore } from "../stores/UserStore";
import {
  useCommissionStore,
  type AnimationType,
  type CommissionStatus,
  type MatrixSize,
  type PaymentGateway,
} from "../stores/CommissionStore";

const STATUS_BADGE: Record<CommissionStatus, { label: string; bg: string }> = {
  PENDING_REVIEW: { label: "STEP 1: PENDING STAFF REVIEW", bg: "bg-yellow-200" },
  QUOTED: { label: "STEP 2: QUOTED (24H VALIDITY)", bg: "bg-mint" },
  PRICE_EXPIRED: { label: "STEP 2: QUOTE EXPIRED (24H)", bg: "bg-orange-200" },
  PAID_ESCROW: { label: "STEP 3: PAID IN ESCROW", bg: "bg-sage" },
  IN_PROGRESS: { label: "STEP 4–5: DESIGNER WORKING", bg: "bg-blue-200" },
  INTERNAL_REVIEW: { label: "STEP 6–7: STAFF INTERNAL QA", bg: "bg-purple-200" },
  INTERNAL_REVISION_REQUIRED: { label: "STEP 7: DESIGNER REVISING (INTERNAL)", bg: "bg-purple-200" },
  DELIVERED_PREVIEW: { label: "STEP 8: READY FOR YOUR REVIEW", bg: "bg-mint" },
  CUSTOMER_REVISION_REQUESTED: { label: "STEP 8: REVISION QUEUED", bg: "bg-yellow-200" },
  AWAITING_EXTRA_PAYMENT: { label: "STEP 8: AWAITING +10% EXTRA FEE", bg: "bg-orange-300" },
  COMPLETED: { label: "COMPLETED & IN GALLERY", bg: "bg-moss text-cream" },
  CANCELLED: { label: "CANCELLED", bg: "bg-gray-300" },
  REJECTED: { label: "REJECTED BY STAFF", bg: "bg-red-200" },
  REFUNDED: { label: "REFUNDED", bg: "bg-red-200" },
};

export const CustomerCommissionsPage: React.FC = () => {
  const navigate = useNavigate();
  const cartCount = useCartStore((s) => s.items.reduce((sum, i) => sum + i.qty, 0));
  const { userId, userName, switchRole } = useUserStore();

  const {
    commissions,
    customGallery,
    createCommission,
    updateBrief,
    sendChatMessage,
    declineQuotation,
    simulateQuoteExpiry,
    cancelByCustomer,
    payInitialQuote,
    requestCustomerRevision,
    payExtraRevisionFee,
    approveDeliverableVersion,
    resetDemoData,
  } = useCommissionStore();

  const [selectedId, setSelectedId] = useState<string>(commissions[0]?.id || "");
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  // New request form state
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newMatrix, setNewMatrix] = useState<MatrixSize>("64x64");
  const [newAnimType, setNewAnimType] = useState<AnimationType>("ANIMATED");
  const [newRefFiles, setNewRefFiles] = useState<string[]>(["concept_sketch.png"]);

  // Brief editing state
  const [isEditingBrief, setIsEditingBrief] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editMatrix, setEditMatrix] = useState<MatrixSize>("64x64");
  const [editAnim, setEditAnim] = useState<AnimationType>("ANIMATED");

  // Chat & Action states
  const [chatInput, setChatInput] = useState("");
  const [selectedGateway, setSelectedGateway] = useState<PaymentGateway>("MOMO");
  const [selectedVersionId, setSelectedVersionId] = useState<string>("");
  const [revisionNote, setRevisionNote] = useState("");
  const [showRevisionInput, setShowRevisionInput] = useState(false);

  const activeCommission =
    commissions.find((c) => c.id === selectedId) || commissions[0];

  // Filter only Staff-Approved or Final-Approved submissions for Customer view (BR-FL3-03)
  const customerVisibleSubmissions =
    activeCommission?.submissions.filter(
      (s) => s.reviewStatus === "STAFF_APPROVED" || s.reviewStatus === "FINAL_APPROVED"
    ) || [];

  const inspectedSubmission =
    customerVisibleSubmissions.find((s) => s.id === selectedVersionId) ||
    customerVisibleSubmissions[customerVisibleSubmissions.length - 1];

  const canEditBrief =
    activeCommission?.status === "PENDING_REVIEW" ||
    activeCommission?.status === "PRICE_EXPIRED";

  const canCancelUnpaid =
    activeCommission?.status === "PENDING_REVIEW" ||
    activeCommission?.status === "QUOTED" ||
    activeCommission?.status === "PRICE_EXPIRED";

  const handleOpenEditBrief = () => {
    if (!activeCommission) return;
    setEditTitle(activeCommission.title);
    setEditDesc(activeCommission.description);
    setEditMatrix(activeCommission.targetMatrixSize);
    setEditAnim(activeCommission.animationType);
    setIsEditingBrief(true);
  };

  const handleSaveBrief = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCommission) return;
    updateBrief(activeCommission.id, "CUSTOMER", {
      title: editTitle,
      description: editDesc,
      targetMatrixSize: editMatrix,
      animationType: editAnim,
    });
    setIsEditingBrief(false);
  };

  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDesc.trim()) return;
    const createdId = createCommission({
      customerId: userId || "cus-01",
      customerName: userName.replace(" (Customer)", ""),
      title: newTitle.trim(),
      description: newDesc.trim(),
      targetMatrixSize: newMatrix,
      animationType: newAnimType,
      attachmentNames: newRefFiles,
    });
    setNewTitle("");
    setNewDesc("");
    setIsNewModalOpen(false);
    setSelectedId(createdId);
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCommission || !chatInput.trim()) return;
    sendChatMessage(
      activeCommission.id,
      { id: activeCommission.customerId, name: activeCommission.customerName, role: "CUSTOMER" },
      chatInput
    );
    setChatInput("");
  };

  const handleRequestRevision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCommission || !inspectedSubmission || !revisionNote.trim()) return;
    requestCustomerRevision(
      activeCommission.id,
      inspectedSubmission.id,
      revisionNote.trim()
    );
    setRevisionNote("");
    setShowRevisionInput(false);
  };

  return (
    <div className="min-h-screen bg-cream text-dark font-sans flex flex-col selection:bg-mint selection:text-dark">
      <CustomerHeader
        onNavigateToShop={() => navigate("/")}
        onOpenCart={() => navigate("/cart")}
        cartCount={cartCount}
      />

      {/* Demo Role Switcher Bar */}
      <div className="bg-dark text-cream px-4 py-2 border-b-2 border-dark text-xs font-mono">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="bg-mint text-dark font-extrabold px-2 py-0.5">FLOW 3 DEMO</span>
            <span>Active View: <strong>Customer Commission Portal</strong></span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                switchRole("STAFF");
                navigate("/dashboard/staff/designs");
              }}
              className="px-2.5 py-1 bg-sage text-dark font-bold border border-cream cursor-pointer hover:bg-mint"
            >
              🛠 Switch to Staff Dashboard &rarr;
            </button>
            <button
              type="button"
              onClick={() => {
                switchRole("DESIGNER");
                navigate("/dashboard/staff/designer");
              }}
              className="px-2.5 py-1 bg-mint text-dark font-bold border border-cream cursor-pointer hover:bg-sage"
            >
              🎨 Switch to Designer Studio &rarr;
            </button>
            <button
              type="button"
              onClick={resetDemoData}
              className="px-2 py-1 bg-cream/10 hover:bg-cream/20 text-cream border border-cream/30 cursor-pointer"
            >
              ↺ Reset Demo Data
            </button>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8 space-y-10">
        {/* Header & CTA */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b-2 border-dark pb-6">
          <div>
            <OffsetHeading
              text="Custom Character Commissions"
              boxColor="bg-mint"
              boxWidth="w-[85%]"
              boxOffset="top-3 left-3"
            />
            <p className="text-xs font-mono text-dark/70 mt-3 max-w-2xl">
              Submit a custom LED character brief (Step 1), receive a Staff quote in chat (Step 2), pay 100% into escrow (Step 3), and review versioned pixel drafts in our live LED Matrix Simulator (Steps 4–8).
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsNewModalOpen(true)}
            className="px-5 py-2.5 bg-mint hover:bg-sage border-2 border-dark font-extrabold text-sm shadow-neo transition-transform active:translate-x-0.5 active:translate-y-0.5 cursor-pointer self-start"
          >
            + Request Custom Character
          </button>
        </div>

        {/* Owned Exclusive Custom Characters Gallery (BR-FL3-06) */}
        {customGallery.length > 0 && (
          <section className="bg-sage/25 border-2 border-dark p-4 shadow-neo space-y-3 font-mono">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold uppercase flex items-center gap-2">
                <span>🏆 My Private Custom Character Gallery (BR-FL3-06)</span>
                <span className="text-[10px] bg-dark text-mint px-2 py-0.5">
                  EXCLUSIVE • LOCKED FROM STORE
                </span>
              </h3>
              <span className="text-xs font-bold">{customGallery.length} Owned Asset(s)</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {customGallery.map((item) => (
                <div
                  key={item.id}
                  className="bg-cream border-2 border-dark p-3 flex items-center gap-3 shadow-[2px_2px_0px_0px_#23261F]"
                >
                  <LedMatrixPreview
                    pixelFrames={item.pixelFrames}
                    externalDataUrl={item.externalDataUrl}
                    matrixSize={item.matrixSize}
                    fps={item.fps}
                    compact
                  />
                  <div className="space-y-1 text-xs">
                    <div className="font-extrabold">{item.title}</div>
                    <div className="text-[10px] text-dark/70">
                      Ticket: {item.requestCode} (v{item.versionNumber})
                    </div>
                    <div className="text-[10px] text-dark/70">
                      File: <code>{item.ledartBinaryName}</code>
                    </div>
                    <div className="inline-block bg-mint border border-dark px-1.5 py-0.5 text-[9px] font-bold">
                      🔒 Private Entitlement Granted
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Main 12-Col Layout: Left Ticket Selector + Center Brief/Preview + Right Chat */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Column 1 (3 cols): Ticket List */}
          <div className="lg:col-span-3 space-y-3 font-mono">
            <h3 className="text-xs font-extrabold uppercase border-b-2 border-dark pb-1">
              My Requests ({commissions.length})
            </h3>
            <div className="space-y-2.5">
              {commissions.map((com) => {
                const badge = STATUS_BADGE[com.status];
                const isSelected = com.id === activeCommission?.id;
                return (
                  <button
                    key={com.id}
                    type="button"
                    onClick={() => {
                      setSelectedId(com.id);
                      setSelectedVersionId("");
                      setIsEditingBrief(false);
                    }}
                    className={`w-full text-left border-2 border-dark p-3 transition-all cursor-pointer ${
                      isSelected
                        ? "bg-mint shadow-neo translate-x-0.5"
                        : "bg-white hover:bg-sage/20"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-bold">
                      <span>{com.requestCode}</span>
                      <span className="border border-dark px-1 bg-cream">
                        {com.targetMatrixSize}
                      </span>
                    </div>
                    <div className="font-extrabold text-xs mt-1 truncate">
                      {com.title}
                    </div>
                    <div
                      className={`inline-block mt-2 px-1.5 py-0.5 text-[9px] font-extrabold border border-dark ${badge.bg}`}
                    >
                      {badge.label}
                    </div>
                    <div className="mt-2 pt-1.5 border-t border-dark/20 flex justify-between text-[10px]">
                      <span>Total:</span>
                      <span className="font-bold">
                        {com.totalPrice > 0
                          ? `${com.totalPrice.toLocaleString()} VND`
                          : "Awaiting Quote"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Column 2 (4 cols): Brief, 3-Column Pricing Ledger, and Versioned LED Preview */}
          {activeCommission && (
            <div className="lg:col-span-4 space-y-5 font-mono">
              {/* Brief Box */}
              <div className="bg-white border-2 border-dark shadow-neo overflow-hidden">
                <div className="bg-moss text-cream border-b-2 border-dark px-3 py-2 flex items-center justify-between text-xs font-bold">
                  <span>{activeCommission.requestCode} • Request Brief</span>
                  {canEditBrief ? (
                    <button
                      type="button"
                      onClick={handleOpenEditBrief}
                      className="bg-mint text-dark px-2 py-0.5 border border-dark text-[10px] font-extrabold cursor-pointer hover:bg-cream"
                    >
                      ✏️ Edit Brief
                    </button>
                  ) : (
                    <span className="bg-dark text-mint px-2 py-0.5 text-[9px]">
                      🔒 BRIEF LOCKED
                    </span>
                  )}
                </div>

                {isEditingBrief ? (
                  <form onSubmit={handleSaveBrief} className="p-4 space-y-3 text-xs">
                    <div>
                      <label className="font-bold block mb-1">Character Title</label>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full border-2 border-dark p-1.5 bg-cream"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="font-bold block mb-1">Matrix Size</label>
                        <select
                          value={editMatrix}
                          onChange={(e) => setEditMatrix(e.target.value as MatrixSize)}
                          className="w-full border-2 border-dark p-1.5 bg-cream"
                        >
                          <option value="32x32">32x32</option>
                          <option value="32x64">32x64</option>
                          <option value="64x64">64x64</option>
                        </select>
                      </div>
                      <div>
                        <label className="font-bold block mb-1">Animation Type</label>
                        <select
                          value={editAnim}
                          onChange={(e) => setEditAnim(e.target.value as AnimationType)}
                          className="w-full border-2 border-dark p-1.5 bg-cream"
                        >
                          <option value="ANIMATED">Animated GIF</option>
                          <option value="STATIC">Static PNG</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="font-bold block mb-1">Description</label>
                      <textarea
                        rows={3}
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        className="w-full border-2 border-dark p-1.5 bg-cream"
                        required
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="flex-1 py-1.5 bg-mint border-2 border-dark font-bold cursor-pointer"
                      >
                        Save Changes
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditingBrief(false)}
                        className="px-3 py-1.5 bg-gray-200 border-2 border-dark font-bold cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="p-4 space-y-3 text-xs">
                    <div>
                      <div className="text-sm font-extrabold">{activeCommission.title}</div>
                      <p className="text-dark/80 mt-1 leading-relaxed">
                        {activeCommission.description}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-dark/20 text-[11px]">
                      <div>
                        <span className="text-dark/60 block">Target Matrix:</span>
                        <strong>{activeCommission.targetMatrixSize}</strong>
                      </div>
                      <div>
                        <span className="text-dark/60 block">Format:</span>
                        <strong>{activeCommission.animationType}</strong>
                      </div>
                      <div>
                        <span className="text-dark/60 block">Assigned Staff:</span>
                        <strong>{activeCommission.assignedStaffName}</strong>
                      </div>
                      <div>
                        <span className="text-dark/60 block">Package Tier:</span>
                        <strong>{activeCommission.serviceTier || "Pending Quote"}</strong>
                      </div>
                    </div>

                    {activeCommission.attachments.length > 0 && (
                      <div className="pt-2 border-t border-dark/20">
                        <span className="text-[10px] font-bold text-dark/60 block mb-1">
                          Reference Attachments (&le;150KB):
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {activeCommission.attachments.map((att) => (
                            <span
                              key={att.id}
                              className="px-2 py-0.5 bg-cream border border-dark text-[10px]"
                            >
                              📎 {att.fileName} ({(att.fileSizeBytes / 1024).toFixed(0)}KB)
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {canCancelUnpaid && (
                      <div className="pt-2 border-t border-dark/20">
                        <button
                          type="button"
                          onClick={() =>
                            cancelByCustomer(
                              activeCommission.id,
                              "Cancelled by customer prior to escrow payment."
                            )
                          }
                          className="w-full py-1.5 bg-red-100 hover:bg-red-200 border border-dark text-red-900 font-bold text-[11px] cursor-pointer"
                        >
                          ✕ Cancel Request (Allowed Before Payment)
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 3-Column Pricing & Revision Quota Ledger (Main Features G11 & BR-FL3-02) */}
              <div className="bg-white border-2 border-dark p-4 shadow-neo space-y-3">
                <div className="flex items-center justify-between border-b-2 border-dark pb-2">
                  <span className="text-xs font-extrabold uppercase">
                    💰 3-Column Price & Revision Ledger
                  </span>
                  <span className="text-[10px] bg-mint border border-dark px-1.5 py-0.5 font-bold">
                    Revisions: {activeCommission.revisionsUsed} / {activeCommission.maxRevisions}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-cream border border-dark p-2">
                    <div className="text-[9px] text-dark/60 uppercase">1. Initial Quote</div>
                    <div className="font-extrabold mt-1">
                      {activeCommission.initialPrice.toLocaleString()}₫
                    </div>
                  </div>
                  <div className="bg-cream border border-dark p-2">
                    <div className="text-[9px] text-dark/60 uppercase">2. Extra Fees (+10%)</div>
                    <div className="font-extrabold mt-1 text-orange-700">
                      +{activeCommission.extraRevisionFee.toLocaleString()}₫
                    </div>
                  </div>
                  <div className="bg-mint/40 border-2 border-dark p-2">
                    <div className="text-[9px] font-bold uppercase">3. Total Price</div>
                    <div className="font-extrabold mt-1">
                      {activeCommission.totalPrice.toLocaleString()}₫
                    </div>
                  </div>
                </div>
              </div>

              {/* Versioned Deliverable Inspector & LED Matrix Simulator (Step 8) */}
              <div className="bg-white border-2 border-dark p-4 shadow-neo space-y-3">
                <div className="flex items-center justify-between border-b-2 border-dark pb-2">
                  <span className="text-xs font-extrabold uppercase">
                    📺 Deliverable Version Inspector
                  </span>
                  {customerVisibleSubmissions.length > 0 && (
                    <div className="flex gap-1">
                      {customerVisibleSubmissions.map((sub) => (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => setSelectedVersionId(sub.id)}
                          className={`px-2 py-0.5 text-[10px] font-bold border border-dark cursor-pointer ${
                            inspectedSubmission?.id === sub.id
                              ? "bg-mint"
                              : "bg-cream hover:bg-gray-100"
                          }`}
                        >
                          v{sub.versionNumber}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {inspectedSubmission ? (
                  <div className="space-y-3">
                    <LedMatrixPreview
                      pixelFrames={inspectedSubmission.pixelFrames}
                      externalDataUrl={inspectedSubmission.externalDataUrl}
                      matrixSize={inspectedSubmission.matrixSize}
                      fps={inspectedSubmission.fps}
                      title={`DELIVERABLE DRAFT v${inspectedSubmission.versionNumber}`}
                    />

                    <div className="bg-cream border border-dark p-2.5 text-[11px] space-y-1">
                      <div className="font-bold">
                        Version v{inspectedSubmission.versionNumber} Release Notes:
                      </div>
                      <p className="text-dark/80">{inspectedSubmission.releaseNotes}</p>
                    </div>

                    {activeCommission.status === "DELIVERED_PREVIEW" && (
                      <div className="space-y-2 pt-1">
                        <button
                          type="button"
                          onClick={() =>
                            approveDeliverableVersion(
                              activeCommission.id,
                              inspectedSubmission.id,
                              "CUSTOMER"
                            )
                          }
                          className="w-full py-2 bg-mint hover:bg-sage border-2 border-dark font-extrabold text-xs shadow-[3px_3px_0px_0px_#23261F] cursor-pointer"
                        >
                          ✅ Approve & Claim Version v{inspectedSubmission.versionNumber} to My Gallery
                        </button>

                        {!showRevisionInput ? (
                          <button
                            type="button"
                            onClick={() => setShowRevisionInput(true)}
                            className="w-full py-1.5 bg-white hover:bg-yellow-100 border-2 border-dark font-bold text-xs cursor-pointer"
                          >
                            {activeCommission.revisionsUsed < activeCommission.maxRevisions
                              ? `🔄 Request Included Revision (${
                                  activeCommission.maxRevisions - activeCommission.revisionsUsed
                                } remaining)`
                              : `➕ Request Extra Revision (+10% Fee = ${Math.round(
                                  activeCommission.initialPrice * 0.1
                                ).toLocaleString()} VND)`}
                          </button>
                        ) : (
                          <form
                            onSubmit={handleRequestRevision}
                            className="bg-yellow-50 border-2 border-dark p-2.5 space-y-2"
                          >
                            <label className="text-[11px] font-bold block">
                              Describe what you want adjusted:
                            </label>
                            <textarea
                              rows={2}
                              value={revisionNote}
                              onChange={(e) => setRevisionNote(e.target.value)}
                              placeholder="e.g., Make the visor flash slightly faster or adjust horn color..."
                              className="w-full border border-dark p-1.5 text-xs bg-white"
                              required
                            />
                            <div className="flex gap-2">
                              <button
                                type="submit"
                                className="flex-1 py-1 bg-mint border border-dark font-bold text-xs cursor-pointer"
                              >
                                Submit Revision Request
                              </button>
                              <button
                                type="button"
                                onClick={() => setShowRevisionInput(false)}
                                className="px-2 py-1 bg-gray-200 border border-dark text-xs cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          </form>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs text-dark/50">
                    No Staff-approved drafts delivered yet. Once the Designer submits a draft and Staff QA approves it, you can test it here on the simulated LED matrix.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Column 3 (5 cols): Customer <-> Staff Real-Time Chat & Interactive Cards (BR-FL3-03) */}
          {activeCommission && (
            <div className="lg:col-span-5 bg-white border-2 border-dark shadow-neo flex flex-col h-[680px] font-mono">
              {/* Chat Header */}
              <div className="bg-dark text-cream px-4 py-2.5 border-b-2 border-dark flex items-center justify-between">
                <div>
                  <div className="text-xs font-extrabold">
                    💬 Customer &harr; Staff Coordination Room (BR-FL3-03)
                  </div>
                  <div className="text-[10px] text-cream/70">
                    Assigned Coordinator: {activeCommission.assignedStaffName} • Direct Designer chat blocked
                  </div>
                </div>
                <span
                  className={`px-2 py-0.5 text-[9px] font-extrabold text-dark border border-dark ${
                    STATUS_BADGE[activeCommission.status].bg
                  }`}
                >
                  {activeCommission.status}
                </span>
              </div>

              {/* Messages Feed */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-cream/60">
                {activeCommission.messages.map((msg) => {
                  if (msg.messageType === "SYSTEM_EVENT") {
                    return (
                      <div
                        key={msg.id}
                        className="bg-gray-200 border border-dark/40 px-3 py-1.5 text-[10px] text-center font-bold text-dark/80"
                      >
                        ⚙️ {msg.content}
                      </div>
                    );
                  }

                  if (msg.messageType === "QUOTATION_CARD" && msg.quotationMeta) {
                    const q = msg.quotationMeta;
                    return (
                      <div
                        key={msg.id}
                        className="bg-white border-2 border-dark shadow-[4px_4px_0px_0px_#23261F] p-4 space-y-3"
                      >
                        <div className="flex items-center justify-between border-b-2 border-dark pb-2">
                          <span className="text-xs font-extrabold uppercase bg-mint px-2 py-0.5 border border-dark">
                            📋 Official Quotation Card (Step 2)
                          </span>
                          <span className="text-[10px] font-bold">
                            Status: <strong>{q.cardStatus}</strong>
                          </span>
                        </div>

                        <p className="text-xs">{msg.content}</p>

                        <div className="bg-cream border border-dark p-3 space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span>Quoted Price:</span>
                            <strong className="text-base">
                              {q.quotePrice.toLocaleString()} VND
                            </strong>
                          </div>
                          <div className="flex justify-between">
                            <span>Service Tier:</span>
                            <strong>
                              {q.serviceTier} ({q.maxRevisions} Included Revision
                              {q.maxRevisions > 1 ? "s" : ""})
                            </strong>
                          </div>
                          <div className="text-[10px] text-dark/70 pt-1">
                            {q.scopeSummary}
                          </div>
                          <div className="text-[10px] text-orange-800 font-bold pt-1">
                            ⏳ Valid for 24h until: {new Date(q.expiresAt).toLocaleString()} (BR-FL3-04)
                          </div>
                        </div>

                        {q.cardStatus === "ACTIVE" &&
                          activeCommission.status === "QUOTED" && (
                            <div className="space-y-2 pt-1">
                              <div className="flex items-center gap-2 text-xs">
                                <span className="font-bold">Gateway:</span>
                                {(["MOMO", "VNPAY"] as const).map((gw) => (
                                  <button
                                    key={gw}
                                    type="button"
                                    onClick={() => setSelectedGateway(gw)}
                                    className={`px-2.5 py-1 border border-dark font-bold cursor-pointer ${
                                      selectedGateway === gw ? "bg-mint" : "bg-cream"
                                    }`}
                                  >
                                    {gw}
                                  </button>
                                ))}
                              </div>

                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    payInitialQuote(
                                      activeCommission.id,
                                      msg.id,
                                      selectedGateway
                                    )
                                  }
                                  className="flex-1 py-2 bg-mint hover:bg-sage border-2 border-dark font-extrabold text-xs shadow-[2px_2px_0px_0px_#23261F] cursor-pointer"
                                >
                                  💳 Pay {q.quotePrice.toLocaleString()}₫ via {selectedGateway} (Step 3)
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    declineQuotation(
                                      activeCommission.id,
                                      msg.id,
                                      "Can we adjust the scope or price?"
                                    )
                                  }
                                  className="px-3 py-2 bg-white hover:bg-gray-100 border-2 border-dark font-bold text-xs cursor-pointer"
                                >
                                  Decline / Negotiate
                                </button>
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  simulateQuoteExpiry(activeCommission.id, msg.id)
                                }
                                className="w-full py-1 bg-orange-100 hover:bg-orange-200 border border-dark text-[10px] font-bold text-orange-900 cursor-pointer"
                              >
                                ⚡ Demo Trigger: Simulate 24h Quotation Expiry (BR-FL3-04)
                              </button>
                            </div>
                          )}
                      </div>
                    );
                  }

                  if (msg.messageType === "EXTRA_FEE_CARD" && msg.extraFeeMeta) {
                    const ef = msg.extraFeeMeta;
                    return (
                      <div
                        key={msg.id}
                        className="bg-orange-50 border-2 border-dark shadow-[4px_4px_0px_0px_#23261F] p-4 space-y-3"
                      >
                        <div className="flex items-center justify-between border-b-2 border-dark pb-2">
                          <span className="text-xs font-extrabold uppercase bg-orange-300 px-2 py-0.5 border border-dark">
                            ⚡ +10% Extra Revision Fee Card (BR-FL3-02)
                          </span>
                          <span className="text-[10px] font-bold">{ef.cardStatus}</span>
                        </div>
                        <p className="text-xs">{msg.content}</p>
                        <div className="bg-white border border-dark p-2.5 text-xs space-y-1">
                          <div>
                            Surcharge (10% of Initial Quote):{" "}
                            <strong>{ef.feeAmount.toLocaleString()} VND</strong>
                          </div>
                          <div>
                            Requested Changes: <em>"{ef.revisionFeedback}"</em>
                          </div>
                        </div>

                        {ef.cardStatus === "PENDING_PAYMENT" && (
                          <button
                            type="button"
                            onClick={() =>
                              payExtraRevisionFee(
                                activeCommission.id,
                                msg.id,
                                selectedGateway
                              )
                            }
                            className="w-full py-2 bg-mint hover:bg-sage border-2 border-dark font-extrabold text-xs shadow-[2px_2px_0px_0px_#23261F] cursor-pointer"
                          >
                            💳 Pay +{ef.feeAmount.toLocaleString()}₫ Extra Fee via {selectedGateway}
                          </button>
                        )}
                      </div>
                    );
                  }

                  if (msg.messageType === "DELIVERABLE_CARD" && msg.deliverableMeta) {
                    const d = msg.deliverableMeta;
                    const sub = activeCommission.submissions.find(
                      (s) => s.id === d.submissionId
                    );
                    return (
                      <div
                        key={msg.id}
                        className="bg-white border-2 border-dark shadow-[4px_4px_0px_0px_#23261F] p-4 space-y-3"
                      >
                        <div className="flex items-center justify-between border-b-2 border-dark pb-2">
                          <span className="text-xs font-extrabold uppercase bg-sage px-2 py-0.5 border border-dark">
                            🎁 Deliverable Card — Draft v{d.versionNumber}
                          </span>
                          <button
                            type="button"
                            onClick={() => setSelectedVersionId(d.submissionId)}
                            className="text-[10px] underline font-bold cursor-pointer"
                          >
                            Inspect in Simulator &larr;
                          </button>
                        </div>
                        <p className="text-xs">{msg.content}</p>
                        {sub && (
                          <LedMatrixPreview
                            pixelFrames={sub.pixelFrames}
                            externalDataUrl={sub.externalDataUrl}
                            matrixSize={sub.matrixSize}
                            fps={sub.fps}
                            compact
                          />
                        )}
                      </div>
                    );
                  }

                  // Normal Text Message
                  const isCustomer = msg.senderRole === "CUSTOMER";
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${
                        isCustomer ? "items-end" : "items-start"
                      }`}
                    >
                      <span className="text-[9px] text-dark/60 mb-0.5">
                        {msg.senderName}
                      </span>
                      <div
                        className={`max-w-[85%] border-2 border-dark px-3 py-2 text-xs shadow-[2px_2px_0px_0px_#23261F] ${
                          isCustomer ? "bg-mint" : "bg-white"
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Chat Input */}
              <form
                onSubmit={handleSendChat}
                className="p-3 bg-white border-t-2 border-dark flex gap-2"
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Message Staff coordinator..."
                  className="flex-1 border-2 border-dark px-3 py-1.5 text-xs bg-cream outline-none"
                />
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-mint hover:bg-sage border-2 border-dark font-extrabold text-xs shadow-[2px_2px_0px_0px_#23261F] cursor-pointer"
                >
                  Send
                </button>
              </form>
            </div>
          )}
        </div>
      </main>

      {/* Step 1: Create New Custom Design Request Modal */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 bg-dark/60 backdrop-blur-xs flex items-center justify-center p-4 font-mono">
          <div className="bg-cream border-2 border-dark shadow-neo w-full max-w-lg overflow-hidden">
            <div className="bg-moss text-cream px-4 py-2 border-b-2 border-dark flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase">
                Step 1: Submit New Custom Character Request
              </span>
              <button
                type="button"
                onClick={() => setIsNewModalOpen(false)}
                className="px-2 py-0.5 bg-cream text-dark border border-dark text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRequest} className="p-5 space-y-4 text-xs">
              <div>
                <label className="font-bold block mb-1">Character Title *</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g., Pixel Dragon Left-Turn Signal"
                  className="w-full border-2 border-dark p-2 bg-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">Target Matrix Size *</label>
                  <select
                    value={newMatrix}
                    onChange={(e) => setNewMatrix(e.target.value as MatrixSize)}
                    className="w-full border-2 border-dark p-2 bg-white font-bold"
                  >
                    <option value="32x32">32x32 Standard Square</option>
                    <option value="32x64">32x64 Wide Banner</option>
                    <option value="64x64">64x64 Pro Matrix</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold block mb-1">Animation Format *</label>
                  <select
                    value={newAnimType}
                    onChange={(e) => setNewAnimType(e.target.value as AnimationType)}
                    className="w-full border-2 border-dark p-2 bg-white font-bold"
                  >
                    <option value="ANIMATED">Animated GIF (&le;30 FPS)</option>
                    <option value="STATIC">Static Pixel PNG</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1">
                  Detailed Character & Color Brief *
                </label>
                <textarea
                  rows={3}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Describe character pose, colors, vehicle trigger context (Idle, Brake, Turn), and animation loop..."
                  className="w-full border-2 border-dark p-2 bg-white"
                  required
                />
              </div>

              <div>
                <label className="font-bold block mb-1">
                  Reference Attachments (PNG/GIF &le; 150 KB — BR-GEN-08)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept="image/png,image/gif"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setNewRefFiles((prev) => [...prev, file.name]);
                      }
                    }}
                    className="text-[11px]"
                  />
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {newRefFiles.map((f, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 bg-white border border-dark text-[10px]"
                    >
                      📎 {f}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-mint/30 border border-dark p-2.5 text-[10px]">
                ℹ️ Upon submission, your request is automatically routed to an operational Staff coordinator via <strong>Round-Robin (BR-FL3-07)</strong>. You can edit this brief until Staff issues an official Quotation Card.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 bg-gray-200 border-2 border-dark font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-mint hover:bg-sage border-2 border-dark font-extrabold shadow-[3px_3px_0px_0px_#23261F] cursor-pointer"
                >
                  Submit Request (Step 1)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <CustomerFooter />
    </div>
  );
};
