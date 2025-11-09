"""
FastAPI application for Safety Data Analysis
Integrates extraction.py, phidata_agent.py, and charting.py
With JWT authentication and usage tracking
"""

from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.responses import FileResponse
from pathlib import Path
import shutil
import os
import time
from contextlib import asynccontextmanager
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Assign GOOGLE_API_KEY from environment
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

# Import our modules
from services.extraction import extract_tables
import services.phidata_agent as phidata_agent
# Charting will be imported conditionally to avoid loading data at import time

# Import authentication modules
from auth.database import connect_to_mongo, close_mongo_connection
from auth.dependencies import get_current_active_user, track_api_usage
from auth.rate_limiter import check_rate_limit, check_file_size_limit
from auth.routes import router as auth_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown events"""
    # Startup
    await connect_to_mongo()
    yield
    # Shutdown
    await close_mongo_connection()


app = FastAPI(
    title="Safety Data Analysis API",
    version="2.0.0",
    description="Safety Data Analysis API with JWT Authentication",
    lifespan=lifespan
)

# Include authentication routes
app.include_router(auth_router)

# Base directory
BASE_DIR = Path(__file__).parent
EXCEL_PATH = BASE_DIR / "sample.xlsx"
DATA_DIR = BASE_DIR / "Generated"
EXTRACTED_DIR = DATA_DIR / "extracted_tables"
REPORT_PATH = DATA_DIR / "report.md"
CHARTS_DIR = DATA_DIR / "charts"

# Ensure directories exist
DATA_DIR.mkdir(exist_ok=True)
EXTRACTED_DIR.mkdir(exist_ok=True)
CHARTS_DIR.mkdir(exist_ok=True)


@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "message": "Safety Data Analysis API",
        "endpoints": {
            "upload_excel": "/upload",
            "generate_report": "/generate-report",
            "generate_charts": "/generate-charts",
            "get_report": "/report",
            "list_charts": "/charts"
        }
    }


@app.post("/upload")
async def upload_excel(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_active_user)
):
    """
    Upload sample.xlsx file and extract tables.
    Requires authentication.
    
    Expected file name: sample.xlsx
    """
    start_time = time.time()
    user_id = str(current_user["_id"])
    endpoint = "/upload"
    
    try:
        # Check rate limits
        await check_rate_limit(current_user)
        
        # Validate file extension
        if not file.filename.endswith('.xlsx'):
            raise HTTPException(status_code=400, detail="File must be a .xlsx file")
        
        # Read file to get size
        file_content = await file.read()
        file_size = len(file_content)
        
        # Check file size limit
        await check_file_size_limit(current_user, file_size)
        
        # Save uploaded file as sample.xlsx
        file_path = BASE_DIR / "sample.xlsx"
        
        with open(file_path, "wb") as buffer:
            buffer.write(file_content)
        
        # Extract tables from the Excel file
        extract_tables(str(file_path))
        
        response_time = time.time() - start_time
        
        # Track API usage
        await track_api_usage(
            user_id=user_id,
            endpoint=endpoint,
            method="POST",
            status_code=200,
            response_time=response_time,
            file_size=file_size
        )
        
        return {
            "message": "File uploaded and tables extracted successfully",
            "filename": file.filename,
            "extracted_tables_dir": str(EXTRACTED_DIR),
            "file_size": file_size
        }
    
    except HTTPException:
        response_time = time.time() - start_time
        await track_api_usage(
            user_id=user_id,
            endpoint=endpoint,
            method="POST",
            status_code=400,
            response_time=response_time,
            file_size=0,
            error_message="Upload failed"
        )
        raise
    except Exception as e:
        response_time = time.time() - start_time
        await track_api_usage(
            user_id=user_id,
            endpoint=endpoint,
            method="POST",
            status_code=500,
            response_time=response_time,
            file_size=0,
            error_message=str(e)
        )
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")


@app.post("/generate-report")
async def generate_report(
    current_user: dict = Depends(get_current_active_user)
):
    """
    Generate safety analysis report using phidata_agent.
    Requires authentication and extracted tables to exist (upload Excel file first).
    """
    start_time = time.time()
    user_id = str(current_user["_id"])
    endpoint = "/generate-report"
    
    try:
        # Check rate limits
        await check_rate_limit(current_user)
        
        # Check if extracted tables exist
        if not EXTRACTED_DIR.exists() or not any(EXTRACTED_DIR.rglob("table_*.csv")):
            raise HTTPException(
                status_code=400,
                detail="No extracted tables found. Please upload sample.xlsx first."
            )
        
        # Step 1: Summarize numeric data
        numeric_summary = phidata_agent.summarize_numeric_data(EXTRACTED_DIR)
        
        if not numeric_summary:
            raise HTTPException(
                status_code=400,
                detail="No data found in extracted tables."
            )
        
        # Step 2: Create analysis prompt
        prompt = phidata_agent.create_analysis_prompt(numeric_summary)
        
        # Step 3: Generate report with Gemini
        report_content = phidata_agent.generate_report_with_gemini(prompt)
        
        # Step 4: Save report
        phidata_agent.save_report(report_content, REPORT_PATH)
        
        response_time = time.time() - start_time
        
        # Track API usage
        await track_api_usage(
            user_id=user_id,
            endpoint=endpoint,
            method="POST",
            status_code=200,
            response_time=response_time
        )
        
        return {
            "message": "Report generated successfully",
            "report_path": str(REPORT_PATH),
            "report_length": len(report_content)
        }
    
    except HTTPException:
        response_time = time.time() - start_time
        await track_api_usage(
            user_id=user_id,
            endpoint=endpoint,
            method="POST",
            status_code=400,
            response_time=response_time,
            error_message="Report generation failed"
        )
        raise
    except Exception as e:
        response_time = time.time() - start_time
        await track_api_usage(
            user_id=user_id,
            endpoint=endpoint,
            method="POST",
            status_code=500,
            response_time=response_time,
            error_message=str(e)
        )
        raise HTTPException(status_code=500, detail=f"Error generating report: {str(e)}")


@app.post("/generate-charts")
async def generate_charts(
    current_user: dict = Depends(get_current_active_user)
):
    """
    Generate all safety analysis charts using charting.py.
    Requires authentication and extracted tables to exist (upload Excel file first).
    """
    start_time = time.time()
    user_id = str(current_user["_id"])
    endpoint = "/generate-charts"
    
    try:
        # Check rate limits
        await check_rate_limit(current_user)
        
        # Check if extracted tables exist
        if not EXTRACTED_DIR.exists():
            raise HTTPException(
                status_code=400,
                detail="No extracted tables found. Please upload sample.xlsx first."
            )
        
        # Check if required CSV files exist
        required_files = [
            EXTRACTED_DIR / "Employees" / "table_1.csv",
            EXTRACTED_DIR / "Observations" / "table_1.csv",
            EXTRACTED_DIR / "Incidents" / "table_1.csv",
            EXTRACTED_DIR / "NearMisses" / "table_1.csv"
        ]
        
        missing_files = [str(f) for f in required_files if not f.exists()]
        if missing_files:
            raise HTTPException(
                status_code=400,
                detail=f"Missing required data files: {', '.join(missing_files)}"
            )
        
        # Load data and prepare for charting
        import pandas as pd
        import warnings
        warnings.filterwarnings('ignore')
        
        # Change to the base directory to ensure relative paths work
        original_cwd = os.getcwd()
        try:
            os.chdir(BASE_DIR)
            
            # Import charting module now that we're in the right directory
            # This will load the data from CSV files
            import services.charting as charting
            import importlib
            importlib.reload(charting)
            
            # Update charts directory path
            charting.charts_dir = str(CHARTS_DIR)
            
            # Generate all charts
            charting.create_trend_analysis()
            charting.create_location_heatmap()
            charting.create_risk_analysis()
            charting.create_department_analysis()
            charting.create_shift_analysis()
            charting.create_timeline_analysis()
            
        finally:
            os.chdir(original_cwd)
        
        # List generated charts
        chart_files = list(CHARTS_DIR.glob("*.html"))
        
        response_time = time.time() - start_time
        
        # Track API usage
        await track_api_usage(
            user_id=user_id,
            endpoint=endpoint,
            method="POST",
            status_code=200,
            response_time=response_time
        )
        
        return {
            "message": "Charts generated successfully",
            "charts_dir": str(CHARTS_DIR),
            "charts_generated": len(chart_files),
            "chart_files": [f.name for f in chart_files]
        }
    
    except HTTPException:
        response_time = time.time() - start_time
        await track_api_usage(
            user_id=user_id,
            endpoint=endpoint,
            method="POST",
            status_code=400,
            response_time=response_time,
            error_message="Chart generation failed"
        )
        raise
    except Exception as e:
        response_time = time.time() - start_time
        await track_api_usage(
            user_id=user_id,
            endpoint=endpoint,
            method="POST",
            status_code=500,
            response_time=response_time,
            error_message=str(e)
        )
        raise HTTPException(status_code=500, detail=f"Error generating charts: {str(e)}")


@app.get("/report")
async def get_report(
    current_user: dict = Depends(get_current_active_user)
):
    """Get the generated report file. Requires authentication."""
    start_time = time.time()
    user_id = str(current_user["_id"])
    endpoint = "/report"
    
    if not REPORT_PATH.exists():
        response_time = time.time() - start_time
        await track_api_usage(
            user_id=user_id,
            endpoint=endpoint,
            method="GET",
            status_code=404,
            response_time=response_time,
            error_message="Report not found"
        )
        raise HTTPException(status_code=404, detail="Report not found. Please generate report first.")
    
    response_time = time.time() - start_time
    await track_api_usage(
        user_id=user_id,
        endpoint=endpoint,
        method="GET",
        status_code=200,
        response_time=response_time
    )
    
    return FileResponse(
        path=REPORT_PATH,
        filename="report.md",
        media_type="text/markdown"
    )


@app.get("/charts")
async def list_charts(
    current_user: dict = Depends(get_current_active_user)
):
    """List all generated chart files. Requires authentication."""
    start_time = time.time()
    user_id = str(current_user["_id"])
    endpoint = "/charts"
    
    if not CHARTS_DIR.exists():
        response_time = time.time() - start_time
        await track_api_usage(
            user_id=user_id,
            endpoint=endpoint,
            method="GET",
            status_code=200,
            response_time=response_time
        )
        return {"message": "Charts directory not found", "charts": []}
    
    chart_files = list(CHARTS_DIR.glob("*.html"))
    
    response_time = time.time() - start_time
    await track_api_usage(
        user_id=user_id,
        endpoint=endpoint,
        method="GET",
        status_code=200,
        response_time=response_time
    )
    
    return {
        "charts_dir": str(CHARTS_DIR),
        "total_charts": len(chart_files),
        "charts": [{"name": f.name, "path": str(f)} for f in chart_files]
    }


@app.get("/charts/{chart_name}")
async def get_chart(
    chart_name: str,
    current_user: dict = Depends(get_current_active_user)
):
    """Get a specific chart file by name. Requires authentication."""
    start_time = time.time()
    user_id = str(current_user["_id"])
    endpoint = f"/charts/{chart_name}"
    
    chart_path = CHARTS_DIR / chart_name
    
    if not chart_path.exists():
        response_time = time.time() - start_time
        await track_api_usage(
            user_id=user_id,
            endpoint=endpoint,
            method="GET",
            status_code=404,
            response_time=response_time,
            error_message=f"Chart '{chart_name}' not found"
        )
        raise HTTPException(status_code=404, detail=f"Chart '{chart_name}' not found")
    
    response_time = time.time() - start_time
    await track_api_usage(
        user_id=user_id,
        endpoint=endpoint,
        method="GET",
        status_code=200,
        response_time=response_time
    )
    
    return FileResponse(
        path=chart_path,
        filename=chart_name,
        media_type="text/html"
    )


@app.get("/status")
async def get_status(
    current_user: dict = Depends(get_current_active_user)
):
    """Get the current status of extracted data, reports, and charts. Requires authentication."""
    start_time = time.time()
    user_id = str(current_user["_id"])
    endpoint = "/status"
    
    status_info = {
        "excel_file_exists": EXCEL_PATH.exists(),
        "extracted_tables_exist": EXTRACTED_DIR.exists() and any(EXTRACTED_DIR.rglob("table_*.csv")),
        "report_exists": REPORT_PATH.exists(),
        "charts_exist": CHARTS_DIR.exists() and any(CHARTS_DIR.glob("*.html"))
    }
    
    if status_info["extracted_tables_exist"]:
        csv_files = list(EXTRACTED_DIR.rglob("table_*.csv"))
        status_info["extracted_tables_count"] = len(csv_files)
    
    if status_info["charts_exist"]:
        chart_files = list(CHARTS_DIR.glob("*.html"))
        status_info["charts_count"] = len(chart_files)
    
    response_time = time.time() - start_time
    await track_api_usage(
        user_id=user_id,
        endpoint=endpoint,
        method="GET",
        status_code=200,
        response_time=response_time
    )
    
    return status_info


if __name__ == "__main__":
    import uvicorn
    import os
    from dotenv import load_dotenv
    
    load_dotenv()
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8000))
    
    uvicorn.run(app, host=host, port=port)

