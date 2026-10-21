import { create } from "zustand";
import { persist } from "zustand/middleware";

export type MatrixSize = "32x32" | "32x64" | "64x64";
export type AnimationType = "STATIC" | "ANIMATED";
export type ServiceTier = "BASIC" | "ADVANCED" | "CUSTOM";
export type PaymentGateway = "MOMO" | "VNPAY";

export type CommissionStatus =
  | "PENDING_REVIEW"
  | "QUOTED"
  | "PRICE_EXPIRED"
  | "PAID_ESCROW"
  | "IN_PROGRESS"
  | "INTERNAL_REVIEW"
  | "INTERNAL_REVISION_REQUIRED"
  | "DELIVERED_PREVIEW"
  | "CUSTOMER_REVISION_REQUESTED"
  | "AWAITING_EXTRA_PAYMENT"
  | "COMPLETED"
  | "CANCELLED"
  | "REJECTED"
  | "REFUNDED";

export type SubmissionReviewStatus =
  | "PENDING_STAFF_QA"
  | "STAFF_REJECTED"
  | "STAFF_APPROVED"
  | "CUSTOMER_REJECTED"
  | "FINAL_APPROVED";

export type MessageType =
  | "TEXT"
  | "QUOTATION_CARD"
  | "EXTRA_FEE_CARD"
  | "DELIVERABLE_CARD"
  | "SYSTEM_EVENT";

export interface CommissionAttachment {
  id: string;
  fileName: string;
  fileSizeBytes: number;
  previewType: string;
  createdAt: string;
}

export interface CommissionSubmission {
  id: string;
  commissionId: string;
  designerId: string;
  designerName: string;
  versionNumber: number;
  matrixSize: MatrixSize;
  fps: number;
  fileSizeBytes: number;
  sourceType: "PIXEL_STUDIO" | "EXTERNAL_IMPORT";
  /** 16x16 or 32x32 compact hex color grid frames for the LED Matrix Simulator */
  pixelFrames: string[][][];
  externalDataUrl?: string;
  releaseNotes: string;
  reviewStatus: SubmissionReviewStatus;
  staffFeedback?: string;
  customerFeedback?: string;
  reviewedByStaffAt?: string;
  createdAt: string;
}

export interface QuotationCardMeta {
  quotePrice: number;
  serviceTier: ServiceTier;
  maxRevisions: number;
  scopeSummary: string;
  expiresAt: string;
  cardStatus: "ACTIVE" | "PAID" | "DECLINED" | "EXPIRED" | "SUPERSEDED";
  paidGateway?: PaymentGateway;
}

export interface ExtraFeeCardMeta {
  feeAmount: number;
  reason: string;
  revisionFeedback: string;
  targetSubmissionId: string;
  cardStatus: "PENDING_PAYMENT" | "PAID" | "CANCELLED";
  paidGateway?: PaymentGateway;
}

export interface DeliverableCardMeta {
  submissionId: string;
  versionNumber: number;
  note: string;
}

export interface CommissionMessage {
  id: string;
  commissionId: string;
  senderId: string;
  senderName: string;
  senderRole: "CUSTOMER" | "STAFF" | "SYSTEM";
  messageType: MessageType;
  content: string;
  quotationMeta?: QuotationCardMeta;
  extraFeeMeta?: ExtraFeeCardMeta;
  deliverableMeta?: DeliverableCardMeta;
  createdAt: string;
}

export interface CommissionRequest {
  id: string;
  requestCode: string;
  customerId: string;
  customerName: string;
  assignedStaffId: string;
  assignedStaffName: string;
  assignedDesignerId?: string;
  assignedDesignerName?: string;
  title: string;
  description: string;
  targetMatrixSize: MatrixSize;
  animationType: AnimationType;
  status: CommissionStatus;
  serviceTier?: ServiceTier;
  /** Column 1: Initial Base Price (VND) */
  initialPrice: number;
  /** Column 2: Accumulated +10% Extra Revision Fees (VND) */
  extraRevisionFee: number;
  /** Column 3: initialPrice + extraRevisionFee (VND) */
  totalPrice: number;
  maxRevisions: number;
  revisionsUsed: number;
  quoteExpiresAt?: string;
  staffInstructions?: string;
  slaDueAt?: string;
  isSlaOverdue: boolean;
  approvedSubmissionId?: string;
  rejectionOrCancelReason?: string;
  autoCompleteAt?: string;
  attachments: CommissionAttachment[];
  submissions: CommissionSubmission[];
  messages: CommissionMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface CustomGalleryItem {
  id: string;
  ownerId: string;
  commissionId: string;
  requestCode: string;
  sourceSubmissionId: string;
  versionNumber: number;
  title: string;
  category: "CUSTOM_COMMISSION";
  matrixSize: MatrixSize;
  fps: number;
  pixelFrames: string[][][];
  externalDataUrl?: string;
  ledartBinaryName: string;
  fileSizeBytes: number;
  isCustom: true;
  isPrivate: true;
  grantedAt: string;
}

export interface InternalMember {
  id: string;
  name: string;
  role: "STAFF" | "DESIGNER";
  specialty?: string;
}

export const STAFF_MEMBERS: InternalMember[] = [
  { id: "staff-01", name: "Pham Tran Trung Hieu", role: "STAFF" },
  { id: "staff-02", name: "Dang Phuoc Nguyen", role: "STAFF" },
];

export const DESIGNER_MEMBERS: InternalMember[] = [
  { id: "des-01", name: "Le Hoang Tuan", role: "DESIGNER", specialty: "Mecha & Cyberpunk Pixel Art" },
  { id: "des-02", name: "Tran Duc Hai", role: "DESIGNER", specialty: "Chibi Mascots & Retro Racing" },
];

/** Helper to generate 16x16 preset pixel art frames for LED Matrix simulation */
export function createPresetFrames(preset: "SAMURAI" | "SHIBA" | "MECHA_CAT" | "HEART_SIGNAL"): string[][][] {
  const K = "#111310"; // off LED
  const G = "#86d095"; // mint green
  const C = "#00f5d4"; // neon cyan
  const R = "#ff3366"; // neon crimson
  const Y = "#ffd166"; // amber gold
  const W = "#fffdf7"; // white
  const P = "#b5179e"; // magenta

  const emptyGrid = () => Array.from({ length: 16 }, () => Array(16).fill(K));

  if (preset === "SAMURAI") {
    const f1 = emptyGrid();
    const f2 = emptyGrid();
    // Helmet & visor
    for (let x = 4; x <= 11; x++) {
      f1[3][x] = R;
      f2[3][x] = R;
      f1[4][x] = R;
      f2[4][x] = R;
    }
    // Horns
    f1[1][3] = Y; f1[2][4] = Y; f1[1][12] = Y; f1[2][11] = Y;
    f2[1][3] = Y; f2[2][4] = Y; f2[1][12] = Y; f2[2][11] = Y;
    // Glowing Cyber Visor (animated scan)
    for (let x = 5; x <= 10; x++) {
      f1[6][x] = C;
      f2[6][x] = x % 2 === 0 ? W : C;
      f1[7][x] = C;
      f2[7][x] = C;
    }
    // Mask & Armor
    for (let y = 8; y <= 13; y++) {
      for (let x = 4; x <= 11; x++) {
        if (y === 9 || y === 12) {
          f1[y][x] = G;
          f2[y][x] = G;
        } else {
          f1[y][x] = "#2b332c";
          f2[y][x] = "#2b332c";
        }
      }
    }
    // Katana slash in frame 2
    for (let i = 2; i <= 13; i++) {
      f2[i][14 - Math.floor(i / 2)] = W;
    }
    return [f1, f2];
  }

  if (preset === "SHIBA") {
    const f1 = emptyGrid();
    const f2 = emptyGrid();
    // Ears
    f1[2][4] = Y; f1[3][4] = Y; f1[3][5] = Y;
    f1[2][11] = Y; f1[3][11] = Y; f1[3][10] = Y;
    f2[1][4] = Y; f2[2][4] = Y; f2[3][5] = Y;
    f2[1][11] = Y; f2[2][11] = Y; f2[3][10] = Y;
    // Face
    for (let y = 4; y <= 12; y++) {
      for (let x = 4; x <= 11; x++) {
        const isCheek = y >= 8 && x >= 5 && x <= 10;
        f1[y][x] = isCheek ? W : Y;
        f2[y][x] = isCheek ? W : Y;
      }
    }
    // Eyes & Nose
    f1[6][6] = K; f1[6][9] = K; f1[8][7] = K; f1[8][8] = K;
    f2[6][6] = C; f2[6][9] = C; f2[8][7] = K; f2[8][8] = K;
    // Happy tongue in f2
    f2[10][7] = R; f2[10][8] = R; f2[11][7] = R;
    return [f1, f2];
  }

  if (preset === "MECHA_CAT") {
    const f1 = emptyGrid();
    const f2 = emptyGrid();
    // Cat ears
    f1[2][3] = P; f1[3][3] = P; f1[3][4] = C;
    f1[2][12] = P; f1[3][12] = P; f1[3][11] = C;
    f2[2][3] = C; f2[3][3] = P; f2[3][4] = P;
    f2[2][12] = C; f2[3][12] = P; f2[3][11] = P;
    // Head
    for (let y = 4; y <= 11; y++) {
      for (let x = 3; x <= 12; x++) {
        f1[y][x] = "#241938";
        f2[y][x] = "#241938";
      }
    }
    // Neon eyes
    f1[6][5] = G; f1[6][6] = G; f1[6][9] = G; f1[6][10] = G;
    f2[6][5] = Y; f2[6][6] = Y; f2[6][9] = Y; f2[6][10] = Y;
    // Whiskers
    f1[8][1] = C; f1[8][2] = C; f1[8][13] = C; f1[8][14] = C;
    f2[7][1] = P; f2[7][2] = P; f2[7][13] = P; f2[7][14] = P;
    return [f1, f2];
  }

  // HEART_SIGNAL
  const f1 = emptyGrid();
  const f2 = emptyGrid();
  const pts = [
    [4, 5], [4, 6], [4, 9], [4, 10],
    [5, 4], [5, 5], [5, 6], [5, 7], [5, 8], [5, 9], [5, 10], [5, 11],
    [6, 4], [6, 5], [6, 6], [6, 7], [6, 8], [6, 9], [6, 10], [6, 11],
    [7, 5], [7, 6], [7, 7], [7, 8], [7, 9], [7, 10],
    [8, 6], [8, 7], [8, 8], [8, 9],
    [9, 7], [9, 8],
  ];
  pts.forEach(([y, x]) => {
    f1[y][x] = R;
    f2[y][x] = Y;
  });
  return [f1, f2];
}

const INITIAL_COMMISSIONS: CommissionRequest[] = [
  {
    id: "com-1",
    requestCode: "COM-2026-0001",
    customerId: "cus-01",
    customerName: "Nguyen Quang Khanh",
    assignedStaffId: "staff-01",
    assignedStaffName: "Pham Tran Trung Hieu",
    assignedDesignerId: "des-01",
    assignedDesignerName: "Le Hoang Tuan",
    title: "Cyber Samurai Brake Alert Character",
    description:
      "Need an animated pixel Cyber Samurai drawing a glowing katana when I brake. Neon cyan visor, red armor, high contrast on dark windshield.",
    targetMatrixSize: "64x64",
    animationType: "ANIMATED",
    status: "DELIVERED_PREVIEW",
    serviceTier: "BASIC",
    initialPrice: 300000,
    extraRevisionFee: 0,
    totalPrice: 300000,
    maxRevisions: 1,
    revisionsUsed: 1,
    quoteExpiresAt: "2026-10-20T12:00:00Z",
    staffInstructions:
      "Focus on high-contrast cyan (#00F5D4) and crimson (#FF3366). Revision 1 note from customer: Add white katana slash arc in frame 2.",
    slaDueAt: "2026-10-23T12:00:00Z",
    isSlaOverdue: false,
    autoCompleteAt: "2026-10-28T15:00:00Z",
    attachments: [
      {
        id: "att-1",
        fileName: "samurai_helmet_ref.png",
        fileSizeBytes: 68400,
        previewType: "SAMURAI",
        createdAt: "2026-10-19T09:00:00Z",
      },
    ],
    submissions: [
      {
        id: "sub-101",
        commissionId: "com-1",
        designerId: "des-01",
        designerName: "Le Hoang Tuan",
        versionNumber: 1,
        matrixSize: "64x64",
        fps: 12,
        fileSizeBytes: 54200,
        sourceType: "PIXEL_STUDIO",
        pixelFrames: [createPresetFrames("SAMURAI")[0]],
        releaseNotes: "v1 Initial static/idle visor pulse draft.",
        reviewStatus: "STAFF_APPROVED",
        staffFeedback: "Clean silhouette! Posting v1 to customer.",
        customerFeedback: "Looks awesome, can we add a katana slash animation in frame 2?",
        reviewedByStaffAt: "2026-10-20T10:00:00Z",
        createdAt: "2026-10-20T08:30:00Z",
      },
      {
        id: "sub-102",
        commissionId: "com-1",
        designerId: "des-01",
        designerName: "Le Hoang Tuan",
        versionNumber: 2,
        matrixSize: "64x64",
        fps: 15,
        fileSizeBytes: 71800,
        sourceType: "PIXEL_STUDIO",
        pixelFrames: createPresetFrames("SAMURAI"),
        releaseNotes: "v2 Added katana slash arc in Frame 2 + visor flash.",
        reviewStatus: "STAFF_APPROVED",
        staffFeedback: "Meets all revision notes and <=5Hz safety flash rule.",
        reviewedByStaffAt: "2026-10-21T14:00:00Z",
        createdAt: "2026-10-21T11:20:00Z",
      },
    ],
    messages: [
      {
        id: "msg-1",
        commissionId: "com-1",
        senderId: "SYSTEM",
        senderName: "System",
        senderRole: "SYSTEM",
        messageType: "SYSTEM_EVENT",
        content:
          "Request COM-2026-0001 created and auto-assigned to Staff Pham Tran Trung Hieu via Round-Robin (BR-FL3-07).",
        createdAt: "2026-10-19T09:00:00Z",
      },
      {
        id: "msg-2",
        commissionId: "com-1",
        senderId: "staff-01",
        senderName: "Pham Tran Trung Hieu (Staff)",
        senderRole: "STAFF",
        messageType: "QUOTATION_CARD",
        content: "Here is the official quotation for your 64x64 Animated Cyber Samurai character:",
        quotationMeta: {
          quotePrice: 300000,
          serviceTier: "BASIC",
          maxRevisions: 1,
          scopeSummary: "64x64 Animated GIF (up to 15 FPS), Basic Tier (1 included revision). Valid for 24 hours.",
          expiresAt: "2026-10-20T09:15:00Z",
          cardStatus: "PAID",
          paidGateway: "MOMO",
        },
        createdAt: "2026-10-19T09:15:00Z",
      },
      {
        id: "msg-3",
        commissionId: "com-1",
        senderId: "staff-01",
        senderName: "Pham Tran Trung Hieu (Staff)",
        senderRole: "STAFF",
        messageType: "DELIVERABLE_CARD",
        content: "Draft v1 has passed internal QA! Please preview it in the LED Matrix Simulator below.",
        deliverableMeta: {
          submissionId: "sub-101",
          versionNumber: 1,
          note: "Initial Cyber Samurai draft (v1).",
        },
        createdAt: "2026-10-20T10:05:00Z",
      },
      {
        id: "msg-4",
        commissionId: "com-1",
        senderId: "cus-01",
        senderName: "Nguyen Quang Khanh",
        senderRole: "CUSTOMER",
        messageType: "TEXT",
        content: "Requested Revision #1 (1/1 quota used): Can we add a katana slash animation in frame 2?",
        createdAt: "2026-10-20T15:00:00Z",
      },
      {
        id: "msg-5",
        commissionId: "com-1",
        senderId: "staff-01",
        senderName: "Pham Tran Trung Hieu (Staff)",
        senderRole: "STAFF",
        messageType: "DELIVERABLE_CARD",
        content:
          "Updated Draft v2 with the katana slash animation is ready! You can approve v2 (or revert to v1), or request an extra revision (+10% fee since 1/1 included revision was used).",
        deliverableMeta: {
          submissionId: "sub-102",
          versionNumber: 2,
          note: "v2 with animated katana slash.",
        },
        createdAt: "2026-10-21T14:05:00Z",
      },
    ],
    createdAt: "2026-10-19T09:00:00Z",
    updatedAt: "2026-10-21T14:05:00Z",
  },
  {
    id: "com-2",
    requestCode: "COM-2026-0002",
    customerId: "cus-01",
    customerName: "Nguyen Quang Khanh",
    assignedStaffId: "staff-02",
    assignedStaffName: "Dang Phuoc Nguyen",
    title: "Shiba Inu Turn-Signal Wave",
    description:
      "Cute pixel Shiba Inu waving paw to thank drivers behind me. Needs to fit 32x32 matrix clearly.",
    targetMatrixSize: "32x32",
    animationType: "ANIMATED",
    status: "QUOTED",
    serviceTier: "ADVANCED",
    initialPrice: 450000,
    extraRevisionFee: 0,
    totalPrice: 450000,
    maxRevisions: 3,
    revisionsUsed: 0,
    quoteExpiresAt: "2026-10-22T20:00:00Z",
    isSlaOverdue: false,
    attachments: [
      {
        id: "att-2",
        fileName: "shiba_wave_sketch.gif",
        fileSizeBytes: 42100,
        previewType: "SHIBA",
        createdAt: "2026-10-21T08:00:00Z",
      },
    ],
    submissions: [],
    messages: [
      {
        id: "msg-201",
        commissionId: "com-2",
        senderId: "SYSTEM",
        senderName: "System",
        senderRole: "SYSTEM",
        messageType: "SYSTEM_EVENT",
        content:
          "Request COM-2026-0002 created and auto-assigned to Staff Dang Phuoc Nguyen via Round-Robin (BR-FL3-07).",
        createdAt: "2026-10-21T08:00:00Z",
      },
      {
        id: "msg-202",
        commissionId: "com-2",
        senderId: "cus-01",
        senderName: "Nguyen Quang Khanh",
        senderRole: "CUSTOMER",
        messageType: "TEXT",
        content: "Hi! I want 3 revisions just in case I want to tweak the ear bounce speed.",
        createdAt: "2026-10-21T08:10:00Z",
      },
      {
        id: "msg-203",
        commissionId: "com-2",
        senderId: "staff-02",
        senderName: "Dang Phuoc Nguyen (Staff)",
        senderRole: "STAFF",
        messageType: "QUOTATION_CARD",
        content: "We've prepared an Advanced Tier quotation (3 revisions included) for your 32x32 Shiba Inu animation:",
        quotationMeta: {
          quotePrice: 450000,
          serviceTier: "ADVANCED",
          maxRevisions: 3,
          scopeSummary: "32x32 Animated Shiba Wave, Advanced Package (3 revisions). Quote valid for 24 hours (BR-FL3-04).",
          expiresAt: "2026-10-22T20:00:00Z",
          cardStatus: "ACTIVE",
        },
        createdAt: "2026-10-21T20:00:00Z",
      },
    ],
    createdAt: "2026-10-21T08:00:00Z",
    updatedAt: "2026-10-21T20:00:00Z",
  },
  {
    id: "com-3",
    requestCode: "COM-2026-0003",
    customerId: "cus-01",
    customerName: "Nguyen Quang Khanh",
    assignedStaffId: "staff-01",
    assignedStaffName: "Pham Tran Trung Hieu",
    assignedDesignerId: "des-01",
    assignedDesignerName: "Le Hoang Tuan",
    title: "Neon Mecha Cat IdleMascot",
    description:
      "Synthwave Mecha Cat with glowing green/gold eyes and twitching cyber whiskers for 32x64 wide display.",
    targetMatrixSize: "32x64",
    animationType: "ANIMATED",
    status: "INTERNAL_REVIEW",
    serviceTier: "BASIC",
    initialPrice: 350000,
    extraRevisionFee: 0,
    totalPrice: 350000,
    maxRevisions: 1,
    revisionsUsed: 0,
    staffInstructions: "Make sure whiskers contrast strongly on 32x64 layout. Keep file under 150KB.",
    slaDueAt: "2026-10-23T18:00:00Z",
    isSlaOverdue: false,
    attachments: [],
    submissions: [
      {
        id: "sub-301",
        commissionId: "com-3",
        designerId: "des-01",
        designerName: "Le Hoang Tuan",
        versionNumber: 1,
        matrixSize: "32x64",
        fps: 10,
        fileSizeBytes: 48900,
        sourceType: "PIXEL_STUDIO",
        pixelFrames: createPresetFrames("MECHA_CAT"),
        releaseNotes: "v1 Neon Mecha Cat with dual-frame whisker & eye color shift.",
        reviewStatus: "PENDING_STAFF_QA",
        createdAt: "2026-10-21T19:30:00Z",
      },
    ],
    messages: [
      {
        id: "msg-301",
        commissionId: "com-3",
        senderId: "SYSTEM",
        senderName: "System",
        senderRole: "SYSTEM",
        messageType: "SYSTEM_EVENT",
        content: "Customer paid 350,000 VND into Escrow (BR-FL3-01). Ticket assigned to Designer Le Hoang Tuan.",
        createdAt: "2026-10-20T18:00:00Z",
      },
    ],
    createdAt: "2026-10-20T16:00:00Z",
    updatedAt: "2026-10-21T19:30:00Z",
  },
];

interface CommissionStore {
  commissions: CommissionRequest[];
  customGallery: CustomGalleryItem[];
  lastAssignedStaffIndex: number;

  // Step 1: Customer Request Intake & Pre-quote editing
  createCommission: (payload: {
    customerId: string;
    customerName: string;
    title: string;
    description: string;
    targetMatrixSize: MatrixSize;
    animationType: AnimationType;
    attachmentNames: string[];
  }) => string;

  updateBrief: (
    commissionId: string,
    actorRole: "CUSTOMER" | "STAFF",
    payload: {
      title: string;
      description: string;
      targetMatrixSize: MatrixSize;
      animationType: AnimationType;
    }
  ) => void;

  // Chat (Customer <-> Staff only, BR-FL3-03)
  sendChatMessage: (
    commissionId: string,
    sender: { id: string; name: string; role: "CUSTOMER" | "STAFF" },
    content: string
  ) => void;

  // Step 2: Staff Pricing & Quotation (BR-FL3-02, BR-FL3-04)
  issueQuotation: (
    commissionId: string,
    payload: {
      quotePrice: number;
      serviceTier: ServiceTier;
      maxRevisions: number;
      scopeSummary: string;
    }
  ) => void;

  declineQuotation: (commissionId: string, messageId: string, reasonNote?: string) => void;
  simulateQuoteExpiry: (commissionId: string, messageId: string) => void;

  // Cancel / Reject
  cancelByCustomer: (commissionId: string, reason: string) => void;
  rejectOrRefundByStaff: (commissionId: string, reason: string) => void;

  // Step 3: Escrow Payment (BR-FL3-01)
  payInitialQuote: (commissionId: string, messageId: string, gateway: PaymentGateway) => void;

  // Step 4: Designer Assignment & 72h SLA (BR-FL3-05)
  assignDesigner: (
    commissionId: string,
    designerId: string,
    staffInstructions: string
  ) => void;
  toggleSimulateSlaOverdue: (commissionId: string) => void;

  // Step 5 & 6: Designer Creation & Submission (BR-GEN-08, BR-FL2-03)
  submitDesignerDraft: (
    commissionId: string,
    payload: {
      designerId: string;
      designerName: string;
      fps: number;
      fileSizeBytes: number;
      sourceType: "PIXEL_STUDIO" | "EXTERNAL_IMPORT";
      pixelFrames: string[][][];
      externalDataUrl?: string;
      releaseNotes: string;
    }
  ) => void;

  // Step 7: Staff Quality Review (Internal QA vs Deliverable Card)
  reviewSubmissionByStaff: (
    commissionId: string,
    submissionId: string,
    decision: "APPROVE_TO_CUSTOMER" | "REJECT_INTERNALLY",
    feedbackNote: string
  ) => void;

  // Step 8: Customer Review, Revisions (+10% Extra Fee), Version Revert & Final Delivery (BR-FL3-02, BR-FL3-06)
  requestCustomerRevision: (
    commissionId: string,
    submissionId: string,
    customerFeedback: string
  ) => void;

  payExtraRevisionFee: (
    commissionId: string,
    messageId: string,
    gateway: PaymentGateway
  ) => void;

  relayCustomerRevisionToDesigner: (
    commissionId: string,
    staffInstructions: string
  ) => void;

  approveDeliverableVersion: (
    commissionId: string,
    submissionId: string,
    triggeredBy?: "CUSTOMER" | "STAFF_AUTO_COMPLETE"
  ) => void;

  resetDemoData: () => void;
}

export const useCommissionStore = create<CommissionStore>()(
  persist(
    (set, get) => ({
      commissions: INITIAL_COMMISSIONS,
      customGallery: [],
      lastAssignedStaffIndex: 0,

      createCommission: (payload) => {
        const state = get();
        const nextStaffIndex = (state.lastAssignedStaffIndex + 1) % STAFF_MEMBERS.length;
        const assignedStaff = STAFF_MEMBERS[nextStaffIndex];
        const nextNum = state.commissions.length + 1;
        const requestCode = `COM-2026-${String(nextNum).padStart(4, "0")}`;
        const newId = `com-${Date.now()}`;
        const now = new Date().toISOString();

        const newCommission: CommissionRequest = {
          id: newId,
          requestCode,
          customerId: payload.customerId,
          customerName: payload.customerName,
          assignedStaffId: assignedStaff.id,
          assignedStaffName: assignedStaff.name,
          title: payload.title,
          description: payload.description,
          targetMatrixSize: payload.targetMatrixSize,
          animationType: payload.animationType,
          status: "PENDING_REVIEW",
          initialPrice: 0,
          extraRevisionFee: 0,
          totalPrice: 0,
          maxRevisions: 1,
          revisionsUsed: 0,
          isSlaOverdue: false,
          attachments: payload.attachmentNames.map((name, idx) => ({
            id: `att-${Date.now()}-${idx}`,
            fileName: name,
            fileSizeBytes: 52000 + idx * 14000,
            previewType: "HEART_SIGNAL",
            createdAt: now,
          })),
          submissions: [],
          messages: [
            {
              id: `msg-${Date.now()}`,
              commissionId: newId,
              senderId: "SYSTEM",
              senderName: "System",
              senderRole: "SYSTEM",
              messageType: "SYSTEM_EVENT",
              content: `Request ${requestCode} submitted and auto-assigned to Staff ${assignedStaff.name} via Round-Robin (BR-FL3-07).`,
              createdAt: now,
            },
          ],
          createdAt: now,
          updatedAt: now,
        };

        set({
          commissions: [newCommission, ...state.commissions],
          lastAssignedStaffIndex: nextStaffIndex,
        });

        return newId;
      },

      updateBrief: (commissionId, actorRole, payload) => {
        const now = new Date().toISOString();
        set((state) => ({
          commissions: state.commissions.map((com) => {
            if (com.id !== commissionId) return com;
            if (com.status !== "PENDING_REVIEW" && com.status !== "PRICE_EXPIRED") {
              return com;
            }
            return {
              ...com,
              title: payload.title,
              description: payload.description,
              targetMatrixSize: payload.targetMatrixSize,
              animationType: payload.animationType,
              updatedAt: now,
              messages: [
                ...com.messages,
                {
                  id: `msg-${Date.now()}`,
                  commissionId,
                  senderId: "SYSTEM",
                  senderName: "System",
                  senderRole: "SYSTEM",
                  messageType: "SYSTEM_EVENT",
                  content: `Request brief updated by ${actorRole} (${payload.targetMatrixSize}, ${payload.animationType}).`,
                  createdAt: now,
                },
              ],
            };
          }),
        }));
      },

      sendChatMessage: (commissionId, sender, content) => {
        if (!content.trim()) return;
        const now = new Date().toISOString();
        set((state) => ({
          commissions: state.commissions.map((com) =>
            com.id === commissionId
              ? {
                  ...com,
                  updatedAt: now,
                  messages: [
                    ...com.messages,
                    {
                      id: `msg-${Date.now()}`,
                      commissionId,
                      senderId: sender.id,
                      senderName: sender.name,
                      senderRole: sender.role,
                      messageType: "TEXT",
                      content,
                      createdAt: now,
                    },
                  ],
                }
              : com
          ),
        }));
      },

      issueQuotation: (commissionId, payload) => {
        const now = new Date();
        const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
        const nowIso = now.toISOString();

        set((state) => ({
          commissions: state.commissions.map((com) => {
            if (com.id !== commissionId) return com;
            const updatedMessages = com.messages.map((m) =>
              m.messageType === "QUOTATION_CARD" && m.quotationMeta?.cardStatus === "ACTIVE"
                ? {
                    ...m,
                    quotationMeta: { ...m.quotationMeta, cardStatus: "SUPERSEDED" as const },
                  }
                : m
            );

            return {
              ...com,
              status: "QUOTED",
              serviceTier: payload.serviceTier,
              initialPrice: payload.quotePrice,
              totalPrice: payload.quotePrice + com.extraRevisionFee,
              maxRevisions: payload.maxRevisions,
              quoteExpiresAt: expiresAt,
              updatedAt: nowIso,
              messages: [
                ...updatedMessages,
                {
                  id: `msg-${Date.now()}`,
                  commissionId,
                  senderId: com.assignedStaffId,
                  senderName: `${com.assignedStaffName} (Staff)`,
                  senderRole: "STAFF",
                  messageType: "QUOTATION_CARD",
                  content: `Official Quotation issued (${payload.serviceTier} Tier — ${payload.maxRevisions} revisions included). Request brief is now locked.`,
                  quotationMeta: {
                    quotePrice: payload.quotePrice,
                    serviceTier: payload.serviceTier,
                    maxRevisions: payload.maxRevisions,
                    scopeSummary: payload.scopeSummary,
                    expiresAt,
                    cardStatus: "ACTIVE",
                  },
                  createdAt: nowIso,
                },
              ],
            };
          }),
        }));
      },

      declineQuotation: (commissionId, messageId, reasonNote) => {
        const now = new Date().toISOString();
        set((state) => ({
          commissions: state.commissions.map((com) => {
            if (com.id !== commissionId) return com;
            return {
              ...com,
              status: "PENDING_REVIEW",
              updatedAt: now,
              messages: [
                ...com.messages.map((m) =>
                  m.id === messageId && m.quotationMeta
                    ? {
                        ...m,
                        quotationMeta: { ...m.quotationMeta, cardStatus: "DECLINED" as const },
                      }
                    : m
                ),
                {
                  id: `msg-${Date.now()}`,
                  commissionId,
                  senderId: com.customerId,
                  senderName: com.customerName,
                  senderRole: "CUSTOMER",
                  messageType: "TEXT",
                  content: reasonNote
                    ? `Declined quote to negotiate: ${reasonNote}`
                    : "I'd like to negotiate the quotation / adjust the brief.",
                  createdAt: now,
                },
              ],
            };
          }),
        }));
      },

      simulateQuoteExpiry: (commissionId, messageId) => {
        const now = new Date().toISOString();
        set((state) => ({
          commissions: state.commissions.map((com) => {
            if (com.id !== commissionId) return com;
            return {
              ...com,
              status: "PRICE_EXPIRED",
              updatedAt: now,
              messages: [
                ...com.messages.map((m) =>
                  m.id === messageId && m.quotationMeta
                    ? {
                        ...m,
                        quotationMeta: { ...m.quotationMeta, cardStatus: "EXPIRED" as const },
                      }
                    : m
                ),
                {
                  id: `msg-${Date.now()}`,
                  commissionId,
                  senderId: "SYSTEM",
                  senderName: "System",
                  senderRole: "SYSTEM",
                  messageType: "SYSTEM_EVENT",
                  content:
                    "Quotation expired after 24 hours without payment (BR-FL3-04). Status changed to PRICE_EXPIRED. Staff may issue a revised quotation.",
                  createdAt: now,
                },
              ],
            };
          }),
        }));
      },

      cancelByCustomer: (commissionId, reason) => {
        const now = new Date().toISOString();
        set((state) => ({
          commissions: state.commissions.map((com) => {
            if (com.id !== commissionId) return com;
            return {
              ...com,
              status: "CANCELLED",
              rejectionOrCancelReason: reason,
              updatedAt: now,
              messages: [
                ...com.messages,
                {
                  id: `msg-${Date.now()}`,
                  commissionId,
                  senderId: "SYSTEM",
                  senderName: "System",
                  senderRole: "SYSTEM",
                  messageType: "SYSTEM_EVENT",
                  content: `Commission cancelled by Customer. Reason: ${reason}`,
                  createdAt: now,
                },
              ],
            };
          }),
        }));
      },

      rejectOrRefundByStaff: (commissionId, reason) => {
        const now = new Date().toISOString();
        set((state) => ({
          commissions: state.commissions.map((com) => {
            if (com.id !== commissionId) return com;
            const isPaid = [
              "PAID_ESCROW",
              "IN_PROGRESS",
              "INTERNAL_REVIEW",
              "INTERNAL_REVISION_REQUIRED",
              "DELIVERED_PREVIEW",
              "CUSTOMER_REVISION_REQUESTED",
              "AWAITING_EXTRA_PAYMENT",
            ].includes(com.status);
            const nextStatus: CommissionStatus = isPaid ? "REFUNDED" : "REJECTED";
            return {
              ...com,
              status: nextStatus,
              rejectionOrCancelReason: reason,
              updatedAt: now,
              messages: [
                ...com.messages,
                {
                  id: `msg-${Date.now()}`,
                  commissionId,
                  senderId: "SYSTEM",
                  senderName: "System",
                  senderRole: "SYSTEM",
                  messageType: "SYSTEM_EVENT",
                  content: isPaid
                    ? `Commission cancelled & 100% Escrow (${com.totalPrice.toLocaleString()} VND) refunded by Staff. Reason: ${reason}`
                    : `Commission rejected by Staff. Reason: ${reason}`,
                  createdAt: now,
                },
              ],
            };
          }),
        }));
      },

      payInitialQuote: (commissionId, messageId, gateway) => {
        const now = new Date().toISOString();
        set((state) => ({
          commissions: state.commissions.map((com) => {
            if (com.id !== commissionId) return com;
            return {
              ...com,
              status: "PAID_ESCROW",
              updatedAt: now,
              messages: [
                ...com.messages.map((m) =>
                  m.id === messageId && m.quotationMeta
                    ? {
                        ...m,
                        quotationMeta: {
                          ...m.quotationMeta,
                          cardStatus: "PAID" as const,
                          paidGateway: gateway,
                        },
                      }
                    : m
                ),
                {
                  id: `msg-${Date.now()}`,
                  commissionId,
                  senderId: "SYSTEM",
                  senderName: "System",
                  senderRole: "SYSTEM",
                  messageType: "SYSTEM_EVENT",
                  content: `100% Payment (${com.initialPrice.toLocaleString()} VND) verified via ${gateway} and held in Escrow (BR-FL3-01). Ready for Staff to assign a Designer.`,
                  createdAt: now,
                },
              ],
            };
          }),
        }));
      },

      assignDesigner: (commissionId, designerId, staffInstructions) => {
        const designer = DESIGNER_MEMBERS.find((d) => d.id === designerId) ?? DESIGNER_MEMBERS[0];
        const now = new Date();
        const slaDueAt = new Date(now.getTime() + 72 * 60 * 60 * 1000).toISOString();
        const nowIso = now.toISOString();

        set((state) => ({
          commissions: state.commissions.map((com) => {
            if (com.id !== commissionId) return com;
            const isReassign = Boolean(com.assignedDesignerId && com.assignedDesignerId !== designer.id);
            return {
              ...com,
              status: "IN_PROGRESS",
              assignedDesignerId: designer.id,
              assignedDesignerName: designer.name,
              staffInstructions,
              slaDueAt,
              isSlaOverdue: false,
              updatedAt: nowIso,
              messages: [
                ...com.messages,
                {
                  id: `msg-${Date.now()}`,
                  commissionId,
                  senderId: "SYSTEM",
                  senderName: "System",
                  senderRole: "SYSTEM",
                  messageType: "SYSTEM_EVENT",
                  content: isReassign
                    ? `Ticket reassigned to Designer ${designer.name} (72h SLA reset — BR-FL3-05).`
                    : `Ticket assigned to Designer ${designer.name}. First draft due within 72 hours (BR-FL3-05).`,
                  createdAt: nowIso,
                },
              ],
            };
          }),
        }));
      },

      toggleSimulateSlaOverdue: (commissionId) => {
        set((state) => ({
          commissions: state.commissions.map((com) =>
            com.id === commissionId ? { ...com, isSlaOverdue: !com.isSlaOverdue } : com
          ),
        }));
      },

      submitDesignerDraft: (commissionId, payload) => {
        const now = new Date().toISOString();
        set((state) => ({
          commissions: state.commissions.map((com) => {
            if (com.id !== commissionId) return com;
            const nextVersion = com.submissions.length + 1;
            const newSub: CommissionSubmission = {
              id: `sub-${Date.now()}`,
              commissionId,
              designerId: payload.designerId,
              designerName: payload.designerName,
              versionNumber: nextVersion,
              matrixSize: com.targetMatrixSize,
              fps: payload.fps,
              fileSizeBytes: payload.fileSizeBytes,
              sourceType: payload.sourceType,
              pixelFrames: payload.pixelFrames,
              externalDataUrl: payload.externalDataUrl,
              releaseNotes: payload.releaseNotes,
              reviewStatus: "PENDING_STAFF_QA",
              createdAt: now,
            };

            return {
              ...com,
              status: "INTERNAL_REVIEW",
              isSlaOverdue: false,
              updatedAt: now,
              submissions: [...com.submissions, newSub],
            };
          }),
        }));
      },

      reviewSubmissionByStaff: (commissionId, submissionId, decision, feedbackNote) => {
        const now = new Date();
        const nowIso = now.toISOString();
        const autoCompleteAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

        set((state) => ({
          commissions: state.commissions.map((com) => {
            if (com.id !== commissionId) return com;
            const targetSub = com.submissions.find((s) => s.id === submissionId);
            if (!targetSub) return com;

            if (decision === "REJECT_INTERNALLY") {
              return {
                ...com,
                status: "INTERNAL_REVISION_REQUIRED",
                updatedAt: nowIso,
                submissions: com.submissions.map((s) =>
                  s.id === submissionId
                    ? {
                        ...s,
                        reviewStatus: "STAFF_REJECTED",
                        staffFeedback: feedbackNote,
                        reviewedByStaffAt: nowIso,
                      }
                    : s
                ),
              };
            }

            // APPROVE_TO_CUSTOMER
            return {
              ...com,
              status: "DELIVERED_PREVIEW",
              autoCompleteAt,
              updatedAt: nowIso,
              submissions: com.submissions.map((s) =>
                s.id === submissionId
                  ? {
                      ...s,
                      reviewStatus: "STAFF_APPROVED",
                      staffFeedback: feedbackNote || "Approved by Staff QA.",
                      reviewedByStaffAt: nowIso,
                    }
                  : s
              ),
              messages: [
                ...com.messages,
                {
                  id: `msg-${Date.now()}`,
                  commissionId,
                  senderId: com.assignedStaffId,
                  senderName: `${com.assignedStaffName} (Staff)`,
                  senderRole: "STAFF",
                  messageType: "DELIVERABLE_CARD",
                  content:
                    feedbackNote ||
                    `Draft v${targetSub.versionNumber} has passed Staff QA! Preview it below to Approve or Request a Revision.`,
                  deliverableMeta: {
                    submissionId: targetSub.id,
                    versionNumber: targetSub.versionNumber,
                    note: feedbackNote || `Deliverable v${targetSub.versionNumber}`,
                  },
                  createdAt: nowIso,
                },
              ],
            };
          }),
        }));
      },

      requestCustomerRevision: (commissionId, submissionId, customerFeedback) => {
        const now = new Date().toISOString();
        set((state) => ({
          commissions: state.commissions.map((com) => {
            if (com.id !== commissionId) return com;
            const hasIncludedQuota = com.revisionsUsed < com.maxRevisions;

            if (hasIncludedQuota) {
              return {
                ...com,
                status: "CUSTOMER_REVISION_REQUESTED",
                updatedAt: now,
                submissions: com.submissions.map((s) =>
                  s.id === submissionId ? { ...s, customerFeedback } : s
                ),
                messages: [
                  ...com.messages,
                  {
                    id: `msg-${Date.now()}`,
                    commissionId,
                    senderId: com.customerId,
                    senderName: com.customerName,
                    senderRole: "CUSTOMER",
                    messageType: "TEXT",
                    content: `Revision Requested (Included Quota ${com.revisionsUsed + 1}/${com.maxRevisions}): "${customerFeedback}"`,
                    createdAt: now,
                  },
                ],
              };
            }

            // Exceeded quota -> BR-FL3-02 (+10% of initialPrice)
            const extraFee = Math.round(com.initialPrice * 0.1);
            return {
              ...com,
              status: "AWAITING_EXTRA_PAYMENT",
              updatedAt: now,
              submissions: com.submissions.map((s) =>
                s.id === submissionId ? { ...s, customerFeedback } : s
              ),
              messages: [
                ...com.messages,
                {
                  id: `msg-${Date.now()}`,
                  commissionId,
                  senderId: "SYSTEM",
                  senderName: "System",
                  senderRole: "SYSTEM",
                  messageType: "EXTRA_FEE_CARD",
                  content: `You have used all ${com.maxRevisions} included revision(s). Per BR-FL3-02, an extra revision requires a +10% surcharge (${extraFee.toLocaleString()} VND) before reopening the design flow.`,
                  extraFeeMeta: {
                    feeAmount: extraFee,
                    reason: "+10% Extra Revision Surcharge (BR-FL3-02)",
                    revisionFeedback: customerFeedback,
                    targetSubmissionId: submissionId,
                    cardStatus: "PENDING_PAYMENT",
                  },
                  createdAt: now,
                },
              ],
            };
          }),
        }));
      },

      payExtraRevisionFee: (commissionId, messageId, gateway) => {
        const now = new Date().toISOString();
        set((state) => ({
          commissions: state.commissions.map((com) => {
            if (com.id !== commissionId) return com;
            const cardMsg = com.messages.find((m) => m.id === messageId);
            const feeAmount = cardMsg?.extraFeeMeta?.feeAmount ?? Math.round(com.initialPrice * 0.1);
            const newExtraFee = com.extraRevisionFee + feeAmount;

            return {
              ...com,
              status: "CUSTOMER_REVISION_REQUESTED",
              extraRevisionFee: newExtraFee,
              totalPrice: com.initialPrice + newExtraFee,
              maxRevisions: com.maxRevisions + 1,
              updatedAt: now,
              messages: [
                ...com.messages.map((m) =>
                  m.id === messageId && m.extraFeeMeta
                    ? {
                        ...m,
                        extraFeeMeta: {
                          ...m.extraFeeMeta,
                          cardStatus: "PAID" as const,
                          paidGateway: gateway,
                        },
                      }
                    : m
                ),
                {
                  id: `msg-${Date.now()}`,
                  commissionId,
                  senderId: "SYSTEM",
                  senderName: "System",
                  senderRole: "SYSTEM",
                  messageType: "SYSTEM_EVENT",
                  content: `Extra Revision Fee (+${feeAmount.toLocaleString()} VND) paid via ${gateway} (BR-FL3-09). Total Commission Price updated to ${(com.initialPrice + newExtraFee).toLocaleString()} VND. Staff can now relay the revision brief to the Designer.`,
                  createdAt: now,
                },
              ],
            };
          }),
        }));
      },

      relayCustomerRevisionToDesigner: (commissionId, staffInstructions) => {
        const now = new Date().toISOString();
        set((state) => ({
          commissions: state.commissions.map((com) => {
            if (com.id !== commissionId) return com;
            const nextUsed = com.revisionsUsed + 1;
            return {
              ...com,
              status: "IN_PROGRESS",
              revisionsUsed: nextUsed,
              staffInstructions,
              updatedAt: now,
              messages: [
                ...com.messages,
                {
                  id: `msg-${Date.now()}`,
                  commissionId,
                  senderId: "SYSTEM",
                  senderName: "System",
                  senderRole: "SYSTEM",
                  messageType: "SYSTEM_EVENT",
                  content: `Staff relayed Revision #${nextUsed} (${nextUsed}/${com.maxRevisions} used) to Designer ${com.assignedDesignerName}.`,
                  createdAt: now,
                },
              ],
            };
          }),
        }));
      },

      approveDeliverableVersion: (commissionId, submissionId, triggeredBy = "CUSTOMER") => {
        const now = new Date().toISOString();
        set((state) => {
          const targetCom = state.commissions.find((c) => c.id === commissionId);
          const targetSub = targetCom?.submissions.find((s) => s.id === submissionId);
          if (!targetCom || !targetSub) return state;

          const newGalleryItem: CustomGalleryItem = {
            id: `gal-${Date.now()}`,
            ownerId: targetCom.customerId,
            commissionId: targetCom.id,
            requestCode: targetCom.requestCode,
            sourceSubmissionId: targetSub.id,
            versionNumber: targetSub.versionNumber,
            title: targetCom.title,
            category: "CUSTOM_COMMISSION",
            matrixSize: targetSub.matrixSize,
            fps: targetSub.fps,
            pixelFrames: targetSub.pixelFrames,
            externalDataUrl: targetSub.externalDataUrl,
            ledartBinaryName: `${targetCom.requestCode.toLowerCase()}_v${targetSub.versionNumber}.ledart`,
            fileSizeBytes: Math.min(targetSub.fileSizeBytes, 128000),
            isCustom: true,
            isPrivate: true,
            grantedAt: now,
          };

          const alreadyGranted = state.customGallery.some(
            (g) => g.commissionId === targetCom.id
          );

          return {
            customGallery: alreadyGranted
              ? state.customGallery.map((g) =>
                  g.commissionId === targetCom.id ? newGalleryItem : g
                )
              : [newGalleryItem, ...state.customGallery],
            commissions: state.commissions.map((com) =>
              com.id === commissionId
                ? {
                    ...com,
                    status: "COMPLETED",
                    approvedSubmissionId: submissionId,
                    updatedAt: now,
                    submissions: com.submissions.map((s) =>
                      s.id === submissionId ? { ...s, reviewStatus: "FINAL_APPROVED" } : s
                    ),
                    messages: [
                      ...com.messages,
                      {
                        id: `msg-${Date.now()}`,
                        commissionId,
                        senderId: "SYSTEM",
                        senderName: "System",
                        senderRole: "SYSTEM",
                        messageType: "SYSTEM_EVENT",
                        content:
                          triggeredBy === "CUSTOMER"
                            ? `Customer approved Draft v${targetSub.versionNumber}! Commission COMPLETED. Exclusive character provisioned to Customer Private Gallery (${newGalleryItem.ledartBinaryName}) and permanently locked from public Store publishing (BR-FL3-06).`
                            : `7-day review window completed / finalized by Staff for Draft v${targetSub.versionNumber}. Exclusive character provisioned to Customer Private Gallery (BR-FL3-06).`,
                        createdAt: now,
                      },
                    ],
                  }
                : com
            ),
          };
        });
      },

      resetDemoData: () =>
        set({
          commissions: INITIAL_COMMISSIONS,
          customGallery: [],
          lastAssignedStaffIndex: 0,
        }),
    }),
    {
      name: "led-windshield-commission-store-v1",
    }
  )
);
