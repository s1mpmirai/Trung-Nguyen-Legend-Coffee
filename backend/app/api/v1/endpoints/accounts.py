from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db

router = APIRouter()

@router.post("/create_account")
def create_account(db: Session = Depends(get_db)):
    pass

@router.post("/{ma_nv}/status")
def login(db: Session = Depends(get_db)):
    pass

