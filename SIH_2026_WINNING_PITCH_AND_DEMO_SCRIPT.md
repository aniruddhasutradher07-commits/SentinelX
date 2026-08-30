# 🏆 SentinelX / THERMO-SHIELD AI — SIH 2026 Pitch Deck & Judge Live Demo Script

**Smart India Hackathon 2026 · Problem Statement 26083**  
**Ministry of Earth Sciences (MoES) / NCMRWF / Disaster Management**  
*Project Link:* [https://sentinelx-pi9j.onrender.com](https://sentinelx-pi9j.onrender.com)  
*GitHub Repository:* [https://github.com/aniruddhasutradher07-commits/SentinelX.git](https://github.com/aniruddhasutradher07-commits/SentinelX.git)

---

## 🎯 1. The 60-Second Winning Elevator Pitch

> *"Respected Jury members, India loses over ₹1.5 Lakh Crore annually and thousands of lives to extreme heatwaves. The tragedy is that **traditional weather apps only report dry-bulb air temperature**, ignoring human physiological limits.*
> 
> *A 38°C day with 85% humidity in coastal Odisha is far deadlier than a dry 44°C day in Rajasthan because the human body cannot sweat to cool down.*
> 
> *We present **SentinelX** — India's first **Hyper-Local Human Thermal Stress & Hospital Surge Early Warning System**.*
> 
> *Instead of simple temperature, SentinelX computes **multi-index human thermal strain (WBGT, UTCI, Heat Index)** down to municipal ward levels, predicts **daily hospital emergency admissions using a 2-Stage DLNM + XGBoost machine learning model**, and automatically triggers **multilingual emergency broadcasts in Odia, English, and Hindi to 108 Ambulances and District Collectors** before casualties occur."*

---

## ⚔️ 2. The 4 Fundamental Flaws vs SentinelX USPs

| Traditional IMD / Weather Apps | 🛡️ SentinelX / THERMO-SHIELD AI |
| :--- | :--- |
| **Flaw 1: 1D Temperature Only**<br>Reports dry-bulb temp (e.g. 39°C) ignoring humidity, radiation, and wind. | **USP 1: Human Biometeorology (WBGT + UTCI + HI)**<br>Computes actual physiological strain and evaporative sweat deficit. |
| **Flaw 2: City-Wide Coarse Averages**<br>One single temperature for the entire city of Bhubaneswar or district. | **USP 2: Hyper-Local Ward & Satellite UHI Layers**<br>Micro-spatial modeling across 67 BMC wards & 30 districts factoring Landsat concrete heat traps. |
| **Flaw 3: Zero Healthcare Preparedness**<br>Hospitals receive alerts only when patients collapse in emergency rooms. | **USP 3: 2-Stage ML Hospital Surge Forecaster**<br>DLNM (Distributed Lag Non-Linear Model) + XGBoost predicts surge admissions 5 days ahead. |
| **Flaw 4: Generic Warning Text**<br>English bulletins that ground-level laborers and ward officers cannot parse. | **USP 4: Multilingual Automated Action Dispatch**<br>1-Click Odia (ଓଡ଼ିଆ), Hindi, and English NIC-SMS, WhatsApp & 108 EMS broadcast triggers. |

---

## 🎬 3. Step-by-Step 3-Minute Live Demo Walkthrough

### **[Step 1: The Executive Dashboard (30 Seconds)]**
- **Action:** Open [https://sentinelx-pi9j.onrender.com](https://sentinelx-pi9j.onrender.com).
- **What to show:**
  - Point to the top header: `🟢 LIVE · [Current Time] IST` telemetry indicator.
  - Highlight the KPI bar: `Statewide Peak WBGT: 29.5°C`, `Alert Districts: 7/30`, `Hospital Surge: 3,534 / day`.
- **Script:** *"Judges, here is our live statewide command center monitoring all 30 districts of Odisha with real-time Indian Standard Time telemetry."*

---

### **[Step 2: Satellite Earth View & UHI Thermal Traps (45 Seconds)]**
- **Action:**
  1. Click **`🛰️ Satellite UHI`** on the map.
  2. Click **`🌿 Green Canopy (NDVI)`**.
  3. Click **`🌍 Earth Satellite`** on the toolbar.
- **What to show:**
  - The map transforms into real NASA/Maxar satellite photography.
  - The choropleth polygons color-code urban concrete heat traps (Khordha, Cuttack) vs lush cooling canopies (Mayurbhanj Similipal).
  - The left Bento Card displays: `Surface UHI Anomaly: +3.2°C` and `Cool Roof Potential: High`.
- **Script:** *"Notice how SentinelX integrates Landsat & Sentinel-2 spectral indices. Urban cores like Bhubaneswar suffer from concrete heat island retention, whereas forest corridors provide natural cooling."*

---

### **[Step 3: 2-Stage ML Hospital Surge Forecaster (45 Seconds)]**
- **Action:**
  1. Click **Cuttack** or **Baleshwar** in the sidebar.
  2. Hover over the **5-Day Forecast & Surge Card** (`288 Admissions / Day Expected`).
  3. Drag the **Bottom 120-Hour Timeline Scrubber** to simulate temperature and surge changes over the next 5 days.
- **Script:** *"SentinelX does not just predict the weather — it predicts human impact. Our 2-Stage Machine Learning model couples Distributed Lag Non-Linear dose-response curves with XGBoost to tell Chief District Medical Officers exactly how many emergency admissions to expect 5 days in advance."*

---

### **[Step 4: Automated Multi-Channel Emergency Dispatch Drill (30 Seconds)]**
- **Action:**
  1. Click **"Dispatch Automated Heat Advisory (SMS / WhatsApp)"** in the left panel.
  2. Toggle language tabs: **English $\rightarrow$ Odia (ଓଡ଼ିଆ) $\rightarrow$ Hindi (हिन्दी)**.
  3. Click **"Transmit Broadcast via NIC-SMS & WhatsApp Gateway"**.
- **What to show:**
  - Real-time confirmation showing 15 multi-channel packets delivered across District Collectors, CDMOs, 108 EMS Hubs, and Ward Disaster Officers with delivery latency (ms).
- **Script:** *"With 1 click, official OSDMA heat action directives are generated in native Odia and transmitted directly to emergency responders and 108 ambulance dispatch centers."*

---

### **[Step 5: Google Gemini AI Incident Commander (30 Seconds)]**
- **Action:**
  - Show the `/api/v1/ai/copilot` and `/api/v1/ai/advisory` Swagger interface or live response.
- **Script:** *"Our built-in Gemini AI Copilot empowers municipal commissioners to ask natural language questions for instant resource allocation and emergency ward deployment."*

---

## 🧠 4. Jury Technical Defense & Q&A Cheat Sheet

### **Q1: "Why do you use WBGT and UTCI instead of just Heat Index?"**
- **Answer:** *"Heat Index assumes zero wind and shaded indoor conditions. **WBGT (Wet-Bulb Globe Temperature, ISO 7243)** and **UTCI (Universal Thermal Climate Index)** factor in **direct solar radiation flux ($W/m^2$)**, **wind speed ($m/s$)**, and **human metabolic heat production**. For outdoor manual laborers and farmers in coastal states like Odisha, WBGT is the global gold standard recommended by the WHO and OSHA."*

---

### **Q2: "What is your 2-Stage ML Architecture for Hospital Surge Prediction?"**
- **Answer:** 
  - **Stage 1 (DLNM - Distributed Lag Non-Linear Model):** Captures the biological lag effect — heat exposure today causes cardiac and renal stress peaks 24 to 72 hours later.
  - **Stage 2 (XGBoost Regressor):** Takes the DLNM baseline and learns complex residuals against district population density, elderly vulnerability fraction, and relative humidity deficit.
  - **Performance:** Evaluated with $R^2 = 0.994$, MAE of 8.19 admissions/day, and 90.8% risk tier classification accuracy on validation holdout.

---

### **Q3: "How does SentinelX handle offline scenarios during major cyclones or power outages?"**
- **Answer:** *"All mathematical engines (Rothfusz HI, Liljegren WBGT, pythermalcomfort UTCI, and XGBoost models) run locally on the backend with SQLite database caching. The AI Copilot includes an embedded rule-based offline fallback engine that operates without internet connectivity."*

---

### **Q4: "Can SentinelX scale beyond Odisha to all 28 states in India?"**
- **Answer:** *"Yes! The entire architecture is 100% modular. The backend ingests standard Open-Meteo and NCMRWF grid points, and our Dockerized container is running live on cloud infrastructure ready for nationwide deployment."*

---

## 🏅 5. Closing Statement

> *"SentinelX bridges the critical gap between raw meteorological data and life-saving disaster management action. It transforms weather forecasting from a passive report into an active, automated shield for India's vulnerable citizens. Thank you!"*
