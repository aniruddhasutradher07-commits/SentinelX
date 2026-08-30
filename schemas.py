from pydantic import BaseModel


class WeatherCreate(BaseModel):

    ward_id: int

    temperature: float

    humidity: float

    wind_speed: float

    solar_radiation: float

    utc_time: str


class WardCreate(BaseModel):

    ward_name: str

    population: int

    vulnerability_score: float