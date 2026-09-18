import type { DEVICE_TYPES, SERVICE_CATEGORIES } from "@/lib/constants";

type DeviceType = (typeof DEVICE_TYPES)[number];
type ServiceCategory = (typeof SERVICE_CATEGORIES)[number];
type CatalogService = {
  name: string;
  slug: string;
  category: ServiceCategory;
  supportedDeviceTypes: DeviceType[];
  shortDescription: string;
  description: string;
  basePrice: number;
  estimatedDurationMinutes: number;
  requiresDiagnosis: true;
  requiresQuotationApproval: true;
  isActive: true;
};

const computers: DeviceType[] = ["LAPTOP", "DESKTOP"];
const tablets: DeviceType[] = ["TABLET"];
const phones: DeviceType[] = ["PHONE"];
const entry = (
  name: string,
  slug: string,
  category: ServiceCategory,
  supportedDeviceTypes: DeviceType[],
  shortDescription: string,
  basePrice: number,
  estimatedDurationMinutes: number,
): CatalogService => ({
  name, slug, category, supportedDeviceTypes, shortDescription,
  description: `${shortDescription} We assess the device, explain the findings, and provide a quotation before paid repair work. The starting price is an estimate; replacement parts and additional work are quoted separately in naira.`,
  basePrice, estimatedDurationMinutes,
  requiresDiagnosis: true,
  requiresQuotationApproval: true,
  isActive: true,
});

export const CARE_SERVICES: readonly CatalogService[] = [
  entry("Computer diagnostics", "computer-diagnostics", "HARDWARE_DIAGNOSTICS", computers, "Find the cause of startup, performance, display, or hardware faults on a laptop or desktop.", 20000, 90),
  entry("Computer screen repair", "computer-screen-repair", "HARDWARE_REPAIR", computers, "Assess and repair a damaged or faulty laptop screen or desktop display connection.", 45000, 180),
  entry("Computer battery and power repair", "computer-power-repair", "HARDWARE_REPAIR", computers, "Diagnose laptop battery, charging, adapter, and computer power-supply problems.", 30000, 150),
  entry("Computer storage upgrade", "computer-storage-upgrade", "SYSTEM_UPGRADE", computers, "Upgrade a laptop or desktop drive and check compatibility and data-transfer needs.", 35000, 180),
  entry("Computer cleaning and thermal care", "computer-thermal-care", "PREVENTIVE_MAINTENANCE", computers, "Clean internal dust, inspect cooling, and address overheating or fan noise.", 25000, 120),
  entry("Computer operating-system recovery", "computer-system-recovery", "SOFTWARE_INSTALLATION", computers, "Repair boot and operating-system issues while assessing options for preserving data.", 30000, 180),
  entry("Tablet diagnostics", "tablet-diagnostics", "HARDWARE_DIAGNOSTICS", tablets, "Identify tablet display, charging, battery, software, and performance faults.", 20000, 90),
  entry("Tablet screen repair", "tablet-screen-repair", "HARDWARE_REPAIR", tablets, "Assess cracked glass, touch failure, display faults, and screen replacement options.", 40000, 180),
  entry("Tablet battery repair", "tablet-battery-repair", "HARDWARE_REPAIR", tablets, "Investigate fast battery drain, swelling, and charging-related battery faults.", 30000, 150),
  entry("Tablet charging-port repair", "tablet-charging-port-repair", "HARDWARE_REPAIR", tablets, "Diagnose loose, damaged, or unreliable tablet charging connections.", 35000, 150),
  entry("Tablet software recovery", "tablet-software-recovery", "SOFTWARE_INSTALLATION", tablets, "Resolve tablet startup, update, and operating-system issues after assessment.", 25000, 120),
  entry("Phone diagnostics", "phone-diagnostics", "HARDWARE_DIAGNOSTICS", phones, "Identify the cause of phone power, display, charging, audio, or software faults.", 15000, 75),
  entry("Phone screen repair", "phone-screen-repair", "HARDWARE_REPAIR", phones, "Assess cracked glass, unresponsive touch, and display replacement options.", 35000, 150),
  entry("Phone battery repair", "phone-battery-repair", "HARDWARE_REPAIR", phones, "Investigate poor battery life, unexpected shutdowns, and battery swelling.", 25000, 120),
  entry("Phone charging-port repair", "phone-charging-port-repair", "HARDWARE_REPAIR", phones, "Diagnose unreliable charging, damaged ports, and cable-connection issues.", 30000, 120),
  entry("Phone liquid-damage assessment", "phone-liquid-damage-assessment", "HARDWARE_DIAGNOSTICS", phones, "Inspect a liquid-exposed phone and identify safe recovery and repair options.", 30000, 120),
  entry("Phone software recovery", "phone-software-recovery", "SOFTWARE_INSTALLATION", phones, "Assess startup loops, failed updates, and software faults before recovery work.", 20000, 120),
];
