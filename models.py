from sqlalchemy import Column, Integer, Float, String
from database import Base


class Weather(Base):

    __tablename__ = "weather"

    id = Column(Integer, primary_key=True, index=True)

    ward_id = Column(Integer)

    temperature = Column(Float)

    humidity = Column(Float)

    wind_speed = Column(Float)

    solar_radiation = Column(Float)

    utc_time = Column(String)


class Ward(Base):

    __tablename__ = "wards"

    id = Column(Integer, primary_key=True, index=True)

    ward_name = Column(String)

    population = Column(Integer)

    vulnerability_score = Column(Float)

    # --- Added for SentinelX live-weather integration (additive, optional) ---
    ward_code = Column(String, nullable=True, index=True)   # e.g. "W21"
    zone = Column(String, nullable=True)                     # e.g. "North Zone"
    area_hectares = Column(Float, nullable=True)              # used to derive
    # the UHI (urban heat island) density proxy for live per-ward temperature


class RiskPrediction(Base):

    __tablename__ = "risk_predictions"

    id = Column(Integer, primary_key=True, index=True)

    ward_id = Column(Integer)

    temperature = Column(Float)

    humidity = Column(Float)

    hi = Column(Float, nullable=True)  # Heat Index — added for SentinelX integration

    utci = Column(Float, nullable=True)

    wbgt = Column(Float, nullable=True)

    risk_score = Column(Float)

    risk_level = Column(String)

    prediction_time = Column(String)
class Alert(Base):

    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)

    ward_id = Column(Integer)

    risk_level = Column(String)

    risk_score = Column(Float)

    message = Column(String)

    status = Column(String)

    alert_time = Column(String)