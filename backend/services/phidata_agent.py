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
- Executive Summary
- Data Overview with detailed statistics
- Key Trends and Risks with specific examples and percentages
- Actionable Recommendations with specific actions, based on the data and trends identified.In neat and Tabulor Format
- Reference the data whenever and wherever possible.



## Data summaries
{chr(10).join(numeric_summary)}
"""
    return prompt


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
