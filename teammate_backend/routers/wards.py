from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import SessionLocal
from models import Ward, Weather
from schemas import WardCreate


router = APIRouter()


def get_db():

    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()


@router.post("/wards")
def add_ward(
    data: WardCreate,
    db: Session = Depends(get_db)
):

    ward = Ward(
        ward_name=data.ward_name,
        population=data.population,
        vulnerability_score=data.vulnerability_score
    )

    db.add(ward)
    db.commit()
    db.refresh(ward)

    return {
        "message": "Ward added successfully",
        "ward_id": ward.id
    }


@router.get("/wards")
def get_wards(
    db: Session = Depends(get_db)
):

    wards = db.query(Ward).all()

    return wards


@router.get("/wards/{ward_id}")
def get_ward(
    ward_id: int,
    db: Session = Depends(get_db)
):

    ward = db.query(Ward).filter(Ward.id == ward_id).first()

    if ward is None:

        raise HTTPException(
            status_code=404,
            detail="Ward not found"
        )

    return ward


@router.get("/wards/{ward_id}/weather")
def get_ward_weather(
    ward_id: int,
    db: Session = Depends(get_db)
):

    ward = db.query(Ward).filter(Ward.id == ward_id).first()

    if ward is None:
        raise HTTPException(
            status_code=404,
            detail="Ward not found"
        )

    weather_data = (
        db.query(Weather)
        .filter(Weather.ward_id == ward_id)
        .all()
    )

    return {
        "ward_id": ward.id,
        "ward_name": ward.ward_name,
        "weather": weather_data
    }