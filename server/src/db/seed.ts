/**
 * Curated Demonstration Product Catalog Seed Script
 *
 * Populates realistic product inventory across the 7 required categories:
 * - Laptops
 * - Monitors
 * - Keyboards
 * - Mice
 * - Headphones
 * - Furniture
 * - Accessories
 *
 * Explicit Notice: All entries are demonstration catalog data for the PayPal AI
 * Hackathon prototype. They do not claim access to live merchant inventory.
 */

import { DatabaseSync } from 'node:sqlite';
import { getDatabase } from './index';
import { logger } from '../utils/logger';

export interface SeedProduct {
  id: string;
  sku: string;
  title: string;
  categoryId: string;
  brand: string;
  basePrice: number;
  currency: string;
  rating: number;
  reviewCount: number;
  inStock: boolean;
  imageUrl: string;
  description: string;
  attributes: Array<{
    key: string;
    value: string;
    type: 'string' | 'number' | 'boolean';
    filterable: boolean;
  }>;
}

export const SEED_PRODUCTS: SeedProduct[] = [
  // ==========================================================================
  // 1. LAPTOPS
  // ==========================================================================
  {
    id: 'prod_lap_01',
    sku: 'LAP-APEX-14',
    title: 'ApexBook Pro 14 Silicon Developer Laptop',
    categoryId: 'laptops',
    brand: 'ApexTech',
    basePrice: 1299.0,
    currency: 'USD',
    rating: 4.9,
    reviewCount: 412,
    inStock: true,
    imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600',
    description:
      'High-performance 14-inch developer ultrabook powered by a 10-core ARM processor, 32GB unified RAM, and 1TB NVMe SSD. Ultra-quiet active cooling. [Demonstration Catalog Data - Not Live Merchant Inventory]',
    attributes: [
      { key: 'screen_size', value: '14.2 inches', type: 'string', filterable: true },
      { key: 'ram', value: '32GB', type: 'string', filterable: true },
      { key: 'storage', value: '1TB SSD', type: 'string', filterable: true },
      { key: 'processor', value: '10-Core ARM', type: 'string', filterable: true },
      { key: 'weight_lbs', value: '3.1', type: 'number', filterable: true },
      { key: 'battery_hours', value: '18', type: 'number', filterable: true },
    ],
  },
  {
    id: 'prod_lap_02',
    sku: 'LAP-NOVA-13',
    title: 'NovaBook Air 13 Portable Ultrabook',
    categoryId: 'laptops',
    brand: 'NovaTech',
    basePrice: 849.0,
    currency: 'USD',
    rating: 4.7,
    reviewCount: 285,
    inStock: true,
    imageUrl: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=600',
    description:
      'Featherlight 13.3-inch laptop designed for nomadic productivity and mobile development. 16GB LPDDR5, 512GB PCIe 4.0 SSD, all-day battery. [Demonstration Catalog Data - Not Live Merchant Inventory]',
    attributes: [
      { key: 'screen_size', value: '13.3 inches', type: 'string', filterable: true },
      { key: 'ram', value: '16GB', type: 'string', filterable: true },
      { key: 'storage', value: '512GB SSD', type: 'string', filterable: true },
      { key: 'processor', value: 'Intel Core i7-1355U', type: 'string', filterable: true },
      { key: 'weight_lbs', value: '2.6', type: 'number', filterable: true },
      { key: 'battery_hours', value: '15', type: 'number', filterable: true },
    ],
  },
  {
    id: 'prod_lap_03',
    sku: 'LAP-TITAN-16',
    title: 'TitanForge 16 Extreme Mobile Workstation',
    categoryId: 'laptops',
    brand: 'TitanForge',
    basePrice: 1799.0,
    currency: 'USD',
    rating: 4.8,
    reviewCount: 167,
    inStock: true,
    imageUrl: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=600',
    description:
      'Uncompromising desktop replacement with 16-inch 165Hz mini-LED display, 64GB DDR5 memory, 2TB Gen4 SSD, and RTX 4070 GPU for local ML inference. [Demonstration Catalog Data - Not Live Merchant Inventory]',
    attributes: [
      { key: 'screen_size', value: '16.0 inches', type: 'string', filterable: true },
      { key: 'ram', value: '64GB', type: 'string', filterable: true },
      { key: 'storage', value: '2TB SSD', type: 'string', filterable: true },
      { key: 'gpu', value: 'NVIDIA RTX 4070', type: 'string', filterable: true },
      { key: 'weight_lbs', value: '4.6', type: 'number', filterable: true },
    ],
  },

  // ==========================================================================
  // 2. MONITORS
  // ==========================================================================
  {
    id: 'prod_mon_01',
    sku: 'MON-VC-27-4K',
    title: 'ViewCraft UltraClear 27-inch 4K UHD IPS Designer Monitor',
    categoryId: 'monitors',
    brand: 'ViewCraft',
    basePrice: 379.99,
    currency: 'USD',
    rating: 4.8,
    reviewCount: 520,
    inStock: true,
    imageUrl: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600',
    description:
      'Factory-calibrated 27-inch 4K IPS panel with 99% sRGB and 95% DCI-P3 color gamut. Features 90W USB-C single-cable power delivery and VESA 100 mount. [Demonstration Catalog Data - Not Live Merchant Inventory]',
    attributes: [
      { key: 'screen_size', value: '27 inches', type: 'string', filterable: true },
      { key: 'resolution', value: '3840x2160 (4K UHD)', type: 'string', filterable: true },
      { key: 'panel_type', value: 'IPS', type: 'string', filterable: true },
      { key: 'refresh_rate', value: '60Hz', type: 'string', filterable: true },
      { key: 'connectivity', value: 'USB-C (90W PD), HDMI 2.1, DisplayPort 1.4', type: 'string', filterable: true },
      { key: 'vesa_compatible', value: 'true', type: 'boolean', filterable: true },
    ],
  },
  {
    id: 'prod_mon_02',
    sku: 'MON-VE-34-UW',
    title: 'VisionEdge HorizonView 34-inch Curved Ultrawide Display',
    categoryId: 'monitors',
    brand: 'VisionEdge',
    basePrice: 499.99,
    currency: 'USD',
    rating: 4.9,
    reviewCount: 340,
    inStock: true,
    imageUrl: 'https://images.unsplash.com/photo-1547082299-de196ea013d6?w=600',
    description:
      'Immersive 34-inch 21:9 ultrawide with 1800R gentle curvature, 3440x1440 WQHD resolution, and 144Hz refresh rate. Replaces dual monitor setups seamlessly. [Demonstration Catalog Data - Not Live Merchant Inventory]',
    attributes: [
      { key: 'screen_size', value: '34 inches', type: 'string', filterable: true },
      { key: 'resolution', value: '3440x1440 (WQHD Ultrawide)', type: 'string', filterable: true },
      { key: 'aspect_ratio', value: '21:9', type: 'string', filterable: true },
      { key: 'refresh_rate', value: '144Hz', type: 'string', filterable: true },
      { key: 'curvature', value: '1800R', type: 'string', filterable: true },
      { key: 'vesa_compatible', value: 'true', type: 'boolean', filterable: true },
    ],
  },
  {
    id: 'prod_mon_03',
    sku: 'MON-VC-24-FHD',
    title: 'ViewCraft ErgoSharp 24-inch FHD Productivity Monitor',
    categoryId: 'monitors',
    brand: 'ViewCraft',
    basePrice: 159.99,
    currency: 'USD',
    rating: 4.6,
    reviewCount: 680,
    inStock: true,
    imageUrl: 'https://images.unsplash.com/photo-1586210579191-33b45e38fa2c?w=600',
    description:
      'Space-efficient 24-inch 1080p IPS display with ultra-thin bezels, hardware low blue light filter, and fully height-adjustable ergonomic stand. [Demonstration Catalog Data - Not Live Merchant Inventory]',
    attributes: [
      { key: 'screen_size', value: '24 inches', type: 'string', filterable: true },
      { key: 'resolution', value: '1920x1080 (FHD)', type: 'string', filterable: true },
      { key: 'panel_type', value: 'IPS', type: 'string', filterable: true },
      { key: 'refresh_rate', value: '75Hz', type: 'string', filterable: true },
      { key: 'vesa_compatible', value: 'true', type: 'boolean', filterable: true },
    ],
  },

  // ==========================================================================
  // 3. KEYBOARDS
  // ==========================================================================
  {
    id: 'prod_kb_01',
    sku: 'KB-ERGO-SPLIT',
    title: 'ErgoKey Split Ergonomic Mechanical Keyboard',
    categoryId: 'keyboards',
    brand: 'ErgoKey',
    basePrice: 139.99,
    currency: 'USD',
    rating: 4.8,
    reviewCount: 310,
    inStock: true,
    imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600',
    description:
      'Split ortholinear ergonomic keyboard designed to eliminate ulnar deviation and carpal pressure. Features pre-lubed silent tactile switches and magnetic wrist rests. [Demonstration Catalog Data - Not Live Merchant Inventory]',
    attributes: [
      { key: 'layout', value: 'Split Ortholinear', type: 'string', filterable: true },
      { key: 'switch_type', value: 'Silent Tactile Brown', type: 'string', filterable: true },
      { key: 'connectivity', value: 'Wireless 2.4G + Bluetooth + USB-C', type: 'string', filterable: true },
      { key: 'wrist_rest', value: 'Included (Magnetic Cushioned)', type: 'string', filterable: true },
      { key: 'hot_swappable', value: 'true', type: 'boolean', filterable: true },
    ],
  },
  {
    id: 'prod_kb_02',
    sku: 'KB-CODE-75',
    title: 'KeyCraft CodeType Pro 75% Wireless Mechanical Keyboard',
    categoryId: 'keyboards',
    brand: 'KeyCraft',
    basePrice: 119.99,
    currency: 'USD',
    rating: 4.7,
    reviewCount: 440,
    inStock: true,
    imageUrl: 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=600',
    description:
      'Compact 75% mechanical keyboard engineered for developers. Gasket-mounted design with CNC aluminum knob, sound-dampening silicone foam, and 200-hour battery. [Demonstration Catalog Data - Not Live Merchant Inventory]',
    attributes: [
      { key: 'layout', value: '75% Compact', type: 'string', filterable: true },
      { key: 'switch_type', value: 'Linear Red (Pre-lubed)', type: 'string', filterable: true },
      { key: 'connectivity', value: 'Tri-Mode (Wireless/BT/USB-C)', type: 'string', filterable: true },
      { key: 'backlight', value: 'RGB South-Facing', type: 'string', filterable: true },
      { key: 'battery_hours', value: '200', type: 'number', filterable: true },
    ],
  },
  {
    id: 'prod_kb_03',
    sku: 'KB-SLNT-MEM',
    title: 'NovaType SilentTouch Low-Profile Bluetooth Keyboard',
    categoryId: 'keyboards',
    brand: 'NovaType',
    basePrice: 59.99,
    currency: 'USD',
    rating: 4.5,
    reviewCount: 520,
    inStock: true,
    imageUrl: 'https://images.unsplash.com/photo-1595225476474-87563907a212?w=600',
    description:
      'Whisper-quiet low-profile scissor-switch keyboard with dedicated numeric pad. Effortlessly pairs with up to 3 devices simultaneously with one-touch switching. [Demonstration Catalog Data - Not Live Merchant Inventory]',
    attributes: [
      { key: 'layout', value: 'Full Size 104-Key', type: 'string', filterable: true },
      { key: 'switch_type', value: 'Scissor Membrane', type: 'string', filterable: true },
      { key: 'connectivity', value: 'Bluetooth 5.2 (Multi-device)', type: 'string', filterable: true },
      { key: 'profile', value: 'Ultra-slim Low Profile', type: 'string', filterable: true },
    ],
  },

  // ==========================================================================
  // 4. MICE
  // ==========================================================================
  {
    id: 'prod_mou_01',
    sku: 'MOU-ERGO-VERT',
    title: 'ErgoKey ErgoGlide Vertical Ergonomic Wireless Mouse',
    categoryId: 'mice',
    brand: 'ErgoKey',
    basePrice: 69.99,
    currency: 'USD',
    rating: 4.8,
    reviewCount: 380,
    inStock: true,
    imageUrl: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=600',
    description:
      'Scientific 57-degree natural handshake angle reduces forearm pronation and wrist strain by up to 40%. Features high-precision 4000 DPI sensor and thumb rest. [Demonstration Catalog Data - Not Live Merchant Inventory]',
    attributes: [
      { key: 'form_factor', value: 'Vertical Ergonomic (57 deg handshake)', type: 'string', filterable: true },
      { key: 'dpi', value: '4000 DPI Optical', type: 'string', filterable: true },
      { key: 'connectivity', value: 'Wireless 2.4G + Bluetooth', type: 'string', filterable: true },
      { key: 'buttons', value: '6 Programmable Buttons', type: 'string', filterable: true },
      { key: 'rechargeable', value: 'true', type: 'boolean', filterable: true },
    ],
  },
  {
    id: 'prod_mou_02',
    sku: 'MOU-NOVA-MX',
    title: 'NovaTech PrecisionMaster MX Wireless Productivity Mouse',
    categoryId: 'mice',
    brand: 'NovaTech',
    basePrice: 99.99,
    currency: 'USD',
    rating: 4.9,
    reviewCount: 710,
    inStock: true,
    imageUrl: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600',
    description:
      'Flagship productivity mouse featuring electromagnetic MagSpeed scroll wheel capable of 1,000 lines per second. Tracks on any surface, including glass. [Demonstration Catalog Data - Not Live Merchant Inventory]',
    attributes: [
      { key: 'form_factor', value: 'Right-handed Sculpted', type: 'string', filterable: true },
      { key: 'dpi', value: '8000 DPI Darkfield Glass Tracking', type: 'string', filterable: true },
      { key: 'connectivity', value: 'Bluetooth + Logi Bolt USB', type: 'string', filterable: true },
      { key: 'scroll_type', value: 'Electromagnetic MagSpeed', type: 'string', filterable: true },
      { key: 'battery_days', value: '70', type: 'number', filterable: true },
    ],
  },
  {
    id: 'prod_mou_03',
    sku: 'MOU-TRACK-ORB',
    title: 'TrackFlow OrbitBall Ergonomic Finger Trackball Mouse',
    categoryId: 'mice',
    brand: 'TrackFlow',
    basePrice: 79.99,
    currency: 'USD',
    rating: 4.6,
    reviewCount: 220,
    inStock: true,
    imageUrl: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=600',
    description:
      'Stationary ergonomic trackball mouse that completely eliminates repetitive arm movement. 20-degree tilt angle adjustment with smooth optical bearing. [Demonstration Catalog Data - Not Live Merchant Inventory]',
    attributes: [
      { key: 'form_factor', value: 'Trackball Stationary', type: 'string', filterable: true },
      { key: 'control_mechanism', value: 'Index/Middle Finger 40mm Ball', type: 'string', filterable: true },
      { key: 'connectivity', value: '2.4GHz Wireless + USB-C', type: 'string', filterable: true },
      { key: 'adjustable_tilt', value: '0 to 20 Degrees', type: 'string', filterable: true },
    ],
  },

  // ==========================================================================
  // 5. HEADPHONES
  // ==========================================================================
  {
    id: 'prod_hp_01',
    sku: 'HP-STUDIO-40',
    title: 'StudioPure 40mm Closed-Back Reference Headphones',
    categoryId: 'headphones',
    brand: 'StudioPure',
    basePrice: 89.99,
    currency: 'USD',
    rating: 4.9,
    reviewCount: 620,
    inStock: true,
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600',
    description:
      'Acoustically tuned 40mm neodymium drivers delivering flat, uncolored frequency response for critical audio monitoring and podcast editing. Closed-back isolation. [Demonstration Catalog Data - Not Live Merchant Inventory]',
    attributes: [
      { key: 'acoustic_design', value: 'Closed-Back Over-Ear', type: 'string', filterable: true },
      { key: 'driver_size', value: '40mm Neodymium', type: 'string', filterable: true },
      { key: 'impedance', value: '32 Ohms', type: 'string', filterable: true },
      { key: 'detachable_cable', value: 'true', type: 'boolean', filterable: true },
      { key: 'noise_isolation', value: 'Passive Physical Seal', type: 'string', filterable: true },
    ],
  },
  {
    id: 'prod_hp_02',
    sku: 'HP-SOUND-ANC',
    title: 'SoundWave SilenceMax Hybrid Active Noise Cancelling Headphones',
    categoryId: 'headphones',
    brand: 'SoundWave',
    basePrice: 199.99,
    currency: 'USD',
    rating: 4.8,
    reviewCount: 450,
    inStock: true,
    imageUrl: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600',
    description:
      'Deep 38dB active noise cancellation with 40-hour battery life and multi-point Bluetooth connectivity. Memory foam ear cushions provide all-day comfort. [Demonstration Catalog Data - Not Live Merchant Inventory]',
    attributes: [
      { key: 'acoustic_design', value: 'Over-Ear Wireless ANC', type: 'string', filterable: true },
      { key: 'anc_reduction', value: '38dB Hybrid ANC', type: 'string', filterable: true },
      { key: 'battery_hours', value: '40', type: 'number', filterable: true },
      { key: 'codecs', value: 'LDAC, AAC, SBC', type: 'string', filterable: true },
      { key: 'multipoint', value: 'true', type: 'boolean', filterable: true },
    ],
  },
  {
    id: 'prod_hp_03',
    sku: 'HP-VOICE-USB',
    title: 'VoiceLink ClearVoice USB Call Headset with Noise-Cancelling Mic',
    categoryId: 'headphones',
    brand: 'VoiceLink',
    basePrice: 49.99,
    currency: 'USD',
    rating: 4.6,
    reviewCount: 380,
    inStock: true,
    imageUrl: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600',
    description:
      'Ultra-lightweight on-ear headset with flexible noise-cancelling boom microphone. In-line mute and volume controls with dual USB-A and USB-C adapters. [Demonstration Catalog Data - Not Live Merchant Inventory]',
    attributes: [
      { key: 'form_factor', value: 'On-Ear Single/Dual', type: 'string', filterable: true },
      { key: 'microphone', value: 'Noise-Cancelling Boom Mic', type: 'string', filterable: true },
      { key: 'connectivity', value: 'USB-C with USB-A Adapter', type: 'string', filterable: true },
      { key: 'inline_mute', value: 'true', type: 'boolean', filterable: true },
    ],
  },

  // ==========================================================================
  // 6. FURNITURE
  // ==========================================================================
  {
    id: 'prod_fur_01',
    sku: 'FUR-AERO-DSK',
    title: 'AeroDesk 60x30 Dual-Motor Electric Standing Desk',
    categoryId: 'furniture',
    brand: 'AeroDesk',
    basePrice: 399.99,
    currency: 'USD',
    rating: 4.8,
    reviewCount: 290,
    inStock: true,
    imageUrl: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=600',
    description:
      'Commercial-grade solid core desk featuring whisper-quiet dual electric lift motors, 4 programmable height presets, anti-collision sensor, and cable management tray. [Demonstration Catalog Data - Not Live Merchant Inventory]',
    attributes: [
      { key: 'dimensions', value: '60" W x 30" D', type: 'string', filterable: true },
      { key: 'height_range', value: '28" to 48"', type: 'string', filterable: true },
      { key: 'motor_type', value: 'Dual Electric High-Torque', type: 'string', filterable: true },
      { key: 'weight_capacity_lbs', value: '260', type: 'number', filterable: true },
      { key: 'memory_presets', value: '4', type: 'number', filterable: true },
    ],
  },
  {
    id: 'prod_fur_02',
    sku: 'FUR-ERGO-CHR',
    title: 'ErgoChairs DynamicMesh High-Back Ergonomic Office Chair',
    categoryId: 'furniture',
    brand: 'ErgoChairs',
    basePrice: 279.99,
    currency: 'USD',
    rating: 4.7,
    reviewCount: 350,
    inStock: true,
    imageUrl: 'https://images.unsplash.com/photo-1580481077195-c3a821a58875?w=600',
    description:
      'Engineered for long computing sessions with adaptive self-adjusting lumbar support, 4D multi-directional armrests, breathable elastomeric mesh, and 135-degree recline. [Demonstration Catalog Data - Not Live Merchant Inventory]',
    attributes: [
      { key: 'lumbar_support', value: 'Adaptive 3D Self-Adjusting', type: 'string', filterable: true },
      { key: 'armrests', value: '4D Height/Depth/Angle', type: 'string', filterable: true },
      { key: 'material', value: 'Breathable Elastomeric Mesh', type: 'string', filterable: true },
      { key: 'recline_range', value: '90 to 135 Degrees', type: 'string', filterable: true },
      { key: 'weight_capacity_lbs', value: '300', type: 'number', filterable: true },
    ],
  },
  {
    id: 'prod_fur_03',
    sku: 'FUR-CONF-MAT',
    title: 'ErgoChairs ComfortStep Anti-Fatigue Desk Standing Mat',
    categoryId: 'furniture',
    brand: 'ErgoChairs',
    basePrice: 44.99,
    currency: 'USD',
    rating: 4.8,
    reviewCount: 510,
    inStock: true,
    imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600',
    description:
      'High-density 3/4-inch polyurethane foam core cushions feet and relieves spine compression during standing desk use. Beveled anti-trip safety borders. [Demonstration Catalog Data - Not Live Merchant Inventory]',
    attributes: [
      { key: 'thickness_inches', value: '0.75', type: 'number', filterable: true },
      { key: 'material', value: 'High-Density Ergonomic Foam', type: 'string', filterable: true },
      { key: 'dimensions', value: '32" x 20"', type: 'string', filterable: true },
      { key: 'beveled_edges', value: 'true', type: 'boolean', filterable: true },
    ],
  },

  // ==========================================================================
  // 7. ACCESSORIES
  // ==========================================================================
  {
    id: 'prod_acc_01',
    sku: 'ACC-MNT-GAS',
    title: 'ErgoView Dual Gas Spring Counterbalance Monitor Mount',
    categoryId: 'accessories',
    brand: 'ErgoView',
    basePrice: 79.99,
    currency: 'USD',
    rating: 4.8,
    reviewCount: 460,
    inStock: true,
    imageUrl: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=600',
    description:
      'Heavy-duty pneumatic gas spring arms hold twin displays up to 32 inches each (19.8 lbs per arm). Fully articulates with 360-degree rotation and concealed cabling. [Demonstration Catalog Data - Not Live Merchant Inventory]',
    attributes: [
      { key: 'mount_type', value: 'Dual Desk Clamp & Grommet', type: 'string', filterable: true },
      { key: 'max_screen_size', value: '32 inches per arm', type: 'string', filterable: true },
      { key: 'max_payload_lbs', value: '19.8 per arm', type: 'number', filterable: true },
      { key: 'vesa_standard', value: '75x75 and 100x100', type: 'string', filterable: true },
    ],
  },
  {
    id: 'prod_acc_02',
    sku: 'ACC-LGT-BAR',
    title: 'Lumeno Pro ScreenBar High-CRI Desk Task Lamp',
    categoryId: 'accessories',
    brand: 'Lumeno',
    basePrice: 64.99,
    currency: 'USD',
    rating: 4.9,
    reviewCount: 390,
    inStock: true,
    imageUrl: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600',
    description:
      'Asymmetric optical light bar mounts securely atop monitors to illuminate work surface without casting glare on the display screen. CRI > 95 color fidelity. [Demonstration Catalog Data - Not Live Merchant Inventory]',
    attributes: [
      { key: 'light_source', value: 'Asymmetric High-CRI LED', type: 'string', filterable: true },
      { key: 'color_rendering_index', value: '95+ CRI', type: 'string', filterable: true },
      { key: 'color_temperature', value: '2700K - 6500K Adjustable', type: 'string', filterable: true },
      { key: 'glare_free', value: 'true', type: 'boolean', filterable: true },
      { key: 'power_source', value: 'USB Powered 5V/1A', type: 'string', filterable: true },
    ],
  },
  {
    id: 'prod_acc_03',
    sku: 'ACC-HUB-GAN',
    title: 'NovaTech PowerHub 8-in-1 100W GaN USB-C Desktop Dock',
    categoryId: 'accessories',
    brand: 'NovaTech',
    basePrice: 89.99,
    currency: 'USD',
    rating: 4.8,
    reviewCount: 320,
    inStock: true,
    imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600',
    description:
      'Compact GaN-powered docking station delivering 100W Power Delivery pass-through, dual 4K@60Hz HDMI video, 3x USB 3.2 Gen 2 ports, SD reader, and Gigabit Ethernet. [Demonstration Catalog Data - Not Live Merchant Inventory]',
    attributes: [
      { key: 'power_delivery', value: '100W PD 3.0 Fast Charge', type: 'string', filterable: true },
      { key: 'video_outputs', value: 'Dual 4K@60Hz HDMI', type: 'string', filterable: true },
      { key: 'ports', value: '8 Total Ports', type: 'number', filterable: true },
      { key: 'ethernet', value: 'Gigabit 1000Mbps', type: 'string', filterable: true },
    ],
  },
  {
    id: 'prod_acc_04',
    sku: 'ACC-MIC-DYN',
    title: 'AuraVoice Pro USB Broadcast Dynamic Microphone',
    categoryId: 'accessories',
    brand: 'AuraVoice',
    basePrice: 129.99,
    currency: 'USD',
    rating: 4.9,
    reviewCount: 430,
    inStock: true,
    imageUrl: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=600',
    description:
      'Studio dynamic cardioid capsule with 24-bit/96kHz high-resolution ADC, internal shock isolation, and onboard hardware DSP noise reduction. [Demonstration Catalog Data - Not Live Merchant Inventory]',
    attributes: [
      { key: 'polar_pattern', value: 'Cardioid Directional', type: 'string', filterable: true },
      { key: 'capsule_type', value: 'Broadcast Dynamic', type: 'string', filterable: true },
      { key: 'audio_resolution', value: '24-bit / 96kHz', type: 'string', filterable: true },
      { key: 'headphone_jack', value: 'Zero-latency 3.5mm monitor', type: 'string', filterable: true },
    ],
  },
  {
    id: 'prod_acc_05',
    sku: 'ACC-ARM-BOOM',
    title: 'FlexMount Articulated Low-Profile Desk Boom Arm',
    categoryId: 'accessories',
    brand: 'FlexMount',
    basePrice: 69.99,
    currency: 'USD',
    rating: 4.7,
    reviewCount: 240,
    inStock: true,
    imageUrl: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=600',
    description:
      'All-metal low-profile microphone boom arm sits cleanly beneath monitors without obstructing line-of-sight. Concealed magnetic cable raceways. [Demonstration Catalog Data - Not Live Merchant Inventory]',
    attributes: [
      { key: 'reach_inches', value: '30', type: 'number', filterable: true },
      { key: 'max_payload_lbs', value: '4.4', type: 'number', filterable: true },
      { key: 'rotation_degrees', value: '360', type: 'number', filterable: true },
      { key: 'profile', value: 'Under-Monitor Low Profile', type: 'string', filterable: true },
    ],
  },
];

/**
 * Executes idempotent database seeding.
 */
export function seedCatalog(db: DatabaseSync, force = false): void {
  // Check existing count
  const countRow = db.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number };
  if (!force && countRow && countRow.count >= SEED_PRODUCTS.length) {
    logger.info(`Product catalog already populated with ${countRow.count} items. Skipping seed.`);
    return;
  }

  logger.info(`Seeding comprehensive demonstration product catalog (${SEED_PRODUCTS.length} items)...`);

  const deleteAttrs = db.prepare('DELETE FROM product_attributes');
  const deleteProds = db.prepare('DELETE FROM products');

  const insertProduct = db.prepare(`
    INSERT INTO products (id, sku, title, category_id, brand, base_price, currency, rating, review_count, in_stock, image_url, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertAttr = db.prepare(`
    INSERT INTO product_attributes (id, product_id, attribute_key, attribute_value, attribute_type, is_filterable)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  if (force) {
    deleteAttrs.run();
    deleteProds.run();
  }

  let attrCount = 0;
  for (const p of SEED_PRODUCTS) {
    // Delete if existing to allow upsert
    db.prepare('DELETE FROM product_attributes WHERE product_id = ?').run(p.id);
    db.prepare('DELETE FROM products WHERE id = ?').run(p.id);

    insertProduct.run(
      p.id,
      p.sku,
      p.title,
      p.categoryId,
      p.brand,
      p.basePrice,
      p.currency,
      p.rating,
      p.reviewCount,
      p.inStock ? 1 : 0,
      p.imageUrl,
      p.description
    );

    let attrIdx = 1;
    for (const attr of p.attributes) {
      const attrId = `attr_${p.id}_${attrIdx++}`;
      insertAttr.run(
        attrId,
        p.id,
        attr.key,
        attr.value,
        attr.type,
        attr.filterable ? 1 : 0
      );
      attrCount++;
    }
  }

  logger.info(
    `Successfully seeded ${SEED_PRODUCTS.length} products with ${attrCount} structured attributes across 7 categories.`
  );
}

// Standalone execution entrypoint
if (require.main === module) {
  const db = getDatabase();
  seedCatalog(db, true);
  console.log('Seed execution completed successfully.');
}
