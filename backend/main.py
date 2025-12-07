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
import importlib
import pandas as pd
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from typing import Callable, Any

# Load environment variables from .env file
load_dotenv()

# Assign GOOGLE_API_KEY from environment
#GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
GROQ_API_KEY=os.getenv("GROQ_API_KEY")
print(GROQ_API_KEY)
# Import our modules
from services.extraction import extract_tables
import services.phidata_agent as phidata_agent
# Charting will be imported conditionally to avoid loading data at import time

# Import authentication modules
from auth.database import connect_to_mongo, close_mongo_connection
from auth.dependencies import get_current_active_user, track_api_usage
from auth.rate_limiter import check_rate_limit, check_file_size_limit
from auth.routes import router as auth_router
from services.dashboard import router as dashboard_router, persist_charting_kpis


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
app.include_router(dashboard_router)

# Base directory
BASE_DIR = Path(__file__).parent
DATA_DIR = BASE_DIR / "Generated"
EXTRACTED_DIR = DATA_DIR / "extracted_tables"
CHARTS_DIR = DATA_DIR / "charts"

# Ensure directories exist
DATA_DIR.mkdir(exist_ok=True)
EXTRACTED_DIR.mkdir(exist_ok=True)
CHARTS_DIR.mkdir(exist_ok=True)


async def _run_charting_and_capture(user_id: str, exec_fn: Callable[[Any], None]) -> None:
    """Helper to execute charting functions and persist captured KPI tables."""
    original_cwd = os.getcwd()
    kpi_payloads = {}
    try:
        os.chdir(BASE_DIR)
        import services.charting as charting_module
        importlib.reload(charting_module)
        charting_module.charts_dir = str(CHARTS_DIR)
        if hasattr(charting_module, "reset_kpi_registry"):
            charting_module.reset_kpi_registry()
        exec_fn(charting_module)
        if hasattr(charting_module, "get_kpi_registry"):
            kpi_payloads = charting_module.get_kpi_registry()
    finally:
        os.chdir(original_cwd)

    if kpi_payloads:
        await persist_charting_kpis(user_id, kpi_payloads)


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
                "list_charts": "/charts"
            },
            "ptw_kpi": {
                "upload_ptw": "/upload-ptw",
                "generate_ptw_report": "/generate-ptw-report",
                "generate_ptw_charts": "/generate-ptw-charts",
                "list_ptw_charts": "/ptw-charts"
            },
            "inspections_audit": {
                "upload_inspections": "/upload-inspections",
                "generate_inspections_report": "/generate-inspections-report",
                "generate_inspections_charts": "/generate-inspections-charts",
                "list_inspections_charts": "/inspections-charts"
            },
            "medical_records": {
                "upload_medical": "/upload-medical",
                "generate_medical_report": "/generate-medical-report",
                "generate_medical_charts": "/generate-medical-charts",
                "list_medical_charts": "/medical-charts"
            },
            "training_database": {
                "upload_training": "/upload-training",
                "generate_training_report": "/generate-training-report",
                "generate_training_charts": "/generate-training-charts",
                "list_training_charts": "/training-charts"
            },
            "ppe_assets": {
                "upload_ppe": "/upload-ppe",
                "generate_ppe_report": "/generate-ppe-report",
                "generate_ppe_charts": "/generate-ppe-charts",
                "list_ppe_charts": "/ppe-charts"
            },
            "corrective_actions_rca": {
                "upload_rca": "/upload-rca",
                "generate_rca_report": "/generate-rca-report",
                "generate_rca_charts": "/generate-rca-charts",
                "list_rca_charts": "/rca-charts"
            },
            "environmental_resource_use": {
                "upload_environmental": "/upload-environmental",
                "generate_environmental_report": "/generate-environmental-report",
                "generate_environmental_charts": "/generate-environmental-charts",
                "list_environmental_charts": "/environmental-charts"
            },
            "social_governance": {
                "upload_social_governance": "/upload-social-governance",
                "generate_social_governance_report": "/generate-social-governance-report",
                "generate_social_governance_charts": "/generate-social-governance-charts",
                "list_social_governance_charts": "/social-governance-charts"
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
        
        # Extract tables directly from the uploaded Excel content
        extract_tables(file_content, output_dir=EXTRACTED_DIR)
        
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
        
        response_time = time.time() - start_time
        
        # Track API usage
        usage_stats = await track_api_usage(
            user_id=user_id,
            endpoint=endpoint,
            method="POST",
            status_code=200,
            response_time=response_time,
            deduct_api_call=True
        )
        
        return {
            "message": "Report generated successfully",
            "report_length": len(report_content),
            "report_content": report_content,
            "api_calls_limit": usage_stats["api_calls_limit"] if usage_stats else None
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
        
        def _run_safety_charts(charting_module: Any) -> None:
            charting_module.create_safety_kpi_dashboard()
            charting_module.create_trend_analysis()
            charting_module.create_location_heatmap()
            charting_module.create_risk_analysis()
            charting_module.create_department_analysis()
            charting_module.create_shift_analysis()
            charting_module.create_timeline_analysis()

        await _run_charting_and_capture(user_id, _run_safety_charts)
        
        # List only safety (non-prefixed) charts similar to other chart endpoints
        chart_files = [
            f for f in CHARTS_DIR.glob("*.html")
            if not (
                f.name.startswith("ptw_")
                or f.name.startswith("insp_")
                or f.name.startswith("medical_")
                or f.name.startswith("training_")
                or f.name.startswith("ppe_")
                or f.name.startswith("rca_")
                or f.name.startswith("env_")
                or f.name.startswith("social_")
            )
        ]
        
        response_time = time.time() - start_time
        
        # Track API usage
        usage_stats = await track_api_usage(
            user_id=user_id,
            endpoint=endpoint,
            method="POST",
            status_code=200,
            response_time=response_time,
            deduct_api_call=True
        )
        
        return {
            "message": "Charts generated successfully",
            "charts_dir": str(CHARTS_DIR),
            "charts_generated": len(chart_files),
            "chart_files": [f.name for f in chart_files],
            "api_calls_limit": usage_stats["api_calls_limit"] if usage_stats else None
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
        
        # Extract tables directly from the uploaded Excel content
        extract_tables(file_content, output_dir=EXTRACTED_DIR)
        
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
        
        response_time = time.time() - start_time
        
        # Track API usage
        usage_stats = await track_api_usage(
            user_id=user_id,
            endpoint=endpoint,
            method="POST",
            status_code=200,
            response_time=response_time,
            deduct_api_call=True
        )
        
        return {
            "message": "PTW/KPI report generated successfully",
            "report_length": len(report_content),
            "report_content": report_content,
            "api_calls_limit": usage_stats["api_calls_limit"] if usage_stats else None
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
        
        def _run_ptw(charting_module: Any) -> None:
            charting_module.create_all_ptw_charts()

        await _run_charting_and_capture(user_id, _run_ptw)
        
        # List generated PTW charts
        ptw_chart_files = list(CHARTS_DIR.glob("ptw_*.html"))
        
        response_time = time.time() - start_time
        
        # Track API usage
        usage_stats = await track_api_usage(
            user_id=user_id,
            endpoint=endpoint,
            method="POST",
            status_code=200,
            response_time=response_time,
            deduct_api_call=True
        )
        
        return {
            "message": "PTW/KPI charts generated successfully",
            "charts_dir": str(CHARTS_DIR),
            "charts_generated": len(ptw_chart_files),
            "chart_files": [f.name for f in ptw_chart_files],
            "api_calls_limit": usage_stats["api_calls_limit"] if usage_stats else None
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
            "extracted_tables_exist": EXTRACTED_DIR.exists() and any(EXTRACTED_DIR.rglob("table_*.csv")),
            "charts_exist": CHARTS_DIR.exists() and any(
                f for f in CHARTS_DIR.glob("*.html")
                if not f.name.startswith(("ptw_", "insp_", "medical_", "training_", "ppe_", "rca_", "env_", "social_"))
            )
        },
        "ptw_kpi": {
            "ptw_tables_exist": (
                (EXTRACTED_DIR / "PTW_Records" / "table_1.csv").exists() and
                (EXTRACTED_DIR / "PTW_KPIs_By_Area" / "table_1.csv").exists()
            ),
            "ptw_charts_exist": CHARTS_DIR.exists() and any(CHARTS_DIR.glob("ptw_*.html"))
        },
        "inspections_audit": {
            "inspections_tables_exist": (
                (EXTRACTED_DIR / "Inspections" / "table_1.csv").exists() and
                (EXTRACTED_DIR / "Top_Recurring_Failures" / "table_1.csv").exists()
            ),
            "inspections_charts_exist": CHARTS_DIR.exists() and any(CHARTS_DIR.glob("insp_*.html"))
        },
        "medical_records": {
            "medical_tables_exist": (
                (EXTRACTED_DIR / "Medical_Records" / "table_1.csv").exists() and
                (EXTRACTED_DIR / "Medical_KPIs" / "table_1.csv").exists()
            ),
            "medical_charts_exist": CHARTS_DIR.exists() and any(CHARTS_DIR.glob("medical_*.html"))
        },
        "training_database": {
            "training_tables_exist": (
                (EXTRACTED_DIR / "Training_Records_150plus" / "table_1.csv").exists()
            ),
            "training_charts_exist": CHARTS_DIR.exists() and any(CHARTS_DIR.glob("training_*.html"))
        },
        "ppe_assets": {
            "ppe_tables_exist": (
                (EXTRACTED_DIR / "Sheet1" / "table_1.csv").exists() or
                (EXTRACTED_DIR / "PPE" / "table_1.csv").exists() or
                (EXTRACTED_DIR / "Assets_PPE" / "table_1.csv").exists()
            ),
            "ppe_charts_exist": CHARTS_DIR.exists() and any(CHARTS_DIR.glob("ppe_*.html"))
        },
        "corrective_actions_rca": {
            "rca_tables_exist": (
                (EXTRACTED_DIR / "Corrective_Actions_RCA" / "table_1.csv").exists() or
                (EXTRACTED_DIR / "Corrective_Actions" / "table_1.csv").exists() or
                (EXTRACTED_DIR / "RCA" / "table_1.csv").exists() or
                (EXTRACTED_DIR / "Actions" / "table_1.csv").exists()
            ),
            "rca_charts_exist": CHARTS_DIR.exists() and any(CHARTS_DIR.glob("rca_*.html"))
        },
        "environmental_resource_use": {
            "environmental_tables_exist": (
                (EXTRACTED_DIR / "Environmental_Data" / "table_1.csv").exists() or
                (EXTRACTED_DIR / "Monthly_KPIs" / "table_1.csv").exists() or
                (EXTRACTED_DIR / "Environmental" / "table_1.csv").exists() or
                (EXTRACTED_DIR / "Resource_Use" / "table_1.csv").exists()
            ),
            "environmental_charts_exist": CHARTS_DIR.exists() and any(CHARTS_DIR.glob("env_*.html"))
        },
        "social_governance": {
            "social_governance_tables_exist": (
                (EXTRACTED_DIR / "Workforce_Social" / "table_1.csv").exists() or
                (EXTRACTED_DIR / "Workforce_KPIs_By_Dept" / "table_1.csv").exists() or
                (EXTRACTED_DIR / "Supplier_Audits" / "table_1.csv").exists() or
                (EXTRACTED_DIR / "Governance_Metrics" / "table_1.csv").exists()
            ),
            "social_governance_charts_exist": CHARTS_DIR.exists() and any(CHARTS_DIR.glob("social_*.html"))
        }
    }
    
    if status_info["safety_data"]["extracted_tables_exist"]:
        csv_files = list(EXTRACTED_DIR.rglob("table_*.csv"))
        status_info["safety_data"]["extracted_tables_count"] = len(csv_files)
    
    if status_info["safety_data"]["charts_exist"]:
        chart_files = list(CHARTS_DIR.glob("*.html"))
        safety_charts = [f for f in chart_files if not f.name.startswith("ptw_") and not f.name.startswith("insp_") and not f.name.startswith("medical_") and not f.name.startswith("training_") and not f.name.startswith("ppe_") and not f.name.startswith("rca_") and not f.name.startswith("env_") and not f.name.startswith("social_")]
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
    
    if status_info["training_database"]["training_charts_exist"]:
        training_chart_files = list(CHARTS_DIR.glob("training_*.html"))
        status_info["training_database"]["training_charts_count"] = len(training_chart_files)
    
    if status_info["ppe_assets"]["ppe_charts_exist"]:
        ppe_chart_files = list(CHARTS_DIR.glob("ppe_*.html"))
        status_info["ppe_assets"]["ppe_charts_count"] = len(ppe_chart_files)
    
    if status_info["corrective_actions_rca"]["rca_charts_exist"]:
        rca_chart_files = list(CHARTS_DIR.glob("rca_*.html"))
        status_info["corrective_actions_rca"]["rca_charts_count"] = len(rca_chart_files)
    
    if status_info["environmental_resource_use"]["environmental_charts_exist"]:
        environmental_chart_files = list(CHARTS_DIR.glob("env_*.html"))
        status_info["environmental_resource_use"]["environmental_charts_count"] = len(environmental_chart_files)
    
    if status_info["social_governance"]["social_governance_charts_exist"]:
        social_governance_chart_files = list(CHARTS_DIR.glob("social_*.html"))
        status_info["social_governance"]["social_governance_charts_count"] = len(social_governance_chart_files)
    
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
        
        # Extract tables directly from the uploaded Excel content
        extract_tables(file_content, output_dir=EXTRACTED_DIR)
        
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
        
        response_time = time.time() - start_time
        
        # Track API usage
        usage_stats = await track_api_usage(
            user_id=user_id,
            endpoint=endpoint,
            method="POST",
            status_code=200,
            response_time=response_time,
            deduct_api_call=True
        )
        
        return {
            "message": "Inspections/Audit report generated successfully",
            "report_length": len(report_content),
            "report_content": report_content,
            "api_calls_limit": usage_stats["api_calls_limit"] if usage_stats else None
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
        
        def _run_inspections(charting_module: Any) -> None:
            charting_module.create_all_inspections_charts()

        await _run_charting_and_capture(user_id, _run_inspections)
        
        # List generated inspections charts
        inspections_chart_files = list(CHARTS_DIR.glob("insp_*.html"))
        
        response_time = time.time() - start_time
        
        # Track API usage
        usage_stats = await track_api_usage(
            user_id=user_id,
            endpoint=endpoint,
            method="POST",
            status_code=200,
            response_time=response_time,
            deduct_api_call=True
        )
        
        return {
            "message": "Inspections/Audit charts generated successfully",
            "charts_dir": str(CHARTS_DIR),
            "charts_generated": len(inspections_chart_files),
            "chart_files": [f.name for f in inspections_chart_files],
            "api_calls_limit": usage_stats["api_calls_limit"] if usage_stats else None
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
        
        # Extract tables directly from the uploaded Excel content
        extract_tables(file_content, output_dir=EXTRACTED_DIR)
        
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
        
        response_time = time.time() - start_time
        
        # Track API usage
        usage_stats = await track_api_usage(
            user_id=user_id,
            endpoint=endpoint,
            method="POST",
            status_code=200,
            response_time=response_time,
            deduct_api_call=True
        )
        
        return {
            "message": "Medical Records report generated successfully",
            "report_length": len(report_content),
            "report_content": report_content,
            "api_calls_limit": usage_stats["api_calls_limit"] if usage_stats else None
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
        
        def _run_medical(charting_module: Any) -> None:
            charting_module.create_all_medical_charts()

        await _run_charting_and_capture(user_id, _run_medical)
        
        # List generated medical charts
        medical_chart_files = list(CHARTS_DIR.glob("medical_*.html"))
        
        response_time = time.time() - start_time
        
        # Track API usage
        usage_stats = await track_api_usage(
            user_id=user_id,
            endpoint=endpoint,
            method="POST",
            status_code=200,
            response_time=response_time,
            deduct_api_call=True
        )
        
        return {
            "message": "Medical Records charts generated successfully",
            "charts_dir": str(CHARTS_DIR),
            "charts_generated": len(medical_chart_files),
            "chart_files": [f.name for f in medical_chart_files],
            "api_calls_limit": usage_stats["api_calls_limit"] if usage_stats else None
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


@app.post("/upload-training")
async def upload_training_excel(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_active_user)
):
    """
    Upload training_database.xlsx file and extract tables.
    Requires authentication.
    
    Expected file name: training_database.xlsx (or any .xlsx file with training data)
    """
    start_time = time.time()
    user_id = str(current_user["_id"])
    endpoint = "/upload-training"
    
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
        
        # Extract tables directly from the uploaded Excel content
        extract_tables(file_content, output_dir=EXTRACTED_DIR)
        
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
            "message": "Training Database file uploaded and tables extracted successfully",
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
            error_message="Training upload failed"
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
        raise HTTPException(status_code=500, detail=f"Error processing Training file: {str(e)}")


@app.post("/generate-training-report")
async def generate_training_report(
    current_user: dict = Depends(get_current_active_user)
):
    """
    Generate Training Database analysis report using phidata_agent.
    Requires authentication and extracted training tables to exist (upload training Excel file first).
    """
    start_time = time.time()
    user_id = str(current_user["_id"])
    endpoint = "/generate-training-report"
    
    try:
        # Check rate limits
        await check_rate_limit(current_user)
        
        # Check if training extracted tables exist
        training_records_path = EXTRACTED_DIR / "Training_Records_150plus" / "table_1.csv"
        
        if not training_records_path.exists():
            raise HTTPException(
                status_code=400,
                detail="Training Database extracted tables not found. Please upload training_database.xlsx first."
            )
        
        # Step 1: Summarize numeric data (only training-related tables)
        training_tables_dir = EXTRACTED_DIR
        numeric_summary = phidata_agent.summarize_numeric_data(training_tables_dir)
        
        # Filter to only training-related summaries
        training_summary = [s for s in numeric_summary if any(keyword in s for keyword in ['Training', 'Training_Records'])]
        
        if not training_summary:
            raise HTTPException(
                status_code=400,
                detail="No Training Database data found in extracted tables."
            )
        
        # Step 2: Create training analysis prompt
        prompt = phidata_agent.create_training_analysis_prompt(training_summary)
        
        # Step 3: Generate report with Gemini
        report_content = phidata_agent.generate_training_report_with_gemini(prompt)
        
        response_time = time.time() - start_time
        
        # Track API usage
        usage_stats = await track_api_usage(
            user_id=user_id,
            endpoint=endpoint,
            method="POST",
            status_code=200,
            response_time=response_time,
            deduct_api_call=True
        )
        
        return {
            "message": "Training Database report generated successfully",
            "report_length": len(report_content),
            "report_content": report_content,
            "api_calls_limit": usage_stats["api_calls_limit"] if usage_stats else None
        }
    
    except HTTPException:
        response_time = time.time() - start_time
        await track_api_usage(
            user_id=user_id,
            endpoint=endpoint,
            method="POST",
            status_code=400,
            response_time=response_time,
            error_message="Training report generation failed"
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
        raise HTTPException(status_code=500, detail=f"Error generating Training report: {str(e)}")


@app.post("/generate-training-charts")
async def generate_training_charts(
    current_user: dict = Depends(get_current_active_user)
):
    """
    Generate all Training Database analysis charts using charting.py.
    Requires authentication and extracted training tables to exist (upload training Excel file first).
    """
    start_time = time.time()
    user_id = str(current_user["_id"])
    endpoint = "/generate-training-charts"
    
    try:
        # Check rate limits
        await check_rate_limit(current_user)
        
        # Check if training extracted tables exist
        training_records_path = EXTRACTED_DIR / "Training_Records_150plus" / "table_1.csv"
        
        if not training_records_path.exists():
            raise HTTPException(
                status_code=400,
                detail="Training Database extracted tables not found. Please upload training_database.xlsx first."
            )
        
        def _run_training(charting_module: Any) -> None:
            charting_module.create_all_training_charts()

        await _run_charting_and_capture(user_id, _run_training)
        
        # List generated training charts
        training_chart_files = list(CHARTS_DIR.glob("training_*.html"))
        
        response_time = time.time() - start_time
        
        # Track API usage
        usage_stats = await track_api_usage(
            user_id=user_id,
            endpoint=endpoint,
            method="POST",
            status_code=200,
            response_time=response_time,
            deduct_api_call=True
        )
        
        return {
            "message": "Training Database charts generated successfully",
            "charts_dir": str(CHARTS_DIR),
            "charts_generated": len(training_chart_files),
            "chart_files": [f.name for f in training_chart_files],
            "api_calls_limit": usage_stats["api_calls_limit"] if usage_stats else None
        }
    
    except HTTPException:
        response_time = time.time() - start_time
        await track_api_usage(
            user_id=user_id,
            endpoint=endpoint,
            method="POST",
            status_code=400,
            response_time=response_time,
            error_message="Training chart generation failed"
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
        raise HTTPException(status_code=500, detail=f"Error generating Training charts: {str(e)}")


@app.get("/training-charts")
async def list_training_charts(
    current_user: dict = Depends(get_current_active_user)
):
    """List all generated Training Database chart files. Requires authentication."""
    start_time = time.time()
    user_id = str(current_user["_id"])
    endpoint = "/training-charts"
    
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
    
    training_chart_files = list(CHARTS_DIR.glob("training_*.html"))
    
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
        "total_training_charts": len(training_chart_files),
        "charts": [{"name": f.name, "path": str(f)} for f in training_chart_files]
    }


@app.post("/upload-ppe")
async def upload_ppe_excel(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_active_user)
):
    """
    Upload assets&ppe.xlsx file and extract tables.
    Requires authentication.
    
    Expected file name: assets&ppe.xlsx (or any .xlsx file with PPE data)
    """
    start_time = time.time()
    user_id = str(current_user["_id"])
    endpoint = "/upload-ppe"
    
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
        
        # Extract tables directly from the uploaded Excel content
        extract_tables(file_content, output_dir=EXTRACTED_DIR)
        
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
            "message": "PPE (Assets & PPE) file uploaded and tables extracted successfully",
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
            error_message="PPE upload failed"
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
        raise HTTPException(status_code=500, detail=f"Error processing PPE file: {str(e)}")


@app.post("/generate-ppe-report")
async def generate_ppe_report(
    current_user: dict = Depends(get_current_active_user)
):
    """
    Generate PPE (Assets & PPE) analysis report using phidata_agent.
    Requires authentication and extracted PPE tables to exist (upload PPE Excel file first).
    """
    start_time = time.time()
    user_id = str(current_user["_id"])
    endpoint = "/generate-ppe-report"
    
    try:
        # Check rate limits
        await check_rate_limit(current_user)
        
        # Check if PPE extracted tables exist (try multiple possible paths)
        ppe_paths = [
            EXTRACTED_DIR / "Sheet1" / "table_1.csv",
            EXTRACTED_DIR / "PPE" / "table_1.csv",
            EXTRACTED_DIR / "Assets_PPE" / "table_1.csv"
        ]
        
        ppe_path = None
        for path in ppe_paths:
            if path.exists():
                ppe_path = path
                break
        
        if ppe_path is None:
            raise HTTPException(
                status_code=400,
                detail="PPE extracted tables not found. Please upload assets&ppe.xlsx first."
            )
        
        # Step 1: Summarize numeric data (only PPE-related tables)
        ppe_tables_dir = EXTRACTED_DIR
        numeric_summary = phidata_agent.summarize_numeric_data(ppe_tables_dir)
        
        # Filter to only PPE-related summaries
        ppe_summary = [s for s in numeric_summary if any(keyword in s for keyword in ['PPE', 'Sheet1', 'ppe_item', 'quantity_purchased'])]
        
        if not ppe_summary:
            raise HTTPException(
                status_code=400,
                detail="No PPE data found in extracted tables."
            )
        
        # Step 2: Create PPE analysis prompt
        prompt = phidata_agent.create_ppe_analysis_prompt(ppe_summary)
        
        # Step 3: Generate report with Gemini
        report_content = phidata_agent.generate_ppe_report_with_gemini(prompt)
        
        response_time = time.time() - start_time
        
        # Track API usage
        usage_stats = await track_api_usage(
            user_id=user_id,
            endpoint=endpoint,
            method="POST",
            status_code=200,
            response_time=response_time,
            deduct_api_call=True
        )
        
        return {
            "message": "PPE (Assets & PPE) report generated successfully",
            "report_length": len(report_content),
            "report_content": report_content,
            "api_calls_limit": usage_stats["api_calls_limit"] if usage_stats else None
        }
    
    except HTTPException:
        response_time = time.time() - start_time
        await track_api_usage(
            user_id=user_id,
            endpoint=endpoint,
            method="POST",
            status_code=400,
            response_time=response_time,
            error_message="PPE report generation failed"
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
        raise HTTPException(status_code=500, detail=f"Error generating PPE report: {str(e)}")


@app.post("/generate-ppe-charts")
async def generate_ppe_charts(
    current_user: dict = Depends(get_current_active_user)
):
    """
    Generate all PPE (Assets & PPE) analysis charts using charting.py.
    Requires authentication and extracted PPE tables to exist (upload PPE Excel file first).
    """
    start_time = time.time()
    user_id = str(current_user["_id"])
    endpoint = "/generate-ppe-charts"
    
    try:
        # Check rate limits
        await check_rate_limit(current_user)
        
        # Check if PPE extracted tables exist
        ppe_paths = [
            EXTRACTED_DIR / "Sheet1" / "table_1.csv",
            EXTRACTED_DIR / "PPE" / "table_1.csv",
            EXTRACTED_DIR / "Assets_PPE" / "table_1.csv"
        ]
        
        ppe_path = None
        for path in ppe_paths:
            if path.exists():
                ppe_path = path
                break
        
        if ppe_path is None:
            raise HTTPException(
                status_code=400,
                detail="PPE extracted tables not found. Please upload assets&ppe.xlsx first."
            )
        
        def _run_ppe(charting_module: Any) -> None:
            charting_module.create_all_ppe_charts()

        await _run_charting_and_capture(user_id, _run_ppe)
        
        # List generated PPE charts
        ppe_chart_files = list(CHARTS_DIR.glob("ppe_*.html"))
        
        response_time = time.time() - start_time
        
        # Track API usage
        usage_stats = await track_api_usage(
            user_id=user_id,
            endpoint=endpoint,
            method="POST",
            status_code=200,
            response_time=response_time,
            deduct_api_call=True
        )
        
        return {
            "message": "PPE (Assets & PPE) charts generated successfully",
            "charts_dir": str(CHARTS_DIR),
            "charts_generated": len(ppe_chart_files),
            "chart_files": [f.name for f in ppe_chart_files],
            "api_calls_limit": usage_stats["api_calls_limit"] if usage_stats else None
        }
    
    except HTTPException:
        response_time = time.time() - start_time
        await track_api_usage(
            user_id=user_id,
            endpoint=endpoint,
            method="POST",
            status_code=400,
            response_time=response_time,
            error_message="PPE chart generation failed"
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
        raise HTTPException(status_code=500, detail=f"Error generating PPE charts: {str(e)}")


@app.get("/ppe-charts")
async def list_ppe_charts(
    current_user: dict = Depends(get_current_active_user)
):
    """List all generated PPE (Assets & PPE) chart files. Requires authentication."""
    start_time = time.time()
    user_id = str(current_user["_id"])
    endpoint = "/ppe-charts"
    
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
    
    ppe_chart_files = list(CHARTS_DIR.glob("ppe_*.html"))
    
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
        "total_ppe_charts": len(ppe_chart_files),
        "charts": [{"name": f.name, "path": str(f)} for f in ppe_chart_files]
    }


@app.post("/upload-rca")
async def upload_rca_excel(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_active_user)
):
    """
    Upload corrective_actions_database.xlsx file and extract tables.
    Requires authentication.
    
    Expected file name: corrective_actions_database.xlsx (or any .xlsx file with corrective actions/RCA data)
    """
    start_time = time.time()
    user_id = str(current_user["_id"])
    endpoint = "/upload-rca"
    
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
        
        # Extract tables directly from the uploaded Excel content
        extract_tables(file_content, output_dir=EXTRACTED_DIR)
        
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
            "message": "Corrective Actions & RCA file uploaded and tables extracted successfully",
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
            error_message="RCA upload failed"
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
        raise HTTPException(status_code=500, detail=f"Error processing Corrective Actions & RCA file: {str(e)}")


@app.post("/generate-rca-report")
async def generate_rca_report(
    current_user: dict = Depends(get_current_active_user)
):
    """
    Generate Corrective Actions & RCA analysis report using phidata_agent.
    Requires authentication and extracted RCA tables to exist (upload RCA Excel file first).
    """
    start_time = time.time()
    user_id = str(current_user["_id"])
    endpoint = "/generate-rca-report"
    
    try:
        # Check rate limits
        await check_rate_limit(current_user)
        
        # Check if RCA extracted tables exist (try multiple possible paths)
        rca_paths = [
            EXTRACTED_DIR / "Corrective_Actions_RCA" / "table_1.csv",
            EXTRACTED_DIR / "Corrective_Actions" / "table_1.csv",
            EXTRACTED_DIR / "RCA" / "table_1.csv",
            EXTRACTED_DIR / "Actions" / "table_1.csv"
        ]
        
        rca_path = None
        for path in rca_paths:
            if path.exists():
                rca_path = path
                break
        
        if rca_path is None:
            raise HTTPException(
                status_code=400,
                detail="Corrective Actions & RCA extracted tables not found. Please upload corrective_actions_database.xlsx first."
            )
        
        # Step 1: Summarize numeric data (only RCA-related tables)
        rca_tables_dir = EXTRACTED_DIR
        numeric_summary = phidata_agent.summarize_numeric_data(rca_tables_dir)
        
        # Filter to only RCA-related summaries
        rca_summary = [s for s in numeric_summary if any(keyword in s for keyword in ['Corrective', 'RCA', 'Actions', 'action_id', 'status', 'due_date', 'owner', 'priority'])]
        
        if not rca_summary:
            raise HTTPException(
                status_code=400,
                detail="No Corrective Actions & RCA data found in extracted tables."
            )
        
        # Step 2: Create RCA analysis prompt
        prompt = phidata_agent.create_rca_analysis_prompt(rca_summary)
        
        # Step 3: Generate report with Gemini
        report_content = phidata_agent.generate_rca_report_with_gemini(prompt)
        
        response_time = time.time() - start_time
        
        # Track API usage
        usage_stats = await track_api_usage(
            user_id=user_id,
            endpoint=endpoint,
            method="POST",
            status_code=200,
            response_time=response_time,
            deduct_api_call=True
        )
        
        return {
            "message": "Corrective Actions & RCA report generated successfully",
            "report_length": len(report_content),
            "report_content": report_content,
            "api_calls_limit": usage_stats["api_calls_limit"] if usage_stats else None
        }
    
    except HTTPException:
        response_time = time.time() - start_time
        await track_api_usage(
            user_id=user_id,
            endpoint=endpoint,
            method="POST",
            status_code=400,
            response_time=response_time,
            error_message="RCA report generation failed"
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
        raise HTTPException(status_code=500, detail=f"Error generating Corrective Actions & RCA report: {str(e)}")


@app.post("/generate-rca-charts")
async def generate_rca_charts(
    current_user: dict = Depends(get_current_active_user)
):
    """
    Generate all Corrective Actions & RCA analysis charts using charting.py.
    Requires authentication and extracted RCA tables to exist (upload RCA Excel file first).
    """
    start_time = time.time()
    user_id = str(current_user["_id"])
    endpoint = "/generate-rca-charts"
    
    try:
        # Check rate limits
        await check_rate_limit(current_user)
        
        # Check if RCA extracted tables exist
        rca_paths = [
            EXTRACTED_DIR / "Corrective_Actions_RCA" / "table_1.csv",
            EXTRACTED_DIR / "Corrective_Actions" / "table_1.csv",
            EXTRACTED_DIR / "RCA" / "table_1.csv",
            EXTRACTED_DIR / "Actions" / "table_1.csv"
        ]
        
        rca_path = None
        for path in rca_paths:
            if path.exists():
                rca_path = path
                break
        
        if rca_path is None:
            raise HTTPException(
                status_code=400,
                detail="Corrective Actions & RCA extracted tables not found. Please upload corrective_actions_database.xlsx first."
            )
        
        def _run_rca(charting_module: Any) -> None:
            charting_module.create_all_rca_charts()

        await _run_charting_and_capture(user_id, _run_rca)
        
        # List generated RCA charts
        rca_chart_files = list(CHARTS_DIR.glob("rca_*.html"))
        
        response_time = time.time() - start_time
        
        # Track API usage
        usage_stats = await track_api_usage(
            user_id=user_id,
            endpoint=endpoint,
            method="POST",
            status_code=200,
            response_time=response_time,
            deduct_api_call=True
        )
        
        return {
            "message": "Corrective Actions & RCA charts generated successfully",
            "charts_dir": str(CHARTS_DIR),
            "charts_generated": len(rca_chart_files),
            "chart_files": [f.name for f in rca_chart_files],
            "api_calls_limit": usage_stats["api_calls_limit"] if usage_stats else None
        }
    
    except HTTPException:
        response_time = time.time() - start_time
        await track_api_usage(
            user_id=user_id,
            endpoint=endpoint,
            method="POST",
            status_code=400,
            response_time=response_time,
            error_message="RCA chart generation failed"
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
        raise HTTPException(status_code=500, detail=f"Error generating Corrective Actions & RCA charts: {str(e)}")


@app.get("/rca-charts")
async def list_rca_charts(
    current_user: dict = Depends(get_current_active_user)
):
    """List all generated Corrective Actions & RCA chart files. Requires authentication."""
    start_time = time.time()
    user_id = str(current_user["_id"])
    endpoint = "/rca-charts"
    
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
    
    rca_chart_files = list(CHARTS_DIR.glob("rca_*.html"))
    
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
        "total_rca_charts": len(rca_chart_files),
        "charts": [{"name": f.name, "path": str(f)} for f in rca_chart_files]
    }


@app.post("/upload-environmental")
async def upload_environmental_excel(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_active_user)
):
    """
    Upload Environmental & Resource Use database.xlsx file and extract tables.
    Requires authentication.
    
    Expected file name: Environmental & Resource Use_ database.xlsx (or any .xlsx file with environmental/resource use data)
    """
    start_time = time.time()
    user_id = str(current_user["_id"])
    endpoint = "/upload-environmental"
    
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
        
        # Extract tables directly from the uploaded Excel content
        extract_tables(file_content, output_dir=EXTRACTED_DIR)
        
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
            "message": "Environmental & Resource Use file uploaded and tables extracted successfully",
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
            error_message="Environmental upload failed"
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
        raise HTTPException(status_code=500, detail=f"Error processing Environmental & Resource Use file: {str(e)}")


@app.post("/generate-environmental-report")
async def generate_environmental_report(
    current_user: dict = Depends(get_current_active_user)
):
    """
    Generate Environmental & Resource Use analysis report using phidata_agent.
    Requires authentication and extracted environmental tables to exist (upload environmental Excel file first).
    """
    start_time = time.time()
    user_id = str(current_user["_id"])
    endpoint = "/generate-environmental-report"
    
    try:
        # Check rate limits
        await check_rate_limit(current_user)
        
        # Check if environmental extracted tables exist (try multiple possible paths)
        env_paths = [
            EXTRACTED_DIR / "Environmental_Data" / "table_1.csv",
            EXTRACTED_DIR / "Monthly_KPIs" / "table_1.csv",
            EXTRACTED_DIR / "Environmental" / "table_1.csv",
            EXTRACTED_DIR / "Resource_Use" / "table_1.csv"
        ]
        
        env_path = None
        for path in env_paths:
            if path.exists():
                # Check if this looks like environmental data
                try:
                    test_df = pd.read_csv(path)
                    if any(col in test_df.columns for col in ['energy', 'Energy', 'water', 'Water', 'waste', 'Waste', 'co2', 'CO2', 'emissions', 'renewable', 'plant', 'Plant', 'month', 'Month']):
                        env_path = path
                        break
                except:
                    continue
        
        if env_path is None:
            raise HTTPException(
                status_code=400,
                detail="Environmental & Resource Use extracted tables not found. Please upload Environmental & Resource Use_ database.xlsx first."
            )
        
        # Step 1: Summarize numeric data (only environmental-related tables)
        env_tables_dir = EXTRACTED_DIR
        numeric_summary = phidata_agent.summarize_numeric_data(env_tables_dir)
        
        # Filter to only environmental-related summaries
        env_summary = [s for s in numeric_summary if any(keyword in s for keyword in ['Environmental', 'Resource', 'energy', 'Energy', 'water', 'Water', 'waste', 'Waste', 'co2', 'CO2', 'emissions', 'renewable', 'plant', 'Plant', 'Monthly_KPIs', 'Environmental_Data'])]
        
        if not env_summary:
            raise HTTPException(
                status_code=400,
                detail="No Environmental & Resource Use data found in extracted tables."
            )
        
        # Step 2: Create environmental analysis prompt
        prompt = phidata_agent.create_environmental_analysis_prompt(env_summary)
        
        # Step 3: Generate report with Gemini
        report_content = phidata_agent.generate_environmental_report_with_gemini(prompt)
        
        response_time = time.time() - start_time
        
        # Track API usage
        usage_stats = await track_api_usage(
            user_id=user_id,
            endpoint=endpoint,
            method="POST",
            status_code=200,
            response_time=response_time,
            deduct_api_call=True
        )
        
        return {
            "message": "Environmental & Resource Use report generated successfully",
            "report_length": len(report_content),
            "report_content": report_content,
            "api_calls_limit": usage_stats["api_calls_limit"] if usage_stats else None
        }
    
    except HTTPException:
        response_time = time.time() - start_time
        await track_api_usage(
            user_id=user_id,
            endpoint=endpoint,
            method="POST",
            status_code=400,
            response_time=response_time,
            error_message="Environmental report generation failed"
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
        raise HTTPException(status_code=500, detail=f"Error generating Environmental & Resource Use report: {str(e)}")


@app.post("/generate-environmental-charts")
async def generate_environmental_charts(
    current_user: dict = Depends(get_current_active_user)
):
    """
    Generate all Environmental & Resource Use analysis charts using charting.py.
    Requires authentication and extracted environmental tables to exist (upload environmental Excel file first).
    """
    start_time = time.time()
    user_id = str(current_user["_id"])
    endpoint = "/generate-environmental-charts"
    
    try:
        # Check rate limits
        await check_rate_limit(current_user)
        
        # Check if environmental extracted tables exist
        env_paths = [
            EXTRACTED_DIR / "Environmental_Data" / "table_1.csv",
            EXTRACTED_DIR / "Monthly_KPIs" / "table_1.csv",
            EXTRACTED_DIR / "Environmental" / "table_1.csv",
            EXTRACTED_DIR / "Resource_Use" / "table_1.csv"
        ]
        
        env_path = None
        for path in env_paths:
            if path.exists():
                # Check if this looks like environmental data
                try:
                    test_df = pd.read_csv(path)
                    if any(col in test_df.columns for col in ['energy', 'Energy', 'water', 'Water', 'waste', 'Waste', 'co2', 'CO2', 'emissions', 'renewable', 'plant', 'Plant', 'month', 'Month']):
                        env_path = path
                        break
                except:
                    continue
        
        if env_path is None:
            raise HTTPException(
                status_code=400,
                detail="Environmental & Resource Use extracted tables not found. Please upload Environmental & Resource Use_ database.xlsx first."
            )
        
        def _run_environmental(charting_module: Any) -> None:
            charting_module.create_all_environmental_charts()

        await _run_charting_and_capture(user_id, _run_environmental)
        
        # List generated environmental charts
        environmental_chart_files = list(CHARTS_DIR.glob("env_*.html"))
        
        response_time = time.time() - start_time
        
        # Track API usage
        usage_stats = await track_api_usage(
            user_id=user_id,
            endpoint=endpoint,
            method="POST",
            status_code=200,
            response_time=response_time,
            deduct_api_call=True
        )
        
        return {
            "message": "Environmental & Resource Use charts generated successfully",
            "charts_dir": str(CHARTS_DIR),
            "charts_generated": len(environmental_chart_files),
            "chart_files": [f.name for f in environmental_chart_files],
            "api_calls_limit": usage_stats["api_calls_limit"] if usage_stats else None
        }
    
    except HTTPException:
        response_time = time.time() - start_time
        await track_api_usage(
            user_id=user_id,
            endpoint=endpoint,
            method="POST",
            status_code=400,
            response_time=response_time,
            error_message="Environmental chart generation failed"
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
        raise HTTPException(status_code=500, detail=f"Error generating Environmental & Resource Use charts: {str(e)}")


@app.get("/environmental-charts")
async def list_environmental_charts(
    current_user: dict = Depends(get_current_active_user)
):
    """List all generated Environmental & Resource Use chart files. Requires authentication."""
    start_time = time.time()
    user_id = str(current_user["_id"])
    endpoint = "/environmental-charts"
    
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
    
    environmental_chart_files = list(CHARTS_DIR.glob("env_*.html"))
    
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
        "total_environmental_charts": len(environmental_chart_files),
        "charts": [{"name": f.name, "path": str(f)} for f in environmental_chart_files]
    }


@app.post("/upload-social-governance")
async def upload_social_governance_excel(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_active_user)
):
    """
    Upload social_governance_database.xlsx file and extract tables.
    Requires authentication.
    
    Expected file name: social_governance_database.xlsx (or any .xlsx file with social/governance data)
    """
    start_time = time.time()
    user_id = str(current_user["_id"])
    endpoint = "/upload-social-governance"
    
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
        
        # Extract tables directly from the uploaded Excel content
        extract_tables(file_content, output_dir=EXTRACTED_DIR)
        
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
            "message": "Social & Governance file uploaded and tables extracted successfully",
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
            error_message="Social & Governance upload failed"
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
        raise HTTPException(status_code=500, detail=f"Error processing Social & Governance file: {str(e)}")


@app.post("/generate-social-governance-report")
async def generate_social_governance_report(
    current_user: dict = Depends(get_current_active_user)
):
    """
    Generate Social & Governance analysis report using phidata_agent.
    Requires authentication and extracted social/governance tables to exist (upload social/governance Excel file first).
    """
    start_time = time.time()
    user_id = str(current_user["_id"])
    endpoint = "/generate-social-governance-report"
    
    try:
        # Check rate limits
        await check_rate_limit(current_user)
        
        # Check if social/governance extracted tables exist (try multiple possible paths)
        social_paths = [
            EXTRACTED_DIR / "Workforce_Social" / "table_1.csv",
            EXTRACTED_DIR / "Workforce_KPIs_By_Dept" / "table_1.csv",
            EXTRACTED_DIR / "Supplier_Audits" / "table_1.csv",
            EXTRACTED_DIR / "Governance_Metrics" / "table_1.csv"
        ]
        
        # Check if at least one social/governance table exists
        found_paths = []
        for path in social_paths:
            if path.exists():
                # Check if this looks like social/governance data
                try:
                    test_df = pd.read_csv(path)
                    # Make column check case-insensitive and check for partial matches
                    columns_lower = [str(col).lower() for col in test_df.columns]
                    social_keywords = ['employee', 'workforce', 'supplier', 'governance', 'turnover', 'absenteeism', 
                                      'compliance', 'board', 'whistleblower', 'survey', 'audit', 'csr', 'policy']
                    if any(keyword in col for col in columns_lower for keyword in social_keywords):
                        found_paths.append(path)
                except Exception as e:
                    # If file exists but can't be read, still count it as found
                    found_paths.append(path)
        
        if not found_paths:
            raise HTTPException(
                status_code=400,
                detail="Social & Governance extracted tables not found. Please upload social_governance_database.xlsx first."
            )
        
        # Step 1: Summarize numeric data (only social/governance-related tables)
        social_tables_dir = EXTRACTED_DIR
        numeric_summary = phidata_agent.summarize_numeric_data(social_tables_dir)
        
        # Filter to only social/governance-related summaries
        social_summary = [s for s in numeric_summary if any(keyword in s for keyword in ['Workforce', 'Social', 'Governance', 'Supplier', 'employee', 'Employee', 'turnover', 'Turnover', 'absenteeism', 'Absenteeism', 'compliance', 'Compliance', 'board', 'Board', 'whistleblower', 'Whistleblower'])]
        
        if not social_summary:
            raise HTTPException(
                status_code=400,
                detail="No Social & Governance data found in extracted tables."
            )
        
        # Step 2: Create social/governance analysis prompt
        prompt = phidata_agent.create_social_governance_analysis_prompt(social_summary)
        
        # Step 3: Generate report with Gemini
        report_content = phidata_agent.generate_social_governance_report_with_gemini(prompt)
        
        response_time = time.time() - start_time
        
        # Track API usage
        usage_stats = await track_api_usage(
            user_id=user_id,
            endpoint=endpoint,
            method="POST",
            status_code=200,
            response_time=response_time,
            deduct_api_call=True
        )
        
        return {
            "message": "Social & Governance report generated successfully",
            "report_length": len(report_content),
            "report_content": report_content,
            "api_calls_limit": usage_stats["api_calls_limit"] if usage_stats else None
        }
    
    except HTTPException:
        response_time = time.time() - start_time
        await track_api_usage(
            user_id=user_id,
            endpoint=endpoint,
            method="POST",
            status_code=400,
            response_time=response_time,
            error_message="Social & Governance report generation failed"
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
        raise HTTPException(status_code=500, detail=f"Error generating Social & Governance report: {str(e)}")


@app.post("/generate-social-governance-charts")
async def generate_social_governance_charts(
    current_user: dict = Depends(get_current_active_user)
):
    """
    Generate all Social & Governance analysis charts using charting.py.
    Requires authentication and extracted social/governance tables to exist (upload social/governance Excel file first).
    """
    start_time = time.time()
    user_id = str(current_user["_id"])
    endpoint = "/generate-social-governance-charts"
    
    try:
        # Check rate limits
        await check_rate_limit(current_user)
        
        # Check if social/governance extracted tables exist
        social_paths = [
            EXTRACTED_DIR / "Workforce_Social" / "table_1.csv",
            EXTRACTED_DIR / "Workforce_KPIs_By_Dept" / "table_1.csv",
            EXTRACTED_DIR / "Supplier_Audits" / "table_1.csv",
            EXTRACTED_DIR / "Governance_Metrics" / "table_1.csv"
        ]
        
        # Check if at least one social/governance table exists
        found_paths = []
        for path in social_paths:
            if path.exists():
                # Check if this looks like social/governance data
                try:
                    test_df = pd.read_csv(path)
                    # Make column check case-insensitive and check for partial matches
                    columns_lower = [str(col).lower() for col in test_df.columns]
                    social_keywords = ['employee', 'workforce', 'supplier', 'governance', 'turnover', 'absenteeism', 
                                      'compliance', 'board', 'whistleblower', 'survey', 'audit', 'csr', 'policy']
                    if any(keyword in col for col in columns_lower for keyword in social_keywords):
                        found_paths.append(path)
                except Exception as e:
                    # If file exists but can't be read, still count it as found
                    found_paths.append(path)
        
        if not found_paths:
            raise HTTPException(
                status_code=400,
                detail="Social & Governance extracted tables not found. Please upload social_governance_database.xlsx first."
            )
        
        def _run_social(charting_module: Any) -> None:
            charting_module.create_all_social_governance_charts()

        await _run_charting_and_capture(user_id, _run_social)
        
        # List generated social/governance charts
        social_governance_chart_files = list(CHARTS_DIR.glob("social_*.html"))
        
        response_time = time.time() - start_time
        
        # Track API usage
        usage_stats = await track_api_usage(
            user_id=user_id,
            endpoint=endpoint,
            method="POST",
            status_code=200,
            response_time=response_time,
            deduct_api_call=True
        )
        
        return {
            "message": "Social & Governance charts generated successfully",
            "charts_dir": str(CHARTS_DIR),
            "charts_generated": len(social_governance_chart_files),
            "chart_files": [f.name for f in social_governance_chart_files],
            "api_calls_limit": usage_stats["api_calls_limit"] if usage_stats else None
        }
    
    except HTTPException:
        response_time = time.time() - start_time
        await track_api_usage(
            user_id=user_id,
            endpoint=endpoint,
            method="POST",
            status_code=400,
            response_time=response_time,
            error_message="Social & Governance chart generation failed"
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
        raise HTTPException(status_code=500, detail=f"Error generating Social & Governance charts: {str(e)}")


@app.get("/social-governance-charts")
async def list_social_governance_charts(
    current_user: dict = Depends(get_current_active_user)
):
    """List all generated Social & Governance chart files. Requires authentication."""
    start_time = time.time()
    user_id = str(current_user["_id"])
    endpoint = "/social-governance-charts"
    
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
    
    social_governance_chart_files = list(CHARTS_DIR.glob("social_*.html"))
    
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
        "total_social_governance_charts": len(social_governance_chart_files),
        "charts": [{"name": f.name, "path": str(f)} for f in social_governance_chart_files]
    }


if __name__ == "__main__":
    import uvicorn
    import os
    from dotenv import load_dotenv
    
    load_dotenv()
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8000))
    
    uvicorn.run(app, host=host, port=port)

