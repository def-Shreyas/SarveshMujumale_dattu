# services/safety_intelligence/schemas.py
from pydantic import BaseModel
from typing import List, Literal

class SafetyQueryRequest(BaseModel):
    query: str

class IncidentCase(BaseModel):
    case_id: str
    title: str
    year: int
    country: str
    industry: str
    severity: Literal["Low", "Medium", "High", "Fatal"]
    summary: str
    lessons_learned: List[str]
    source_url: str

class SafetyQueryResponse(BaseModel):
    query: str
    total_cases: int
    cases: List[IncidentCase]
    
class SafetyPDFRequest(BaseModel):
    query: str