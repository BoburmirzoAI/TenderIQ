"""Team and team membership models for workspace collaboration."""

from sqlalchemy import Column, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class Team(BaseModel):
    """A workspace team owned by a company."""

    __tablename__ = "teams"

    name = Column(String(255), nullable=False)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    max_members = Column(Integer, default=5, nullable=False)

    owner = relationship("User", foreign_keys=[owner_id], lazy="selectin")
    company = relationship("Company", lazy="selectin")
    members = relationship("TeamMember", back_populates="team", lazy="selectin", cascade="all, delete-orphan")


class TeamMember(BaseModel):
    """A user's membership in a team with a specific role."""

    __tablename__ = "team_members"

    team_id = Column(Integer, ForeignKey("teams.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    role = Column(String(20), default="member", nullable=False)

    team = relationship("Team", back_populates="members")
    user = relationship("User", lazy="selectin")

    __table_args__ = (
        UniqueConstraint("team_id", "user_id", name="uq_team_user"),
    )
