"""Service layer for tender application pipeline management."""

from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.tender import Tender
from app.models.tender_application import TenderApplication
from app.schemas.application import (
    VALID_PRIORITIES,
    VALID_STAGES,
    ApplicationCreate,
    ApplicationStats,
    ApplicationUpdate,
    ApplicationWithTender,
)


class ApplicationService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, user_id: int, data: ApplicationCreate) -> TenderApplication:
        tender = await self.db.get(Tender, data.tender_id)
        if not tender:
            raise HTTPException(status_code=404, detail="Tender topilmadi")

        existing = await self.db.execute(
            select(TenderApplication).where(
                TenderApplication.user_id == user_id,
                TenderApplication.tender_id == data.tender_id,
            )
        )
        if existing.scalar_one_or_none():
            raise HTTPException(
                status_code=409, detail="Bu tenderga allaqachon ariza mavjud"
            )

        if data.stage not in VALID_STAGES:
            raise HTTPException(status_code=400, detail=f"Noto'g'ri bosqich: {data.stage}")
        if data.priority not in VALID_PRIORITIES:
            raise HTTPException(status_code=400, detail=f"Noto'g'ri muhimlik: {data.priority}")

        app = TenderApplication(
            user_id=user_id,
            tender_id=data.tender_id,
            stage=data.stage,
            priority=data.priority,
            bid_amount=data.bid_amount,
            currency=data.currency,
            notes=data.notes,
            assigned_to=data.assigned_to,
        )
        self.db.add(app)
        await self.db.commit()
        await self.db.refresh(app)
        return app

    async def get_all(
        self,
        user_id: int,
        stage: str | None = None,
        priority: str | None = None,
        skip: int = 0,
        limit: int = 100,
    ) -> tuple[list[ApplicationWithTender], int]:
        base = select(TenderApplication).where(TenderApplication.user_id == user_id)
        count_q = select(func.count()).select_from(TenderApplication).where(
            TenderApplication.user_id == user_id
        )

        if stage:
            base = base.where(TenderApplication.stage == stage)
            count_q = count_q.where(TenderApplication.stage == stage)
        if priority:
            base = base.where(TenderApplication.priority == priority)
            count_q = count_q.where(TenderApplication.priority == priority)

        total = (await self.db.execute(count_q)).scalar() or 0

        query = base.order_by(TenderApplication.updated_at.desc()).offset(skip).limit(limit)
        result = await self.db.execute(query)
        apps = result.scalars().all()

        items = []
        for app in apps:
            tender = await self.db.get(Tender, app.tender_id)
            items.append(
                ApplicationWithTender(
                    **{c.name: getattr(app, c.name) for c in app.__table__.columns},
                    tender_title=tender.title if tender else None,
                    tender_organization=tender.organization if tender else None,
                    tender_category=tender.category if tender else None,
                    tender_region=tender.region if tender else None,
                    tender_amount=tender.amount if tender else None,
                    tender_deadline=tender.deadline if tender else None,
                    tender_status=tender.status if tender else None,
                )
            )
        return items, total

    async def get_one(self, user_id: int, app_id: int) -> TenderApplication:
        app = await self.db.get(TenderApplication, app_id)
        if not app or app.user_id != user_id:
            raise HTTPException(status_code=404, detail="Ariza topilmadi")
        return app

    async def update(
        self, user_id: int, app_id: int, data: ApplicationUpdate
    ) -> TenderApplication:
        app = await self.get_one(user_id, app_id)

        if data.stage is not None:
            if data.stage not in VALID_STAGES:
                raise HTTPException(status_code=400, detail=f"Noto'g'ri bosqich: {data.stage}")
            app.stage = data.stage
            if data.stage == "submitted" and not app.submitted_at:
                app.submitted_at = datetime.now(timezone.utc)
            if data.stage in ("won", "lost") and not app.decided_at:
                app.decided_at = datetime.now(timezone.utc)
                app.result = data.stage

        if data.priority is not None:
            if data.priority not in VALID_PRIORITIES:
                raise HTTPException(
                    status_code=400, detail=f"Noto'g'ri muhimlik: {data.priority}"
                )
            app.priority = data.priority

        if data.bid_amount is not None:
            app.bid_amount = data.bid_amount
        if data.notes is not None:
            app.notes = data.notes
        if data.assigned_to is not None:
            app.assigned_to = data.assigned_to
        if data.win_probability is not None:
            app.win_probability = data.win_probability
        if data.result is not None:
            app.result = data.result

        await self.db.commit()
        await self.db.refresh(app)
        return app

    async def delete(self, user_id: int, app_id: int) -> None:
        app = await self.get_one(user_id, app_id)
        await self.db.delete(app)
        await self.db.commit()

    async def get_stats(self, user_id: int) -> ApplicationStats:
        apps_result = await self.db.execute(
            select(TenderApplication).where(TenderApplication.user_id == user_id)
        )
        apps = apps_result.scalars().all()

        by_stage: dict[str, int] = {}
        by_priority: dict[str, int] = {}
        total_bid = 0.0
        bid_count = 0
        won = 0
        lost = 0

        for app in apps:
            by_stage[app.stage] = by_stage.get(app.stage, 0) + 1
            by_priority[app.priority] = by_priority.get(app.priority, 0) + 1
            if app.bid_amount:
                total_bid += app.bid_amount
                bid_count += 1
            if app.result == "won":
                won += 1
            elif app.result == "lost":
                lost += 1

        decided = won + lost
        return ApplicationStats(
            total=len(apps),
            by_stage=by_stage,
            by_priority=by_priority,
            total_bid_amount=total_bid,
            won_count=won,
            lost_count=lost,
            win_rate=round(won / decided * 100, 1) if decided > 0 else None,
            avg_bid_amount=round(total_bid / bid_count) if bid_count > 0 else None,
        )
