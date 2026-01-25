import io
import pandas as pd
from pathlib import Path
import os

def extract_tables(file_content: bytes, output_dir: Path):
    """
    Extracts all sheets from the Excel file bytes and saves them as CSV files.
    
    Structure: output_dir / SheetName / table_1.csv
    """
    # Ensure output_dir exists
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Read Excel file
    try:
        xls = pd.ExcelFile(io.BytesIO(file_content))
    except Exception as e:
        print(f"Error reading Excel file: {e}")
        raise e

    for sheet_name in xls.sheet_names:
        try:
            # Clean sheet name to be filesystem friendly if necessary
            # We strip whitespace to be safe, but keep original case as much as possible
            safe_sheet_name = sheet_name.strip()
            
            # Create directory for this sheet
            sheet_dir = output_dir / safe_sheet_name
            sheet_dir.mkdir(parents=True, exist_ok=True)
            
            # Read sheet data
            df = xls.parse(sheet_name)
            
            # Save as CSV
            output_path = sheet_dir / "table_1.csv"
            df.to_csv(output_path, index=False)
            print(f"Extracted {sheet_name} to {output_path}")
            
        except Exception as e:
            print(f"Error extracting sheet {sheet_name}: {e}")
