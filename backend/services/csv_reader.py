import pandas as pd
from io import BytesIO

def extract_csv_text(file_bytes):
    df = pd.read_csv(BytesIO(file_bytes))
    return df.to_string()
