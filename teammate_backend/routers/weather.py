from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import SessionLocal
from models import Weather
from schemas import WeatherCreate


router = APIRouter()


def get_db():

    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()


@router.post("/weather")
def add_weather(
    data: WeatherCreate,
    db: Session = Depends(get_db)
):

    weather = Weather(
        ward_id=data.ward_id,
        temperature=data.temperature,
        humidity=data.humidity,
        wind_speed=data.wind_speed,
        solar_radiation=data.solar_radiation,
        utc_time=data.utc_time
    )

    db.add(weather)

    db.commit()

    db.refresh(weather)

    return {
        "message": "Weather data saved successfully",
        "id": weather.id
    }
@router.get("/weather")
def get_weather(
    db: Session = Depends(get_db)
):

    weather_data = db.query(Weather).all()

    return weather_data