# HeatGuard AI — Thermal Science & Methodology

HeatGuard AI converts raw meteorological observations into human-centric thermal intelligence by evaluating how ambient heat, atmospheric moisture, solar flux, and wind speed interact with human physiology.

> **Important Clinical Disclaimer:**
> The composite risk scores and thermal indices computed by HeatGuard AI are operational decision-support indicators for municipal planning, resource staging, and occupational safety. They are **not** clinical diagnostic tools, nor do they guarantee prevention of heat illnesses or medical emergencies.

---

## 🌡️ Core Bio-Meteorological Formulations

### 1. Steadman Heat Index (Rothfusz Formulation)
Calculates apparent thermal sensation based on ambient dry-bulb temperature ($T$ in °F) and relative humidity ($RH$ in %):

$$\text{HI} = c_1 + c_2 T + c_3 RH + c_4 T \cdot RH + c_5 T^2 + c_6 RH^2 + c_7 T^2 \cdot RH + c_8 T \cdot RH^2 + c_9 T^2 \cdot RH^2$$

Where coefficients $c_1 \dots c_9$ follow the National Weather Service (NWS) polynomial regression.

### 2. Wet Bulb Globe Temperature (WBGT)
Evaluates environmental thermal stress under direct occupational exposure, utilizing the standard ISO 7243 formulation:

$$\text{WBGT}_{\text{outdoor}} = 0.7\,T_{\text{nw}} + 0.2\,T_{\text{g}} + 0.1\,T_{\text{a}}$$

- $T_{\text{nw}}$: Natural wet-bulb temperature (evaporative potential)
- $T_{\text{g}}$: Black globe temperature (radiant heat burden)
- $T_{\text{a}}$: Ambient air temperature

*Standard Operating Note:* HeatGuard AI's configured alert color tiers (Green, Yellow, Orange, Red) represent application-level municipal decision thresholds. While the underlying equations adhere strictly to ISO 7243 methodology, ISO 7243 itself does not prescribe the specific color palette of this platform.

### 3. Universal Thermal Climate Index (UTCI)
Computes an equivalent temperature (°C) referencing an idealized human energy balance model (Fiala multi-node thermoregulation), capturing wind chilling and solar heating effects.

### 4. Apparent Temperature (Australian Bureau of Meteorology)
Used as the target metric for ML V2 forecasting:

$$AT = T_{\text{a}} + 0.33\,e - 0.70\,w - 4.00$$

Where $e$ is water vapor pressure (hPa) and $w$ is wind speed (m/s) at 10 meters.

---

## 🗺️ Ward-Level Composite Risk Index

To prioritize municipal intervention across Bhubaneswar's 67 administrative wards, HeatGuard AI calculates a composite risk index:

$$\text{Ward Risk Score} = 0.50 \times \text{Hazard} + 0.35 \times \text{Vulnerability} + 0.15 \times \text{Exposure}$$

### Component Breakdown:

1. **Hazard Component ($0.50$):**
   - Normalized continuous thermal stress based on localized WBGT and Heat Index.
   - Includes nocturnal temperature penalty (minimum night-time temperature failing to drop below 26°C, impeding physiological recovery).

2. **Vulnerability Component ($0.35$):**
   - **Elderly Ratio ($30\%$):** Demographic percentage of residents aged 65+.
   - **Outdoor Worker Density ($30\%$):** Proportion of informal, construction, and delivery laborers.
   - **Tree Canopy Deficit ($20\%$):** Lack of vegetative shading based on satellite NDVI.
   - **Heat-Trapping Roof Density ($20\%$):** Uninsulated tin, asbestos, and tar-sheet roofing percentage.

3. **Exposure Component ($0.15$):**
   - Census population density per square kilometer within the ward boundary.

### Decision-Support Risk Tiers:
- **Low (Score < 30):** Routine public advisory, standard hydration guidance.
- **Moderate (Score 30–49):** Yellow Alert; shade point activation, elderly check-ins.
- **High (Score 50–74):** Orange Alert; mandatory worker rest cycles, afternoon school shift closures.
- **Severe (Score 75–100):** Red Alert; emergency water tanker dispatch, cooling centers operationalized.
