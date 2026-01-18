import pandas as pd
from io import BytesIO

def extract_excel_text(file_bytes):
    xls = pd.ExcelFile(BytesIO(file_bytes))
    data = ""

    for sheet in xls.sheet_names:
        df = xls.parse(sheet)
        data += df.to_string() + "\n\n"

    return data
