# PTW/KPI Analysis Report

Of course. Here is a comprehensive PTW analysis report based on the provided data summaries.

***

# Permit to Work (PTW) & KPI Analysis Report

## Executive Summary

This report provides a detailed analysis of the Permit to Work (PTW) system based on 75 recent permit records. The analysis reveals a mixed performance with notable strengths and critical areas for improvement.

While the overall **PTW Closure Efficiency is high at 90.67%**, indicating that most permits are eventually closed, this is overshadowed by significant safety and timeliness issues. A critical finding is the **Safety Checklist Compliance Rate of only 69.33%**, with **30.67% of all permits (23 out of 75) having missing safety controls**. This represents a substantial operational risk.

Furthermore, the system struggles with timely closures. **All currently open permits (7) are past their expiry date**, resulting in an **Overdue PTW rate of 9.33%**. This points to a systemic failure in managing the lifecycle of active permits. The 'Maintenance Workshop' and 'Electrical' permits are identified as high-volume areas requiring focused attention.

Immediate actions should prioritize enforcing safety control compliance through system checks and training, implementing an automated alert system for expiring permits, and conducting targeted audits in high-risk areas.

---

## 1. PTW Status Summary

The analysis covers a total of **75 permits**. The current status of these permits is broken down as follows, indicating a significant issue with overdue permits.

| Status | Permit Count | Percentage of Total |
| :--- | :--- | :--- |
| **Closed** | 68 | 90.67% |
| **Open** | 7 | 9.33% |
| **Overdue** | 7 | 9.33% |
| **Total** | **75** | **100%** |

**Key Insight:** The data from `PTW_Records/table_1.csv` shows that the number of 'Open' permits (7) exactly matches the number of 'Overdue' permits (7, where `is_past_expiry` is True). This means **100% of currently open permits are overdue**, highlighting a critical lapse in timely close-out or extension procedures.

---

## 2. PTW Type Distribution Analysis

The dataset includes **7 unique permit types**, indicating a diverse range of operational tasks requiring formal safety clearance.

*   **Most Frequent Permit Type:** 'Electrical' permits are the most common, accounting for **17 of the 75 total permits** (22.7%).
*   **Most Active Area:** The 'Maintenance Workshop' is the busiest area, with **11 permits** issued for work within it.

**Pattern Identification:** The high frequency of 'Electrical' permits, which are inherently high-risk, combined with the 'Maintenance Workshop' being the most active area, suggests that safety protocols and resources should be prioritized for this combination of work type and location.

---

## 3. Safety Checklist Compliance Rate Analysis

Safety compliance is a major area of concern. The analysis of `missing_controls_flag` in the `PTW_Records` data reveals significant gaps.

*   **Total Permits Analyzed:** 75
*   **Permits with All Controls:** 52
*   **Permits with Missing Controls:** 23
*   **Calculated Compliance Rate:** (52 / 75) × 100 = **69.33%**

**Interpretation:** A compliance rate of just under 70% is alarmingly low. This means that nearly one-third (**30.67%**) of all work initiated under a PTW may not have had all the required safety controls in place. The `PTW_KPIs_By_Area` data further shows this is a widespread issue, with an average of **2.56 missing controls per area** and a maximum of **5 missing controls** in a single area.

---

## 4. Key Performance Indicators (KPIs)

The following KPIs provide a quantitative assessment of the PTW system's health and efficiency.

| KPI | Formula | Calculation | Result | Interpretation |
| :--- | :--- | :--- | :--- | :--- |
| **PTW Closure Efficiency** | (Closed Permits / Total Permits) × 100 | (68 / 75) × 100 | **90.67%** | **Strong.** This indicates a robust process for eventually closing out permits. However, this high rate masks the underlying issue of timeliness. |
| **Overdue PTW %** | (Overdue Permits / Total Permits) × 100 | (7 / 75) × 100 | **9.33%** | **Poor.** Nearly 10% of all permits are not closed on time. This metric is critical as it directly correlates with unmonitored and potentially unsafe work conditions. |
| **Avg. Closure Time** | Mean(Close Time – Issue Time) | *N/A* | *N/A* | **Action Required.** This KPI cannot be calculated from the provided data summaries but is essential for measuring the efficiency of work execution. It should be tracked to identify bottlenecks. |

---

## 5. AI Functions Results

### Missing Controls Verification

The automated verification system has flagged a significant number of permits for non-compliance.

*   **Permits Flagged:** **23** permits have been identified with the `missing_controls_flag` set to 'Yes'.
*   **Percentage of Total:** This accounts for **30.67%** of all issued permits.
*   **Distribution:** The `PTW_KPIs_By_Area` summary confirms that this is not an isolated issue. The problem is present across all 9 operational areas, indicating a systemic weakness in the permit authorization process rather than a failure in a single area.

### Permit Load Prediction per Shift

Based on historical data from `PTW_Records/table_1.csv`, we can predict the daily permit workload.

*   **Historical Data:** 75 permits were issued across 54 unique dates.
*   **Average Daily Load:** ~1.4 permits per day.
*   **Peak Daily Load:** The busiest day recorded saw **3 permits** issued.

**Prediction:** Teams should be prepared to handle an average of **1-2 permits per day**, with the capacity to manage a peak load of **3-4 permits per day** to avoid delays in work commencement.

### Overdue PTW Alerts

**URGENT ACTION REQUIRED:** The system has identified the following critical alert.

*   **Alert:** **7 PTWs are currently OPEN and PAST THEIR EXPIRY TIME.**
*   **Details:**
    *   **Status:** All 7 permits are active in the system but have exceeded their authorized work duration.
    *   **Area Distribution:** According to the `PTW_KPIs_By_Area` data, these overdue permits are distributed across multiple areas, with at least one area having **2 permits past expiry**.
*   **Immediate Risk:** These permits represent unmonitored, unauthorized work. The associated risks have not been reassessed, and the work areas may not be safe.

---

## 6. Dashboard Insights

*   **Strength vs. Weakness:** There is a clear conflict between **high closure efficiency (90.67%)** and **poor timeliness (9.33% overdue)**. This suggests that while the administrative process of closing permits is followed, the operational discipline of closing them *on time* is lacking.
*   **Safety is Compromised:** The **30.67% rate of missing controls** is the most critical finding. This metric indicates a failure in the core purpose of the PTW system—to ensure work is conducted safely. It exposes the organization to significant operational and legal risks.
*   **High-Risk Focus Area:** The convergence of the highest permit volume ('Maintenance Workshop') and the most frequent high-risk permit type ('Electrical') provides a clear target for immediate safety audits, supervision, and training initiatives.

---

## 7. Actionable Recommendations

The following recommendations are based on the data analysis to drive targeted improvements in the PTW management process.

| Recommendation | Rationale (Based on Data) | Specific Action(s) | Priority |
| :--- | :--- | :--- | :--- |
| **1. Enforce Safety Control Compliance** | A **30.67%** non-compliance rate (23 of 75 permits) with up to 5 missing controls in one area. | <li>Implement a mandatory, system-enforced checklist that prevents permit submission if controls are missing.</li><li>Conduct immediate refresher training for all requesters and authorizers.</li> | **High** |
| **2. Eradicate Overdue Permits** | **100% of open permits (7)** are past their expiry date, resulting in a 9.33% total overdue rate. | <li>Configure automated email/SMS alerts to be sent to requesters and authorizers 2 hours before permit expiry.</li><li>Perform a root cause analysis on the 7 current overdue permits to understand failure points.</li> | **High** |
| **3. Target High-Volume/High-Risk Areas** | The 'Maintenance Workshop' has the highest permit volume (11), and 'Electrical' work is the most common type (17). | <li>Increase the frequency of safety audits and field verifications in the Maintenance Workshop.</li><li>Review and enhance the standard safety control checklists specifically for Electrical permits.</li> | **Medium** |
| **4. Enhance KPI Monitoring & Efficiency** | The `Avg. Closure Time` is a critical efficiency metric but could not be calculated. | <li>Configure the PTW dashboard to automatically calculate and display the `Avg. Closure Time` per area and permit type.</li><li>Set a target for this KPI and monitor it weekly to identify and resolve process bottlenecks.</li> | **Medium** |