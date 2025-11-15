"""
FastAPI application for Safety Data Analysis
Integrates extraction.py, phidata_agent.py, and charting.py
With JWT authentication and usage tracking
"""

from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
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

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Include authentication routes
app.include_router(auth_router)

# Base directory
BASE_DIR = Path(__file__).parent
EXCEL_PATH = BASE_DIR / "sample.xlsx"
PTW_EXCEL_PATH = BASE_DIR / "ptw&kpi.xlsx"
INSPECTIONS_EXCEL_PATH = BASE_DIR / "inspections_audit_database.xlsx"
MEDICAL_EXCEL_PATH = BASE_DIR / "medical_records_database.xlsx"
DATA_DIR = BASE_DIR / "Generated"
EXTRACTED_DIR = DATA_DIR / "extracted_tables"
REPORT_PATH = DATA_DIR / "report.md"
PTW_REPORT_PATH = DATA_DIR / "ptw_report.md"
INSPECTIONS_REPORT_PATH = DATA_DIR / "inspections_report.md"
MEDICAL_REPORT_PATH = DATA_DIR / "medical_report.md"
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
            "safety_data": {
                "upload_excel": "/upload",
                "generate_report": "/generate-report",
                "generate_charts": "/generate-charts",
                "get_report": "/report",
                "list_charts": "/charts"
            },
            "ptw_kpi": {
                "upload_ptw": "/upload-ptw",
                "generate_ptw_report": "/generate-ptw-report",
                "generate_ptw_charts": "/generate-ptw-charts",
                "get_ptw_report": "/ptw-report",
                "list_ptw_charts": "/ptw-charts"
            },
            "inspections_audit": {
                "upload_inspections": "/upload-inspections",
                "generate_inspections_report": "/generate-inspections-report",
                "generate_inspections_charts": "/generate-inspections-charts",
                "get_inspections_report": "/inspections-report",
                "list_inspections_charts": "/inspections-charts"
            },
            "medical_records": {
                "upload_medical": "/upload-medical",
                "generate_medical_report": "/generate-medical-report",
                "generate_medical_charts": "/generate-medical-charts",
                "get_medical_report": "/medical-report",
                "list_medical_charts": "/medical-charts"
            },
            "status": "/status"
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


@app.post("/upload-ptw")
async def upload_ptw_excel(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_active_user)
):
    """
    Upload ptw&kpi.xlsx file and extract tables.
    Requires authentication.
    
    Expected file name: ptw&kpi.xlsx (or any .xlsx file with PTW/KPI data)
    """
    start_time = time.time()
    user_id = str(current_user["_id"])
    endpoint = "/upload-ptw"
    
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
        
        # Save uploaded file as ptw&kpi.xlsx
        file_path = BASE_DIR / "ptw&kpi.xlsx"
        
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
            "message": "PTW/KPI file uploaded and tables extracted successfully",
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
            error_message="PTW upload failed"
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
        raise HTTPException(status_code=500, detail=f"Error processing PTW file: {str(e)}")


@app.post("/generate-ptw-report")
async def generate_ptw_report(
    current_user: dict = Depends(get_current_active_user)
):
    """
    Generate PTW/KPI analysis report using phidata_agent.
    Requires authentication and extracted PTW tables to exist (upload PTW Excel file first).
    """
    start_time = time.time()
    user_id = str(current_user["_id"])
    endpoint = "/generate-ptw-report"
    
    try:
        # Check rate limits
        await check_rate_limit(current_user)
        
        # Check if PTW extracted tables exist
        ptw_records_path = EXTRACTED_DIR / "PTW_Records" / "table_1.csv"
        ptw_kpis_path = EXTRACTED_DIR / "PTW_KPIs_By_Area" / "table_1.csv"
        
        if not ptw_records_path.exists() or not ptw_kpis_path.exists():
            raise HTTPException(
                status_code=400,
                detail="PTW/KPI extracted tables not found. Please upload ptw&kpi.xlsx first."
            )
        
        # Step 1: Summarize numeric data (only PTW-related tables)
        ptw_tables_dir = EXTRACTED_DIR
        numeric_summary = phidata_agent.summarize_numeric_data(ptw_tables_dir)
        
        # Filter to only PTW-related summaries
        ptw_summary = [s for s in numeric_summary if 'PTW' in s]
        
        if not ptw_summary:
            raise HTTPException(
                status_code=400,
                detail="No PTW/KPI data found in extracted tables."
            )
        
        # Step 2: Create PTW analysis prompt
        prompt = phidata_agent.create_ptw_analysis_prompt(ptw_summary)
        
        # Step 3: Generate report with Gemini
        report_content = phidata_agent.generate_ptw_report_with_gemini(prompt)
        
        # Step 4: Save report
        phidata_agent.save_ptw_report(report_content, PTW_REPORT_PATH)
        
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
            "message": "PTW/KPI report generated successfully",
            "report_path": str(PTW_REPORT_PATH),
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
            error_message="PTW report generation failed"
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
        raise HTTPException(status_code=500, detail=f"Error generating PTW report: {str(e)}")


@app.post("/generate-ptw-charts")
async def generate_ptw_charts(
    current_user: dict = Depends(get_current_active_user)
):
    """
    Generate all PTW/KPI analysis charts using charting.py.
    Requires authentication and extracted PTW tables to exist (upload PTW Excel file first).
    """
    start_time = time.time()
    user_id = str(current_user["_id"])
    endpoint = "/generate-ptw-charts"
    
    try:
        # Check rate limits
        await check_rate_limit(current_user)
        
        # Check if PTW extracted tables exist
        ptw_records_path = EXTRACTED_DIR / "PTW_Records" / "table_1.csv"
        ptw_kpis_path = EXTRACTED_DIR / "PTW_KPIs_By_Area" / "table_1.csv"
        
        if not ptw_records_path.exists() or not ptw_kpis_path.exists():
            raise HTTPException(
                status_code=400,
                detail="PTW/KPI extracted tables not found. Please upload ptw&kpi.xlsx first."
            )
        
        # Change to the base directory to ensure relative paths work
        original_cwd = os.getcwd()
        try:
            os.chdir(BASE_DIR)
            
            # Import charting module now that we're in the right directory
            import services.charting as charting
            import importlib
            importlib.reload(charting)
            
            # Update charts directory path
            charting.charts_dir = str(CHARTS_DIR)
            
            # Generate all PTW charts
            charting.create_all_ptw_charts()
            
        finally:
            os.chdir(original_cwd)
        
        # List generated PTW charts
        ptw_chart_files = list(CHARTS_DIR.glob("ptw_*.html"))
        
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
            "message": "PTW/KPI charts generated successfully",
            "charts_dir": str(CHARTS_DIR),
            "charts_generated": len(ptw_chart_files),
            "chart_files": [f.name for f in ptw_chart_files]
        }
    
    except HTTPException:
        response_time = time.time() - start_time
        await track_api_usage(
            user_id=user_id,
            endpoint=endpoint,
            method="POST",
            status_code=400,
            response_time=response_time,
            error_message="PTW chart generation failed"
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
        raise HTTPException(status_code=500, detail=f"Error generating PTW charts: {str(e)}")


@app.get("/ptw-report")
async def get_ptw_report(
    current_user: dict = Depends(get_current_active_user)
):
    """Get the generated PTW/KPI report file. Requires authentication."""
    start_time = time.time()
    user_id = str(current_user["_id"])
    endpoint = "/ptw-report"
    
    if not PTW_REPORT_PATH.exists():
        response_time = time.time() - start_time
        await track_api_usage(
            user_id=user_id,
            endpoint=endpoint,
            method="GET",
            status_code=404,
            response_time=response_time,
            error_message="PTW report not found"
        )
        raise HTTPException(status_code=404, detail="PTW report not found. Please generate PTW report first.")
    
    response_time = time.time() - start_time
    await track_api_usage(
        user_id=user_id,
        endpoint=endpoint,
        method="GET",
        status_code=200,
        response_time=response_time
    )
    
    return FileResponse(
        path=PTW_REPORT_PATH,
        filename="ptw_report.md",
        media_type="text/markdown"
    )


@app.get("/ptw-charts")
async def list_ptw_charts(
    current_user: dict = Depends(get_current_active_user)
):
    """List all generated PTW/KPI chart files. Requires authentication."""
    start_time = time.time()
    user_id = str(current_user["_id"])
    endpoint = "/ptw-charts"
    
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
    
    ptw_chart_files = list(CHARTS_DIR.glob("ptw_*.html"))
    
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
        "total_ptw_charts": len(ptw_chart_files),
        "charts": [{"name": f.name, "path": str(f)} for f in ptw_chart_files]
    }


@app.get("/status")
async def get_status(
    current_user: dict = Depends(get_current_active_user)
):
    """Get the current status of extracted data, reports, and charts. Requires authentication."""
    start_time = time.time()
    user_id = str(current_user["_id"])
    endpoint = "/status"
    
    status_info = {
        "safety_data": {
            "excel_file_exists": EXCEL_PATH.exists(),
            "extracted_tables_exist": EXTRACTED_DIR.exists() and any(EXTRACTED_DIR.rglob("table_*.csv")),
            "report_exists": REPORT_PATH.exists(),
            "charts_exist": CHARTS_DIR.exists() and any(CHARTS_DIR.glob("*.html"))
        },
        "ptw_kpi": {
            "ptw_excel_file_exists": PTW_EXCEL_PATH.exists(),
            "ptw_tables_exist": (
                (EXTRACTED_DIR / "PTW_Records" / "table_1.csv").exists() and
                (EXTRACTED_DIR / "PTW_KPIs_By_Area" / "table_1.csv").exists()
            ),
            "ptw_report_exists": PTW_REPORT_PATH.exists(),
            "ptw_charts_exist": CHARTS_DIR.exists() and any(CHARTS_DIR.glob("ptw_*.html"))
        },
        "inspections_audit": {
            "inspections_excel_file_exists": INSPECTIONS_EXCEL_PATH.exists(),
            "inspections_tables_exist": (
                (EXTRACTED_DIR / "Inspections" / "table_1.csv").exists() and
                (EXTRACTED_DIR / "Top_Recurring_Failures" / "table_1.csv").exists()
            ),
            "inspections_report_exists": INSPECTIONS_REPORT_PATH.exists(),
            "inspections_charts_exist": CHARTS_DIR.exists() and any(CHARTS_DIR.glob("insp_*.html"))
        },
        "medical_records": {
            "medical_excel_file_exists": MEDICAL_EXCEL_PATH.exists(),
            "medical_tables_exist": (
                (EXTRACTED_DIR / "Medical_Records" / "table_1.csv").exists() and
                (EXTRACTED_DIR / "Medical_KPIs" / "table_1.csv").exists()
            ),
            "medical_report_exists": MEDICAL_REPORT_PATH.exists(),
            "medical_charts_exist": CHARTS_DIR.exists() and any(CHARTS_DIR.glob("medical_*.html"))
        }
    }
    
    if status_info["safety_data"]["extracted_tables_exist"]:
        csv_files = list(EXTRACTED_DIR.rglob("table_*.csv"))
        status_info["safety_data"]["extracted_tables_count"] = len(csv_files)
    
    if status_info["safety_data"]["charts_exist"]:
        chart_files = list(CHARTS_DIR.glob("*.html"))
        safety_charts = [f for f in chart_files if not f.name.startswith("ptw_") and not f.name.startswith("insp_") and not f.name.startswith("medical_")]
        status_info["safety_data"]["charts_count"] = len(safety_charts)
    
    if status_info["ptw_kpi"]["ptw_charts_exist"]:
        ptw_chart_files = list(CHARTS_DIR.glob("ptw_*.html"))
        status_info["ptw_kpi"]["ptw_charts_count"] = len(ptw_chart_files)
    
    if status_info["inspections_audit"]["inspections_charts_exist"]:
        inspections_chart_files = list(CHARTS_DIR.glob("insp_*.html"))
        status_info["inspections_audit"]["inspections_charts_count"] = len(inspections_chart_files)
    
    if status_info["medical_records"]["medical_charts_exist"]:
        medical_chart_files = list(CHARTS_DIR.glob("medical_*.html"))
        status_info["medical_records"]["medical_charts_count"] = len(medical_chart_files)
    
    response_time = time.time() - start_time
    await track_api_usage(
        user_id=user_id,
        endpoint=endpoint,
        method="GET",
        status_code=200,
        response_time=response_time
    )
    
    return status_info


@app.post("/upload-inspections")
async def upload_inspections_excel(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_active_user)
):
    """
    Upload inspections_audit_database.xlsx file and extract tables.
    Requires authentication.
    
    Expected file name: inspections_audit_database.xlsx (or any .xlsx file with inspections/audit data)
    """
    start_time = time.time()
    user_id = str(current_user["_id"])
    endpoint = "/upload-inspections"
    
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
        
        # Save uploaded file as inspections_audit_database.xlsx
        file_path = BASE_DIR / "inspections_audit_database.xlsx"
        
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
            "message": "Inspections/Audit file uploaded and tables extracted successfully",
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
            error_message="Inspections upload failed"
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
        raise HTTPException(status_code=500, detail=f"Error processing Inspections file: {str(e)}")


@app.post("/generate-inspections-report")
async def generate_inspections_report(
    current_user: dict = Depends(get_current_active_user)
):
    """
    Generate Inspections/Audit analysis report using phidata_agent.
    Requires authentication and extracted inspections tables to exist (upload inspections Excel file first).
    """
    start_time = time.time()
    user_id = str(current_user["_id"])
    endpoint = "/generate-inspections-report"
    
    try:
        # Check rate limits
        await check_rate_limit(current_user)
        
        # Check if inspections extracted tables exist
        inspections_path = EXTRACTED_DIR / "Inspections" / "table_1.csv"
        recurring_failures_path = EXTRACTED_DIR / "Top_Recurring_Failures" / "table_1.csv"
        
        if not inspections_path.exists():
            raise HTTPException(
                status_code=400,
                detail="Inspections/Audit extracted tables not found. Please upload inspections_audit_database.xlsx first."
            )
        
        # Step 1: Summarize numeric data (only inspections-related tables)
        inspections_tables_dir = EXTRACTED_DIR
        numeric_summary = phidata_agent.summarize_numeric_data(inspections_tables_dir)
        
        # Filter to only inspections-related summaries
        inspections_summary = [s for s in numeric_summary if any(keyword in s for keyword in ['Inspections', 'Recurring', 'Top_Recurring'])]
        
        if not inspections_summary:
            raise HTTPException(
                status_code=400,
                detail="No Inspections/Audit data found in extracted tables."
            )
        
        # Step 2: Create inspections analysis prompt
        prompt = phidata_agent.create_inspections_analysis_prompt(inspections_summary)
        
        # Step 3: Generate report with Gemini
        report_content = phidata_agent.generate_inspections_report_with_gemini(prompt)
        
        # Step 4: Save report
        phidata_agent.save_inspections_report(report_content, INSPECTIONS_REPORT_PATH)
        
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
            "message": "Inspections/Audit report generated successfully",
            "report_path": str(INSPECTIONS_REPORT_PATH),
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
            error_message="Inspections report generation failed"
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
        raise HTTPException(status_code=500, detail=f"Error generating Inspections report: {str(e)}")


@app.post("/generate-inspections-charts")
async def generate_inspections_charts(
    current_user: dict = Depends(get_current_active_user)
):
    """
    Generate all Inspections/Audit analysis charts using charting.py.
    Requires authentication and extracted inspections tables to exist (upload inspections Excel file first).
    """
    start_time = time.time()
    user_id = str(current_user["_id"])
    endpoint = "/generate-inspections-charts"
    
    try:
        # Check rate limits
        await check_rate_limit(current_user)
        
        # Check if inspections extracted tables exist
        inspections_path = EXTRACTED_DIR / "Inspections" / "table_1.csv"
        
        if not inspections_path.exists():
            raise HTTPException(
                status_code=400,
                detail="Inspections/Audit extracted tables not found. Please upload inspections_audit_database.xlsx first."
            )
        
        # Change to the base directory to ensure relative paths work
        original_cwd = os.getcwd()
        try:
            os.chdir(BASE_DIR)
            
            # Import charting module now that we're in the right directory
            import services.charting as charting
            import importlib
            importlib.reload(charting)
            
            # Update charts directory path
            charting.charts_dir = str(CHARTS_DIR)
            
            # Generate all inspections charts
            charting.create_all_inspections_charts()
            
        finally:
            os.chdir(original_cwd)
        
        # List generated inspections charts
        inspections_chart_files = list(CHARTS_DIR.glob("insp_*.html"))
        
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
            "message": "Inspections/Audit charts generated successfully",
            "charts_dir": str(CHARTS_DIR),
            "charts_generated": len(inspections_chart_files),
            "chart_files": [f.name for f in inspections_chart_files]
        }
    
    except HTTPException:
        response_time = time.time() - start_time
        await track_api_usage(
            user_id=user_id,
            endpoint=endpoint,
            method="POST",
            status_code=400,
            response_time=response_time,
            error_message="Inspections chart generation failed"
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
        raise HTTPException(status_code=500, detail=f"Error generating Inspections charts: {str(e)}")


@app.get("/inspections-report")
async def get_inspections_report(
    current_user: dict = Depends(get_current_active_user)
):
    """Get the generated Inspections/Audit report file. Requires authentication."""
    start_time = time.time()
    user_id = str(current_user["_id"])
    endpoint = "/inspections-report"
    
    if not INSPECTIONS_REPORT_PATH.exists():
        response_time = time.time() - start_time
        await track_api_usage(
            user_id=user_id,
            endpoint=endpoint,
            method="GET",
            status_code=404,
            response_time=response_time,
            error_message="Inspections report not found"
        )
        raise HTTPException(status_code=404, detail="Inspections report not found. Please generate Inspections report first.")
    
    response_time = time.time() - start_time
    await track_api_usage(
        user_id=user_id,
        endpoint=endpoint,
        method="GET",
        status_code=200,
        response_time=response_time
    )
    
    return FileResponse(
        path=INSPECTIONS_REPORT_PATH,
        filename="inspections_report.md",
        media_type="text/markdown"
    )


@app.get("/inspections-charts")
async def list_inspections_charts(
    current_user: dict = Depends(get_current_active_user)
):
    """List all generated Inspections/Audit chart files. Requires authentication."""
    start_time = time.time()
    user_id = str(current_user["_id"])
    endpoint = "/inspections-charts"
    
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
    
    inspections_chart_files = list(CHARTS_DIR.glob("insp_*.html"))
    
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
        "total_inspections_charts": len(inspections_chart_files),
        "charts": [{"name": f.name, "path": str(f)} for f in inspections_chart_files]
    }


@app.post("/upload-medical")
async def upload_medical_excel(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_active_user)
):
    """
    Upload medical_records_database.xlsx file and extract tables.
    Requires authentication.
    
    Expected file name: medical_records_database.xlsx (or any .xlsx file with medical records data)
    """
    start_time = time.time()
    user_id = str(current_user["_id"])
    endpoint = "/upload-medical"
    
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
        
        # Save uploaded file as medical_records_database.xlsx
        file_path = BASE_DIR / "medical_records_database.xlsx"
        
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
            "message": "Medical Records file uploaded and tables extracted successfully",
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
            error_message="Medical upload failed"
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
        raise HTTPException(status_code=500, detail=f"Error processing Medical file: {str(e)}")


@app.post("/generate-medical-report")
async def generate_medical_report(
    current_user: dict = Depends(get_current_active_user)
):
    """
    Generate Medical Records analysis report using phidata_agent.
    Requires authentication and extracted medical tables to exist (upload medical Excel file first).
    """
    start_time = time.time()
    user_id = str(current_user["_id"])
    endpoint = "/generate-medical-report"
    
    try:
        # Check rate limits
        await check_rate_limit(current_user)
        
        # Check if medical extracted tables exist
        medical_records_path = EXTRACTED_DIR / "Medical_Records" / "table_1.csv"
        medical_kpis_path = EXTRACTED_DIR / "Medical_KPIs" / "table_1.csv"
        
        if not medical_records_path.exists():
            raise HTTPException(
                status_code=400,
                detail="Medical Records extracted tables not found. Please upload medical_records_database.xlsx first."
            )
        
        # Step 1: Summarize numeric data (only medical-related tables)
        medical_tables_dir = EXTRACTED_DIR
        numeric_summary = phidata_agent.summarize_numeric_data(medical_tables_dir)
        
        # Filter to only medical-related summaries
        medical_summary = [s for s in numeric_summary if any(keyword in s for keyword in ['Medical', 'Medical_Records', 'Medical_KPIs'])]
        
        if not medical_summary:
            raise HTTPException(
                status_code=400,
                detail="No Medical Records data found in extracted tables."
            )
        
        # Step 2: Create medical analysis prompt
        prompt = phidata_agent.create_medical_analysis_prompt(medical_summary)
        
        # Step 3: Generate report with Gemini
        report_content = phidata_agent.generate_medical_report_with_gemini(prompt)
        
        # Step 4: Save report
        phidata_agent.save_medical_report(report_content, MEDICAL_REPORT_PATH)
        
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
            "message": "Medical Records report generated successfully",
            "report_path": str(MEDICAL_REPORT_PATH),
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
            error_message="Medical report generation failed"
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
        raise HTTPException(status_code=500, detail=f"Error generating Medical report: {str(e)}")


@app.post("/generate-medical-charts")
async def generate_medical_charts(
    current_user: dict = Depends(get_current_active_user)
):
    """
    Generate all Medical Records analysis charts using charting.py.
    Requires authentication and extracted medical tables to exist (upload medical Excel file first).
    """
    start_time = time.time()
    user_id = str(current_user["_id"])
    endpoint = "/generate-medical-charts"
    
    try:
        # Check rate limits
        await check_rate_limit(current_user)
        
        # Check if medical extracted tables exist
        medical_records_path = EXTRACTED_DIR / "Medical_Records" / "table_1.csv"
        
        if not medical_records_path.exists():
            raise HTTPException(
                status_code=400,
                detail="Medical Records extracted tables not found. Please upload medical_records_database.xlsx first."
            )
        
        # Change to the base directory to ensure relative paths work
        original_cwd = os.getcwd()
        try:
            os.chdir(BASE_DIR)
            
            # Import charting module now that we're in the right directory
            import services.charting as charting
            import importlib
            importlib.reload(charting)
            
            # Update charts directory path
            charting.charts_dir = str(CHARTS_DIR)
            
            # Generate all medical charts
            charting.create_all_medical_charts()
            
        finally:
            os.chdir(original_cwd)
        
        # List generated medical charts
        medical_chart_files = list(CHARTS_DIR.glob("medical_*.html"))
        
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
            "message": "Medical Records charts generated successfully",
            "charts_dir": str(CHARTS_DIR),
            "charts_generated": len(medical_chart_files),
            "chart_files": [f.name for f in medical_chart_files]
        }
    
    except HTTPException:
        response_time = time.time() - start_time
        await track_api_usage(
            user_id=user_id,
            endpoint=endpoint,
            method="POST",
            status_code=400,
            response_time=response_time,
            error_message="Medical chart generation failed"
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
        raise HTTPException(status_code=500, detail=f"Error generating Medical charts: {str(e)}")


@app.get("/medical-report")
async def get_medical_report(
    current_user: dict = Depends(get_current_active_user)
):
    """Get the generated Medical Records report file. Requires authentication."""
    start_time = time.time()
    user_id = str(current_user["_id"])
    endpoint = "/medical-report"
    
    if not MEDICAL_REPORT_PATH.exists():
        response_time = time.time() - start_time
        await track_api_usage(
            user_id=user_id,
            endpoint=endpoint,
            method="GET",
            status_code=404,
            response_time=response_time,
            error_message="Medical report not found"
        )
        raise HTTPException(status_code=404, detail="Medical report not found. Please generate Medical report first.")
    
    response_time = time.time() - start_time
    await track_api_usage(
        user_id=user_id,
        endpoint=endpoint,
        method="GET",
        status_code=200,
        response_time=response_time
    )
    
    return FileResponse(
        path=MEDICAL_REPORT_PATH,
        filename="medical_report.md",
        media_type="text/markdown"
    )


@app.get("/medical-charts")
async def list_medical_charts(
    current_user: dict = Depends(get_current_active_user)
):
    """List all generated Medical Records chart files. Requires authentication."""
    start_time = time.time()
    user_id = str(current_user["_id"])
    endpoint = "/medical-charts"
    
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
    
    medical_chart_files = list(CHARTS_DIR.glob("medical_*.html"))
    
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
        "total_medical_charts": len(medical_chart_files),
        "charts": [{"name": f.name, "path": str(f)} for f in medical_chart_files]
    }


if __name__ == "__main__":
    import uvicorn
    import os
    from dotenv import load_dotenv
    
    load_dotenv()
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8000))
    
    uvicorn.run(app, host=host, port=port)

