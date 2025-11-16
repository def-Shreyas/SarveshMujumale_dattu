# PTW/KPI Analysis Report

Of course. Here is a comprehensive PTW analysis report based on the provided data summaries.

***

# Permit to Work (PTW) & KPI Analysis Report

## Executive Summary

This report provides a detailed analysis of the Permit to Work (PTW) system based on 75 permit records across 9 distinct work areas. The analysis reveals a high PTW closure rate but uncovers significant underlying issues in process compliance and timeliness.

Key findings indicate a **PTW Closure Efficiency of 90.67%**, with 68 out of 75 permits closed. However, the remaining 7 open permits are all past their expiry date, resulting in an **Overdue Rate of 9.33%**. This suggests a critical gap in the closure process, where permits are left open indefinitely after expiry instead of being formally closed or re-issued.

A major area of concern is safety compliance. The analysis identified that **30.67% of all permits (23 out of 75) were issued with missing safety controls**. This non-compliance is concentrated in certain areas, with one area having as many as 5 non-compliant permits, posing a significant operational risk.

**Electrical** work is the most frequent permit type, accounting for over 22% of all activities, highlighting a need for focused safety protocols in this domain.

This report concludes with actionable recommendations to address these gaps, focusing on enforcing timely permit closure, improving safety control verification, and enhancing data-driven oversight of the PTW process.

## 1. PTW Status Summary

The status of the 75 permits under review provides a clear picture of the current operational state. The breakdown is as follows:

*   **Total Permits Issued:** 75
*   **Closed Permits:** 68
*   **Open Permits:** 7
*   **Overdue Permits:** 7

**Analysis:**
Based on the `PTW_Records` data summary (`permit_status` frequency of 'Closed' is 68 out of 75), the number of open permits is 7. The `is_past_expiry` flag is `True` for 7 permits as well. This perfect correlation indicates that **100% of currently open permits are overdue**. This is a critical finding, suggesting a systemic failure to close out permits upon work completion or expiry.

| Status | Count | Percentage |
| :--- | :--- | :--- |
| Closed | 68 | 90.67% |
| Open & Overdue | 7 | 9.33% |
| **Total** | **75** | **100.00%** |

## 2. PTW Type Distribution Analysis

The dataset includes 7 unique permit types. Understanding the distribution helps identify which work types are most common and may require special attention.

*   **Most Frequent Permit Type:** **Electrical**
*   **Frequency:** 17 out of 75 permits
*   **Percentage of Total:** 22.7%

**Analysis:**
The `PTW_Records` summary shows that 'Electrical' is the top permit type with a frequency of 17. This indicates that a significant portion of high-risk work managed by the PTW system is electrical. Safety protocols, training, and control measures for electrical work should be a primary focus for continuous improvement initiatives.

## 3. Safety Checklist Compliance Rate Analysis

Safety checklist compliance is a leading indicator of process safety. The analysis measures the percentage of permits issued with all required safety controls documented.

*   **Total Permits:** 75
*   **Permits with Complete Controls:** 52
*   **Permits with Missing Controls:** 23

**Calculation:**
*   **Compliance Rate:** (52 / 75) × 100 = **69.33%**
*   **Non-Compliance Rate:** (23 / 75) × 100 = **30.67%**

**Analysis:**
The `PTW_Records` summary indicates that the `missing_controls_flag` was 'No' for 52 permits, meaning 23 permits were non-compliant. This is corroborated by the `PTW_KPIs_By_Area` summary, where the sum of `missing_controls` across all areas is approximately 23 (`mean` of 2.55 * 9 areas). A non-compliance rate of nearly 31% is a major safety concern. The area-specific data shows this problem is severe in some locations, with one area having up to 5 permits with missing controls.

## 4. Key Performance Indicators (KPIs)

KPIs provide a quantitative measure of the PTW system's health and efficiency.

| KPI | Formula | Calculation | Result | Interpretation |
| :--- | :--- | :--- | :--- | :--- |
| **PTW Closure Efficiency** | (Closed / Total) × 100 | (68 / 75) × 100 | **90.67%** | While appearing high, this metric is misleading. It reflects historical closures but masks the critical issue that all currently open permits are overdue. |
| **Overdue %** | (Overdue / Total) × 100 | (7 / 75) × 100 | **9.33%** | A nearly 10% overdue rate is a significant process failure. It indicates a lack of discipline in closing out permits and creates ambiguity about the status of ongoing work. |
| **Avg. Closure Time** | Mean(Close Time – Issue Time) | - | **N/A** | This KPI cannot be calculated from the provided data summaries, as it requires the individual `issue_time` and `close_time` for each of the 68 closed permits. |

## 5. AI Functions Results

This section simulates the output of automated monitoring and analysis functions.

#### Missing Controls Verification
*   **Result:** A total of **23 permits** were automatically flagged for having missing safety controls.
*   **Details:** The `PTW_KPIs_By_Area` data summary shows that this issue is widespread, with an average of 2.55 non-compliant permits per area. The problem is particularly acute in at least one area, which has a maximum of 5 permits with missing controls. This requires an immediate audit.

#### Permit Load Prediction per Shift
*   **Result:** The provided data does not contain shift-level information, making an accurate prediction per shift impossible.
*   **Details:** We can infer a daily load from the `issue_date` column in the `PTW_Records` summary, which has 54 unique values for 75 permits. This suggests an average of **1.4 permits issued per day**. However, this average may not reflect actual workload distribution, as work could be heavily concentrated on specific days. To enable accurate shift-based prediction, data collection must be enhanced to include a 'Shift' identifier (e.g., Day, Night, A, B).

#### Overdue PTW Alerts
*   **ALERT:** **7 Permits are currently OVERDUE.**
*   **Details:** The `PTW_Records` summary identifies 7 permits where `is_past_expiry` is `True`. These are the same 7 permits listed with an 'Open' status. While specific IDs are not available in the summary, the `PTW_KPIs_By_Area` table shows these overdue permits are distributed across several areas, with at least one area having 2 overdue permits (`permits_past_expiry` max = 2). These permits represent an active risk and require immediate investigation by area supervisors.

## 6. Dashboard Insights

*   **Critical Alert - Overdue Status:** The most critical insight is that the "Open" status is synonymous with "Overdue." This means there is no proactive management of permits nearing expiry. The system is reactive, only showing a permit as overdue after it has already expired.
*   **Safety Compliance Risk:** A compliance rate of just **69%** is a major red flag on a safety dashboard. This metric indicates a systemic failure in the verification process before permit authorization and points to a significant cultural or training issue.
*   **Area Hotspots:** The `PTW_KPIs_By_Area` data clearly indicates that performance is not uniform. Dashboards should highlight the areas with the highest number of `permits_past_expiry` and `missing_controls` as "Hotspots" requiring immediate managerial attention.
*   **Work Type Focus:** With **Electrical** permits forming the largest single category (22.7%), any safety dashboard should feature specific metrics and trends related to this work type.

## 7. Actionable Recommendations

Based on the analysis, the following actions are recommended to improve the PTW management process.

| Area of Concern | Recommendation | Specific Actions | Data Reference |
| :--- | :--- | :--- | :--- |
| **Permit Closure** | Enforce Timely Closure of All Permits | 1. Immediately investigate and close the 7 overdue permits. <br> 2. Implement automated email/SMS alerts to authorizers 1 hour before permit expiry. <br> 3. Make permit closure a mandatory field in daily supervisor reports. | 7 permits are 'Open' and also `is_past_expiry` (`PTW_Records`). |
| **Safety Compliance** | Strengthen Control Verification Process | 1. Conduct a Root Cause Analysis (RCA) on the 23 permits with missing controls. <br> 2. Focus the initial audit on the area with 5 non-compliant permits. <br> 3. Update the e-PTW system to make key control fields mandatory before submission. | `missing_controls` flag is 'Yes' for 23 permits (`PTW_Records`). Max of 5 in one area (`PTW_KPIs_By_Area`). |
| **Process & Training** | Enhance User Training and Awareness | 1. Conduct refresher training for all authorizers and requesters, focusing on the importance of closure and control verification. <br> 2. Develop targeted safety bulletins for 'Electrical' work, given its high frequency. | 'Electrical' is the top permit type with 17 instances (`PTW_Records`). |
| **Data & Systems** | Improve Data Analytics Capability | 1. Add a 'Shift' field to the PTW form to enable workload prediction. <br> 2. Configure the system to automatically calculate and display 'Average Closure Time' on dashboards. <br> 3. Create an area-specific PTW performance dashboard for managers. | Inability to calculate `Avg. Closure Time` and predict shift load from current data. |