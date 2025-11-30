import pandas as pd
import os

file_path = "sample.xlsx"
output_file = "analysis_result.txt"

if not os.path.exists(file_path):
    with open(output_file, "w") as f:
        f.write(f"File not found: {file_path}")
    exit(1)

try:
    xl = pd.ExcelFile(file_path)
    with open(output_file, "w") as f:
        f.write("---SHEET NAMES START---\n")
        for sheet in xl.sheet_names:
            f.write(f"SHEET: {sheet}\n")
        f.write("---SHEET NAMES END---\n")
        
        for sheet in xl.sheet_names:
            df = xl.parse(sheet)
            f.write(f"---COLUMNS FOR {sheet} START---\n")
            for col in df.columns:
                f.write(f"COL: {col}\n")
            f.write(f"---COLUMNS FOR {sheet} END---\n")
except Exception as e:
    with open(output_file, "w") as f:
        f.write(f"Error reading file: {e}")
