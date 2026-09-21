// src/data/mockProducts.js
export const mockProducts = [
  {
    id: "PROD-LED-WS-01",
    name: "LED X1", // Shortened slightly for UI fit
    description: "An IoT-enabled automotive projection display designed for windshield mounting. It projects dynamic pixel animations, character designs, and custom graphics visible to exterior road users without obstructing the driver's interior visibility.",
    image: "https://images.example.com/products/smart-led-windshield-x1.png",
    price: {
      amount: 20,
      currency: "USD",
      formatted: "$20.00"
    },
    specifications: {
      display_type: "Flexible RGB LED Matrix Panel",
      resolution: "32x32 Full-Color Pixels",
      brightness: "1,200 nits (Auto-dimming ambient light sensor)",
      optical_feature: "Exterior high-contrast reflection with zero interior driver glare",
      connectivity: [
        "Bluetooth 5.0 BLE",
        "Wi-Fi 802.11 b/g/n (2.4GHz)"
      ],
      power_input: "5V / 2A USB Type-C (includes 12V car adapter cable)",
      mounting_method: "High-transparency electrostatic windshield film with magnetic quick-release bracket",
      supported_content: [
        "Custom DIY Pixel Art",
        "Animated GIFs",
        "Dynamic Text / Emojis",
        "Marketplace Downloadable Graphics"
      ],
      supported_platforms: "iOS & Android Companion App (with Web Management Dashboard)",
      firmware_support: "OTA (Over-The-Air) Firmware Updates",
    },
    variants: [
        "Device Only",
        "Device + Starter Design Pack",
    ]
  }
];