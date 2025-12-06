"""
phidata_agent.py — Full workflow to:
1. Extract tables from sample.xlsx (if not already done)
2. Ask Gemini (via Phidata) to analyze and generate an in-depth report
3. Save the report as report.md
"""

import subprocess
import sys
import re
from pathlib import Path
import pandas as pd
import os
from datetime import datetime
from dotenv import load_dotenv
from phi.agent import Agent
from phi.model.google import Gemini

# Load environment variables from .env file
load_dotenv()

# Assign GOOGLE_API_KEY from environment
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

# -------------------------------------------------------------
# CONFIG
# -------------------------------------------------------------
BASE = Path(__file__).parent
EXCEL_PATH = BASE.parent / "sample.xlsx"
EXTRACT_SCRIPT = BASE / "extraction.py"
EXTRACTED_DIR = BASE.parent / "Generated" / "extracted_tables"
REPORT_PATH = BASE.parent / "Generated" / "report.md"


# -------------------------------------------------------------
# HELPER FUNCTIONS
# -------------------------------------------------------------
def force_convert(df: pd.DataFrame) -> pd.DataFrame:
    """Force pandas to infer numeric types even if stored as text."""
    for col in df.columns:
        try:
            df[col] = pd.to_numeric(df[col])
        except (ValueError, TypeError):
            # Keep original values if conversion fails
            pass
    return df


def extract_content_from_response(response) -> str:
    """Extract markdown content from phidata response object."""
    report_content = None

    # Try to get content directly from response
    if hasattr(response, 'content'):
        report_content = response.content
    # Try to get content from messages (phidata response structure)
    elif hasattr(response, 'messages') and len(response.messages) > 0:
        # Find the model message (last one with role='model')
        for msg in reversed(response.messages):
            if hasattr(msg, 'role') and hasattr(msg, 'content'):
                if msg.role == 'model' and msg.content:
                    report_content = msg.content
                    break
            elif hasattr(msg, 'content'):
                report_content = msg.content
                break

    # Fallback: extract from string representation
    if not report_content:
        response_str = str(response)
        # Try to extract content from the string representation (handles phidata RunResponse format)
        # Look for content='...' pattern
        match = re.search(r"content='(.*?)'(?:\s+content_type|\s+event=)", response_str, re.DOTALL)
        if match:
            report_content = match.group(1)
            # Unescape newlines and other escape sequences
            report_content = report_content.replace('\\n', '\n').replace("\\'", "'")
        else:
            report_content = response_str

    # Clean up escaped newlines if any
    if isinstance(report_content, str):
        report_content = report_content.replace('\\n', '\n')

    return report_content


# -------------------------------------------------------------
# MAIN FUNCTIONS
# -------------------------------------------------------------
def extract_tables_from_excel(extract_script: Path, extracted_dir: Path) -> None:
    """Extract tables from Excel file if not already extracted."""
    if not extracted_dir.exists():
        print("[INFO] Extracting tables from sample.xlsx ...")
        subprocess.run([sys.executable, str(extract_script)], check=True)
    else:
        print("[INFO] Tables already extracted.")


def summarize_numeric_data(extracted_dir: Path) -> list:
    """Generate numeric summaries for all CSV files."""
    numeric_summary = []
    
    for csv_file in extracted_dir.rglob("table_*.csv"):
        df = pd.read_csv(csv_file)
        df = force_convert(df)
        
        try:
            desc = df.describe(include='all').to_string()
        except Exception:
            desc = "No numeric summary available."
        
        numeric_summary.append(
            f"### {csv_file.parent.name}/{csv_file.name}\n```\n{desc}\n```"
        )
    
    return numeric_summary


def create_analysis_prompt(numeric_summary: list) -> str:
    """Create the prompt for Gemini analysis."""
    current_date = datetime.now().strftime("%B %d, %Y")
    prompt = f"""
You are a Safety Data Analysis Assistant.
Analyze the provided data tables and summaries.

Goals:
1. Summarize, observation, near-miss, and incident data.
2. Identify notable trends and risks.
3. Provide actionable recommendations for safety officers.
4. Provide an in-depth, comprehensive analysis with detailed insights and rationale for each recommendation.
5. Act as a Data analyser and try to extract key points from the given data 

Please provide a comprehensive, detailed report similar to an executive safety analysis report. Include:
- Start the report with: **Date:** {current_date}
- Executive Summary
- Data Overview with detailed statistics
- Key Trends and Risks with specific examples and percentages
- Actionable Recommendations with specific actions, based on the data and trends identified.In neat and Tabulor Format
- Reference the data whenever and wherever possible.



## Data summaries
{chr(10).join(numeric_summary)}
"""
    return prompt


def create_ptw_analysis_prompt(numeric_summary: list) -> str:
    """Create the prompt for PTW/KPI analysis."""
    current_date = datetime.now().strftime("%B %d, %Y")
    prompt = f"""
You are a Permit to Work (PTW) and KPI Analysis Assistant.
Analyze the provided PTW records and KPI data tables.

Goals:
1. Analyze PTW status (Open/Closed/Overdue) and provide summary statistics.
2. Analyze PTW type distribution and identify patterns.
3. Calculate and analyze safety checklist compliance rates.
4. Calculate and interpret key KPIs:
   - PTW Closure Efficiency = (Closed / Total) × 100
   - Avg. Closure Time = Mean(Close Time – Issue Time)
   - Overdue % = (Overdue / Total) × 100
5. Verify missing controls automatically and identify compliance issues.
6. Predict permit load per shift based on historical patterns.
7. Alert for overdue PTWs and identify areas of concern.
8. Provide actionable recommendations for improving PTW management.

Please provide a comprehensive, detailed report similar to an executive PTW analysis report. Include:
- Start the report with: **Date:** {current_date}
- Executive Summary
- PTW Status Summary (Open/Closed/Overdue breakdown)
- PTW Type Distribution Analysis
- Safety Checklist Compliance Rate Analysis
- Key Performance Indicators (KPIs) with calculations and interpretations
- AI Functions Results:
  * Missing Controls Verification (identify permits with missing controls)
  * Permit Load Prediction per Shift (based on historical data)
  * Overdue PTW Alerts (list overdue permits with details)
- Dashboard Insights (interpretation of key metrics)
- Actionable Recommendations with specific actions, based on the data and trends identified in neat and tabular format
- Reference the data whenever and wherever possible.

## Data summaries
{chr(10).join(numeric_summary)}
"""
    return prompt


def generate_ptw_report_with_gemini(prompt: str) -> str:
    """Generate PTW/KPI analysis report using Gemini via Phidata."""
    gemini = Gemini(id="gemini-2.5-pro", temperature=0.2)
    agent = Agent(model=gemini, markdown=True)
    
    print("[INFO] Generating PTW/KPI report with Gemini...")
    response = agent.run(prompt)
    
    report_content = extract_content_from_response(response)
    return report_content


def save_ptw_report(report_content: str, report_path: Path) -> None:
    """Save the generated PTW report to a markdown file."""
    with open(report_path, "w", encoding="utf-8") as f:
        f.write("# PTW/KPI Analysis Report\n\n")
        f.write(report_content)
    
    print(f"[INFO] PTW/KPI Report generated: {report_path}")


def create_inspections_analysis_prompt(numeric_summary: list) -> str:
    """Create the prompt for Inspections/Audit analysis."""
    current_date = datetime.now().strftime("%B %d, %Y")
    prompt = f"""
You are an Inspections and Audit Analysis Assistant.
Analyze the provided inspection records and recurring failures data.

Goals:
1. Analyze NCR (Non-Conformance Report) summary and provide statistics.
2. Calculate and analyze audit compliance percentage.
3. Identify and analyze recurring non-compliance items.
4. Create audit scorecards by area and inspector.
5. Calculate and interpret key KPIs:
   - Compliance % = Pass / Total × 100
   - Recurrence % = Repeat NCR / Total NCR × 100
   - Avg. Closure Days (if closure date data available)
6. AI Functions:
   - Identify repeating NCRs automatically
   - Suggest preventive actions based on recurring failures
   - Predict audit failure risk by area based on historical patterns
7. Provide actionable recommendations for improving audit compliance.

Please provide a comprehensive, detailed report similar to an executive audit analysis report. Include:
- Start the report with: **Date:** {current_date}
- Executive Summary
- NCR Summary (Pass/Fail/NA breakdown with statistics)
- Audit Compliance Percentage Analysis
- Recurring Non-Compliance List (top recurring items with details)
- Audit Scorecards:
  * Compliance by Area
  * Compliance by Inspector
  * Total Inspections by Area
- Key Performance Indicators (KPIs) with calculations and interpretations:
  * Compliance Percentage
  * Recurrence Percentage
  * Average Closure Days (if available)
- AI Functions Results:
  * Repeating NCRs Identification (list of items that fail repeatedly)
  * Preventive Actions Suggestions (specific actions to prevent recurring failures)
  * Audit Failure Risk Prediction by Area (risk levels for each area)
- Dashboard Insights (interpretation of key metrics and trends)
- Actionable Recommendations with specific actions, based on the data and trends identified in neat and tabular format
- Reference the data whenever and wherever possible.

## Data summaries
{chr(10).join(numeric_summary)}
"""
    return prompt


def generate_inspections_report_with_gemini(prompt: str) -> str:
    """Generate Inspections/Audit analysis report using Gemini via Phidata."""
    gemini = Gemini(id="gemini-2.5-pro", temperature=0.2)
    agent = Agent(model=gemini, markdown=True)
    
    print("[INFO] Generating Inspections/Audit report with Gemini...")
    response = agent.run(prompt)
    
    report_content = extract_content_from_response(response)
    return report_content


def save_inspections_report(report_content: str, report_path: Path) -> None:
    """Save the generated Inspections/Audit report to a markdown file."""
    with open(report_path, "w", encoding="utf-8") as f:
        f.write("# Inspections/Audit Analysis Report\n\n")
        f.write(report_content)
    
    print(f"[INFO] Inspections/Audit Report generated: {report_path}")


def create_medical_analysis_prompt(numeric_summary: list) -> str:
    """Create the prompt for Medical Records analysis."""
    current_date = datetime.now().strftime("%B %d, %Y")
    prompt = f"""
You are a Medical Records and Health & Safety Analysis Assistant.
Analyze the provided medical records and KPI data.

Goals:
1. Analyze First-aid vs LTI (Lost Time Injury) summary and provide statistics.
2. Create drill compliance report (analyze emergency preparedness).
3. Analyze response time analytics and identify patterns.
4. Calculate and interpret key KPIs:
   - FA Cases / Month = Average first-aid cases per month
   - Avg. Response Time = Average time from incident to first aid
   - Drill Compliance % = Percentage of drills completed successfully
5. AI Functions:
   - Predict repetitive injury patterns based on historical data
   - Suggest wellness interventions to prevent common injuries
   - Identify high-risk departments and areas
6. Provide actionable recommendations for improving workplace health and safety.

Please provide a comprehensive, detailed report similar to an executive medical records analysis report. Include:
- Start the report with: **Date:** {current_date}
- Executive Summary
- First-aid vs LTI Summary (breakdown with statistics and trends)
- Drill Compliance Report (analysis of emergency preparedness drills)
- Response Time Analytics (time to first aid, patterns by department/time)
- Key Performance Indicators (KPIs) with calculations and interpretations:
  * FA Cases per Month
  * Average Response Time
  * Drill Compliance Percentage
- AI Functions Results:
  * Repetitive Injury Pattern Predictions (identify patterns in injury types, departments, times)
  * Wellness Intervention Suggestions (specific recommendations to prevent common injuries)
  * High-Risk Area Identification (departments/areas with elevated injury rates)
- Dashboard Insights (interpretation of key metrics and trends)
- Injury Type Analysis (distribution and trends)
- Actionable Recommendations with specific actions, based on the data and trends identified in neat and tabular format
- Reference the data whenever and wherever possible.

## Data summaries
{chr(10).join(numeric_summary)}
"""
    return prompt


def generate_medical_report_with_gemini(prompt: str) -> str:
    """Generate Medical Records analysis report using Gemini via Phidata."""
    gemini = Gemini(id="gemini-2.5-pro", temperature=0.2)
    agent = Agent(model=gemini, markdown=True)
    
    print("[INFO] Generating Medical Records report with Gemini...")
    response = agent.run(prompt)
    
    report_content = extract_content_from_response(response)
    return report_content


def save_medical_report(report_content: str, report_path: Path) -> None:
    """Save the generated Medical Records report to a markdown file."""
    with open(report_path, "w", encoding="utf-8") as f:
        f.write("# Medical Records Analysis Report\n\n")
        f.write(report_content)
    
    print(f"[INFO] Medical Records Report generated: {report_path}")


def create_training_analysis_prompt(numeric_summary: list) -> str:
    """Create the prompt for Training Database analysis."""
    current_date = datetime.now().strftime("%B %d, %Y")
    prompt = f"""
You are a Training and Development Analysis Assistant.
Analyze the provided training records data.

Goals:
1. Analyze training completion summary and provide statistics.
2. Perform skill gap analysis to identify areas needing improvement.
3. Generate expiry reminders for certifications.
4. Calculate and interpret key KPIs:
   - Coverage % = Trained / Total × 100
   - Effectiveness = Avg(Post Score – Pre Score)
   - Expiry Compliance % = Valid / Total × 100
5. AI Functions:
   - Recommend retraining candidates based on low scores or expiring certifications
   - Predict departments with low competency based on training performance
   - Generate monthly TNA (Training Needs Analysis) summary
6. Provide actionable recommendations for improving training effectiveness.

Please provide a comprehensive, detailed report similar to an executive training analysis report. Include:
- Start the report with: **Date:** {current_date}
- Executive Summary
- Training Completion Summary (statistics on completed trainings, coverage, etc.)
- Skill Gap Analysis (identify departments/courses with skill gaps, low scores)
- Expiry Reminders (list of certifications expiring soon, expired certifications)
- Key Performance Indicators (KPIs) with calculations and interpretations:
  * Coverage Percentage (Trained / Total employees)
  * Training Effectiveness (Average improvement: Post - Pre scores)
  * Expiry Compliance Percentage (Valid certifications / Total)
- AI Functions Results:
  * Retraining Candidate Recommendations (employees needing retraining based on scores/expiry)
  * Low Competency Department Predictions (departments with below-average training performance)
  * Monthly TNA Summary (Training Needs Analysis by month, department, course)
- Dashboard Insights (interpretation of key metrics and trends)
- Training Calendar Analysis (training distribution over time)
- Skill Matrix Analysis (competency levels by department and course)
- Actionable Recommendations with specific actions, based on the data and trends identified in neat and tabular format
- Reference the data whenever and wherever possible.

## Data summaries
{chr(10).join(numeric_summary)}
"""
    return prompt


def generate_training_report_with_gemini(prompt: str) -> str:
    """Generate Training Database analysis report using Gemini via Phidata."""
    gemini = Gemini(id="gemini-2.5-pro", temperature=0.2)
    agent = Agent(model=gemini, markdown=True)
    
    print("[INFO] Generating Training Database report with Gemini...")
    response = agent.run(prompt)
    
    report_content = extract_content_from_response(response)
    return report_content


def save_training_report(report_content: str, report_path: Path) -> None:
    """Save the generated Training Database report to a markdown file."""
    with open(report_path, "w", encoding="utf-8") as f:
        f.write("# Training Database Analysis Report\n\n")
        f.write(report_content)
    
    print(f"[INFO] Training Database Report generated: {report_path}")


def create_ppe_analysis_prompt(numeric_summary: list) -> str:
    """Create the prompt for PPE (Assets & PPE) analysis."""
    current_date = datetime.now().strftime("%B %d, %Y")
    prompt = f"""
You are a PPE (Personal Protective Equipment) and Assets Management Analysis Assistant.
Analyze the provided PPE inventory and usage data.

Goals:
1. Analyze stock summary by PPE type and provide statistics.
2. Analyze usage vs purchase patterns and identify trends.
3. Generate reorder alerts for low stock items.
4. Calculate and interpret key KPIs:
   - Utilization % = Issued / Purchased × 100
   - Stock Turnover Rate = Issued / Average Stock
   - Low Stock Alerts (< threshold)
5. AI Functions:
   - Predict next stock-out date based on consumption patterns
   - Identify high-usage departments requiring more frequent replenishment
   - Auto-generate reorder list with recommended quantities
6. Provide actionable recommendations for optimizing PPE inventory management.

Please provide a comprehensive, detailed report similar to an executive PPE management analysis report. Include:
- Start the report with: **Date:** {current_date}
- Executive Summary
- Stock Summary by PPE Type (purchased, issued, balance statistics)
- Usage vs Purchase Analysis (comparison charts, trends, patterns)
- Reorder Alerts (items needing reorder, low stock items, upcoming deliveries)
- Key Performance Indicators (KPIs) with calculations and interpretations:
  * Utilization Percentage (Issued / Purchased)
  * Stock Turnover Rate (how quickly stock is being used)
  * Low Stock Alerts Count (items below threshold)
- AI Functions Results:
  * Next Stock-Out Date Predictions (when each PPE item is likely to run out)
  * High-Usage Department Identification (departments consuming PPE at high rates)
  * Auto-Generated Reorder List (recommended items and quantities for reorder)
- Dashboard Insights (interpretation of key metrics and trends)
- Consumption Trend Analysis (by department, by PPE type, over time)
- Upcoming Expiry/Delivery List (items with upcoming delivery dates)
- Actionable Recommendations with specific actions, based on the data and trends identified in neat and tabular format
- Reference the data whenever and wherever possible.

## Data summaries
{chr(10).join(numeric_summary)}
"""
    return prompt


def generate_ppe_report_with_gemini(prompt: str) -> str:
    """Generate PPE analysis report using Gemini via Phidata."""
    gemini = Gemini(id="gemini-2.5-pro", temperature=0.2)
    agent = Agent(model=gemini, markdown=True)
    
    print("[INFO] Generating PPE report with Gemini...")
    response = agent.run(prompt)
    
    report_content = extract_content_from_response(response)
    return report_content


def save_ppe_report(report_content: str, report_path: Path) -> None:
    """Save the generated PPE report to a markdown file."""
    with open(report_path, "w", encoding="utf-8") as f:
        f.write("# PPE (Assets & PPE) Analysis Report\n\n")
        f.write(report_content)
    
    print(f"[INFO] PPE Report generated: {report_path}")


def create_rca_analysis_prompt(numeric_summary: list) -> str:
    """Create the prompt for Corrective Actions & RCA analysis."""
    current_date = datetime.now().strftime("%B %d, %Y")
    prompt = f"""
You are a Corrective Actions and Root Cause Analysis (RCA) Management Assistant.
Analyze the provided corrective actions and RCA data.

Goals:
1. Analyze open vs closed actions summary and provide statistics.
2. Track SLA-based closure performance and identify bottlenecks.
3. Calculate and interpret key KPIs:
   - Action Closure % = Closed / Total × 100
   - Overdue Actions = Count(Actions > Due Date)
   - Avg. Closure Time = Mean(Closed Date – Created Date)
4. AI Functions:
   - Flag overdue actions automatically and prioritize them
   - Recommend preventive measures based on root cause patterns
   - Identify recurring issues requiring systemic solutions
5. Provide actionable recommendations for improving corrective action management.

Please provide a comprehensive, detailed report similar to an executive corrective actions analysis report. Include:
- Start the report with: **Date:** {current_date}
- Executive Summary
- Open vs Closed Actions Summary (status breakdown, statistics)
- SLA-Based Closure Tracking (performance against service level agreements)
- Key Performance Indicators (KPIs) with calculations and interpretations:
  * Action Closure Percentage (Closed / Total actions)
  * Overdue Actions Count (actions past their due date)
  * Average Closure Time (time taken to close actions)
- AI Functions Results:
  * Overdue Actions Flagging (list of overdue actions with details and priority)
  * Preventive Measures Recommendations (specific actions to prevent recurring issues)
  * Root Cause Pattern Analysis (common root causes and their frequency)
- Dashboard Insights (interpretation of key metrics and trends)
- Overdue Trend Analysis (trend of overdue actions over time)
- RCA Closure Gauge Interpretation (closure rate performance)
- Actionable Recommendations with specific actions, based on the data and trends identified in neat and tabular format
- Reference the data whenever and wherever possible.

## Data summaries
{chr(10).join(numeric_summary)}
"""
    return prompt


def generate_rca_report_with_gemini(prompt: str) -> str:
    """Generate Corrective Actions & RCA analysis report using Gemini via Phidata."""
    gemini = Gemini(id="gemini-2.5-pro", temperature=0.2)
    agent = Agent(model=gemini, markdown=True)
    
    print("[INFO] Generating Corrective Actions & RCA report with Gemini...")
    response = agent.run(prompt)
    
    report_content = extract_content_from_response(response)
    return report_content


def save_rca_report(report_content: str, report_path: Path) -> None:
    """Save the generated Corrective Actions & RCA report to a markdown file."""
    with open(report_path, "w", encoding="utf-8") as f:
        f.write("# Corrective Actions & RCA Analysis Report\n\n")
        f.write(report_content)
    
    print(f"[INFO] Corrective Actions & RCA Report generated: {report_path}")


def create_environmental_analysis_prompt(numeric_summary: list) -> str:
    """Create the prompt for Environmental & Resource Use analysis."""
    current_date = datetime.now().strftime("%B %d, %Y")
    prompt = f"""
You are an Environmental and Resource Use Analysis Assistant.
Analyze the provided environmental and resource consumption data.

Goals:
1. Analyze energy and emission trends over time.
2. Analyze waste recycling patterns and identify improvement opportunities.
3. Calculate and interpret key KPIs:
   - Energy Intensity = kWh / Unit Produced (if production data available)
   - CO₂ Intensity = tCO₂ / Unit Produced (if production data available)
   - Recycling % = Recycled / Total Waste × 100
4. AI Functions:
   - Detect abnormal resource consumption patterns and flag anomalies
   - Recommend reduction actions for energy, water, waste, and CO₂ emissions
   - Identify opportunities for renewable energy adoption
5. Provide actionable recommendations for improving environmental performance.

Please provide a comprehensive, detailed report similar to an executive environmental analysis report. Include:
- Start the report with: **Date:** {current_date}
- Executive Summary
- Energy and Emission Trends (monthly patterns, plant-wise comparison)
- Waste Recycling Summary (recycling rates, waste distribution, improvement areas)
- Key Performance Indicators (KPIs) with calculations and interpretations:
  * Energy Intensity (kWh per unit produced)
  * CO₂ Intensity (tCO₂ per unit produced)
  * Recycling Percentage (Recycled / Total Waste)
  * Renewable Energy Percentage
- AI Functions Results:
  * Abnormal Resource Consumption Detection (identify spikes, anomalies, unusual patterns)
  * Reduction Action Recommendations (specific actions to reduce energy, water, waste, CO₂)
  * Renewable Energy Opportunities (areas where renewable energy can be increased)
- Dashboard Insights (interpretation of key metrics and trends)
- ESG Score Analysis (Environmental, Social, Governance scoring)
- CO₂ Reduction Analysis (trends, targets, achievements)
- Actionable Recommendations with specific actions, based on the data and trends identified in neat and tabular format
- Reference the data whenever and wherever possible.

## Data summaries
{chr(10).join(numeric_summary)}
"""
    return prompt


def generate_environmental_report_with_gemini(prompt: str) -> str:
    """Generate Environmental & Resource Use analysis report using Gemini via Phidata."""
    gemini = Gemini(id="gemini-2.5-pro", temperature=0.2)
    agent = Agent(model=gemini, markdown=True)
    
    print("[INFO] Generating Environmental & Resource Use report with Gemini...")
    response = agent.run(prompt)
    
    report_content = extract_content_from_response(response)
    return report_content


def save_environmental_report(report_content: str, report_path: Path) -> None:
    """Save the generated Environmental & Resource Use report to a markdown file."""
    with open(report_path, "w", encoding="utf-8") as f:
        f.write("# Environmental & Resource Use Analysis Report\n\n")
        f.write(report_content)
    
    print(f"[INFO] Environmental & Resource Use Report generated: {report_path}")


def create_social_governance_analysis_prompt(numeric_summary: list) -> str:
    """Create the prompt for Social & Governance analysis."""
    current_date = datetime.now().strftime("%B %d, %Y")
    prompt = f"""
You are a Social & Governance Analysis Assistant.
Analyze the provided workforce, social, and governance data.

Goals:
1. Analyze workforce diversity summary (gender, age groups, departments).
2. Analyze policy compliance and governance metrics.
3. Analyze supplier ESG ratings and audit performance.
4. Calculate and interpret key KPIs:
   - Turnover Rate = (Employees Left / Total Employees) × 100
   - Absenteeism % = (Absent Days / Total Working Days) × 100
   - Policy Compliance % = (Compliant Policies / Total Policies) × 100
   - Supplier Audit % = (Audited Suppliers / Total Suppliers) × 100
5. AI Functions:
   - Predict attrition risk by department based on turnover rates, absenteeism, and survey scores
   - Analyze sentiment from employee surveys and identify areas of concern
   - Generate governance score summary combining board diversity, whistleblower reports, and policy compliance
6. Provide actionable recommendations for improving social and governance performance.

Please provide a comprehensive, detailed report similar to an executive social & governance analysis report. Include:
- Start the report with: **Date:** {current_date}
- Executive Summary
- Workforce Diversity Summary (gender distribution, age group breakdown, department diversity)
- Policy Compliance Report (policy review dates, compliance status, version tracking)
- Supplier ESG Rating Analysis (supplier audit scores, compliance rates, incident tracking)
- Key Performance Indicators (KPIs) with calculations and interpretations:
  * Turnover Rate (department-wise and overall)
  * Absenteeism Percentage (by department and overall)
  * Policy Compliance Percentage (based on policy reviews and compliance)
  * Supplier Audit Percentage (audited vs total suppliers)
- AI Functions Results:
  * Attrition Risk Prediction by Department (identify high-risk departments with specific risk factors)
  * Employee Survey Sentiment Analysis (analyze survey scores, identify trends, highlight concerns)
  * Governance Score Summary (combine board diversity, whistleblower handling, policy compliance)
- Dashboard Insights (interpretation of key metrics and trends)
- Workforce Stability Trend Analysis (turnover and absenteeism trends over time)
- ESG Radar Chart Interpretation (Social and Governance pillars performance)
- Actionable Recommendations with specific actions, based on the data and trends identified in neat and tabular format
- Reference the data whenever and wherever possible.

## Data summaries
{chr(10).join(numeric_summary)}
"""
    return prompt


def generate_social_governance_report_with_gemini(prompt: str) -> str:
    """Generate Social & Governance analysis report using Gemini via Phidata."""
    gemini = Gemini(id="gemini-2.5-pro", temperature=0.2)
    agent = Agent(model=gemini, markdown=True)
    
    print("[INFO] Generating Social & Governance report with Gemini...")
    response = agent.run(prompt)
    
    report_content = extract_content_from_response(response)
    return report_content


def save_social_governance_report(report_content: str, report_path: Path) -> None:
    """Save the generated Social & Governance report to a markdown file."""
    with open(report_path, "w", encoding="utf-8") as f:
        f.write("# Social & Governance Analysis Report\n\n")
        f.write(report_content)
    
    print(f"[INFO] Social & Governance Report generated: {report_path}")


def generate_report_with_gemini(prompt: str) -> str:
    """Generate safety analysis report using Gemini via Phidata."""
    gemini = Gemini(id="gemini-2.5-pro", temperature=0.2)
    agent = Agent(model=gemini, markdown=True)
    
    print("[INFO] Generating report with Gemini...")
    response = agent.run(prompt)
    
    report_content = extract_content_from_response(response)
    return report_content


def save_report(report_content: str, report_path: Path) -> None:
    """Save the generated report to a markdown file."""
    with open(report_path, "w", encoding="utf-8") as f:
        f.write("# Safety Data Report\n\n")
        f.write(report_content)
    
    print(f"[INFO] Report generated: {report_path}")


# -------------------------------------------------------------
# MAIN WORKFLOW
# -------------------------------------------------------------
def main():
    """Main workflow function."""
    # Step 1: Extract tables from Excel
    extract_tables_from_excel(EXTRACT_SCRIPT, EXTRACTED_DIR)
    
    # Step 2: Summarize numeric data
    numeric_summary = summarize_numeric_data(EXTRACTED_DIR)
    
    # Step 3: Generate report with Gemini
    prompt = create_analysis_prompt(numeric_summary)
    report_content = generate_report_with_gemini(prompt)
    
    # Step 4: Save final report
    save_report(report_content, REPORT_PATH)


if __name__ == "__main__":
    main()