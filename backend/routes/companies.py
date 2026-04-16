from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from db import get_db
from schemas import CompanyOut
from services.data_service import list_companies

router = APIRouter()


@router.get("/companies", response_model=list[CompanyOut])
def get_companies(db: Session = Depends(get_db)) -> list[CompanyOut]:
    return list_companies(db)
