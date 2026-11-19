import React, { useState } from "react";
import { RetroWindow } from "../../components/RetroWindow";
import { OffsetHeading } from "../../components/OffsetHeading";
import { useUserStore } from "../../stores/UserStore";
import {
  useFirmwareStore,
  type DeviceConnectionMode,
  type FirmwareRelease,
  type FirmwareStatus,
  type ReleaseChannel,
} from "../../stores/FirmwareStore";

const STATUS_BADGE: Record<
  FirmwareStatus,
  { label: string; bg: string; text: string }
> = {
  ACTIVE: {
    label: "🟢 ACTIVE (LATEST OTA)",
    bg: "bg-mint",
    text: "text-dark",
  },
  PREVIOUS_STABLE: {
    label: "🛡️ RETAINED STABLE (ROLLBACK READY)",
    bg: "bg-sage/60",
    text: "text-dark",
  },
  ARCHIVED: {
    label: "📦 ARCHIVED HISTORY",
    bg: "bg-gray-200",
    text: "text-dark/80",
  },
  DEPRECATED: {
    label: "🚫 DEPRECATED / REVOKED",
    bg: "bg-red-200",
    text: "text-red-950",
  },
};

interface OtaSimulationProgress {
  isRunning: boolean;
  scenario:
    | "SUCCESS"
    | "WIFI_INTERRUPTED"
    | "CHECKSUM_MISMATCH"
    | "BOOT_FAIL_AUTO_ROLLBACK"
    | "BLE_BLOCKED"
    | null;
  stepIndex: number; // 0..5
  downloadPercent: number;
  statusText: string;
  isError: boolean;
}

const generateDeterministicHexHash = (seed: string): string => {
  let h1 = 0xdeadbeef ^ seed.length;
  let h2 = 0x41c6ce57 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    const ch = seed.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  let out = "";
  for (let round = 0; round < 8; round++) {
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507 ^ round);
    h2 = Math.imul(h2 ^ (h2 >>> 13), 3266489909 ^ round);
    const p1 = (h1 >>> 0).toString(16).padStart(8, "0");
    const p2 = (h2 >>> 0).toString(16).padStart(8, "0");
    out += p1 + p2;
  }
  return out.slice(0, 64).toLowerCase();
};

export const AdminFirmwarePage: React.FC = () => {
  const { role, userName, switchRole } = useUserStore();
  const {
    ledModels,
    releases,
    fleetDevices,
    auditLogs,
    uploadFirmwareRelease,
    deprecateFirmwareRelease,
    promoteToActiveRelease,
    setDeviceConnectionMode,
    applySimulatedOtaOutcome,
    resetFirmwareDemo,
  } = useFirmwareStore();

  const isAdmin = role === "ADMIN";

  // Selected Hardware Model (DEV-01)
  const [selectedModelId, setSelectedModelId] = useState<string>(
    ledModels[0]?.id || "model-64x64-pro"
  );
  const activeModel =
    ledModels.find((m) => m.id === selectedModelId) || ledModels[0];

  // Filtered releases for active model
  const modelReleases = releases.filter((r) => r.ledModelId === activeModel.id);
  const activeRelease = modelReleases.find((r) => r.status === "ACTIVE");
  const retainedStableReleases = modelReleases.filter(
    (r) => r.status === "ACTIVE" || r.status === "PREVIOUS_STABLE"
  );

  // Filtered fleet devices for active model
  const modelDevices = fleetDevices.filter(
    (d) => d.ledModelId === activeModel.id
  );
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>(
    INITIAL_DEVICE_ID(fleetDevices, activeModel.id)
  );
  const activeDevice =
    modelDevices.find((d) => d.id === selectedDeviceId) ||
    modelDevices[0] ||
    fleetDevices[0];

  // Upload Firmware Form State (DEV-12)
  const [versionInput, setVersionInput] = useState<string>("2.4.0");
  const [fileNameInput, setFileNameInput] = useState<string>(
    "lumintra_64x64_s3_rev2.1_v2.4.0.bin"
  );
  const [fileSizeInput, setFileSizeInput] = useState<number>(924672);
  const [extractedHwRev, setExtractedHwRev] = useState<string>(
    activeModel.hardwareRevision
  );
  const [sha256Input, setSha256Input] = useState<string>(
    "e4c92a81f07b6d3519a8c4e2b7d0f1e39a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d"
  );
  const [channelInput, setChannelInput] = useState<ReleaseChannel>("STABLE");
  const [isMandatoryInput, setIsMandatoryInput] = useState<boolean>(false);
  const [changelogInput, setChangelogInput] = useState<string>(
    "• Added CAN-bus turn-signal dynamic frame interpolation.\n• Improved ESP32-S3 Wi-Fi OTA chunk streaming speed (<35s total flash time).\n• Verified dual-partition ota_0/ota_1 SHA-256 post-write check."
  );
  const [uploadBanner, setUploadBanner] = useState<{
    type: "SUCCESS" | "ERROR";
    code?: string;
    text: string;
  } | null>(null);

  // Deprecate Modal / Inline Drawer State (DEV-13 / BR-FL4-05)
  const [deprecatingReleaseId, setDeprecatingReleaseId] = useState<
    string | null
  >(null);
  const [deprecationReason, setDeprecationReason] = useState<string>(
    "High memory fragmentation detected under continuous 30 FPS GIF playback on CAN-bus trigger. Revoking build per BR-FL4-05."
  );
  const [selectedRollbackId, setSelectedRollbackId] = useState<string>("");

  // Interactive OTA Pipeline Simulator State (DEV-10 / BR-FL4-01 / BR-FL4-02)
  const [otaProgress, setOtaProgress] = useState<OtaSimulationProgress>({
    isRunning: false,
    scenario: null,
    stepIndex: 0,
    downloadPercent: 0,
    statusText: "Idle — Ready to simulate OTA check & dual-partition flash.",
    isError: false,
  });

  // Switch model helper that updates default form presets
  const handleSelectModel = (modelId: string) => {
    setSelectedModelId(modelId);
    const nextModel = ledModels.find((m) => m.id === modelId);
    if (!nextModel) return;
    const nextReleases = releases.filter((r) => r.ledModelId === modelId);
    const latestVer = nextReleases[0]?.version || "1.0.0";
    const parts = latestVer.split(".").map((n) => parseInt(n, 10) || 0);
    const bumped = `${parts[0] || 1}.${(parts[1] || 0) + 1}.0`;
    const slug = nextModel.modelCode.toLowerCase().replace(/[^a-z0-9]/g, "_");
    const revSlug = nextModel.hardwareRevision
      .toLowerCase()
      .replace(/[^a-z0-9.]/g, "_");
    const nextFile = `${slug}_${revSlug}_v${bumped}.bin`;

    setVersionInput(bumped);
    setFileNameInput(nextFile);
    setFileSizeInput(860160);
    setExtractedHwRev(nextModel.hardwareRevision);
    setSha256Input(generateDeterministicHexHash(nextFile + bumped));
    setUploadBanner(null);
    setDeprecatingReleaseId(null);

    const firstDev = fleetDevices.find((d) => d.ledModelId === modelId);
    if (firstDev) setSelectedDeviceId(firstDev.id);
  };

  // Preset loaders for quick rule testing
  const loadValidPreset = () => {
    const nextReleases = releases.filter((r) => r.ledModelId === activeModel.id);
    const latestVer = nextReleases[0]?.version || "2.3.0";
    const parts = latestVer.split(".").map((n) => parseInt(n, 10) || 0);
    const bumped = `${parts[0] || 2}.${(parts[1] || 0) + 1}.0`;
    const slug = activeModel.modelCode.toLowerCase().replace(/[^a-z0-9]/g, "_");
    const revSlug = activeModel.hardwareRevision
      .toLowerCase()
      .replace(/[^a-z0-9.]/g, "_");
    const fname = `${slug}_${revSlug}_v${bumped}.bin`;
    setVersionInput(bumped);
    setFileNameInput(fname);
    setFileSizeInput(931840);
    setExtractedHwRev(activeModel.hardwareRevision);
    setSha256Input(generateDeterministicHexHash(fname));
    setChannelInput("STABLE");
    setChangelogInput(
      `• Stable OTA release v${bumped} for ${activeModel.modelCode} (${activeModel.hardwareRevision}).\n• Dual-partition ota_0/ota_1 verified with SHA-256 integrity header.`
    );
    setUploadBanner(null);
  };

  const loadInvalidMimePreset = () => {
    setFileNameInput("lumintra_firmware_bundle_v2.4.0.zip");
    setFileSizeInput(1420800);
    setExtractedHwRev(activeModel.hardwareRevision);
    setUploadBanner(null);
  };

  const loadMismatchedHwRevPreset = () => {
    const wrongRev =
      activeModel.hardwareRevision === "ESP32-C3-REV1.0"
        ? "ESP32-S3-REV2.1"
        : "ESP32-C3-REV1.0";
    const fname = `lumintra_wrong_board_${wrongRev.toLowerCase()}_v9.0.0.bin`;
    setVersionInput("9.0.0");
    setFileNameInput(fname);
    setFileSizeInput(612352);
    setExtractedHwRev(wrongRev);
    setSha256Input(generateDeterministicHexHash(fname));
    setUploadBanner(null);
  };

  // Real local file input handler (computes actual Web Crypto SHA-256!)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileNameInput(file.name);
    setFileSizeInput(file.size || 524288);
    setUploadBanner(null);

    try {
      const buf = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest("SHA-256", buf);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      setSha256Input(hashHex);
    } catch {
      setSha256Input(generateDeterministicHexHash(file.name + file.size));
    }
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      setUploadBanner({
        type: "ERROR",
        code: "FORBIDDEN_NOT_ADMIN",
        text: "BR-FL4-04 / BR-GEN-15 Violation: Only System Administrator (ADMIN) can upload or publish firmware binaries.",
      });
      return;
    }

    const res = uploadFirmwareRelease({
      ledModelId: activeModel.id,
      version: versionInput,
      fileName: fileNameInput,
      fileSizeBytes: fileSizeInput,
      extractedHeaderHwRev: extractedHwRev,
      sha256Checksum: sha256Input,
      channel: channelInput,
      isMandatory: isMandatoryInput,
      changelog: changelogInput,
      adminName: userName,
    });

    if (!res.ok) {
      setUploadBanner({
        type: "ERROR",
        code: res.errorCode,
        text: res.message,
      });
    } else {
      setUploadBanner({
        type: "SUCCESS",
        text: res.message,
      });
      // Bump version for next upload convenience
      const parts = versionInput.split(".").map((n) => parseInt(n, 10) || 0);
      const nextVer = `${parts[0] || 2}.${parts[1] || 4}.${(parts[2] || 0) + 1}`;
      setVersionInput(nextVer);
      const nextName = fileNameInput.replace(
        /v?\d+\.\d+\.\d+/i,
        `v${nextVer}`
      );
      setFileNameInput(nextName);
      setSha256Input(generateDeterministicHexHash(nextName + Date.now()));
    }
  };

  const handleConfirmDeprecate = (release: FirmwareRelease) => {
    if (!isAdmin) return;
    const res = deprecateFirmwareRelease(
      release.id,
      deprecationReason,
      selectedRollbackId || null,
      userName
    );
    setDeprecatingReleaseId(null);
    setUploadBanner({
      type: res.ok ? "SUCCESS" : "ERROR",
      text: res.message,
    });
  };

  // Run animated OTA pipeline simulation on the selected fleet device
  const runOtaSimulation = (
    scenario:
      | "SUCCESS"
      | "WIFI_INTERRUPTED"
      | "CHECKSUM_MISMATCH"
      | "BOOT_FAIL_AUTO_ROLLBACK"
  ) => {
    if (!activeDevice || !activeRelease || otaProgress.isRunning) return;

    // BR-FL4-01: Check if device is on BLE_ONLY or OFFLINE
    if (activeDevice.connectionMode !== "WIFI") {
      setOtaProgress({
        isRunning: false,
        scenario: "BLE_BLOCKED",
        stepIndex: 1,
        downloadPercent: 0,
        statusText:
          "BR-FL4-01 BLOCKED: Device is connected via BLE Only. OTA binary streaming requires Wi-Fi to guarantee <60s transfer and prevent corrupted flash frames.",
        isError: true,
      });
      applySimulatedOtaOutcome(activeDevice.id, "BLE_BLOCKED", activeRelease);
      return;
    }

    // Start step-by-step animation
    setOtaProgress({
      isRunning: true,
      scenario,
      stepIndex: 1,
      downloadPercent: 10,
      statusText: `Step 1/5: GET /api/devices/${activeDevice.id}/ota/check — Verified HW Rev [${activeDevice.hardwareRevision}] matches manifest [${activeRelease.targetHardwareRevision}] (BR-FL4-03)...`,
      isError: false,
    });

    setTimeout(() => {
      setOtaProgress({
        isRunning: true,
        scenario,
        stepIndex: 2,
        downloadPercent: 45,
        statusText: `Step 2/5: Streaming ${activeRelease.fileName} over Wi-Fi (${activeDevice.wifiSsid}) into standby partition [${activeDevice.standbyPartition}] (BR-FL4-01)...`,
        isError: false,
      });
    }, 650);

    setTimeout(() => {
      if (scenario === "WIFI_INTERRUPTED") {
        setOtaProgress({
          isRunning: false,
          scenario,
          stepIndex: 2,
          downloadPercent: 64,
          statusText: `⚡ Step 2/5 INTERRUPTED at 64%: Wi-Fi / Car ignition power dropped! Standby partition [${activeDevice.standbyPartition}] discarded. Bootloader kept active safe partition [${activeDevice.activePartition}] (v${activeDevice.currentFirmwareVersion}) — Device NOT bricked (BR-FL4-02).`,
          isError: true,
        });
        applySimulatedOtaOutcome(
          activeDevice.id,
          "WIFI_INTERRUPTED",
          activeRelease
        );
        return;
      }

      setOtaProgress({
        isRunning: true,
        scenario,
        stepIndex: 3,
        downloadPercent: 100,
        statusText: `Step 3/5: Binary 100% written to [${activeDevice.standbyPartition}]. Computing on-chip SHA-256 digest against manifest (${activeRelease.sha256Checksum.slice(
          0,
          12
        )}...) (BR-FL4-02)...`,
        isError: false,
      });

      setTimeout(() => {
        if (scenario === "CHECKSUM_MISMATCH") {
          setOtaProgress({
            isRunning: false,
            scenario,
            stepIndex: 3,
            downloadPercent: 100,
            statusText: `🔐 Step 3/5 SHA-256 MISMATCH! Computed 0xbadf00d... != expected ${activeRelease.sha256Checksum.slice(
              0,
              12
            )}... Partition switch aborted! ESP32 remains on safe partition [${activeDevice.activePartition}] (v${activeDevice.currentFirmwareVersion}) (BR-FL4-02).`,
            isError: true,
          });
          applySimulatedOtaOutcome(
            activeDevice.id,
            "CHECKSUM_MISMATCH",
            activeRelease
          );
          return;
        }

        setOtaProgress({
          isRunning: true,
          scenario,
          stepIndex: 4,
          downloadPercent: 100,
          statusText: `Step 4/5: SHA-256 Verified! Updating ota_data boot pointer: [${activeDevice.activePartition}] → [${activeDevice.standbyPartition}]...`,
          isError: false,
        });

        setTimeout(() => {
          if (scenario === "BOOT_FAIL_AUTO_ROLLBACK") {
            setOtaProgress({
              isRunning: false,
              scenario,
              stepIndex: 5,
              downloadPercent: 100,
              statusText: `💥 Step 5/5 WATCHDOG AUTO-ROLLBACK: IC detected boot fault on [${activeDevice.standbyPartition}] (v${activeRelease.version}). ESP32 hardware bootloader automatically rebooted and rolled back to [${activeDevice.activePartition}] (v${activeDevice.currentFirmwareVersion}) with zero customer action!`,
              isError: true,
            });
            applySimulatedOtaOutcome(
              activeDevice.id,
              "BOOT_FAIL_AUTO_ROLLBACK",
              activeRelease
            );
            return;
          }

          setOtaProgress({
            isRunning: false,
            scenario,
            stepIndex: 5,
            downloadPercent: 100,
            statusText: `✅ Step 5/5 OTA COMPLETE: ESP32 auto-rebooted into [${activeDevice.standbyPartition}] running v${activeRelease.version}! Previous partition [${activeDevice.activePartition}] (v${activeDevice.currentFirmwareVersion}) is preserved as safe fallback.`,
            isError: false,
          });
          applySimulatedOtaOutcome(activeDevice.id, "SUCCESS", activeRelease);
        }, 700);
      }, 700);
    }, 1300);
  };

  const isHeaderMatching = extractedHwRev === activeModel.hardwareRevision;
  const isBinFile = fileNameInput.toLowerCase().endsWith(".bin");

  return (
    <RetroWindow className="h-full min-h-[calc(100vh-2rem)]">
      <div className="flex flex-col gap-6">
        {/* Top Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b-2 border-dark pb-4 gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <OffsetHeading
                text="Firmware OTA Admin.sys"
                boxColor="bg-mint"
              />
              <span className="px-2 py-0.5 bg-dark text-mint text-[10px] font-extrabold uppercase">
                Flow 4 / Device Firmware Administration
              </span>
            </div>
            <p className="text-xs text-dark/75 mt-2">
              End-to-end visualization: Admin uploads signed{" "}
              <code className="bg-white px-1 border border-dark">.bin</code>{" "}
              (DEV-12) &rarr; Catalog &amp; &ge;3 Release Retention (DEV-11 /
              BR-FL4-05) &rarr; Deprecate &amp; Rollback (DEV-13) &rarr; ESP32
              Wi-Fi Dual-Partition OTA (`ota_0` / `ota_1`) (DEV-10 / BR-FL4-02).
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {!isAdmin ? (
              <button
                type="button"
                onClick={() => switchRole("ADMIN")}
                className="px-3 py-1.5 bg-yellow-300 hover:bg-mint border-2 border-dark text-xs font-extrabold shadow-[2px_2px_0px_0px_#23261F] cursor-pointer"
              >
                ⚡ Switch to ADMIN Role (BR-FL4-04)
              </button>
            ) : (
              <span className="px-3 py-1.5 bg-mint border-2 border-dark text-xs font-extrabold shadow-[2px_2px_0px_0px_#23261F]">
                🔐 ADMIN AUTHORIZED (firmware:manage)
              </span>
            )}
            <button
              type="button"
              onClick={() => {
                resetFirmwareDemo();
                setUploadBanner({
                  type: "SUCCESS",
                  text: "Reset Firmware Catalog, Fleet Devices, and Audit Logs to initial demo state.",
                });
              }}
              className="px-3 py-1.5 bg-white hover:bg-gray-100 border-2 border-dark text-xs font-bold cursor-pointer"
            >
              ↺ Reset Demo State
            </button>
          </div>
        </div>

        {/* Visual 4-Step Flow Map Banner */}
        <div className="bg-white border-2 border-dark p-3 shadow-[4px_4px_0px_0px_#23261F]">
          <div className="text-[11px] font-extrabold uppercase text-dark/70 mb-2">
            🗺️ Interactive Firmware Update &amp; Rollback Lifecycle
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
            <div className="border-2 border-dark bg-cream p-2.5">
              <div className="font-extrabold text-dark flex items-center justify-between">
                <span>1. Upload &amp; Verify .bin</span>
                <span className="bg-dark text-cream px-1.5 text-[10px]">
                  DEV-12
                </span>
              </div>
              <p className="text-[11px] text-dark/80 mt-1">
                Admin uploads compiled <code>.bin</code> (BR-GEN-08), matches{" "}
                <strong>HW Revision</strong> header (BR-FL4-03), and records{" "}
                <strong>SHA-256</strong> checksum.
              </p>
            </div>

            <div className="border-2 border-dark bg-cream p-2.5">
              <div className="font-extrabold text-dark flex items-center justify-between">
                <span>2. Retain &ge;3 Releases</span>
                <span className="bg-dark text-cream px-1.5 text-[10px]">
                  DEV-11
                </span>
              </div>
              <p className="text-[11px] text-dark/80 mt-1">
                Server keeps at least the <strong>3 latest releases</strong> per{" "}
                <code>LED_MODEL</code> on Firebase Cloud Storage (BR-FL4-05).
              </p>
            </div>

            <div className="border-2 border-dark bg-cream p-2.5">
              <div className="font-extrabold text-dark flex items-center justify-between">
                <span>3. Deprecate &amp; Rollback</span>
                <span className="bg-dark text-cream px-1.5 text-[10px]">
                  DEV-13
                </span>
              </div>
              <p className="text-[11px] text-dark/80 mt-1">
                If a release has a critical bug, Admin revokes it and promotes
                the previous stable build for automatic rollback (BR-FL4-05).
              </p>
            </div>

            <div className="border-2 border-dark bg-cream p-2.5">
              <div className="font-extrabold text-dark flex items-center justify-between">
                <span>4. Dual-Partition OTA</span>
                <span className="bg-dark text-cream px-1.5 text-[10px]">
                  DEV-10
                </span>
              </div>
              <p className="text-[11px] text-dark/80 mt-1">
                ESP32 downloads over <strong>Wi-Fi only</strong> (BR-FL4-01) to{" "}
                <code>ota_0/ota_1</code>, checks SHA-256 (BR-FL4-02), &amp; IC
                auto-reboots.
              </p>
            </div>
          </div>
        </div>

        {/* Non-Admin RBAC Warning Banner (BR-FL4-04 / BR-GEN-15) */}
        {!isAdmin && (
          <div className="bg-yellow-200 border-2 border-dark p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[3px_3px_0px_0px_#23261F]">
            <div className="text-xs">
              <strong className="uppercase block">
                🔒 RBAC Guard Active (BR-FL4-04 &amp; BR-GEN-15): Read-Only View
              </strong>
              <span>
                You are currently viewing as <strong>{role}</strong> (
                {userName}). Only{" "}
                <strong>System Administrator (ROLE_ADMIN)</strong> holds{" "}
                <code>CREATE_FIRMWARE</code> / <code>UPDATE_FIRMWARE</code>{" "}
                permissions to upload or deprecate firmware builds.
              </span>
            </div>
            <button
              type="button"
              onClick={() => switchRole("ADMIN")}
              className="px-3 py-2 bg-dark text-mint font-extrabold text-xs border-2 border-dark shrink-0 cursor-pointer"
            >
              Switch to ADMIN Now &rarr;
            </button>
          </div>
        )}

        {/* Step 0: Select Target Hardware Model (DEV-01: GET /api/management/admin/led-models) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-sm font-extrabold uppercase">
              🖥️ Target LED Hardware Model Catalog (
              <code className="text-xs">
                GET /api/management/admin/led-models
              </code>{" "}
              — DEV-01)
            </h2>
            <span className="text-[11px] text-dark/70">
              Select a hardware model to manage its firmware track &amp; test
              OTA compatibility (BR-FL4-03)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {ledModels.map((model) => {
              const isSelected = model.id === activeModel.id;
              const modelRel = releases.filter((r) => r.ledModelId === model.id);
              const currentActive = modelRel.find((r) => r.status === "ACTIVE");
              const isLowStock = model.stockAvailable < 5; // BR-FL5-01

              return (
                <button
                  key={model.id}
                  type="button"
                  onClick={() => handleSelectModel(model.id)}
                  className={`text-left p-3 border-2 border-dark transition-all cursor-pointer ${
                    isSelected
                      ? "bg-mint shadow-[4px_4px_0px_0px_#23261F] -translate-y-0.5"
                      : "bg-white hover:bg-cream"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-extrabold text-sm">
                      {model.modelCode}
                    </span>
                    <span className="px-1.5 py-0.5 bg-dark text-cream text-[10px] font-bold">
                      {model.matrixSize} LED
                    </span>
                  </div>
                  <div className="text-[11px] font-bold text-dark/80 mt-0.5">
                    {model.displayName}
                  </div>

                  <div className="mt-2 pt-2 border-t border-dark/20 text-[11px] space-y-1">
                    <div className="flex justify-between">
                      <span className="text-dark/70">HW Revision:</span>
                      <code className="font-extrabold bg-cream px-1 border border-dark">
                        {model.hardwareRevision}
                      </code>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-dark/70">Active OTA Build:</span>
                      <span className="font-extrabold">
                        {currentActive ? `v${currentActive.version}` : "None"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-dark/70">Fleet / Stock:</span>
                      <span>
                        <strong>{model.activeDevicesCount}</strong> bound •{" "}
                        <span
                          className={
                            isLowStock
                              ? "bg-red-200 border border-dark px-1 font-extrabold text-red-900"
                              : ""
                          }
                        >
                          {model.stockAvailable} stock
                          {isLowStock ? " (LOW!)" : ""}
                        </span>
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Two-Column Grid: Left = Upload .bin (DEV-12) | Right = Release Catalog & Rollback (DEV-11, DEV-13) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT COLUMN (5 cols): Upload & Verify Firmware Binary (POST /api/management/admin/firmware) */}
          <div className="lg:col-span-5 bg-white border-2 border-dark p-4 shadow-[4px_4px_0px_0px_#23261F] flex flex-col justify-between">
            <div className="space-y-4">
              <div className="border-b-2 border-dark pb-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-sm uppercase">
                    ⬆️ Step 1: Upload Firmware Binary
                  </h3>
                  <span className="text-[10px] font-bold bg-sage px-1.5 py-0.5 border border-dark">
                    POST /api/management/admin/firmware
                  </span>
                </div>
                <p className="text-[11px] text-dark/70 mt-1">
                  Validates <code>.bin</code> MIME/magic byte (BR-GEN-08),
                  checks <code>HW_REV</code> header against{" "}
                  <strong>{activeModel.hardwareRevision}</strong> (BR-FL4-03),
                  and records SHA-256 (BR-FL4-02).
                </p>
              </div>

              {/* Quick Scenario Presets to visualize validation rules */}
              <div className="bg-cream border-2 border-dark p-2.5 space-y-2">
                <div className="text-[10px] font-extrabold uppercase text-dark/70">
                  🧪 One-Click Validation Test Presets:
                </div>
                <div className="grid grid-cols-1 gap-1.5">
                  <button
                    type="button"
                    onClick={loadValidPreset}
                    className="text-left px-2.5 py-1.5 bg-mint/60 hover:bg-mint border border-dark text-[11px] font-bold cursor-pointer"
                  >
                    🟢 Load Valid .bin for {activeModel.hardwareRevision} (Passes
                    All Checks)
                  </button>
                  <button
                    type="button"
                    onClick={loadInvalidMimePreset}
                    className="text-left px-2.5 py-1.5 bg-red-100 hover:bg-red-200 border border-dark text-[11px] font-bold cursor-pointer"
                  >
                    🔴 Test BR-GEN-08 Reject: Non-.bin File (.zip archive)
                  </button>
                  <button
                    type="button"
                    onClick={loadMismatchedHwRevPreset}
                    className="text-left px-2.5 py-1.5 bg-orange-100 hover:bg-orange-200 border border-dark text-[11px] font-bold cursor-pointer"
                  >
                    🟠 Test BR-FL4-03 Reject: Wrong Hardware Revision Header
                  </button>
                </div>
              </div>

              {uploadBanner && (
                <div
                  className={`p-3 border-2 border-dark text-xs ${
                    uploadBanner.type === "SUCCESS"
                      ? "bg-mint text-dark"
                      : "bg-red-200 text-red-950"
                  }`}
                >
                  {uploadBanner.code && (
                    <div className="font-extrabold uppercase text-[10px] mb-0.5">
                      [{uploadBanner.code}]
                    </div>
                  )}
                  <div className="font-bold">{uploadBanner.text}</div>
                </div>
              )}

              <form onSubmit={handleUploadSubmit} className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-bold mb-1">
                      Target Hardware Model
                    </label>
                    <input
                      type="text"
                      value={`${activeModel.modelCode} (${activeModel.hardwareRevision})`}
                      readOnly
                      className="w-full bg-gray-100 border-2 border-dark px-2 py-1.5 text-[11px] font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">
                      Semantic Version *
                    </label>
                    <input
                      type="text"
                      value={versionInput}
                      onChange={(e) => setVersionInput(e.target.value)}
                      placeholder="e.g. 2.4.0"
                      required
                      className="w-full bg-white border-2 border-dark px-2 py-1.5 font-extrabold"
                    />
                  </div>
                </div>

                {/* File selector / Binary Name */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold">
                      Firmware Binary File (<code>.bin</code> only — BR-GEN-08)
                      *
                    </label>
                    <label className="text-[10px] underline font-bold cursor-pointer hover:text-moss">
                      Browse Local File...
                      <input
                        type="file"
                        accept=".bin,*/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <input
                    type="text"
                    value={fileNameInput}
                    onChange={(e) => setFileNameInput(e.target.value)}
                    required
                    className={`w-full border-2 border-dark px-2 py-1.5 font-mono text-[11px] ${
                      isBinFile ? "bg-white" : "bg-red-100"
                    }`}
                  />
                </div>

                {/* Binary Header & Integrity Inspector Box */}
                <div className="bg-cream border-2 border-dark p-2.5 space-y-1.5 text-[11px]">
                  <div className="font-extrabold uppercase text-[10px] text-dark/70 border-b border-dark/20 pb-1">
                    🔍 Binary Header &amp; Integrity Pre-Flight Check
                  </div>

                  <div className="flex items-center justify-between">
                    <span>MIME / Extension (BR-GEN-08):</span>
                    <span
                      className={`px-1.5 py-0.2 font-extrabold border border-dark ${
                        isBinFile ? "bg-mint" : "bg-red-300"
                      }`}
                    >
                      {isBinFile
                        ? "VALID .BIN (0xE9 ESP32 Magic)"
                        : "INVALID NON-.BIN FILE"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span>Header HW Revision (BR-FL4-03):</span>
                    <div className="flex items-center gap-1">
                      <select
                        value={extractedHwRev}
                        onChange={(e) => setExtractedHwRev(e.target.value)}
                        aria-label="Binary Header Hardware Revision"
                        className={`border border-dark px-1 py-0.5 text-[10px] font-extrabold ${
                          isHeaderMatching ? "bg-mint" : "bg-orange-300"
                        }`}
                      >
                        <option value="ESP32-S3-REV2.1">ESP32-S3-REV2.1</option>
                        <option value="ESP32-WROOM-REV1.4">
                          ESP32-WROOM-REV1.4
                        </option>
                        <option value="ESP32-C3-REV1.0">ESP32-C3-REV1.0</option>
                      </select>
                      <span className="text-[10px] font-extrabold">
                        {isHeaderMatching ? "✅ MATCH" : "❌ MISMATCH"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span>Binary Image Size:</span>
                    <span className="font-bold">
                      {(fileSizeInput / 1024).toFixed(1)} KB (Fits{" "}
                      {activeModel.partitionScheme.split("/")[0]})
                    </span>
                  </div>
                </div>

                {/* SHA-256 Checksum Input (BR-FL4-02) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold">
                      SHA-256 Integrity Checksum (BR-FL4-02) *
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setSha256Input(
                          generateDeterministicHexHash(
                            fileNameInput + versionInput + Date.now()
                          )
                        )
                      }
                      className="text-[10px] underline font-bold cursor-pointer"
                    >
                      Re-hash
                    </button>
                  </div>
                  <input
                    type="text"
                    value={sha256Input}
                    onChange={(e) => setSha256Input(e.target.value)}
                    required
                    className="w-full bg-white border-2 border-dark px-2 py-1.5 font-mono text-[10px]"
                  />
                </div>

                {/* Channel & Mandatory Toggle */}
                <div className="grid grid-cols-2 gap-2.5 items-center">
                  <div>
                    <label className="block font-bold mb-1">
                      Release Channel
                    </label>
                    <select
                      value={channelInput}
                      onChange={(e) =>
                        setChannelInput(e.target.value as ReleaseChannel)
                      }
                      aria-label="Release Channel"
                      className="w-full bg-white border-2 border-dark px-2 py-1.5 font-bold text-xs"
                    >
                      <option value="STABLE">STABLE</option>
                      <option value="HOTFIX">HOTFIX</option>
                      <option value="SECURITY_PATCH">SECURITY_PATCH</option>
                    </select>
                  </div>
                  <label className="flex items-center gap-2 pt-4 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isMandatoryInput}
                      onChange={(e) => setIsMandatoryInput(e.target.checked)}
                      className="w-4 h-4 accent-dark"
                    />
                    <span className="font-bold text-[11px]">
                      Mandatory Critical Update
                    </span>
                  </label>
                </div>

                {/* Changelog */}
                <div>
                  <label className="block font-bold mb-1">
                    Release Notes / Changelog *
                  </label>
                  <textarea
                    rows={3}
                    value={changelogInput}
                    onChange={(e) => setChangelogInput(e.target.value)}
                    required
                    className="w-full bg-white border-2 border-dark p-2 text-[11px]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-mint hover:bg-sage border-2 border-dark font-extrabold text-xs uppercase shadow-[3px_3px_0px_0px_#23261F] transition-transform active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
                >
                  🚀 Upload &amp; Publish Firmware Release (DEV-12)
                </button>
              </form>
            </div>
          </div>

          {/* RIGHT COLUMN (7 cols): Firmware Release Catalog, >=3 Retention Window & Rollback (DEV-11 & DEV-13) */}
          <div className="lg:col-span-7 bg-white border-2 border-dark p-4 shadow-[4px_4px_0px_0px_#23261F] flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-dark pb-2 gap-2">
                <div>
                  <h3 className="font-extrabold text-sm uppercase">
                    📚 Step 2 &amp; 3: Firmware Catalog &amp; Rollback Control
                  </h3>
                  <p className="text-[11px] text-dark/70">
                    <code>GET /api/management/admin/firmware</code> (DEV-11) •{" "}
                    <code>
                      PATCH /api/management/admin/firmware/&#123;id&#125;/deprecate
                    </code>{" "}
                    (DEV-13)
                  </p>
                </div>

                {/* BR-FL4-05 Retention Policy Badge */}
                <div className="bg-cream border-2 border-dark px-2.5 py-1 text-[11px] shrink-0">
                  <div className="font-extrabold flex items-center gap-1.5">
                    <span>🛡️ BR-FL4-05 Retention Pool:</span>
                    <span
                      className={`px-1.5 border border-dark font-extrabold ${
                        retainedStableReleases.length >= 3
                          ? "bg-mint"
                          : "bg-yellow-200"
                      }`}
                    >
                      {retainedStableReleases.length} / 3 Min Stable Builds
                    </span>
                  </div>
                </div>
              </div>

              {/* Release Cards List */}
              <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
                {modelReleases.map((rel) => {
                  const badge = STATUS_BADGE[rel.status];
                  const retainedIndex = retainedStableReleases.findIndex(
                    (r) => r.id === rel.id
                  );
                  const isInTop3Retention =
                    retainedIndex !== -1 && retainedIndex < 3;
                  const isDeprecatingThis = deprecatingReleaseId === rel.id;

                  // Available rollback options if deprecating this release
                  const rollbackCandidates = modelReleases.filter(
                    (r) => r.id !== rel.id && r.status !== "DEPRECATED"
                  );

                  return (
                    <div
                      key={rel.id}
                      className={`border-2 border-dark p-3 transition-all ${
                        rel.status === "ACTIVE"
                          ? "bg-mint/20 shadow-[3px_3px_0px_0px_#23261F]"
                          : rel.status === "DEPRECATED"
                          ? "bg-red-50/70 opacity-90"
                          : "bg-cream"
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-base font-extrabold">
                            v{rel.version}
                          </span>
                          <span
                            className={`px-2 py-0.5 border border-dark text-[10px] font-extrabold ${badge.bg} ${badge.text}`}
                          >
                            {badge.label}
                          </span>
                          <span className="px-1.5 py-0.5 bg-white border border-dark text-[10px] font-bold">
                            {rel.channel}
                          </span>
                          {rel.isMandatory && (
                            <span className="px-1.5 py-0.5 bg-yellow-300 border border-dark text-[10px] font-extrabold">
                              MANDATORY
                            </span>
                          )}
                          {isInTop3Retention && (
                            <span className="px-1.5 py-0.5 bg-dark text-mint text-[10px] font-bold">
                              Pinned Slot #{retainedIndex + 1}/3 (BR-FL4-05)
                            </span>
                          )}
                        </div>

                        <div className="text-[11px] font-bold text-dark/70">
                          Uploaded: {rel.uploadedAt}
                        </div>
                      </div>

                      {/* Metadata row */}
                      <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2 bg-white border border-dark p-2 text-[11px]">
                        <div className="truncate">
                          <span className="text-dark/60 block text-[10px]">
                            Binary File (BR-GEN-08)
                          </span>
                          <code className="font-bold">{rel.fileName}</code> (
                          {Math.round(rel.fileSizeBytes / 1024)} KB)
                        </div>
                        <div>
                          <span className="text-dark/60 block text-[10px]">
                            Target HW Rev (BR-FL4-03)
                          </span>
                          <code className="font-extrabold bg-cream px-1 border border-dark">
                            {rel.targetHardwareRevision}
                          </code>
                        </div>
                        <div className="truncate">
                          <span className="text-dark/60 block text-[10px]">
                            SHA-256 Checksum (BR-FL4-02)
                          </span>
                          <code
                            className="font-mono text-[10px]"
                            title={rel.sha256Checksum}
                          >
                            {rel.sha256Checksum.slice(0, 16)}...
                            {rel.sha256Checksum.slice(-8)}
                          </code>
                        </div>
                      </div>

                      {/* Changelog */}
                      <pre className="mt-2 text-[11px] font-mono whitespace-pre-wrap text-dark/85 bg-white/60 p-2 border border-dark/30">
                        {rel.changelog}
                      </pre>

                      {/* Deprecation Notice if Revoked */}
                      {rel.status === "DEPRECATED" && rel.deprecationReason && (
                        <div className="mt-2 bg-red-200 border border-dark p-2 text-[11px] text-red-950">
                          <strong>🚫 Revocation Reason (BR-FL4-05):</strong>{" "}
                          {rel.deprecationReason}
                          <div className="text-[10px] mt-0.5 text-red-900">
                            Deprecated by {rel.deprecatedBy} at{" "}
                            {rel.deprecatedAt}
                          </div>
                        </div>
                      )}

                      {/* Footer Actions */}
                      <div className="mt-3 pt-2 border-t border-dark/20 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="text-[11px]">
                          Fleet Adoption:{" "}
                          <strong>{rel.adoptionCount} devices</strong> • By{" "}
                          <span className="text-dark/80">{rel.uploadedBy}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          {rel.status === "PREVIOUS_STABLE" && (
                            <button
                              type="button"
                              disabled={!isAdmin}
                              onClick={() => {
                                const res = promoteToActiveRelease(
                                  rel.id,
                                  "Manual Admin Rollback / Promotion (BR-FL4-05)",
                                  userName
                                );
                                setUploadBanner({
                                  type: res.ok ? "SUCCESS" : "ERROR",
                                  text: res.message,
                                });
                              }}
                              className="px-2.5 py-1 bg-sage hover:bg-mint disabled:opacity-50 border-2 border-dark text-[11px] font-extrabold cursor-pointer"
                            >
                              ⏪ Rollback Fleet to v{rel.version}
                            </button>
                          )}

                          {rel.status !== "DEPRECATED" && (
                            <button
                              type="button"
                              disabled={!isAdmin}
                              onClick={() => {
                                setDeprecatingReleaseId(
                                  isDeprecatingThis ? null : rel.id
                                );
                                setSelectedRollbackId(
                                  rollbackCandidates[0]?.id || ""
                                );
                              }}
                              className="px-2.5 py-1 bg-red-200 hover:bg-red-300 disabled:opacity-50 border-2 border-dark text-[11px] font-extrabold cursor-pointer"
                            >
                              ⚠️ Deprecate / Revoke (DEV-13)
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Inline Deprecate & Rollback Drawer */}
                      {isDeprecatingThis && (
                        <div className="mt-3 bg-red-100 border-2 border-dark p-3 space-y-2.5 text-xs">
                          <div className="font-extrabold uppercase text-red-950 flex items-center justify-between">
                            <span>
                              🚨 Confirm Firmware Revocation &amp; Rollback
                              (PATCH /api/management/admin/firmware/{rel.id}
                              /deprecate)
                            </span>
                            <button
                              type="button"
                              onClick={() => setDeprecatingReleaseId(null)}
                              className="underline text-[11px] cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>

                          <div>
                            <label className="block font-bold text-[11px] mb-1">
                              Defect / Revocation Reason (Recorded in Audit Log
                              — BR-GEN-09):
                            </label>
                            <input
                              type="text"
                              value={deprecationReason}
                              onChange={(e) =>
                                setDeprecationReason(e.target.value)
                              }
                              className="w-full bg-white border-2 border-dark px-2 py-1 text-[11px]"
                            />
                          </div>

                          {rel.status === "ACTIVE" &&
                            rollbackCandidates.length > 0 && (
                              <div>
                                <label className="block font-bold text-[11px] mb-1">
                                  Designate Automatic Rollback Target (from
                                  &ge;3 Retained Releases — BR-FL4-05):
                                </label>
                                <select
                                  value={selectedRollbackId}
                                  onChange={(e) =>
                                    setSelectedRollbackId(e.target.value)
                                  }
                                  aria-label="Designate Automatic Rollback Target"
                                  className="w-full bg-white border-2 border-dark px-2 py-1.5 font-extrabold text-xs"
                                >
                                  {rollbackCandidates.map((cand) => (
                                    <option key={cand.id} value={cand.id}>
                                      v{cand.version} ({cand.channel}) —
                                      Uploaded {cand.uploadedAt} [SHA-256:{" "}
                                      {cand.sha256Checksum.slice(0, 10)}...]
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}

                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleConfirmDeprecate(rel)}
                              className="px-3 py-1.5 bg-red-600 text-white border-2 border-dark font-extrabold text-xs shadow-[2px_2px_0px_0px_#23261F] cursor-pointer"
                            >
                              Confirm Deprecate &amp; Activate Rollback &rarr;
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* STEP 4: Interactive ESP32 Dual-Partition & Fleet OTA Visualizer (DEV-10 / BR-FL4-01 / BR-FL4-02 / BR-FL4-03) */}
        <div className="bg-white border-2 border-dark p-4 shadow-[4px_4px_0px_0px_#23261F] space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b-2 border-dark pb-3 gap-2">
            <div>
              <h3 className="text-base font-extrabold uppercase">
                📡 Step 4: Interactive ESP32 Dual-Partition OTA Simulator (
                <code className="text-xs">
                  GET /api/devices/&#123;id&#125;/ota/check
                </code>{" "}
                — DEV-10)
              </h3>
              <p className="text-xs text-dark/75">
                Visualize how a bound customer <code>LED_INSTANCE</code> checks
                hardware compatibility (BR-FL4-03), enforces{" "}
                <strong>Wi-Fi only</strong> download (BR-FL4-01), verifies{" "}
                <strong>SHA-256</strong> before switching{" "}
                <code>ota_0 &harr; ota_1</code> (BR-FL4-02), and auto-rolls back
                on failure.
              </p>
            </div>
            <span className="px-2.5 py-1 bg-mint border-2 border-dark text-xs font-extrabold shrink-0">
              Target Active Release:{" "}
              {activeRelease
                ? `v${activeRelease.version} (${activeModel.hardwareRevision})`
                : "None"}
            </span>
          </div>

          {/* Device Selector Tabs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {modelDevices.map((dev) => {
              const isSelected = dev.id === activeDevice?.id;
              const isUpToDate =
                activeRelease &&
                dev.currentFirmwareVersion === activeRelease.version;
              const isRunningDeprecated = modelReleases.some(
                (r) =>
                  r.version === dev.currentFirmwareVersion &&
                  r.status === "DEPRECATED"
              );

              return (
                <button
                  key={dev.id}
                  type="button"
                  onClick={() => {
                    setSelectedDeviceId(dev.id);
                    setOtaProgress({
                      isRunning: false,
                      scenario: null,
                      stepIndex: 0,
                      downloadPercent: 0,
                      statusText: `Selected ${dev.serialNumber} (running v${dev.currentFirmwareVersion} on [${dev.activePartition}]).`,
                      isError: false,
                    });
                  }}
                  className={`text-left p-3 border-2 border-dark transition-all cursor-pointer ${
                    isSelected
                      ? "bg-sage/50 shadow-[3px_3px_0px_0px_#23261F]"
                      : "bg-cream hover:bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs">
                      📟 {dev.serialNumber}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 border border-dark text-[10px] font-extrabold ${
                        isRunningDeprecated
                          ? "bg-red-300 text-red-950"
                          : isUpToDate
                          ? "bg-mint text-dark"
                          : "bg-yellow-200 text-dark"
                      }`}
                    >
                      {isRunningDeprecated
                        ? "⚠️ REVOKED v" + dev.currentFirmwareVersion
                        : isUpToDate
                        ? "✅ UP TO DATE v" + dev.currentFirmwareVersion
                        : "⬆️ UPDATE READY (v" +
                          dev.currentFirmwareVersion +
                          " → v" +
                          (activeRelease?.version || "?") +
                          ")"}
                    </span>
                  </div>
                  <div className="text-[11px] text-dark/80 mt-1">
                    Owner: <strong>{dev.ownerName}</strong> • MAC:{" "}
                    <code>{dev.macAddress}</code>
                  </div>
                  <div className="text-[10px] mt-1 flex items-center justify-between text-dark/70">
                    <span>
                      Boot: <strong>{dev.activePartition}</strong> (v
                      {dev.currentFirmwareVersion})
                    </span>
                    <span>
                      Net:{" "}
                      <strong>
                        {dev.connectionMode === "WIFI"
                          ? `📶 Wi-Fi (${dev.wifiSsid})`
                          : "🦷 BLE Only"}
                      </strong>
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {activeDevice && activeRelease && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pt-2">
              {/* Left 7 cols: Dual-Partition Architecture & Interactive Triggers */}
              <div className="lg:col-span-7 bg-cream border-2 border-dark p-3.5 space-y-4">
                {/* Connection Mode Switcher (BR-FL4-01) */}
                <div className="flex flex-wrap items-center justify-between gap-2 bg-white border-2 border-dark p-2.5">
                  <div className="text-xs">
                    <strong className="block">
                      1. Device Transport Channel (BR-FL4-01):
                    </strong>
                    <span className="text-[11px] text-dark/75">
                      OTA binary download is restricted to{" "}
                      <strong>Wi-Fi only</strong> (&lt;60s flash). BLE is
                      blocked.
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {(["WIFI", "BLE_ONLY"] as DeviceConnectionMode[]).map(
                      (mode) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() =>
                            setDeviceConnectionMode(activeDevice.id, mode)
                          }
                          className={`px-2.5 py-1 border-2 border-dark text-[11px] font-extrabold cursor-pointer ${
                            activeDevice.connectionMode === mode
                              ? mode === "WIFI"
                                ? "bg-mint shadow-[2px_2px_0px_0px_#23261F]"
                                : "bg-orange-300 shadow-[2px_2px_0px_0px_#23261F]"
                              : "bg-white"
                          }`}
                        >
                          {mode === "WIFI"
                            ? "📶 Wi-Fi Connected"
                            : "🦷 BLE Only (Test Block)"}
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* ESP32 Flash Memory Dual-Partition Diagram (ota_0 & ota_1 - BR-FL4-02) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <strong className="uppercase">
                      2. ESP32 Dual-Partition Flash Map (BR-FL4-02):
                    </strong>
                    <span className="text-[11px] font-bold">
                      Boot Pointer (<code>ota_data</code>) &rarr;{" "}
                      <code className="bg-mint px-1.5 py-0.5 border border-dark font-extrabold">
                        {activeDevice.activePartition}
                      </code>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(["ota_0", "ota_1"] as const).map((part) => {
                      const isCurrentBoot =
                        activeDevice.activePartition === part;
                      const partVersion = isCurrentBoot
                        ? activeDevice.currentFirmwareVersion
                        : activeDevice.standbyFirmwareVersion || "Empty";

                      return (
                        <div
                          key={part}
                          className={`border-2 border-dark p-3 relative ${
                            isCurrentBoot
                              ? "bg-mint/40 shadow-[3px_3px_0px_0px_#23261F]"
                              : "bg-white border-dashed"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-sm uppercase">
                              Partition [{part}]
                            </span>
                            <span
                              className={`px-2 py-0.5 border border-dark text-[10px] font-extrabold ${
                                isCurrentBoot
                                  ? "bg-dark text-mint"
                                  : "bg-yellow-200 text-dark"
                              }`}
                            >
                              {isCurrentBoot
                                ? "🟢 ACTIVE BOOT"
                                : "🎯 STANDBY OTA TARGET"}
                            </span>
                          </div>

                          <div className="mt-2 text-xs space-y-1">
                            <div>
                              Stored Image:{" "}
                              <strong className="font-extrabold">
                                v{partVersion}
                              </strong>
                            </div>
                            <div className="text-[11px] text-dark/75">
                              {isCurrentBoot
                                ? "Currently executing LED matrix & CAN-bus slots. Protected during OTA download."
                                : `Receives incoming Wi-Fi .bin stream (v${activeRelease.version}) & verifies SHA-256 before boot pointer flip.`}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Live 5-Step Progress Bar & Status Box */}
                <div
                  className={`border-2 border-dark p-3 space-y-2 ${
                    otaProgress.isError
                      ? "bg-red-100"
                      : otaProgress.stepIndex === 5
                      ? "bg-mint/50"
                      : "bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-extrabold">
                    <span>OTA Pipeline Telemetry:</span>
                    <span>{otaProgress.downloadPercent}%</span>
                  </div>
                  <div className="w-full h-3 bg-cream border-2 border-dark overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        otaProgress.isError ? "bg-red-500" : "bg-moss"
                      }`}
                      style={{ width: `${otaProgress.downloadPercent}%` }}
                    />
                  </div>
                  <p className="text-xs font-bold leading-relaxed">
                    {otaProgress.statusText}
                  </p>
                  <div className="text-[11px] text-dark/80 border-t border-dark/20 pt-1.5">
                    <strong>Last Device State:</strong>{" "}
                    {activeDevice.lastOtaMessage}
                  </div>
                </div>

                {/* Interactive Simulation Action Buttons */}
                <div className="space-y-2">
                  <div className="text-xs font-extrabold uppercase">
                    3. Trigger OTA Flow / Fault Injection Scenarios:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={otaProgress.isRunning}
                      onClick={() => runOtaSimulation("SUCCESS")}
                      className="px-3 py-2 bg-mint hover:bg-sage disabled:opacity-50 border-2 border-dark text-xs font-extrabold text-left shadow-[2px_2px_0px_0px_#23261F] cursor-pointer"
                    >
                      ✅ 1. Normal Wi-Fi OTA Flash (v
                      {activeDevice.currentFirmwareVersion} &rarr; v
                      {activeRelease.version})
                    </button>

                    <button
                      type="button"
                      disabled={otaProgress.isRunning}
                      onClick={() => runOtaSimulation("WIFI_INTERRUPTED")}
                      className="px-3 py-2 bg-yellow-200 hover:bg-yellow-300 disabled:opacity-50 border-2 border-dark text-xs font-extrabold text-left shadow-[2px_2px_0px_0px_#23261F] cursor-pointer"
                    >
                      ⚡ 2. Simulate Power / Wi-Fi Drop at 64% (BR-FL4-02)
                    </button>

                    <button
                      type="button"
                      disabled={otaProgress.isRunning}
                      onClick={() => runOtaSimulation("CHECKSUM_MISMATCH")}
                      className="px-3 py-2 bg-orange-200 hover:bg-orange-300 disabled:opacity-50 border-2 border-dark text-xs font-extrabold text-left shadow-[2px_2px_0px_0px_#23261F] cursor-pointer"
                    >
                      🔐 3. Simulate Bad SHA-256 Checksum Abort (BR-FL4-02)
                    </button>

                    <button
                      type="button"
                      disabled={otaProgress.isRunning}
                      onClick={() =>
                        runOtaSimulation("BOOT_FAIL_AUTO_ROLLBACK")
                      }
                      className="px-3 py-2 bg-red-200 hover:bg-red-300 disabled:opacity-50 border-2 border-dark text-xs font-extrabold text-left shadow-[2px_2px_0px_0px_#23261F] cursor-pointer"
                    >
                      💥 4. Simulate Post-Boot Fault &rarr; IC Auto-Rollback
                    </button>
                  </div>
                </div>
              </div>

              {/* Right 5 cols: Live Backend API Contract Inspector (GET /api/devices/{id}/ota/check) */}
              <div className="lg:col-span-5 bg-dark text-cream border-2 border-dark p-3.5 flex flex-col justify-between font-mono text-xs">
                <div className="space-y-2">
                  <div className="flex items-center justify-between border-b border-cream/20 pb-2">
                    <span className="text-mint font-extrabold uppercase">
                      📄 Live API Contract (DEV-10)
                    </span>
                    <span className="px-1.5 py-0.5 bg-mint text-dark text-[10px] font-extrabold">
                      200 OK
                    </span>
                  </div>
                  <div className="text-[11px] text-cream/80">
                    <code>GET /api/devices/{activeDevice.id}/ota/check</code>
                  </div>

                  <pre className="bg-black/50 p-3 border border-cream/20 text-[10px] leading-relaxed overflow-x-auto text-mint">
                    {JSON.stringify(
                      {
                        data: {
                          deviceId: activeDevice.id,
                          serialNumber: activeDevice.serialNumber,
                          hardwareRevision: activeDevice.hardwareRevision,
                          currentFirmwareVersion:
                            activeDevice.currentFirmwareVersion,
                          activePartition: activeDevice.activePartition,
                          standbyPartition: activeDevice.standbyPartition,
                          updateAvailable:
                            activeDevice.currentFirmwareVersion !==
                            activeRelease.version,
                          isRollbackFromDeprecated: modelReleases.some(
                            (r) =>
                              r.version ===
                                activeDevice.currentFirmwareVersion &&
                              r.status === "DEPRECATED"
                          ),
                          wifiRequired: true,
                          targetRelease: {
                            releaseId: activeRelease.id,
                            version: activeRelease.version,
                            channel: activeRelease.channel,
                            isMandatory: activeRelease.isMandatory,
                            fileName: activeRelease.fileName,
                            fileSizeBytes: activeRelease.fileSizeBytes,
                            sha256Checksum: activeRelease.sha256Checksum,
                            downloadUrl: `https://storage.googleapis.com/lumintra-ota/${activeModel.modelCode}/${activeRelease.fileName}`,
                          },
                        },
                      },
                      null,
                      2
                    )}
                  </pre>
                </div>

                <div className="mt-3 pt-2 border-t border-cream/20 text-[11px] text-cream/80 space-y-1">
                  <div>
                    • <strong>BR-FL4-03:</strong> Server compares{" "}
                    <code>device.hardwareRevision</code> with{" "}
                    <code>release.targetHardwareRevision</code>.
                  </div>
                  <div>
                    • <strong>BR-FL5-05:</strong> Unofficial firmware voids the
                    180-day hardware warranty.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Immutable System Audit Trail (BR-GEN-09) */}
        <div className="bg-white border-2 border-dark p-4 shadow-[4px_4px_0px_0px_#23261F] space-y-3">
          <div className="flex items-center justify-between border-b-2 border-dark pb-2">
            <div>
              <h3 className="text-sm font-extrabold uppercase">
                🛡️ Immutable Firmware &amp; OTA Audit Log (BR-GEN-09)
              </h3>
              <p className="text-[11px] text-dark/70">
                Every sensitive admin upload, deprecation, rollback, and device
                OTA event is recorded with User ID, Action, IP, and UTC
                Timestamp.
              </p>
            </div>
            <span className="text-[11px] font-bold bg-cream px-2 py-0.5 border border-dark">
              {auditLogs.length} entries
            </span>
          </div>

          <div className="overflow-x-auto max-h-60 overflow-y-auto">
            <table className="w-full text-left border-collapse text-[11px]">
              <thead>
                <tr className="bg-cream border-b-2 border-dark">
                  <th className="p-2 border-r border-dark">UTC Timestamp</th>
                  <th className="p-2 border-r border-dark">Actor &amp; IP</th>
                  <th className="p-2 border-r border-dark">Action</th>
                  <th className="p-2 border-r border-dark">Model / Version</th>
                  <th className="p-2">Audit Details &amp; SHA-256</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b border-dark/20 hover:bg-cream/60"
                  >
                    <td className="p-2 border-r border-dark/20 whitespace-nowrap font-mono">
                      {log.timestamp}
                    </td>
                    <td className="p-2 border-r border-dark/20 whitespace-nowrap">
                      <div className="font-bold">{log.actorName}</div>
                      <div className="text-[10px] text-dark/60">
                        {log.actorRole} • {log.ipAddress}
                      </div>
                    </td>
                    <td className="p-2 border-r border-dark/20 whitespace-nowrap">
                      <span
                        className={`px-1.5 py-0.5 border border-dark text-[10px] font-extrabold ${
                          log.action === "FIRMWARE_DEPRECATED"
                            ? "bg-red-200"
                            : log.action === "OTA_SAFE_PARTITION_RETAINED"
                            ? "bg-yellow-200"
                            : "bg-mint"
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="p-2 border-r border-dark/20 whitespace-nowrap">
                      <div className="font-extrabold">{log.targetModelCode}</div>
                      <div className="text-[10px]">v{log.targetVersion}</div>
                    </td>
                    <td className="p-2">
                      <div>{log.details}</div>
                      <div className="text-[10px] text-dark/60 font-mono">
                        SHA-256: {log.sha256Snippet}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </RetroWindow>
  );
};

function INITIAL_DEVICE_ID(
  devices: { id: string; ledModelId: string }[],
  modelId: string
): string {
  return (
    devices.find((d) => d.ledModelId === modelId)?.id || devices[0]?.id || ""
  );
}
