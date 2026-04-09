"""
schemas.py — Pydantic request/response models for the AI service.
"""

from pydantic import BaseModel, Field
from typing import Optional, List


# ── Demand Prediction ──────────────────────────────────────────────────────

class DemandRequest(BaseModel):
    route_id: str
    date: str                           # YYYY-MM-DD
    hour: int = Field(..., ge=0, le=23)
    is_weekend: bool = False
    is_holiday: bool = False
    weather: str = "clear"              # clear | rain | fog | heatwave
    avg_temp_c: float = 25.0
    special_event: bool = False

class DemandResponse(BaseModel):
    route_id: str
    date: str
    hour: int
    predicted_count: int
    crowd_level: str                    # low | medium | high | critical
    confidence: float


# ── Delay Prediction ───────────────────────────────────────────────────────

class DelayRequest(BaseModel):
    route_id: str
    hour: int = Field(..., ge=0, le=23)
    day_of_week: int = Field(..., ge=0, le=6)   # 0=Mon
    is_weekend: bool = False
    is_holiday: bool = False
    weather: str = "clear"
    avg_temp_c: float = 25.0
    passenger_load_pct: float = 50.0            # 0-100
    scheduled_duration_min: float = 60.0
    distance_km: float = 10.0
    total_stops: int = 20

class DelayResponse(BaseModel):
    route_id: str
    predicted_delay_minutes: float
    is_delayed: bool                    # True if delay > 5 min
    delay_probability: float            # probability of being delayed


# ── Schedule Generation ────────────────────────────────────────────────────

class ScheduleSlot(BaseModel):
    hour: int
    minute: int
    frequency_minutes: int
    bus_count: int
    type: str   # regular | peak | express

class ScheduleRequest(BaseModel):
    route_id: str
    date: str
    total_buses_available: int = 5

class ScheduleResponse(BaseModel):
    route_id: str
    date: str
    slots: List[ScheduleSlot]
    total_trips: int
    ai_generated: bool = True
