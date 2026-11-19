import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { MatrixSize } from "./CommissionStore";

export type FirmwareStatus =
  | "ACTIVE" // Current latest release served by OTA Check
  | "PREVIOUS_STABLE" // Retained in the >=3 history window for instant rollback (BR-FL4-05)
  | "ARCHIVED" // Older historical release
  | "DEPRECATED"; // Revoked due to critical defect (DEV-13 / BR-FL4-05)

export type ReleaseChannel = "STABLE" | "HOTFIX" | "SECURITY_PATCH";

export interface LedHardwareModel {
  id: string;
  modelCode: string;
  displayName: string;
  hardwareRevision: string; // BR-FL4-03: Header in .bin must match this exact revision
  chipset: string;
  matrixSize: MatrixSize;
  flashSizeMb: number;
  partitionScheme: string;
  activeDevicesCount: number;
  stockAvailable: number;
  stockWarrantyReserved: number;
}

export interface FirmwareRelease {
  id: string;
  ledModelId: string;
  targetHardwareRevision: string; // BR-FL4-03
  version: string; // Semantic version e.g. "2.4.0"
  fileName: string; // Must be .bin (BR-GEN-08)
  fileSizeBytes: number;
  sha256Checksum: string; // 64-hex char SHA-256 (BR-FL4-02)
  binaryMagicByte: string; // e.g. "0xE9 (ESP32 App Image)"
  channel: ReleaseChannel;
  isMandatory: boolean;
  isRollbackTarget?: boolean;
  status: FirmwareStatus;
  changelog: string;
  deprecationReason?: string;
  deprecatedAt?: string;
  deprecatedBy?: string;
  uploadedBy: string;
  uploadedAt: string;
  adoptionCount: number;
}

export type OtaPartition = "ota_0" | "ota_1";

export type DeviceConnectionMode = "WIFI" | "BLE_ONLY" | "OFFLINE";

export interface FleetDeviceInstance {
  id: string;
  serialNumber: string;
  macAddress: string;
  ownerName: string;
  ownerEmail: string;
  ledModelId: string;
  hardwareRevision: string;
  currentFirmwareVersion: string;
  activePartition: OtaPartition;
  standbyPartition: OtaPartition;
  standbyFirmwareVersion: string | null;
  connectionMode: DeviceConnectionMode;
  wifiSsid?: string;
  wifiRssiDbm?: number;
  lastOtaCheckAt: string;
  lastOtaResult:
    | "UP_TO_DATE"
    | "UPDATE_AVAILABLE"
    | "ROLLBACK_REQUIRED"
    | "OTA_SUCCESS"
    | "FAILED_CHECKSUM_KEPT_SAFE_PARTITION"
    | "FAILED_WIFI_DROP_KEPT_SAFE_PARTITION"
    | "FAILED_BOOT_AUTO_ROLLBACK"
    | "BLOCKED_BLE_ONLY"
    | "BLOCKED_HW_REV_MISMATCH";
  lastOtaMessage: string;
}

export interface FirmwareAuditLog {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  ipAddress: string;
  action:
    | "FIRMWARE_UPLOADED"
    | "FIRMWARE_DEPRECATED"
    | "FIRMWARE_ROLLBACK_ACTIVATED"
    | "OTA_CHECK_PERFORMED"
    | "OTA_FLASH_COMPLETED"
    | "OTA_SAFE_PARTITION_RETAINED";
  targetModelCode: string;
  targetVersion: string;
  sha256Snippet: string;
  details: string;
}

interface UploadFirmwareInput {
  ledModelId: string;
  version: string;
  fileName: string;
  fileSizeBytes: number;
  extractedHeaderHwRev: string;
  sha256Checksum: string;
  channel: ReleaseChannel;
  isMandatory: boolean;
  changelog: string;
  adminName: string;
}

interface FirmwareStore {
  ledModels: LedHardwareModel[];
  releases: FirmwareRelease[];
  fleetDevices: FleetDeviceInstance[];
  auditLogs: FirmwareAuditLog[];

  uploadFirmwareRelease: (input: UploadFirmwareInput) => {
    ok: boolean;
    errorCode?: string;
    message: string;
    release?: FirmwareRelease;
  };

  deprecateFirmwareRelease: (
    releaseId: string,
    reason: string,
    rollbackTargetId: string | null,
    adminName: string
  ) => {
    ok: boolean;
    message: string;
  };

  promoteToActiveRelease: (
    releaseId: string,
    reason: string,
    adminName: string
  ) => {
    ok: boolean;
    message: string;
  };

  setDeviceConnectionMode: (deviceId: string, mode: DeviceConnectionMode) => void;

  applySimulatedOtaOutcome: (
    deviceId: string,
    outcome:
      | "SUCCESS"
      | "WIFI_INTERRUPTED"
      | "CHECKSUM_MISMATCH"
      | "BOOT_FAIL_AUTO_ROLLBACK"
      | "BLE_BLOCKED",
    targetRelease: FirmwareRelease
  ) => void;

  resetFirmwareDemo: () => void;
}

const INITIAL_LED_MODELS: LedHardwareModel[] = [
  {
    id: "model-64x64-pro",
    modelCode: "LUM-64x64-PRO",
    displayName: "Lumintra Matrix Pro 64×64 (CAN-Bus Edition)",
    hardwareRevision: "ESP32-S3-REV2.1",
    chipset: "ESP32-S3-WROOM-1 (Dual-Core 240MHz)",
    matrixSize: "64x64",
    flashSizeMb: 8,
    partitionScheme: "Dual OTA (ota_0: 3MB / ota_1: 3MB / nvs + spiffs: 2MB)",
    activeDevicesCount: 142,
    stockAvailable: 38,
    stockWarrantyReserved: 6,
  },
  {
    id: "model-32x64-wide",
    modelCode: "LUM-32x64-WIDE",
    displayName: "Lumintra Rear Banner 32×64",
    hardwareRevision: "ESP32-WROOM-REV1.4",
    chipset: "ESP32-WROOM-32E (Dual-Core 160MHz)",
    matrixSize: "32x64",
    flashSizeMb: 4,
    partitionScheme: "Dual OTA (ota_0: 1.5MB / ota_1: 1.5MB / spiffs: 1MB)",
    activeDevicesCount: 89,
    stockAvailable: 24,
    stockWarrantyReserved: 4,
  },
  {
    id: "model-32x32-mini",
    modelCode: "LUM-32x32-MINI",
    displayName: "Lumintra Compact Cube 32×32",
    hardwareRevision: "ESP32-C3-REV1.0",
    chipset: "ESP32-C3-MINI-1 (RISC-V 160MHz)",
    matrixSize: "32x32",
    flashSizeMb: 4,
    partitionScheme: "Dual OTA (ota_0: 1.5MB / ota_1: 1.5MB / spiffs: 1MB)",
    activeDevicesCount: 54,
    stockAvailable: 3, // Low stock (<5 BR-FL5-01)
    stockWarrantyReserved: 2,
  },
];

const INITIAL_RELEASES: FirmwareRelease[] = [
  // LUM-64x64-PRO (4 versions to demonstrate >=3 retention + 1 deprecated)
  {
    id: "fw-64-230",
    ledModelId: "model-64x64-pro",
    targetHardwareRevision: "ESP32-S3-REV2.1",
    version: "2.3.0",
    fileName: "lumintra_64x64_s3_rev2.1_v2.3.0.bin",
    fileSizeBytes: 912384,
    sha256Checksum:
      "a94f8c210e7b3d651a89f0c4b23e7d1896a4c5e0f3d2b1a8c7e6f5d4c3b2a190",
    binaryMagicByte: "0xE9 (ESP32-S3 Image)",
    channel: "STABLE",
    isMandatory: false,
    status: "ACTIVE",
    changelog:
      "• Optimized RGB565 DMA refresh pipeline for 64x64 matrix (zero flicker).\n• Enforced 5Hz max strobe safety limiter & LDR auto-brightness curve (BR-GEN-06).\n• Sub-80ms emergency power-off interrupt response (BR-GEN-05).",
    uploadedBy: "Tran Duc Hai (System Admin)",
    uploadedAt: "2026-10-25 14:20",
    adoptionCount: 96,
  },
  {
    id: "fw-64-221-bad",
    ledModelId: "model-64x64-pro",
    targetHardwareRevision: "ESP32-S3-REV2.1",
    version: "2.2.1",
    fileName: "lumintra_64x64_s3_rev2.1_v2.2.1.bin",
    fileSizeBytes: 908112,
    sha256Checksum:
      "d03b7a19c4e82f506b11e9d3a7c580f24e6b9a1c3d5e7f8091a2b3c4d5e6f701",
    binaryMagicByte: "0xE9 (ESP32-S3 Image)",
    channel: "HOTFIX",
    isMandatory: false,
    status: "DEPRECATED",
    deprecationReason:
      "Critical DMA buffer race condition when switching from Idle slot to Brake slot over CAN-bus. Revoked per BR-FL4-05.",
    deprecatedAt: "2026-10-19 09:45",
    deprecatedBy: "Tran Duc Hai (System Admin)",
    changelog:
      "• Experimental CAN-bus high-frequency polling for turn/brake slot transitions.",
    uploadedBy: "Tran Duc Hai (System Admin)",
    uploadedAt: "2026-10-18 18:10",
    adoptionCount: 4,
  },
  {
    id: "fw-64-220",
    ledModelId: "model-64x64-pro",
    targetHardwareRevision: "ESP32-S3-REV2.1",
    version: "2.2.0",
    fileName: "lumintra_64x64_s3_rev2.1_v2.2.0.bin",
    fileSizeBytes: 894464,
    sha256Checksum:
      "7e11c8b490a2d3f65189e0c4a7b2d1f893c6e5a0b4d3f2a19087c6b5a4d3e2f1",
    binaryMagicByte: "0xE9 (ESP32-S3 Image)",
    channel: "STABLE",
    isMandatory: true,
    isRollbackTarget: true,
    status: "PREVIOUS_STABLE",
    changelog:
      "• Added 4-slot Flash storage (Idle, Left Turn, Right Turn, Brake) (BR-FL2-04).\n• Implemented Unix epoch RTC clock sync on BLE handshake (BR-GEN-10).",
    uploadedBy: "Tran Duc Hai (System Admin)",
    uploadedAt: "2026-10-08 11:00",
    adoptionCount: 35,
  },
  {
    id: "fw-64-210",
    ledModelId: "model-64x64-pro",
    targetHardwareRevision: "ESP32-S3-REV2.1",
    version: "2.1.0",
    fileName: "lumintra_64x64_s3_rev2.1_v2.1.0.bin",
    fileSizeBytes: 876544,
    sha256Checksum:
      "3c8a1f5e90b2d4c67182a9f0e4b3c2d18976f5e4d3c2b1a09f8e7d6c5b4a3f21",
    binaryMagicByte: "0xE9 (ESP32-S3 Image)",
    channel: "STABLE",
    isMandatory: false,
    status: "PREVIOUS_STABLE",
    changelog:
      "• Added native .ledart (LEDW header, RGB565 + RLE) decoder up to 128KB (BR-FL2-11).\n• Dual-partition ota_0/ota_1 watchdog verification.",
    uploadedBy: "Tran Duc Hai (System Admin)",
    uploadedAt: "2026-09-22 16:30",
    adoptionCount: 7,
  },

  // LUM-32x64-WIDE (3 retained versions per BR-FL4-05)
  {
    id: "fw-3264-180",
    ledModelId: "model-32x64-wide",
    targetHardwareRevision: "ESP32-WROOM-REV1.4",
    version: "1.8.0",
    fileName: "lumintra_32x64_wroom_rev1.4_v1.8.0.bin",
    fileSizeBytes: 742400,
    sha256Checksum:
      "f41e9a82b7c30d5619a8e2b4c7d0f3e18a9b6c5d4e3f2a1b0c9d8e7f6a5b4c32",
    binaryMagicByte: "0xE9 (ESP32 Image)",
    channel: "STABLE",
    isMandatory: false,
    status: "ACTIVE",
    changelog:
      "• Wide-aspect scrolling text ticker optimization.\n• Reduced Wi-Fi OTA TLS handshake memory footprint.",
    uploadedBy: "Tran Duc Hai (System Admin)",
    uploadedAt: "2026-10-20 10:15",
    adoptionCount: 71,
  },
  {
    id: "fw-3264-175",
    ledModelId: "model-32x64-wide",
    targetHardwareRevision: "ESP32-WROOM-REV1.4",
    version: "1.7.5",
    fileName: "lumintra_32x64_wroom_rev1.4_v1.7.5.bin",
    fileSizeBytes: 738304,
    sha256Checksum:
      "5b2d8e19a4c70f3628e1b9d4c7a0f5e38291b4c6d7e8f9a0b1c2d3e4f5a6b7c8",
    binaryMagicByte: "0xE9 (ESP32 Image)",
    channel: "SECURITY_PATCH",
    isMandatory: true,
    isRollbackTarget: true,
    status: "PREVIOUS_STABLE",
    changelog:
      "• Factory HMAC-SHA256 QR claim signature verification hardening (BR-FL2-05).",
    uploadedBy: "Tran Duc Hai (System Admin)",
    uploadedAt: "2026-10-02 15:40",
    adoptionCount: 14,
  },
  {
    id: "fw-3264-170",
    ledModelId: "model-32x64-wide",
    targetHardwareRevision: "ESP32-WROOM-REV1.4",
    version: "1.7.0",
    fileName: "lumintra_32x64_wroom_rev1.4_v1.7.0.bin",
    fileSizeBytes: 729088,
    sha256Checksum:
      "9a0c4e21b8d73f6501e9c2a4b7d8f0e31928a7b6c5d4e3f2a1b0c9d8e7f6a543",
    binaryMagicByte: "0xE9 (ESP32 Image)",
    channel: "STABLE",
    isMandatory: false,
    status: "PREVIOUS_STABLE",
    changelog: "• Initial production release for LUM-32x64-WIDE Rear Banner.",
    uploadedBy: "Tran Duc Hai (System Admin)",
    uploadedAt: "2026-09-14 09:00",
    adoptionCount: 4,
  },

  // LUM-32x32-MINI
  {
    id: "fw-3232-120",
    ledModelId: "model-32x32-mini",
    targetHardwareRevision: "ESP32-C3-REV1.0",
    version: "1.2.0",
    fileName: "lumintra_32x32_c3_rev1.0_v1.2.0.bin",
    fileSizeBytes: 618496,
    sha256Checksum:
      "1e8d4c7a90b2f56381a9e0c4b2d7f8193a6c5e0b4d2f1a8c7e6f5d4c3b2a1098",
    binaryMagicByte: "0xE9 (ESP32-C3 Image)",
    channel: "STABLE",
    isMandatory: false,
    status: "ACTIVE",
    changelog:
      "• Low-power RISC-V sleep timer accuracy improvement.\n• BLE ACK 5s timeout + 3x retry handler (BR-FL2-08).",
    uploadedBy: "Tran Duc Hai (System Admin)",
    uploadedAt: "2026-10-12 13:25",
    adoptionCount: 54,
  },
];

const INITIAL_FLEET_DEVICES: FleetDeviceInstance[] = [
  {
    id: "dev-instance-01",
    serialNumber: "LUM-S3-882190",
    macAddress: "A0:B7:65:FE:12:88",
    ownerName: "Nguyen Quang Khanh",
    ownerEmail: "khanhnq@lumintra.shop",
    ledModelId: "model-64x64-pro",
    hardwareRevision: "ESP32-S3-REV2.1",
    currentFirmwareVersion: "2.2.0", // Outdated -> 2.3.0 available!
    activePartition: "ota_0",
    standbyPartition: "ota_1",
    standbyFirmwareVersion: "2.1.0",
    connectionMode: "WIFI",
    wifiSsid: "Khanh_Car_Hotspot_5G",
    wifiRssiDbm: -54,
    lastOtaCheckAt: "2026-10-30 10:55",
    lastOtaResult: "UPDATE_AVAILABLE",
    lastOtaMessage:
      "Update v2.3.0 available for HW Rev ESP32-S3-REV2.1 (891 KB .bin). Ready to flash into standby partition ota_1.",
  },
  {
    id: "dev-instance-02",
    serialNumber: "LUM-S3-882415",
    macAddress: "A0:B7:65:FE:49:10",
    ownerName: "Pham Tran Trung Hieu",
    ownerEmail: "hieuptt@lumintra.shop",
    ledModelId: "model-64x64-pro",
    hardwareRevision: "ESP32-S3-REV2.1",
    currentFirmwareVersion: "2.2.1", // Running DEPRECATED version! Needs rollback/update!
    activePartition: "ota_1",
    standbyPartition: "ota_0",
    standbyFirmwareVersion: "2.2.0",
    connectionMode: "WIFI",
    wifiSsid: "VinFast_VF8_WiFi",
    wifiRssiDbm: -61,
    lastOtaCheckAt: "2026-10-30 10:40",
    lastOtaResult: "ROLLBACK_REQUIRED",
    lastOtaMessage:
      "WARNING: Device is running revoked build v2.2.1! Immediate OTA transition to active stable v2.3.0 (or rollback v2.2.0) required.",
  },
  {
    id: "dev-instance-03",
    serialNumber: "LUM-S3-882901",
    macAddress: "A0:B7:65:FE:91:04",
    ownerName: "Dang Phuoc Nguyen",
    ownerEmail: "nguyendp@lumintra.shop",
    ledModelId: "model-64x64-pro",
    hardwareRevision: "ESP32-S3-REV2.1",
    currentFirmwareVersion: "2.3.0", // Already up-to-date unless Admin uploads v2.4.0!
    activePartition: "ota_0",
    standbyPartition: "ota_1",
    standbyFirmwareVersion: "2.2.0",
    connectionMode: "BLE_ONLY",
    lastOtaCheckAt: "2026-10-30 09:15",
    lastOtaResult: "UP_TO_DATE",
    lastOtaMessage:
      "Running latest ACTIVE release v2.3.0 on ota_0. Connected via BLE only (Wi-Fi required for future OTA per BR-FL4-01).",
  },
  {
    id: "dev-instance-04",
    serialNumber: "LUM-WR-440112",
    macAddress: "C4:4F:33:18:77:21",
    ownerName: "Le Hoang Tuan",
    ownerEmail: "tuanlh@lumintra.shop",
    ledModelId: "model-32x64-wide",
    hardwareRevision: "ESP32-WROOM-REV1.4",
    currentFirmwareVersion: "1.7.5",
    activePartition: "ota_0",
    standbyPartition: "ota_1",
    standbyFirmwareVersion: "1.7.0",
    connectionMode: "WIFI",
    wifiSsid: "Mazda_CX5_Hotspot",
    wifiRssiDbm: -58,
    lastOtaCheckAt: "2026-10-30 10:12",
    lastOtaResult: "UPDATE_AVAILABLE",
    lastOtaMessage:
      "Update v1.8.0 available for HW Rev ESP32-WROOM-REV1.4 (725 KB .bin).",
  },
];

const INITIAL_AUDIT_LOGS: FirmwareAuditLog[] = [
  {
    id: "audit-fw-01",
    timestamp: "2026-10-25 14:20:11 UTC",
    actorId: "adm-01",
    actorName: "Tran Duc Hai",
    actorRole: "ADMIN",
    ipAddress: "113.161.72.104",
    action: "FIRMWARE_UPLOADED",
    targetModelCode: "LUM-64x64-PRO",
    targetVersion: "2.3.0",
    sha256Snippet: "a94f8c21...b2a190",
    details:
      "Uploaded & published lumintra_64x64_s3_rev2.1_v2.3.0.bin (HW Rev ESP32-S3-REV2.1). Verified .bin MIME & SHA-256.",
  },
  {
    id: "audit-fw-02",
    timestamp: "2026-10-19 09:45:03 UTC",
    actorId: "adm-01",
    actorName: "Tran Duc Hai",
    actorRole: "ADMIN",
    ipAddress: "113.161.72.104",
    action: "FIRMWARE_DEPRECATED",
    targetModelCode: "LUM-64x64-PRO",
    targetVersion: "2.2.1",
    sha256Snippet: "d03b7a19...e6f701",
    details:
      "Deprecated faulty release v2.2.1 and designated v2.2.0 as automatic rollback target (BR-FL4-05).",
  },
  {
    id: "audit-fw-03",
    timestamp: "2026-10-20 10:15:44 UTC",
    actorId: "adm-01",
    actorName: "Tran Duc Hai",
    actorRole: "ADMIN",
    ipAddress: "113.161.72.104",
    action: "FIRMWARE_UPLOADED",
    targetModelCode: "LUM-32x64-WIDE",
    targetVersion: "1.8.0",
    sha256Snippet: "f41e9a82...5b4c32",
    details:
      "Uploaded & published lumintra_32x64_wroom_rev1.4_v1.8.0.bin (HW Rev ESP32-WROOM-REV1.4).",
  },
];

const formatNow = () => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
};

export const useFirmwareStore = create<FirmwareStore>()(
  persist(
    (set, get) => ({
      ledModels: INITIAL_LED_MODELS,
      releases: INITIAL_RELEASES,
      fleetDevices: INITIAL_FLEET_DEVICES,
      auditLogs: INITIAL_AUDIT_LOGS,

      uploadFirmwareRelease: (input) => {
        const state = get();
        const model = state.ledModels.find((m) => m.id === input.ledModelId);
        if (!model) {
          return {
            ok: false,
            errorCode: "MODEL_NOT_FOUND",
            message: "Target LED Hardware Model does not exist.",
          };
        }

        // BR-GEN-08: MIME / extension validation (.bin only)
        if (!input.fileName.toLowerCase().endsWith(".bin")) {
          return {
            ok: false,
            errorCode: "INVALID_FIRMWARE_MIME_TYPE",
            message:
              "BR-GEN-08 Violation: Firmware binary must be a compiled .bin image with valid 0xE9 magic header. Rejected non-.bin upload.",
          };
        }

        // BR-FL4-03: Hardware Revision Header match check
        if (input.extractedHeaderHwRev !== model.hardwareRevision) {
          return {
            ok: false,
            errorCode: "HARDWARE_REVISION_MISMATCH",
            message: `BR-FL4-03 Violation: Binary metadata header declares [${input.extractedHeaderHwRev}], which does not match target model ${model.modelCode} [${model.hardwareRevision}]. Upload blocked to prevent GPIO pin conflict & LED matrix damage.`,
          };
        }

        // Duplicate version check for same model
        const duplicate = state.releases.find(
          (r) =>
            r.ledModelId === input.ledModelId &&
            r.version.trim().toLowerCase() === input.version.trim().toLowerCase()
        );
        if (duplicate) {
          return {
            ok: false,
            errorCode: "FIRMWARE_VERSION_EXISTS",
            message: `Version v${input.version} already exists in the catalog for ${model.modelCode}.`,
          };
        }

        // BR-FL4-02: Validate SHA-256 format (64 hex chars)
        const cleanHash = input.sha256Checksum.trim().toLowerCase();
        if (!/^[a-f0-9]{64}$/.test(cleanHash)) {
          return {
            ok: false,
            errorCode: "INVALID_SHA256_CHECKSUM",
            message:
              "BR-FL4-02 Violation: SHA-256 checksum must be a valid 64-character hexadecimal digest.",
          };
        }

        const now = formatNow();
        const newRelease: FirmwareRelease = {
          id: `fw-${Date.now()}`,
          ledModelId: model.id,
          targetHardwareRevision: model.hardwareRevision,
          version: input.version.trim().replace(/^v/i, ""),
          fileName: input.fileName.trim(),
          fileSizeBytes: input.fileSizeBytes,
          sha256Checksum: cleanHash,
          binaryMagicByte: "0xE9 (ESP32 Verified App Image)",
          channel: input.channel,
          isMandatory: input.isMandatory,
          status: "ACTIVE",
          changelog: input.changelog.trim(),
          uploadedBy: input.adminName,
          uploadedAt: now,
          adoptionCount: 0,
        };

        // Demote previous ACTIVE release for this model to PREVIOUS_STABLE (and designate it as rollback target)
        let markedRollbackTarget = false;
        const updatedReleases = [
          newRelease,
          ...state.releases.map((r) => {
            if (r.ledModelId !== model.id) return r;
            if (r.status === "ACTIVE") {
              markedRollbackTarget = true;
              return {
                ...r,
                status: "PREVIOUS_STABLE" as FirmwareStatus,
                isRollbackTarget: true,
              };
            }
            if (markedRollbackTarget && r.isRollbackTarget) {
              return { ...r, isRollbackTarget: false };
            }
            return r;
          }),
        ];

        // Update fleet devices of this model to show UPDATE_AVAILABLE
        const updatedDevices = state.fleetDevices.map((dev) => {
          if (dev.ledModelId !== model.id) return dev;
          if (dev.currentFirmwareVersion === newRelease.version) return dev;
          return {
            ...dev,
            lastOtaCheckAt: now,
            lastOtaResult: "UPDATE_AVAILABLE" as const,
            lastOtaMessage: `New ${newRelease.channel} release v${newRelease.version} published for ${model.hardwareRevision}. Ready for Wi-Fi OTA into standby partition ${dev.standbyPartition}.`,
          };
        });

        const newAudit: FirmwareAuditLog = {
          id: `audit-${Date.now()}`,
          timestamp: `${now}:00 UTC`,
          actorId: "adm-01",
          actorName: input.adminName,
          actorRole: "ADMIN",
          ipAddress: "113.161.72.104",
          action: "FIRMWARE_UPLOADED",
          targetModelCode: model.modelCode,
          targetVersion: newRelease.version,
          sha256Snippet: `${cleanHash.slice(0, 8)}...${cleanHash.slice(-6)}`,
          details: `Uploaded & activated ${newRelease.fileName} (${Math.round(
            newRelease.fileSizeBytes / 1024
          )} KB, HW Rev ${model.hardwareRevision}). Previous active release retained in >=3 rollback pool (BR-FL4-05).`,
        };

        set({
          releases: updatedReleases,
          fleetDevices: updatedDevices,
          auditLogs: [newAudit, ...state.auditLogs],
        });

        return {
          ok: true,
          message: `Published v${newRelease.version} as ACTIVE release for ${model.modelCode} (${model.hardwareRevision}).`,
          release: newRelease,
        };
      },

      deprecateFirmwareRelease: (releaseId, reason, rollbackTargetId, adminName) => {
        const state = get();
        const target = state.releases.find((r) => r.id === releaseId);
        if (!target) {
          return { ok: false, message: "Firmware release not found." };
        }
        const model = state.ledModels.find((m) => m.id === target.ledModelId);
        const now = formatNow();

        // Find fallback stable release to promote if we are deprecating the currently ACTIVE release
        const candidateFallbacks = state.releases.filter(
          (r) =>
            r.ledModelId === target.ledModelId &&
            r.id !== releaseId &&
            r.status !== "DEPRECATED"
        );

        const chosenRollback =
          candidateFallbacks.find((r) => r.id === rollbackTargetId) ||
          candidateFallbacks.find((r) => r.isRollbackTarget) ||
          candidateFallbacks[0] ||
          null;

        const updatedReleases = state.releases.map((r) => {
          if (r.id === releaseId) {
            return {
              ...r,
              status: "DEPRECATED" as FirmwareStatus,
              isRollbackTarget: false,
              deprecationReason:
                reason.trim() ||
                "Revoked by System Administrator due to field stability issue (BR-FL4-05).",
              deprecatedAt: now,
              deprecatedBy: adminName,
            };
          }
          if (
            target.status === "ACTIVE" &&
            chosenRollback &&
            r.id === chosenRollback.id
          ) {
            return {
              ...r,
              status: "ACTIVE" as FirmwareStatus,
              isRollbackTarget: true,
            };
          }
          return r;
        });

        const updatedDevices = state.fleetDevices.map((dev) => {
          if (dev.ledModelId !== target.ledModelId) return dev;
          if (dev.currentFirmwareVersion === target.version) {
            return {
              ...dev,
              lastOtaCheckAt: now,
              lastOtaResult: "ROLLBACK_REQUIRED" as const,
              lastOtaMessage: `ALERT: Running revoked build v${
                target.version
              }! Rollback target v${
                chosenRollback?.version || "previous"
              } activated by Admin (BR-FL4-05).`,
            };
          }
          return dev;
        });

        const newAudit: FirmwareAuditLog = {
          id: `audit-${Date.now()}`,
          timestamp: `${now}:00 UTC`,
          actorId: "adm-01",
          actorName: adminName,
          actorRole: "ADMIN",
          ipAddress: "113.161.72.104",
          action: "FIRMWARE_DEPRECATED",
          targetModelCode: model?.modelCode || target.ledModelId,
          targetVersion: target.version,
          sha256Snippet: `${target.sha256Checksum.slice(
            0,
            8
          )}...${target.sha256Checksum.slice(-6)}`,
          details: `Deprecated v${target.version} (Reason: ${reason.trim()}). ${
            chosenRollback
              ? `Auto-promoted v${chosenRollback.version} as ACTIVE rollback release (BR-FL4-05).`
              : "No fallback release needed."
          }`,
        };

        set({
          releases: updatedReleases,
          fleetDevices: updatedDevices,
          auditLogs: [newAudit, ...state.auditLogs],
        });

        return {
          ok: true,
          message: chosenRollback
            ? `Revoked v${target.version} and activated rollback to stable v${chosenRollback.version}.`
            : `Revoked v${target.version}.`,
        };
      },

      promoteToActiveRelease: (releaseId, reason, adminName) => {
        const state = get();
        const target = state.releases.find((r) => r.id === releaseId);
        if (!target || target.status === "DEPRECATED") {
          return {
            ok: false,
            message: "Cannot promote a deprecated or missing release.",
          };
        }
        const model = state.ledModels.find((m) => m.id === target.ledModelId);
        const now = formatNow();

        const updatedReleases = state.releases.map((r) => {
          if (r.ledModelId !== target.ledModelId) return r;
          if (r.id === releaseId) {
            return {
              ...r,
              status: "ACTIVE" as FirmwareStatus,
              isRollbackTarget: true,
            };
          }
          if (r.status === "ACTIVE") {
            return {
              ...r,
              status: "PREVIOUS_STABLE" as FirmwareStatus,
              isRollbackTarget: false,
            };
          }
          return r;
        });

        const updatedDevices = state.fleetDevices.map((dev) => {
          if (dev.ledModelId !== target.ledModelId) return dev;
          const isSame = dev.currentFirmwareVersion === target.version;
          return {
            ...dev,
            lastOtaCheckAt: now,
            lastOtaResult: isSame
              ? ("UP_TO_DATE" as const)
              : ("UPDATE_AVAILABLE" as const),
            lastOtaMessage: isSame
              ? `Device matches newly promoted active version v${target.version}.`
              : `Admin designated v${target.version} as ACTIVE release (${reason}). Ready for Wi-Fi OTA.`,
          };
        });

        const newAudit: FirmwareAuditLog = {
          id: `audit-${Date.now()}`,
          timestamp: `${now}:00 UTC`,
          actorId: "adm-01",
          actorName: adminName,
          actorRole: "ADMIN",
          ipAddress: "113.161.72.104",
          action: "FIRMWARE_ROLLBACK_ACTIVATED",
          targetModelCode: model?.modelCode || target.ledModelId,
          targetVersion: target.version,
          sha256Snippet: `${target.sha256Checksum.slice(
            0,
            8
          )}...${target.sha256Checksum.slice(-6)}`,
          details: `Promoted retained release v${target.version} to ACTIVE (${reason}).`,
        };

        set({
          releases: updatedReleases,
          fleetDevices: updatedDevices,
          auditLogs: [newAudit, ...state.auditLogs],
        });

        return {
          ok: true,
          message: `Designated v${target.version} as ACTIVE release for ${model?.modelCode}.`,
        };
      },

      setDeviceConnectionMode: (deviceId, mode) => {
        set((state) => ({
          fleetDevices: state.fleetDevices.map((d) =>
            d.id === deviceId
              ? {
                  ...d,
                  connectionMode: mode,
                  wifiSsid:
                    mode === "WIFI"
                      ? d.wifiSsid || "Lumintra_Car_WiFi_5G"
                      : undefined,
                  wifiRssiDbm: mode === "WIFI" ? -52 : undefined,
                }
              : d
          ),
        }));
      },

      applySimulatedOtaOutcome: (deviceId, outcome, targetRelease) => {
        const state = get();
        const dev = state.fleetDevices.find((d) => d.id === deviceId);
        if (!dev) return;
        const model = state.ledModels.find((m) => m.id === dev.ledModelId);
        const now = formatNow();

        let updatedDevice: FleetDeviceInstance = { ...dev, lastOtaCheckAt: now };
        let auditAction: FirmwareAuditLog["action"] = "OTA_SAFE_PARTITION_RETAINED";
        let auditDetails = "";

        if (outcome === "BLE_BLOCKED") {
          updatedDevice.lastOtaResult = "BLOCKED_BLE_ONLY";
          updatedDevice.lastOtaMessage =
            "BR-FL4-01 Blocked: OTA binary download over Bluetooth Low Energy (BLE) is prohibited. Connect ESP32 to Wi-Fi first.";
          auditDetails = `Device ${dev.serialNumber} blocked from OTA v${targetRelease.version}: BLE-only connection (BR-FL4-01).`;
        } else if (outcome === "WIFI_INTERRUPTED") {
          updatedDevice.lastOtaResult = "FAILED_WIFI_DROP_KEPT_SAFE_PARTITION";
          updatedDevice.lastOtaMessage = `BR-FL4-02 Safe Recovery: Wi-Fi connection dropped at 64% while streaming to standby partition [${dev.standbyPartition}]. Bootloader kept active partition [${dev.activePartition}] (v${dev.currentFirmwareVersion}). Device NOT bricked.`;
          auditDetails = `Device ${dev.serialNumber} experienced Wi-Fi drop during v${targetRelease.version} flash to ${dev.standbyPartition}; safely retained ${dev.activePartition} (v${dev.currentFirmwareVersion}).`;
        } else if (outcome === "CHECKSUM_MISMATCH") {
          updatedDevice.lastOtaResult = "FAILED_CHECKSUM_KEPT_SAFE_PARTITION";
          updatedDevice.lastOtaMessage = `BR-FL4-02 Security Abort: On-chip SHA-256 of standby partition [${dev.standbyPartition}] did NOT match manifest (${targetRelease.sha256Checksum.slice(
            0,
            10
          )}...). Partition switch aborted; kept [${dev.activePartition}] (v${
            dev.currentFirmwareVersion
          }).`;
          auditDetails = `Device ${dev.serialNumber} aborted partition switch to ${dev.standbyPartition}: SHA-256 verification failed (BR-FL4-02). Retained ${dev.activePartition}.`;
        } else if (outcome === "BOOT_FAIL_AUTO_ROLLBACK") {
          updatedDevice.lastOtaResult = "FAILED_BOOT_AUTO_ROLLBACK";
          updatedDevice.standbyFirmwareVersion = targetRelease.version;
          updatedDevice.lastOtaMessage = `ESP32 Hardware Watchdog Auto-Rollback: Partition [${dev.standbyPartition}] (v${targetRelease.version}) failed post-boot self-test. IC automatically rebooted and rolled back to safe partition [${dev.activePartition}] (v${dev.currentFirmwareVersion}) with zero customer action required.`;
          auditDetails = `Device ${dev.serialNumber} triggered IC watchdog auto-rollback from ${dev.standbyPartition} (v${targetRelease.version}) back to ${dev.activePartition} (v${dev.currentFirmwareVersion}).`;
        } else if (outcome === "SUCCESS") {
          const previousActive = dev.activePartition;
          const newActive = dev.standbyPartition;
          const previousVersion = dev.currentFirmwareVersion;

          updatedDevice = {
            ...dev,
            activePartition: newActive,
            standbyPartition: previousActive,
            currentFirmwareVersion: targetRelease.version,
            standbyFirmwareVersion: previousVersion,
            lastOtaCheckAt: now,
            lastOtaResult: "OTA_SUCCESS",
            lastOtaMessage: `OTA Complete! Flashed v${targetRelease.version} to [${newActive}], verified SHA-256 (${targetRelease.sha256Checksum.slice(
              0,
              10
            )}...), switched boot pointer [${previousActive} → ${newActive}], and auto-rebooted. [${previousActive}] now holds v${previousVersion} as fallback.`,
          };
          auditAction = "OTA_FLASH_COMPLETED";
          auditDetails = `Device ${dev.serialNumber} updated ${previousVersion} → v${targetRelease.version} over Wi-Fi. Boot partition switched ${previousActive} → ${newActive} after SHA-256 match.`;
        }

        const newAudit: FirmwareAuditLog = {
          id: `audit-${Date.now()}`,
          timestamp: `${now}:15 UTC`,
          actorId: dev.serialNumber,
          actorName: `${dev.serialNumber} (${dev.ownerName})`,
          actorRole: "IOT_DEVICE",
          ipAddress: "192.168.43.108",
          action: auditAction,
          targetModelCode: model?.modelCode || dev.ledModelId,
          targetVersion: targetRelease.version,
          sha256Snippet: `${targetRelease.sha256Checksum.slice(
            0,
            8
          )}...${targetRelease.sha256Checksum.slice(-6)}`,
          details: auditDetails,
        };

        set({
          fleetDevices: state.fleetDevices.map((d) =>
            d.id === deviceId ? updatedDevice : d
          ),
          releases:
            outcome === "SUCCESS"
              ? state.releases.map((r) =>
                  r.id === targetRelease.id
                    ? { ...r, adoptionCount: r.adoptionCount + 1 }
                    : r
                )
              : state.releases,
          auditLogs: [newAudit, ...state.auditLogs],
        });
      },

      resetFirmwareDemo: () =>
        set({
          ledModels: INITIAL_LED_MODELS,
          releases: INITIAL_RELEASES,
          fleetDevices: INITIAL_FLEET_DEVICES,
          auditLogs: INITIAL_AUDIT_LOGS,
        }),
    }),
    {
      name: "lumintra-firmware-ota-store",
    }
  )
);
