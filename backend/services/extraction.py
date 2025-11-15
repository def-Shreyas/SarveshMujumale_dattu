import pandas as pd
import numpy as np
from pathlib import Path

def extract_tables(excel_path):
    excel_path = Path(excel_path)
    out_dir = excel_path.parent / "Generated" / "extracted_tables"
    out_dir.mkdir(parents=True, exist_ok=True)

    # Open ExcelFile and ensure it's properly closed to prevent file locking on Windows
    xls = None
    try:
        xls = pd.ExcelFile(excel_path)
        for sheet in xls.sheet_names:
            df = xls.parse(sheet, header=None, dtype=object)
            df = df.replace(r'^\s*$', np.nan, regex=True)  # treat blanks as NaN

            # detect contiguous non-empty row blocks
            is_full_nan_row = df.isna().all(axis=1)
            segments = []
            in_seg = False
            seg_start = None
            for i, val in enumerate(~is_full_nan_row):
                if val and not in_seg:
                    in_seg = True
                    seg_start = i
                elif not val and in_seg:
                    in_seg = False
                    segments.append((seg_start, i-1))
            if in_seg:
                segments.append((seg_start, len(is_full_nan_row)-1))

            # save each segment as a table
            sheet_out = out_dir / sheet
            sheet_out.mkdir(exist_ok=True)
            for idx, (r0, r1) in enumerate(segments, start=1):
                block = df.iloc[r0:r1+1, :].copy()
                block = block.dropna(axis=1, how='all')

                # promote first row to header if mostly text
                first_row = block.iloc[0].astype(str).str.strip().replace('nan', '')
                num_nonempty = (first_row != '').sum()
                if num_nonempty >= block.shape[1] / 2:
                    block.columns = block.iloc[0].fillna("").astype(str)
                    block = block.drop(block.index[0]).reset_index(drop=True)
                else:
                    block = block.reset_index(drop=True)

                # try numeric conversion
                for col in block.columns:
                    try:
                        block[col] = pd.to_numeric(block[col])
                    except (ValueError, TypeError):
                        # Keep original values if conversion fails
                        pass

                # Skip ID count tables for incidents and nearmisses
                if sheet.lower() in ['incidents', 'nearmisses']:
                    # Check if this table appears to be an ID count table
                    # (typically has columns like IncidentID,Count or NearMissID,Count)
                    col_names = [str(col).lower() for col in block.columns]
                    has_id_col = any('id' in col for col in col_names)
                    has_count_col = any('count' in col for col in col_names)
                    if has_id_col and has_count_col and len(col_names) == 2:
                        print(f"Skipped ID count table in {sheet} (table_{idx})")
                        continue

                csv_path = sheet_out / f"table_{idx}.csv"
                block.to_csv(csv_path, index=False)
                print(f"Saved {csv_path} ({block.shape[0]} rows, {block.shape[1]} cols)")
    finally:
        # Ensure ExcelFile is closed to unlock the file (important on Windows)
        if xls is not None:
            xls.close()

if __name__ == "__main__":
    extract_tables(r"C:\Users\Lenovo\Desktop\dattu\New\medical_firstaid_database.xlsx")
