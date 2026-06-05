from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, EmailStr
from uuid import uuid4
from sqlalchemy import select
from app.database import db
from app.models import User
from app.auth_utils import hash_password, verify_password, create_token
from app.context import current_user_id_var

router = APIRouter(prefix="/auth", tags=["Authentication"])

class AuthRequest(BaseModel):
    email: str
    password: str

class AuthResponse(BaseModel):
    token: str
    user_id: str
    email: str

@router.post("/signup", response_model=AuthResponse)
async def signup(req: AuthRequest):
    email = req.email.strip().lower()
    if not email or not req.password:
        raise HTTPException(status_code=400, detail="Email and password are required")
        
    async with db._session() as session:
        # Check if user already exists
        existing = await session.execute(select(User).where(User.email == email))
        if existing.scalars().first() is not None:
            raise HTTPException(status_code=400, detail="A user with this email already exists")
            
        # Create user
        user_id = str(uuid4())
        hashed = hash_password(req.password)
        new_user = User(
            user_id=user_id,
            email=email,
            password_hash=hashed
        )
        session.add(new_user)
        await session.commit()
        
    # Create token
    token = create_token({"user_id": user_id, "email": email})
    return AuthResponse(token=token, user_id=user_id, email=email)

@router.post("/login", response_model=AuthResponse)
async def login(req: AuthRequest):
    email = req.email.strip().lower()
    async with db._session() as session:
        result = await session.execute(select(User).where(User.email == email))
        user = result.scalars().first()
        if user is None or not verify_password(req.password, user.password_hash):
            raise HTTPException(status_code=401, detail="Invalid email or password")
            
        user_id = user.user_id
        
    token = create_token({"user_id": user_id, "email": email})
    return AuthResponse(token=token, user_id=user_id, email=email)

@router.get("/me")
async def me():
    user_id = current_user_id_var.get()
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
        
    async with db._session() as session:
        result = await session.execute(select(User).where(User.user_id == user_id))
        user = result.scalars().first()
        if user is None:
            raise HTTPException(status_code=404, detail="User not found")
            
        return {"user_id": user.user_id, "email": user.email}
