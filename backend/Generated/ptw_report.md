# PTW/KPI Analysis Report

Of course. Here is a comprehensive PTW analysis report based on the provided data summaries.

***

# Permit to Work (PTW) & KPI Analysis Report

## Executive Summary

This report provides a detailed analysis of the Permit to Work (PTW) system based on 75 permit records. The analysis reveals a system with high operational throughput but significant safety and administrative compliance gaps.

The overall PTW Closure Efficiency is strong at **90.67%**, indicating that the majority of initiated work is completed. However, a critical issue has been identified: **100% of the 7 currently open permits are overdue**, resulting in an Overdue Rate of **9.33%**. This points to systemic issues in permit tracking and closeout procedures.

Furthermore, safety compliance is a major area of concern. The Safety Checklist Compliance Rate is only **69.33%**, with **23 out of 75 permits (30.7%)** flagged for having missing safety controls. This poses a considerable operational risk. The most frequent permit type is **Electrical**, highlighting a need for stringent controls in this high-risk area.

This report breaks down these findings, presents key performance indicators (KPIs), and provides specific, data-driven recommendations to enhance safety, improve compliance, and streamline the PTW management process.

## 1. PTW Status Summary

The status of the 75 permits in the system provides a clear picture of the current workload and administrative backlog.

| Status | Count | Percentage of Total |
| :--- | :--- | :--- |
| **Total Permits** | **75** | **100%** |
| Closed | 68 | 90.67% |
| Open | 7 | 9.33% |
| Overdue | 7 | 9.33% |

**Analysis:**
- A high number of permits (**68**) are successfully closed, demonstrating that work is being completed.
- A critical finding is that **all 7 open permits are past their expiry date**. This indicates a failure in the process of either completing the work on time, extending the permit validity, or administratively closing the permit upon work completion.

## 2. PTW Type Distribution Analysis

Analysis of permit types helps identify which categories of work are most common and may require focused safety attention.

- **Total Unique Permit Types:** 7
- **Most Frequent Permit Type:** **Electrical** (17 instances)

**Analysis:**
The high frequency of "Electrical" permits suggests a significant volume of electrical work, which is inherently high-risk. This pattern indicates that safety protocols, specialized training for electrical work, and verification of controls for these permits should be a top priority for safety audits and supervisory checks.

## 3. Safety Checklist Compliance Rate Analysis

This analysis measures the adherence to mandatory safety controls documented within the PTW system.

- **Total Permits Analyzed:** 75
- **Permits with Missing Controls:** 23
- **Permits with All Controls Verified:** 52
- **Safety Checklist Compliance Rate:** (52 / 75) × 100 = **69.33%**
- **Non-Compliance Rate:** (23 / 75) × 100 = **30.67%**

**Analysis:**
A compliance rate of 69.33% is a significant safety concern. Nearly one-third of all work permits were issued or processed with incomplete safety controls. The area-specific data (`PTW_KPIs_By_Area`) shows that this issue is widespread, with an average of **2.56 missing controls per area** and a maximum of **5 missing controls in a single area**. This indicates a systemic breakdown in safety verification that requires immediate intervention.

## 4. Key Performance Indicators (KPIs)

KPIs provide a quantitative measure of the PTW system's effectiveness and efficiency.

| KPI | Calculation | Result | Interpretation |
| :--- | :--- | :--- | :--- |
| **PTW Closure Efficiency** | (Closed Permits / Total Permits) × 100 | **90.67%** | **Strong.** This indicates that the vast majority of jobs are completed and their permits are eventually closed. However, this metric is undermined by the high overdue rate. |
| **Average Closure Time** | Mean(Close Time – Issue Time) | *Data Not Available* | This KPI measures the average time from permit issuance to final closure. **It is critical to start tracking this** to identify bottlenecks in either work execution or the administrative closeout process. |
| **Overdue Percentage** | (Overdue Permits / Total Permits) × 100 | **9.33%** | **Critical Concern.** An overdue rate of nearly 10% is high. The fact that this accounts for 100% of open permits points to a severe weakness in the monitoring and closeout phase of the PTW lifecycle. |

## 5. AI Functions Results

### Missing Controls Verification
- **Total Permits Flagged:** **23**
- **Insight:** The system automatically identified 23 permits where required safety controls were not documented or verified. The issue is not isolated, with the `PTW_KPIs_By_Area` data indicating that some areas have as many as **5 permits** with missing controls. This highlights a critical need for improved pre-authorization checks.

### Permit Load Prediction per Shift
- **Historical Data:** 75 permits were issued across 54 unique days.
- **Average Load:** Approximately **1.4 permits per day**.
- **Peak Load:** At least one day had **3 permits** issued.
- **Prediction:** While the average daily load is low, the system should be prepared to handle a peak load of **3-4 permits per day**. It is recommended to plan staffing and authorization capacity accordingly to avoid delays during busy periods.

### Overdue PTW Alerts
**<font color='red'>!!! ALERT: IMMEDIATE ACTION REQUIRED !!!</font>**

- **7 permits** are currently open and have passed their designated expiry time.
- Based on the `PTW_KPIs_By_Area` data, these overdue permits are distributed across multiple areas, with at least one area having **2 overdue permits**.
- **Action:** These permits pose a significant risk as the work conditions may no longer be safe or validated. They must be immediately investigated. The responsible parties must either:
  1.  **Close the permit** if the work is complete.
  2.  **Stop the work and re-validate the permit** with a new risk assessment if work needs to continue.

## 6. Dashboard Insights

- **Contradictory Performance:** There is a major disconnect between the high *Closure Efficiency (90.67%)* and the critical *Overdue Percentage (9.33%)*. This suggests a "fire-and-forget" culture where permits are issued and work is done, but the final administrative and safety step of formal closure is neglected.
- **Safety is the Biggest Weakness:** The most alarming metric is the **30.7% Non-Compliance Rate** for safety checklists. This is a leading indicator of potential incidents. It signals that procedural adherence is poor and that the safety assurance step in the PTW process is failing.
- **Area of Focus:** The **Maintenance Workshop** is the area with the highest permit volume (11 permits). While the data does not single it out for non-compliance, its high activity level makes it a logical starting point for audits and improvement initiatives.

## 7. Actionable Recommendations

Based on the analysis, the following actions are recommended to mitigate risks and improve the PTW process.

| No. | Problem Identified | Data Reference | Recommended Action | Owner/Department |
| :-- | :--- | :--- | :--- | :--- |
| 1 | **All open permits (7) are overdue.** | Overdue % = 9.33% | 1. Implement a **mandatory daily review** of all open permits by area supervisors. <br> 2. Establish a clear escalation process for permits approaching their expiry time. <br> 3. Configure automated system alerts for permit issuers and requesters 2 hours before expiry. | Operations / Area Supervisors |
| 2 | **High rate of missing safety controls.** | Non-Compliance Rate = 30.7% (23 permits) | 1. Conduct a Root Cause Analysis (RCA) on the 23 flagged permits to understand why controls are missed. <br> 2. Implement a **mandatory pre-submission verification step** by a supervisor. <br> 3. Provide mandatory refresher training on PTW procedures for all requesters and authorisers. | HSE / Training Department |
| 3 | **High volume of high-risk electrical work.** | 'Electrical' is the top permit type (17 permits). | 1. Conduct a focused safety audit on a sample of recently closed "Electrical" permits. <br> 2. Ensure that job-specific risk assessments (JRA) for electrical work are robust and consistently attached. <br> 3. Verify the competency and training records of personnel requesting and authorising these permits. | Electrical Maintenance / HSE |
| 4 | **Lack of visibility on work/closeout duration.** | Avg. Closure Time KPI is not tracked. | 1. Begin tracking and reporting on **Average Closure Time**. <br> 2. Set a target for this KPI (e.g., closure within 1 hour of work completion). <br> 3. Analyze permits with long closure times to identify process delays. | PTW Coordinator / Management |