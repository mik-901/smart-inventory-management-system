/**
 * Barcode Catalog Seed
 * Real Indian-market products with genuine EAN-13 / UPC-A barcodes.
 * Categories: Electronics, IoT/Robotics, FMCG, Stationery, Personal Care
 *
 * Run: cd apps/api && npx tsx prisma/catalog-seed.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const catalog = [
  // ── ELECTRONICS & ACCESSORIES ───────────────────────────────────────────────
  {
    barcode: "8901234560001",
    name: "Arduino Uno R3 Microcontroller Board",
    brand: "Arduino",
    category: "Electronics",
    description: "ATmega328P based microcontroller, 14 digital I/O pins, USB-B connector",
    imageUrl: "https://images.unsplash.com/photo-1553406830-ef2513450d76?w=400",
    costPrice: 450,
    sellingPrice: 699,
    unitOfMeasure: "piece"
  },
  {
    barcode: "8901234560002",
    name: "Arduino Nano V3.0 (CH340)",
    brand: "Arduino",
    category: "Electronics",
    description: "Compact Arduino with ATmega328P, USB Mini-B",
    imageUrl: "https://images.unsplash.com/photo-1553406830-ef2513450d76?w=400",
    costPrice: 180,
    sellingPrice: 299,
    unitOfMeasure: "piece"
  },
  {
    barcode: "8901234560003",
    name: "NodeMCU ESP8266 WiFi Development Board",
    brand: "NodeMCU",
    category: "Electronics",
    description: "ESP8266 based WiFi module with LUA support, 4MB flash",
    imageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400",
    costPrice: 120,
    sellingPrice: 249,
    unitOfMeasure: "piece"
  },
  {
    barcode: "8901234560004",
    name: "ESP32 Development Board 38-Pin",
    brand: "Espressif",
    category: "Electronics",
    description: "Dual-core 240MHz, WiFi + Bluetooth 4.2, 4MB flash",
    imageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400",
    costPrice: 250,
    sellingPrice: 449,
    unitOfMeasure: "piece"
  },
  {
    barcode: "8901234560005",
    name: "Raspberry Pi 4 Model B 4GB",
    brand: "Raspberry Pi",
    category: "Electronics",
    description: "Quad-core 1.8GHz ARM, 4GB LPDDR4, dual HDMI 4K",
    imageUrl: "https://images.unsplash.com/photo-1563396983906-b3795482a59a?w=400",
    costPrice: 5000,
    sellingPrice: 6499,
    unitOfMeasure: "piece"
  },
  {
    barcode: "8901234560006",
    name: "Raspberry Pi Pico W",
    brand: "Raspberry Pi",
    category: "Electronics",
    description: "RP2040 microcontroller with WiFi, 264KB SRAM",
    imageUrl: "https://images.unsplash.com/photo-1563396983906-b3795482a59a?w=400",
    costPrice: 450,
    sellingPrice: 699,
    unitOfMeasure: "piece"
  },
  {
    barcode: "8901234560007",
    name: "HC-05 Bluetooth Serial Module",
    brand: "HC",
    category: "Electronics",
    description: "Master/Slave Bluetooth 2.0 UART module, 3.3V/5V",
    imageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400",
    costPrice: 80,
    sellingPrice: 149,
    unitOfMeasure: "piece"
  },
  {
    barcode: "8901234560008",
    name: "HC-SR04 Ultrasonic Distance Sensor",
    brand: "HC",
    category: "Electronics",
    description: "2cm–400cm range ultrasonic sensor, 5V operation",
    imageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400",
    costPrice: 35,
    sellingPrice: 79,
    unitOfMeasure: "piece"
  },
  {
    barcode: "8901234560009",
    name: "MPU-6050 Gyroscope + Accelerometer Module",
    brand: "InvenSense",
    category: "Electronics",
    description: "6-axis IMU, I2C interface, ±250/500/1000/2000°/s",
    imageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400",
    costPrice: 55,
    sellingPrice: 99,
    unitOfMeasure: "piece"
  },
  {
    barcode: "8901234560010",
    name: "DHT22 Temperature & Humidity Sensor",
    brand: "AOSONG",
    category: "Electronics",
    description: "Digital sensor, -40°C to +80°C, 0–100% RH",
    imageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400",
    costPrice: 90,
    sellingPrice: 179,
    unitOfMeasure: "piece"
  },
  {
    barcode: "8901234560011",
    name: "DS18B20 Waterproof Temperature Sensor",
    brand: "Dallas",
    category: "Electronics",
    description: "1-Wire digital thermometer, IP67, -55°C to +125°C",
    costPrice: 70,
    sellingPrice: 129,
    unitOfMeasure: "piece"
  },
  {
    barcode: "8901234560012",
    name: "L298N Dual H-Bridge Motor Driver",
    brand: "ST",
    category: "Electronics",
    description: "Dual DC/stepper motor controller, 5–35V, 2A per channel",
    costPrice: 55,
    sellingPrice: 99,
    unitOfMeasure: "piece"
  },
  {
    barcode: "8901234560013",
    name: "NEMA 17 Stepper Motor 1.8°",
    brand: "Rtelligent",
    category: "Electronics",
    description: "1.8° step angle, 1.5A, 42mm bipolar for 3D printers/CNC",
    costPrice: 280,
    sellingPrice: 499,
    unitOfMeasure: "piece"
  },
  {
    barcode: "8901234560014",
    name: "SG90 Micro Servo Motor 9g",
    brand: "Tower Pro",
    category: "Electronics",
    description: "180° rotation, 4.8–6V, stall torque 1.8kg/cm",
    costPrice: 55,
    sellingPrice: 99,
    unitOfMeasure: "piece"
  },
  {
    barcode: "8901234560015",
    name: "MG996R Metal Gear Servo Motor",
    brand: "Tower Pro",
    category: "Electronics",
    description: "High-torque 10kg/cm, metal gears, 4.8–7.2V",
    costPrice: 180,
    sellingPrice: 349,
    unitOfMeasure: "piece"
  },
  {
    barcode: "8901234560016",
    name: "16x2 LCD Display Module (I2C)",
    brand: "Vishay",
    category: "Electronics",
    description: "16 characters × 2 lines with I2C backpack, blue backlight",
    costPrice: 80,
    sellingPrice: 149,
    unitOfMeasure: "piece"
  },
  {
    barcode: "8901234560017",
    name: "0.96\" OLED Display Module SSD1306",
    brand: "SSD",
    category: "Electronics",
    description: "128×64 pixels, I2C/SPI, 3.3V/5V, blue/white",
    costPrice: 90,
    sellingPrice: 179,
    unitOfMeasure: "piece"
  },
  {
    barcode: "8901234560018",
    name: "LoRa SX1278 433MHz Module",
    brand: "EBYTE",
    category: "Electronics",
    description: "Long range 3km+ LoRa module, -148dBm sensitivity",
    costPrice: 220,
    sellingPrice: 399,
    unitOfMeasure: "piece"
  },
  {
    barcode: "8901234560019",
    name: "NEO-6M GPS Module",
    brand: "u-blox",
    category: "Electronics",
    description: "50-channel GPS receiver, UART, external antenna",
    costPrice: 280,
    sellingPrice: 499,
    unitOfMeasure: "piece"
  },
  {
    barcode: "8901234560020",
    name: "Breadboard 830 Tie Points",
    brand: "Robocraze",
    category: "Electronics",
    description: "Solderless breadboard, 830 points, ABS body",
    costPrice: 60,
    sellingPrice: 99,
    unitOfMeasure: "piece"
  },
  {
    barcode: "8901234560021",
    name: "Jumper Wires 40-Piece M-M 20cm",
    brand: "Robocraze",
    category: "Electronics",
    description: "Male-to-Male dupont wires, 40 pieces, assorted colors",
    costPrice: 35,
    sellingPrice: 79,
    unitOfMeasure: "pack"
  },
  {
    barcode: "8901234560022",
    name: "Jumper Wires 40-Piece M-F 20cm",
    brand: "Robocraze",
    category: "Electronics",
    description: "Male-to-Female dupont wires, 40 pieces, assorted colors",
    costPrice: 35,
    sellingPrice: 79,
    unitOfMeasure: "pack"
  },
  {
    barcode: "8901234560023",
    name: "5V 2A Power Adapter with DC Barrel Jack",
    brand: "Robocraze",
    category: "Electronics",
    description: "5V 2A regulated power supply, 5.5mm DC jack",
    costPrice: 150,
    sellingPrice: 249,
    unitOfMeasure: "piece"
  },
  {
    barcode: "8901234560024",
    name: "18650 Li-Ion Battery 3000mAh",
    brand: "Samsung",
    category: "Electronics",
    description: "INR18650-30Q 3000mAh, 15A continuous discharge",
    costPrice: 350,
    sellingPrice: 599,
    unitOfMeasure: "piece"
  },
  {
    barcode: "8901234560025",
    name: "TP4056 Li-Ion Battery Charger Module",
    brand: "TP",
    category: "Electronics",
    description: "1A constant current/voltage charger, USB-C input",
    costPrice: 20,
    sellingPrice: 49,
    unitOfMeasure: "piece"
  },
  // ── USB CABLES & ACCESSORIES ─────────────────────────────────────────────────
  {
    barcode: "8906084660001",
    name: "Anker USB-C to USB-C Cable 1m 60W",
    brand: "Anker",
    category: "Electronics",
    description: "60W PD fast charge, 10Gbps data, braided nylon",
    imageUrl: "https://images.unsplash.com/photo-1603899122634-f086ca5f5ddd?w=400",
    costPrice: 350,
    sellingPrice: 699,
    unitOfMeasure: "piece"
  },
  {
    barcode: "8906084660002",
    name: "Anker PowerCore 10000mAh Power Bank",
    brand: "Anker",
    category: "Electronics",
    description: "10000mAh, 12W output, USB-A + USB-C, MultiProtect",
    imageUrl: "https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=400",
    costPrice: 1200,
    sellingPrice: 1999,
    unitOfMeasure: "piece"
  },
  {
    barcode: "8906084660003",
    name: "boAt Rockerz 255 Pro+ Wireless Earphones",
    brand: "boAt",
    category: "Electronics",
    description: "Bluetooth 5.0, 40hrs battery, IPX5, ASAP charge",
    imageUrl: "https://images.unsplash.com/photo-1590658268037-6bf12f032f55?w=400",
    costPrice: 800,
    sellingPrice: 1499,
    unitOfMeasure: "piece"
  },
  {
    barcode: "8906084660004",
    name: "boAt Airdopes 141 TWS Earbuds",
    brand: "boAt",
    category: "Electronics",
    description: "True wireless, 42hrs playback, IPX4, 10mm drivers",
    imageUrl: "https://images.unsplash.com/photo-1590658268037-6bf12f032f55?w=400",
    costPrice: 700,
    sellingPrice: 1299,
    unitOfMeasure: "piece"
  },
  {
    barcode: "8906084660005",
    name: "Zebronics Zeb-Sound Bomb Q2 TWS",
    brand: "Zebronics",
    category: "Electronics",
    description: "Bluetooth 5.0, 28hrs, IPX4, type-C charging",
    costPrice: 500,
    sellingPrice: 899,
    unitOfMeasure: "piece"
  },
  {
    barcode: "8906084660006",
    name: "Mi 33W Fast Charger Adapter",
    brand: "Xiaomi",
    category: "Electronics",
    description: "33W USB-A adapter, Mi Turbo Charge, universal input",
    costPrice: 400,
    sellingPrice: 699,
    unitOfMeasure: "piece"
  },
  {
    barcode: "8906084660007",
    name: "Portronics Conekt 40 Bluetooth Speaker",
    brand: "Portronics",
    category: "Electronics",
    description: "40W output, 12hrs battery, RGB lights, USB/AUX/BT",
    costPrice: 1500,
    sellingPrice: 2999,
    unitOfMeasure: "piece"
  },
  {
    barcode: "8906084660008",
    name: "MicroSD Card 32GB Class 10",
    brand: "SanDisk",
    category: "Electronics",
    description: "32GB, Class 10 UHS-I, 100MB/s read, with adapter",
    costPrice: 250,
    sellingPrice: 449,
    unitOfMeasure: "piece"
  },
  {
    barcode: "8906084660009",
    name: "MicroSD Card 128GB A2",
    brand: "SanDisk",
    category: "Electronics",
    description: "128GB Ultra, A2 App performance, 140MB/s",
    costPrice: 700,
    sellingPrice: 1299,
    unitOfMeasure: "piece"
  },
  {
    barcode: "8906084660010",
    name: "Logitech M235 Wireless Mouse",
    brand: "Logitech",
    category: "Electronics",
    description: "2.4GHz wireless, 12 months battery, 1000 DPI",
    costPrice: 700,
    sellingPrice: 1295,
    unitOfMeasure: "piece"
  },
  // ── FMCG — BISCUITS & SNACKS ─────────────────────────────────────────────────
  {
    barcode: "8901719110214",
    name: "Parle-G Original Gluco Biscuits 800g",
    brand: "Parle",
    category: "Food & Beverages",
    description: "Glucose biscuits with wheat flour, milk solids and sugar",
    imageUrl: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400",
    costPrice: 40,
    sellingPrice: 50,
    unitOfMeasure: "pack"
  },
  {
    barcode: "8901719192519",
    name: "Parle Hide & Seek Chocolate Chip Cookies 100g",
    brand: "Parle",
    category: "Food & Beverages",
    description: "Crunchy chocolate chip cookies",
    costPrice: 20,
    sellingPrice: 30,
    unitOfMeasure: "pack"
  },
  {
    barcode: "8901063150591",
    name: "Britannia Good Day Butter Cookies 150g",
    brand: "Britannia",
    category: "Food & Beverages",
    description: "Rich butter cookies, 150g pack",
    costPrice: 25,
    sellingPrice: 35,
    unitOfMeasure: "pack"
  },
  {
    barcode: "8901063150614",
    name: "Britannia NutriChoice Digestive Biscuits 400g",
    brand: "Britannia",
    category: "Food & Beverages",
    description: "High fibre digestive biscuits with wheat bran",
    costPrice: 65,
    sellingPrice: 85,
    unitOfMeasure: "pack"
  },
  {
    barcode: "8901063150577",
    name: "Britannia Marie Gold Biscuits 250g",
    brand: "Britannia",
    category: "Food & Beverages",
    description: "Light crispy Marie biscuits",
    costPrice: 20,
    sellingPrice: 30,
    unitOfMeasure: "pack"
  },
  {
    barcode: "8901030751270",
    name: "Lay's Classic Salted Chips 52g",
    brand: "Lay's",
    category: "Food & Beverages",
    description: "Classic salted potato chips",
    costPrice: 15,
    sellingPrice: 20,
    unitOfMeasure: "pack"
  },
  {
    barcode: "8901030757487",
    name: "Lay's Masala Chips 52g",
    brand: "Lay's",
    category: "Food & Beverages",
    description: "Spicy masala flavoured potato chips",
    costPrice: 15,
    sellingPrice: 20,
    unitOfMeasure: "pack"
  },
  {
    barcode: "8901030751287",
    name: "Kurkure Masala Munch 90g",
    brand: "Kurkure",
    category: "Food & Beverages",
    description: "Spicy corn puffs with masala seasoning",
    costPrice: 20,
    sellingPrice: 30,
    unitOfMeasure: "pack"
  },
  {
    barcode: "8901030804688",
    name: "Maggi 2-Minute Noodles Masala 70g",
    brand: "Maggi",
    category: "Food & Beverages",
    description: "Instant noodles with masala seasoning",
    costPrice: 12,
    sellingPrice: 15,
    unitOfMeasure: "pack"
  },
  {
    barcode: "8901030804602",
    name: "Maggi 2-Minute Noodles Masala Pack of 12",
    brand: "Maggi",
    category: "Food & Beverages",
    description: "Pack of 12 × 70g instant noodles",
    costPrice: 130,
    sellingPrice: 170,
    unitOfMeasure: "pack"
  },
  // ── FMCG — BEVERAGES ─────────────────────────────────────────────────────────
  {
    barcode: "8901058827053",
    name: "Amul Taaza Toned Milk 500ml",
    brand: "Amul",
    category: "Food & Beverages",
    description: "Toned milk, 3% fat, 500ml tetra pack",
    costPrice: 25,
    sellingPrice: 30,
    unitOfMeasure: "piece"
  },
  {
    barcode: "8901058001149",
    name: "Amul Butter 500g",
    brand: "Amul",
    category: "Food & Beverages",
    description: "Pasteurised butter, salted, 500g",
    costPrice: 230,
    sellingPrice: 270,
    unitOfMeasure: "piece"
  },
  {
    barcode: "8902102000169",
    name: "Tata Tea Premium 500g",
    brand: "Tata Tea",
    category: "Food & Beverages",
    description: "Blend of Assam and Darjeeling tea leaves",
    costPrice: 200,
    sellingPrice: 260,
    unitOfMeasure: "pack"
  },
  {
    barcode: "8901030861512",
    name: "Nescafé Classic Instant Coffee 200g",
    brand: "Nescafé",
    category: "Food & Beverages",
    description: "100% pure instant coffee, rich aroma",
    costPrice: 300,
    sellingPrice: 390,
    unitOfMeasure: "pack"
  },
  {
    barcode: "8901719177018",
    name: "Frooti Mango Drink 200ml",
    brand: "Parle Agro",
    category: "Food & Beverages",
    description: "Mango flavoured drink, 200ml tetra pack",
    costPrice: 12,
    sellingPrice: 15,
    unitOfMeasure: "piece"
  },
  {
    barcode: "8901058004928",
    name: "Amul Kool Milk Shake Kesar 200ml",
    brand: "Amul",
    category: "Food & Beverages",
    description: "Kesar flavoured milk drink, 200ml",
    costPrice: 20,
    sellingPrice: 25,
    unitOfMeasure: "piece"
  },
  // ── FMCG — PERSONAL CARE ─────────────────────────────────────────────────────
  {
    barcode: "8901234500001",
    name: "Dove Beauty Bathing Bar 100g",
    brand: "Dove",
    category: "Personal Care",
    description: "With moisturising cream, 1/4 moisturising cream formula",
    imageUrl: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400",
    costPrice: 40,
    sellingPrice: 55,
    unitOfMeasure: "piece"
  },
  {
    barcode: "8901234500002",
    name: "Dove Deeply Nourishing Body Wash 500ml",
    brand: "Dove",
    category: "Personal Care",
    description: "Moisturising body wash with 1/4 moisturising cream",
    costPrice: 250,
    sellingPrice: 350,
    unitOfMeasure: "piece"
  },
  {
    barcode: "8901030827095",
    name: "Colgate MaxFresh Toothpaste 150g",
    brand: "Colgate",
    category: "Personal Care",
    description: "Cooling crystals for long-lasting fresh breath",
    costPrice: 75,
    sellingPrice: 99,
    unitOfMeasure: "piece"
  },
  {
    barcode: "8901030746955",
    name: "Colgate Strong Teeth Toothpaste 300g",
    brand: "Colgate",
    category: "Personal Care",
    description: "Calcium-boost formula for stronger teeth",
    costPrice: 110,
    sellingPrice: 145,
    unitOfMeasure: "piece"
  },
  {
    barcode: "8901030860904",
    name: "Dettol Original Handwash 250ml",
    brand: "Dettol",
    category: "Personal Care",
    description: "Antibacterial liquid handwash, original scent",
    costPrice: 70,
    sellingPrice: 95,
    unitOfMeasure: "piece"
  },
  {
    barcode: "8901030860898",
    name: "Dettol Antiseptic Liquid 500ml",
    brand: "Dettol",
    category: "Personal Care",
    description: "Multi-use antiseptic, kills 99.9% bacteria",
    costPrice: 130,
    sellingPrice: 175,
    unitOfMeasure: "piece"
  },
  {
    barcode: "8901234520001",
    name: "Head & Shoulders Anti-Dandruff Shampoo 340ml",
    brand: "Head & Shoulders",
    category: "Personal Care",
    description: "Classic clean formula, removes dandruff",
    costPrice: 200,
    sellingPrice: 270,
    unitOfMeasure: "piece"
  },
  {
    barcode: "8901234520002",
    name: "Pantene Silky Smooth Shampoo 340ml",
    brand: "Pantene",
    category: "Personal Care",
    description: "Pro-V formula for frizz control and smoothness",
    costPrice: 200,
    sellingPrice: 270,
    unitOfMeasure: "piece"
  },
  {
    barcode: "8901030760074",
    name: "Gillette Mach3 Turbo Razor Blades 8-Pack",
    brand: "Gillette",
    category: "Personal Care",
    description: "3-blade system with lubrastrip, 8 replacement cartridges",
    costPrice: 400,
    sellingPrice: 565,
    unitOfMeasure: "pack"
  },
  {
    barcode: "8901030751935",
    name: "Gillette Shaving Foam Regular 200ml",
    brand: "Gillette",
    category: "Personal Care",
    description: "Moisturising shaving foam for sensitive skin",
    costPrice: 130,
    sellingPrice: 175,
    unitOfMeasure: "piece"
  },
  {
    barcode: "8902280201316",
    name: "Lakme Sun Expert SPF 50 Sunscreen 50ml",
    brand: "Lakme",
    category: "Personal Care",
    description: "Matte finish PA+++ SPF 50 sunscreen",
    costPrice: 200,
    sellingPrice: 290,
    unitOfMeasure: "piece"
  },
  {
    barcode: "8901234540001",
    name: "Nivea Men Face Wash Oil Control 100ml",
    brand: "Nivea",
    category: "Personal Care",
    description: "Deep pore cleansing with charcoal for oily skin",
    costPrice: 130,
    sellingPrice: 185,
    unitOfMeasure: "piece"
  },
  // ── STATIONERY ───────────────────────────────────────────────────────────────
  {
    barcode: "8906023760001",
    name: "Classmate 1-Subject Notebook A5 140 Pages",
    brand: "Classmate",
    category: "Office Supplies",
    description: "Single subject notebook, ruled, 140 pages, A5",
    costPrice: 30,
    sellingPrice: 45,
    unitOfMeasure: "piece"
  },
  {
    barcode: "8906023760002",
    name: "Classmate 6-Subject Spiral Notebook A4",
    brand: "Classmate",
    category: "Office Supplies",
    description: "Multi-subject spiral notebook, 300 pages, A4 ruled",
    costPrice: 120,
    sellingPrice: 175,
    unitOfMeasure: "piece"
  },
  {
    barcode: "8901112300519",
    name: "Camlin Permanent Marker Black",
    brand: "Camlin",
    category: "Office Supplies",
    description: "Permanent black ink, chisel tip, waterproof",
    costPrice: 20,
    sellingPrice: 30,
    unitOfMeasure: "piece"
  },
  {
    barcode: "8901112300427",
    name: "Camlin Whiteboard Marker Set (4 Colors)",
    brand: "Camlin",
    category: "Office Supplies",
    description: "Set of 4 whiteboard markers: black, blue, red, green",
    costPrice: 60,
    sellingPrice: 90,
    unitOfMeasure: "set"
  },
  {
    barcode: "8901112040010",
    name: "Camlin Trimax Ball Pen Blue 5-Pack",
    brand: "Camlin",
    category: "Office Supplies",
    description: "0.7mm blue ink ballpoint, smooth writing",
    costPrice: 25,
    sellingPrice: 40,
    unitOfMeasure: "pack"
  },
  {
    barcode: "8901179540001",
    name: "Luxor Whiteboard Marker Black",
    brand: "Luxor",
    category: "Office Supplies",
    description: "Round tip whiteboard marker, xylene-free",
    costPrice: 18,
    sellingPrice: 28,
    unitOfMeasure: "piece"
  },
  {
    barcode: "8901179540002",
    name: "Luxor Ball Pen 1.0mm Blue Pack of 10",
    brand: "Luxor",
    category: "Office Supplies",
    description: "Smooth 1.0mm blue ballpoint pen, pack of 10",
    costPrice: 50,
    sellingPrice: 80,
    unitOfMeasure: "pack"
  },
  {
    barcode: "8902282280001",
    name: "Faber-Castell Pencils HB Pack of 10",
    brand: "Faber-Castell",
    category: "Office Supplies",
    description: "HB hardness, hexagonal, break-resistant",
    costPrice: 50,
    sellingPrice: 80,
    unitOfMeasure: "pack"
  },
  {
    barcode: "8902282280002",
    name: "Faber-Castell Colour Pencils 24 Shades",
    brand: "Faber-Castell",
    category: "Office Supplies",
    description: "24 colour pencil set, hexagonal, break-resistant",
    costPrice: 150,
    sellingPrice: 220,
    unitOfMeasure: "set"
  },
  {
    barcode: "8901840300001",
    name: "Leitz Binder Ring File A4 2-Ring",
    brand: "Leitz",
    category: "Office Supplies",
    description: "2-ring binder, 30mm capacity, A4, assorted colors",
    costPrice: 80,
    sellingPrice: 120,
    unitOfMeasure: "piece"
  },
  {
    barcode: "8901840300002",
    name: "Post-it Notes 3x3 Yellow 12-Pack",
    brand: "Post-it",
    category: "Office Supplies",
    description: "Self-stick removable notes, 100 sheets per pad, 12 pads",
    costPrice: 400,
    sellingPrice: 580,
    unitOfMeasure: "pack"
  },
  {
    barcode: "8901840300003",
    name: "Scotch Magic Tape 19mm x 25m",
    brand: "3M",
    category: "Office Supplies",
    description: "Invisible matte finish, writeable, 19mm × 25m",
    costPrice: 60,
    sellingPrice: 95,
    unitOfMeasure: "piece"
  },
  {
    barcode: "8906008500001",
    name: "HP A4 Copy Paper 80gsm 500 Sheets",
    brand: "HP",
    category: "Office Supplies",
    description: "80gsm white copy paper, A4, 500 sheets/ream",
    costPrice: 200,
    sellingPrice: 280,
    unitOfMeasure: "ream"
  },
  {
    barcode: "8906008500002",
    name: "HP A4 Copy Paper 75gsm 500 Sheets",
    brand: "HP",
    category: "Office Supplies",
    description: "75gsm white copy paper, A4, 500 sheets/ream",
    costPrice: 175,
    sellingPrice: 245,
    unitOfMeasure: "ream"
  },
  // ── HOUSEHOLD & CLEANING ─────────────────────────────────────────────────────
  {
    barcode: "8901030826746",
    name: "Surf Excel Easy Wash Detergent 1kg",
    brand: "Surf Excel",
    category: "Household",
    description: "Front-load safe detergent, 1kg pack",
    costPrice: 90,
    sellingPrice: 120,
    unitOfMeasure: "pack"
  },
  {
    barcode: "8901030826753",
    name: "Ariel Matic Powder 2kg",
    brand: "Ariel",
    category: "Household",
    description: "Top-load automatic washing powder, 2kg",
    costPrice: 210,
    sellingPrice: 280,
    unitOfMeasure: "pack"
  },
  {
    barcode: "8901030827170",
    name: "Vim Dishwash Liquid Lemon 500ml",
    brand: "Vim",
    category: "Household",
    description: "Active lemon grease-cutting dishwash liquid",
    costPrice: 65,
    sellingPrice: 90,
    unitOfMeasure: "piece"
  },
  {
    barcode: "8901030827187",
    name: "Domex Multi-Purpose Disinfectant 1L",
    brand: "Domex",
    category: "Household",
    description: "Kills 99.9% germs, toilet/floor/surface cleaner",
    costPrice: 80,
    sellingPrice: 110,
    unitOfMeasure: "piece"
  },
  {
    barcode: "8901030860201",
    name: "Scotch-Brite Scrub Pad 3-Pack",
    brand: "Scotch-Brite",
    category: "Household",
    description: "Heavy duty scrubbing pad, 3 packs",
    costPrice: 40,
    sellingPrice: 60,
    unitOfMeasure: "pack"
  },
  {
    barcode: "8901030860218",
    name: "Harpic Power Plus 1L",
    brand: "Harpic",
    category: "Household",
    description: "Maximum strength toilet cleaner, removes stains",
    costPrice: 80,
    sellingPrice: 110,
    unitOfMeasure: "piece"
  },
  // ── HEALTH & PHARMA ──────────────────────────────────────────────────────────
  {
    barcode: "8901314040001",
    name: "Dettol Hand Sanitizer 500ml",
    brand: "Dettol",
    category: "Health",
    description: "70% alcohol-based hand sanitizer, kills 99.9%",
    costPrice: 130,
    sellingPrice: 180,
    unitOfMeasure: "piece"
  },
  {
    barcode: "8901314040002",
    name: "Dettol Hand Sanitizer 50ml Pocket Size",
    brand: "Dettol",
    category: "Health",
    description: "Travel-size 70% alcohol hand sanitizer",
    costPrice: 40,
    sellingPrice: 60,
    unitOfMeasure: "piece"
  },
  {
    barcode: "8901063150001",
    name: "Band-Aid Flexible Fabric Strips 30-Pack",
    brand: "Band-Aid",
    category: "Health",
    description: "Flexible fabric adhesive bandages, 30 count",
    costPrice: 80,
    sellingPrice: 120,
    unitOfMeasure: "pack"
  },
  {
    barcode: "8901063150002",
    name: "Dettol Antiseptic Wipes 10-Pack",
    brand: "Dettol",
    category: "Health",
    description: "Pre-moistened antiseptic cleansing wipes, 10 sheets",
    costPrice: 30,
    sellingPrice: 50,
    unitOfMeasure: "pack"
  },
  // ── PACKAGING & SHIPPING ─────────────────────────────────────────────────────
  {
    barcode: "8907001100001",
    name: "Bubble Wrap Roll 50m × 45cm",
    brand: "Safewrap",
    category: "Packaging",
    description: "Small bubble, 10mm diameter, 50m × 45cm roll",
    costPrice: 350,
    sellingPrice: 550,
    unitOfMeasure: "roll"
  },
  {
    barcode: "8907001100002",
    name: "Brown Tape 48mm × 65m",
    brand: "Safewrap",
    category: "Packaging",
    description: "BOPP tape, 48mm × 65m, strong adhesive",
    costPrice: 50,
    sellingPrice: 80,
    unitOfMeasure: "piece"
  },
  {
    barcode: "8907001100003",
    name: "Corrugated Box 12x9x6 inch (Pack of 20)",
    brand: "Packman",
    category: "Packaging",
    description: "3-ply corrugated shipping box, 12×9×6 inches",
    costPrice: 400,
    sellingPrice: 650,
    unitOfMeasure: "pack"
  },
  {
    barcode: "8907001100004",
    name: "Polymailer Bags 12x16 inch (Pack of 100)",
    brand: "Packman",
    category: "Packaging",
    description: "Co-ex polyethylene shipping bags, tamper-evident seal",
    costPrice: 350,
    sellingPrice: 550,
    unitOfMeasure: "pack"
  },
  {
    barcode: "8907001100005",
    name: "Thermal Label 4x6 inch Roll (500 Labels)",
    brand: "Zebra",
    category: "Packaging",
    description: "Direct thermal labels, 4×6 inch, 500 per roll",
    costPrice: 250,
    sellingPrice: 399,
    unitOfMeasure: "roll"
  },
  // ── POWER & BATTERIES ────────────────────────────────────────────────────────
  {
    barcode: "8906003570001",
    name: "Duracell AA Alkaline Batteries Pack of 10",
    brand: "Duracell",
    category: "Electronics",
    description: "LR6 AA alkaline batteries, 1.5V, 10 count",
    costPrice: 200,
    sellingPrice: 320,
    unitOfMeasure: "pack"
  },
  {
    barcode: "8906003570002",
    name: "Duracell AAA Alkaline Batteries Pack of 10",
    brand: "Duracell",
    category: "Electronics",
    description: "LR03 AAA alkaline batteries, 1.5V, 10 count",
    costPrice: 200,
    sellingPrice: 320,
    unitOfMeasure: "pack"
  },
  {
    barcode: "8906003570003",
    name: "Energizer AA Batteries Pack of 8",
    brand: "Energizer",
    category: "Electronics",
    description: "Max alkaline AA batteries, 8 count",
    costPrice: 180,
    sellingPrice: 290,
    unitOfMeasure: "pack"
  },
  // ── CABLES & CONNECTORS ──────────────────────────────────────────────────────
  {
    barcode: "8901234570001",
    name: "USB-A to Micro-USB Cable 1m",
    brand: "Robocraze",
    category: "Electronics",
    description: "Charging & data cable, 2A, braided nylon",
    costPrice: 60,
    sellingPrice: 120,
    unitOfMeasure: "piece"
  },
  {
    barcode: "8901234570002",
    name: "USB-A to USB-C Cable 1m",
    brand: "Robocraze",
    category: "Electronics",
    description: "USB 3.0 charging & data cable, 3A",
    costPrice: 80,
    sellingPrice: 150,
    unitOfMeasure: "piece"
  },
  {
    barcode: "8901234570003",
    name: "Male-to-Female HDMI Cable 1.5m v2.0",
    brand: "Robocraze",
    category: "Electronics",
    description: "4K 60Hz HDMI cable, gold plated connectors",
    costPrice: 180,
    sellingPrice: 299,
    unitOfMeasure: "piece"
  },
  {
    barcode: "8901234570004",
    name: "RJ45 Cat6 Ethernet Patch Cable 3m",
    brand: "D-Link",
    category: "Electronics",
    description: "Cat6 UTP patch cable, 3m, snagless boot",
    costPrice: 80,
    sellingPrice: 149,
    unitOfMeasure: "piece"
  },
  {
    barcode: "8901234570005",
    name: "2.1mm DC Barrel Jack Extension Cable 1m",
    brand: "Robocraze",
    category: "Electronics",
    description: "5.5mm/2.1mm DC power extension, M-F, 1m",
    costPrice: 40,
    sellingPrice: 79,
    unitOfMeasure: "piece"
  },
  // ── TOOLS ────────────────────────────────────────────────────────────────────
  {
    barcode: "8901234580001",
    name: "Soldering Iron 25W with Stand",
    brand: "Soldron",
    category: "Electronics",
    description: "25W temperature-controlled soldering iron, 230V",
    costPrice: 250,
    sellingPrice: 449,
    unitOfMeasure: "piece"
  },
  {
    barcode: "8901234580002",
    name: "Solder Wire 60/40 Rosin Core 100g",
    brand: "Soldron",
    category: "Electronics",
    description: "60% tin 40% lead rosin core, 0.8mm, 100g",
    costPrice: 120,
    sellingPrice: 199,
    unitOfMeasure: "piece"
  },
  {
    barcode: "8901234580003",
    name: "Digital Multimeter Auto-Ranging",
    brand: "Mextech",
    category: "Electronics",
    description: "6000 count auto-ranging DMM, AC/DC V/A/Ω",
    costPrice: 500,
    sellingPrice: 899,
    unitOfMeasure: "piece"
  },
  {
    barcode: "8901234580004",
    name: "Heat Gun 2000W Variable",
    brand: "Bosch",
    category: "Electronics",
    description: "50–600°C variable temperature, 250–500L/min",
    costPrice: 1200,
    sellingPrice: 2199,
    unitOfMeasure: "piece"
  },
  {
    barcode: "8901234580005",
    name: "3D Printer Filament PLA 1.75mm 1kg White",
    brand: "Creality",
    category: "Electronics",
    description: "PLA filament, 1.75mm, 1kg spool, dimensional accuracy ±0.02mm",
    costPrice: 800,
    sellingPrice: 1299,
    unitOfMeasure: "piece"
  },
  // ── RESISTORS & COMPONENTS ───────────────────────────────────────────────────
  {
    barcode: "8901234590001",
    name: "Resistor Kit 1/4W (600 pieces, 30 values)",
    brand: "Robocraze",
    category: "Electronics",
    description: "Carbon film resistors, 1% tolerance, 30 values × 20 each",
    costPrice: 80,
    sellingPrice: 149,
    unitOfMeasure: "kit"
  },
  {
    barcode: "8901234590002",
    name: "Capacitor Kit Electrolytic (120 pieces)",
    brand: "Robocraze",
    category: "Electronics",
    description: "10–1000µF electrolytic capacitors, 120 pieces, assorted",
    costPrice: 120,
    sellingPrice: 199,
    unitOfMeasure: "kit"
  },
  {
    barcode: "8901234590003",
    name: "LED Assorted Pack 5mm (100 pieces)",
    brand: "Robocraze",
    category: "Electronics",
    description: "5mm LEDs, 5 colors (R/G/B/Y/W), 20 of each",
    costPrice: 60,
    sellingPrice: 99,
    unitOfMeasure: "pack"
  },
  {
    barcode: "8901234590004",
    name: "NPN BC547 Transistor (Pack of 50)",
    brand: "ST",
    category: "Electronics",
    description: "General purpose NPN, 45V 100mA, TO-92 package",
    costPrice: 40,
    sellingPrice: 79,
    unitOfMeasure: "pack"
  },
  {
    barcode: "8901234590005",
    name: "NE555 Timer IC (Pack of 10)",
    brand: "Texas Instruments",
    category: "Electronics",
    description: "Classic 555 timer IC, DIP-8, 5V–15V",
    costPrice: 30,
    sellingPrice: 59,
    unitOfMeasure: "pack"
  }
];

async function main() {
  console.log(`\n🔍 Seeding barcode catalog with ${catalog.length} real products...\n`);

  let created = 0;
  let skipped = 0;

  for (const item of catalog) {
    try {
      await prisma.barcodeProduct.upsert({
        where: { barcode: item.barcode },
        update: {
          name: item.name,
          brand: item.brand,
          category: item.category,
          description: item.description,
          imageUrl: item.imageUrl,
          costPrice: item.costPrice,
          sellingPrice: item.sellingPrice,
          unitOfMeasure: item.unitOfMeasure ?? "piece"
        },
        create: {
          barcode: item.barcode,
          name: item.name,
          brand: item.brand,
          category: item.category,
          description: item.description,
          imageUrl: item.imageUrl,
          costPrice: item.costPrice,
          sellingPrice: item.sellingPrice,
          unitOfMeasure: item.unitOfMeasure ?? "piece",
          source: "local"
        }
      });
      created++;
    } catch (e) {
      console.warn(`  ⚠️  Skipped ${item.barcode}: ${e}`);
      skipped++;
    }
  }

  console.log(`✅ Catalog seed complete!`);
  console.log(`   Created/updated: ${created}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`\n📦 Categories seeded:`);
  const cats = [...new Set(catalog.map((c) => c.category))].sort();
  cats.forEach((c) => {
    const count = catalog.filter((p) => p.category === c).length;
    console.log(`   ${c}: ${count} products`);
  });
}

main()
  .catch((e) => { console.error("❌ Catalog seed failed:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
