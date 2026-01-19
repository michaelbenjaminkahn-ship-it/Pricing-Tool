# Stainless Steel Import Pricing Tool - Specification & Claude Code Prompt

## Analysis of Your Current Pricing Models

Based on your Excel files, I've identified the following structure and patterns:

---

### **Overview of Pricing Scenarios**

| File | Supplier | Customer | Origin | Incoterm | Destination | Notes |
|------|----------|----------|--------|----------|-------------|-------|
| 19937.xlsx | PVST | Basic Metals | Unknown | FOB | Unknown | Break Bulk shipping |
| alro.xlsx | Stanch | Alro | Unknown | FOB | Unknown | Container (FCL) |
| oneal.xlsx | Yeou Yih | Oneal | Taiwan (Kaohsiung) | FOB | Unknown | Multiple sizes, weight gain |
| sammy-la-50pct.xlsx | Yuen Chang | Samuel | Unknown | CIF | Los Angeles | 50% tariff finance |

---

### **Cost Components Identified**

#### **1. Base Price Components**
- **FOB Price** - Factory/port price ($/MT)
- **CIF Price** - Price including freight & insurance to destination port
- **CFR Price** - Cost & Freight (no insurance)
- **Ocean Freight** - Typically quoted per 20ft container, converted to $/MT by dividing by ~19 MT

#### **2. Import Duties & Government Fees**
- **Section 232 Tariff** - 25% on FOB price (J7: 0.5 in some files suggests 50% may also apply)
- **HMF (Harbor Maintenance Fee)** - 0.335% on FOB price
- **Tariff Finance** - When financing the tariff payment (50% rate seen)

#### **3. Insurance**
- **Marine Insurance (M.I.)** - 0.24% on CIF value
- **Credit Insurance (C.I.)** - 0.11% on CIF value

#### **4. Financing Costs**
- **LC Pre-Cash** - Finance rate × CIF × days / 360 (typical: 3.75% rate, 60 days)
- **LC Sailing** - Finance rate × CIF × (water days + terms + 15) / 360 (typical: 7.75-8.5% rate)
- **Tariff Finance** - When applicable: FOB × 50% × rate × days / 360

#### **5. Domestic/Handling Costs**
- **Drayage / Destuffing** - Per container charge, converted to $/MT (~$900-1350/20ft ÷ 18-19 MT)
- **Stevedoring** - $/MT for break bulk
- **Broker Fees** - Per MT or per container
- **Commission ("Chiu")** - 1% on FOB

#### **6. Adjustments**
- **Weight Gain** - Mill/theoretical weight variance (varies by size: 3.3% to 5.02%)
- **Margin/Markup** - Percentage added to landed cost (5-10% seen)
- **Rebates** - Customer-specific discounts

---

### **Conversion Constants**
- **1 MT = 2,204.62 lbs** (for $/MT to $/lb conversion)
- **1 container (20ft) ≈ 18-19 MT** (varies by product density)

---

### **Calculation Flow**

```
FOB Price ($/MT)
    ↓
+ Ocean Freight (container rate ÷ ~19 MT)
= CIF or CFR Price
    ↓
+ Section 232 (25% or 50% × FOB)
+ HMF (0.335% × FOB)
+ Marine Insurance (0.24% × CIF)
+ Credit Insurance (0.11% × CIF)
+ Finance Charges (various rates × days / 360)
+ Drayage/Destuffing (container rate ÷ ~18 MT)
+ Broker Fees
+ Commission (1% × FOB)
+ Stevedoring (break bulk only)
= Total Landed Cost ($/MT)
    ↓
÷ 2,204.62
= Landed Cost ($/lb)
    ↓
× (1 + Margin %)
= Target Sale Price ($/lb)
```

---

## Comprehensive Claude Code Prompt

Copy everything below this line into Claude Code:

---

```markdown
# Project: Stainless Steel Import Pricing Calculator Web Application

## Overview
Build a web application for calculating landed costs and pricing for imported stainless steel products. The tool should handle multiple suppliers, origins, customers, and shipping terms (FOB, CIF, CFR) with all associated costs.

## Tech Stack
- React with TypeScript
- Tailwind CSS for styling
- Local storage for saving configurations (suppliers, customers, rate defaults)
- Deploy to GitHub Pages

## Core Features

### 1. Pricing Calculator (Main Screen)

#### Input Section - Deal Parameters
```
Supplier: [Dropdown - user-configurable list]
Customer: [Dropdown - user-configurable list]  
Origin Country: [Dropdown: Taiwan, India, etc.]
Origin Port: [Text or dropdown]
Destination Port: [Dropdown: Los Angeles, Houston, Newark, etc.]
Incoterm: [Radio: FOB | CIF]
Container Size: [Radio: 20ft | 40ft, default: 20ft]
  - 20ft default capacity: 19 MT
  - 40ft default capacity: 38 MT (auto-doubles when selected)
```

#### Input Section - Pricing
```
Base Price ($/MT): [Number input]
  - If FOB selected: show "FOB Price"
  - If CIF selected: show "CIF Price" and auto-calculate FOB from freight
  
Ocean Freight ($/container): [Number input] (hide for CIF)
Container Capacity (MT): [Number input, default: 19] (editable)
```

#### Input Section - Product Details (Optional)
```
Product Grade: [Text, e.g., "304/L"]
Product Size: [Text, e.g., "1/2 inch"]
Weight Gain %: [Number input, default: 0] 
  - Tooltip: "Mill weight vs theoretical weight variance"
```

#### Input Section - Duties & Fees
```
Section 232 Rate: [Number input, default: 25%] (editable for special cases)
  - Apply to: [Auto: FOB price]
HMF Rate: [Number input, default: 0.335%]
```

#### Input Section - Insurance
```
Marine Insurance Rate: [Number input, default: 0.24%]
  - Apply to: [CIF value]
Credit Insurance Rate: [Number input, default: 0.11%]
  - Apply to: [CIF value]
```

#### Input Section - Finance
```
☐ Include LC Finance (Pre-Cash)
  Rate: [Number input, default: 3.75%] (current LC rate)
  Days: [Number input, default: 60]
  
☐ Include Financing (Post-Sailing)
  Rate: [Number input, default: 7.75%] (current financing rate)
  Water Days: [Number input, default: 60]
  Terms Days: [Number input, default: 30]
  Buffer Days: [Number input, default: 15] (auto-add)
  
☐ Include Tariff Finance
  Finance %: [Number input, default: 50%] (portion of tariff financed)
  Rate: [Number input, default: 7.75%]
  Days: [Number input, default: 45]
```

#### Input Section - Handling & Other
```
Drayage / Destuffing ($/container): [Number input]
Destuff Capacity (MT): [Number input, default: 18]

Broker Fee: [Number input]
  - Type: [Radio: Per MT | Per Container | Flat]
  - If Per Container: Containers: [Number input, default: 1]

Commission Rate: [Number input, default: 1%]
  - Apply to: [FOB value]
```

#### Input Section - Margin
```
Target Margin %: [Number input, e.g., 6.5%]
  OR
Target Sale Price ($/lb): [Number input]
  (These should be mutually exclusive - entering one clears the other)
```

### 2. Output Section - Cost Breakdown

Display a clear itemized breakdown:

```
COST BREAKDOWN                              $/MT        $/lb
─────────────────────────────────────────────────────────────
Base FOB Price                           $1,590.00    $0.7213
Ocean Freight ($3,000 ÷ 19 MT)            $157.89    $0.0716
─────────────────────────────────────────────────────────────
CIF Value                                $1,747.89    $0.7929

Section 232 (25% × FOB)                    $397.50    $0.1803
HMF (0.335% × FOB)                          $5.33    $0.0024
Marine Insurance (0.24% × CIF)              $4.19    $0.0019
Credit Insurance (0.11% × CIF)              $1.92    $0.0009
LC Finance (3.75% × 60d)                    $9.93    $0.0045
Financing (7.75% × 105d)                   $39.52    $0.0179
Tariff Finance (50% × 7.75% × 45d)          $7.71    $0.0035
Drayage ($1,350 ÷ 18 MT)                   $75.00    $0.0340
Broker                                     $15.14    $0.0069
Commission (1% × FOB)                      $15.90    $0.0072
─────────────────────────────────────────────────────────────
TOTAL LANDED COST                        $2,319.13    $1.0520

Margin (6.5%)                                        $0.0684
─────────────────────────────────────────────────────────────
TARGET SALE PRICE                                    $1.1204

Margin if sold at $1.15/lb:              $0.0980     8.52%
```

### 3. Multi-Product Pricing
Allow pricing multiple products in a single quote (common for customer quotes with multiple sizes/grades).

**All products in a quote share the same container/freight** - only the product-specific values differ:

```
[+ Add Product Line]

Product 1:
  - Description: [Text, e.g., "304/L 1/2 inch"]
  - FOB Price ($/MT): [Number]
  - Weight Gain %: [Number, optional - for theoretical weight suppliers]
  - Target Sale Price ($/lb): [Number, optional]

Product 2:
  - Description: [Text]
  - FOB Price ($/MT): [Number]
  - Weight Gain %: [Number]
  - Target Sale Price ($/lb): [Number, optional]
  ...

Shared costs (freight, duties, handling, finance) are calculated once and applied to all products.
```

Output shows side-by-side comparison of all products with landed costs and margins.

### 4. Quick Comparison Feature
Allow user to:
- Save current calculation as "Scenario A"
- Modify inputs and save as "Scenario B"
- Side-by-side comparison table

### 5. Settings / Configuration

#### Suppliers Management
- Add/Edit/Delete suppliers
- Store: 
  - Name
  - Default Origin Country & Port
  - Default Incoterm (FOB or CIF)
  - Weight Basis: [Actual | Theoretical] - if Theoretical, prompt for weight gain %
  - Agent Fee % (e.g., "Chiu" 1%, "Tradehansa" 0.5%, or none)
  - Default Commission Rate

#### Customers Management  
- Add/Edit/Delete customers
- Store: Name, Default Destination Port, Credit Insurance Rate, Payment Terms

#### Default Rates
- Section 232 default rate (25%)
- HMF rate (0.335%)
- Marine Insurance rate (0.24%)
- Credit Insurance rate (0.11%)
- LC Rate (3.75%)
- Financing Rate (7.75%)
- Drayage/Destuffing rate per port

#### Ports Configuration
- List of origin ports by country
- List of destination ports
- Default freight rates between port pairs (optional)

### 6. Calculation Formulas

```typescript
// Core calculations
const freightPerMT = oceanFreight / containerCapacity;

const cifValue = incoterm === 'CIF' 
  ? basePrice 
  : basePrice + freightPerMT;

const fobValue = incoterm === 'FOB' 
  ? basePrice 
  : basePrice - freightPerMT - (basePrice * marineInsRate); // back-calculate FOB from CIF

// Apply weight gain if applicable
const adjustedFOB = fobValue * (1 - weightGainPercent);

// Duties & Fees
const section232 = adjustedFOB * section232Rate; // default 25%
const hmf = adjustedFOB * hmfRate;

// Insurance (based on CIF)
const marineIns = cifValue * marineInsRate;
const creditIns = cifValue * creditInsRate;

// Finance charges
const lcFinance = includeLCFinance 
  ? (cifValue * lcRate * lcDays / 360)  // default 3.75%
  : 0;
  
const financingDays = waterDays + termsDays + bufferDays;
const postSailingFinance = includeFinancing 
  ? (cifValue * financingRate * financingDays / 360)  // default 7.75%
  : 0;
  
const tariffFinance = includeTariffFinance 
  ? (adjustedFOB * section232Rate * tariffFinancePct * tariffFinanceRate * tariffFinanceDays / 360) 
  : 0;

// Handling
const drayagePerMT = drayagePerContainer / destuffCapacity;
const brokerPerMT = brokerType === 'perMT' 
  ? brokerFee 
  : brokerType === 'perContainer' 
    ? brokerFee / containerCapacity 
    : brokerFee / totalMT;

// Commission
const commission = adjustedFOB * commissionRate;

// Total Landed Cost ($/MT)
const totalLandedMT = cifValue 
  + section232 
  + hmf 
  + marineIns 
  + creditIns 
  + lcFinance 
  + postSailingFinance 
  + tariffFinance 
  + drayagePerMT 
  + brokerPerMT 
  + commission;

// Convert to $/lb
const MT_TO_LB = 2204.62;
const totalLandedLb = totalLandedMT / MT_TO_LB;

// Target price with margin
const targetPriceLb = totalLandedLb * (1 + marginPercent);

// Or calculate margin from target price
const marginFromPrice = (targetPriceLb - totalLandedLb) / targetPriceLb;
```

### 7. UI/UX Requirements

- Clean, professional interface (not overly corporate - modern startup feel)
- Collapsible sections for advanced options (finance, etc.)
- Real-time calculation as inputs change
- Input validation with helpful error messages
- Tooltips explaining each cost component
- Mobile-responsive design
- Print/Export to PDF option for the cost breakdown

### 8. Data Persistence

Use localStorage to save:
- All configuration (suppliers, customers, ports, default rates)
- Last 10 calculations for quick reference
- User's preferred defaults

### 9. Sample Data for Testing

Include these as default suppliers:
- PVST (Taiwan)
- Stanch (Taiwan)
- Yeou Yih (Taiwan - Kaohsiung)
- Yuen Chang (Taiwan)
- Wuu Jing (Taiwan)

Default customers:
- Basic Metals
- Alro
- Oneal
- Samuel

Default destination ports:
- Los Angeles, CA
- Houston, TX
- Newark, NJ

### 10. Stretch Goals (if time permits)
- Save and load complete pricing scenarios
- Export to Excel format
- Historical price tracking

## File Structure Suggestion

```
src/
├── components/
│   ├── Calculator/
│   │   ├── InputSection.tsx
│   │   ├── CostBreakdown.tsx
│   │   ├── ComparisonView.tsx
│   │   └── index.tsx
│   ├── Settings/
│   │   ├── SupplierManager.tsx
│   │   ├── CustomerManager.tsx
│   │   ├── RateDefaults.tsx
│   │   └── index.tsx
│   └── common/
│       ├── NumberInput.tsx
│       ├── Dropdown.tsx
│       └── Toggle.tsx
├── hooks/
│   ├── useCalculation.ts
│   └── useLocalStorage.ts
├── types/
│   └── index.ts
├── utils/
│   ├── calculations.ts
│   └── constants.ts
├── data/
│   └── defaults.ts
└── App.tsx
```

## Important Notes

1. **The math must be precise** - this is for actual business pricing decisions
2. **Section 232 is always applied to FOB value**, not CIF (default 25%)
3. **Weight gain reduces the effective FOB** (you pay per MT but receive less MT)
4. **Finance days calculations vary**:
   - LC Finance (3.75%): typically from LC issuance to shipment
   - Financing (7.75%): water transit + payment terms + buffer
   - Tariff Finance: from duty payment to customer payment
5. **Container capacity is 19 MT by default** but editable
6. **Support both 20ft and 40ft containers**

Please build this application step by step, starting with the core calculator functionality and then adding the configuration features.
```

---

## Additional Context for Claude Code

If asked about specifics, here's more detail:

### What "Weight Gain" Means
When steel is rolled at the mill, there's a theoretical weight based on dimensions. The actual weight is often slightly different. If the actual weight is 5% less than theoretical, you're paying for weight you don't receive. The formula adjusts: `Effective FOB = FOB × (1 - weight gain %)`

### Finance Cost Explanation
- **LC Finance (3.75% default)**: The cost of the letter of credit - from when you pay the supplier until goods ship.
- **Financing (7.75% default)**: Post-sailing finance cost - from when goods ship until you receive payment from your customer (water days + payment terms + buffer).
- **Tariff Finance**: If you finance the Section 232 duty payment rather than paying cash upfront.

### Why 360 Days?
Banking convention uses a 360-day year for interest calculations.

### Incoterm Implications
- **FOB (Free On Board)**: Buyer pays freight and insurance. Price quoted is at the origin port.
- **CIF (Cost, Insurance, Freight)**: Seller pays freight and insurance. Full delivered price to destination port.

---

## GitHub Setup Instructions (Do This First)

Before opening Claude Code, set up your GitHub repository:

### 1. Create a New Repository on GitHub

1. Go to [github.com](https://github.com) and sign in
2. Click the **+** icon (top right) → **New repository**
3. Fill in:
   - **Repository name**: `steel-pricing-tool` (or whatever you prefer)
   - **Description**: "Stainless steel import pricing calculator"
   - **Public** or **Private** (your choice)
   - ✅ Check **"Add a README file"**
   - ✅ Add **.gitignore** → select **Node**
4. Click **Create repository**

### 2. Get Your Repository URL

After creating, you'll be on your repo page. Copy the URL from your browser - it will look like:
```
https://github.com/YOUR-USERNAME/steel-pricing-tool
```

### 3. Open Claude Code

1. Open Claude Code (terminal or VS Code extension)
2. Navigate to where you want the project:
   ```bash
   cd ~/Projects  # or wherever you keep projects
   ```
3. Clone your repo:
   ```bash
   git clone https://github.com/YOUR-USERNAME/steel-pricing-tool
   cd steel-pricing-tool
   ```

### 4. Start Building with Claude Code

Now you can paste the prompt from this document (everything between the ``` markers in the "Comprehensive Claude Code Prompt" section above).

Tell Claude Code:
> "I've cloned my repo. Here's what I want to build: [paste the prompt]"

### 5. Deploy to GitHub Pages (Later)

Once the app is built, Claude Code can help you deploy. The basic steps are:

1. Build the production version:
   ```bash
   npm run build
   ```

2. Enable GitHub Pages in your repo:
   - Go to repo **Settings** → **Pages**
   - Source: **GitHub Actions** (for Vite/React apps)
   
3. Claude Code can set up the GitHub Actions workflow file for automatic deployment.

---

## Quick Reference Card

| Item | Default | Notes |
|------|---------|-------|
| Section 232 | 25% | Applied to FOB |
| HMF | 0.335% | Applied to FOB |
| Marine Insurance | 0.24% | Applied to CIF |
| Credit Insurance | 0.11% | Applied to CIF |
| LC Rate | 3.75% | Current rate |
| Financing Rate | 7.75% | Current rate |
| 20ft Container | 19 MT | Editable |
| 40ft Container | 38 MT | Double 20ft |
| Destuff Capacity | 18 MT | For drayage calc |
| MT to Lbs | 2,204.62 | Constant |
| Days/Year | 360 | Banking convention |
