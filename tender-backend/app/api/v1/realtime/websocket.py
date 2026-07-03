"""WebSocket endpoint for real-time tender updates."""

import json
import logging
from typing import Optional

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import async_session
from app.utils.security import decode_token
from app.repositories.auth.user_repo import UserRepository

logger = logging.getLogger(__name__)
router = APIRouter()


class ConnectionManager:
    def __init__(self):
        self.user_connections: dict[int, list[WebSocket]] = {}
        self.anonymous_connections: list[WebSocket] = []

    @property
    def total_connections(self) -> int:
        count = len(self.anonymous_connections)
        for conns in self.user_connections.values():
            count += len(conns)
        return count

    async def connect(self, websocket: WebSocket, user_id: Optional[int] = None):
        await websocket.accept()
        if user_id:
            if user_id not in self.user_connections:
                self.user_connections[user_id] = []
            self.user_connections[user_id].append(websocket)
        else:
            self.anonymous_connections.append(websocket)
        logger.info(
            "WS connected: user=%s, total=%d", user_id or "anon", self.total_connections
        )

    def disconnect(self, websocket: WebSocket, user_id: Optional[int] = None):
        if user_id and user_id in self.user_connections:
            try:
                self.user_connections[user_id].remove(websocket)
            except ValueError:
                pass
            if not self.user_connections[user_id]:
                del self.user_connections[user_id]
        else:
            try:
                self.anonymous_connections.remove(websocket)
            except ValueError:
                pass
        logger.info(
            "WS disconnected: user=%s, total=%d",
            user_id or "anon",
            self.total_connections,
        )

    async def send_to_user(self, user_id: int, event: dict):
        message = json.dumps(event, default=str)
        if user_id in self.user_connections:
            disconnected = []
            for ws in self.user_connections[user_id]:
                try:
                    await ws.send_text(message)
                except Exception:
                    disconnected.append(ws)
            for ws in disconnected:
                self.disconnect(ws, user_id)

    async def broadcast(self, event: dict):
        message = json.dumps(event, default=str)
        disconnected_anon = []
        for ws in self.anonymous_connections:
            try:
                await ws.send_text(message)
            except Exception:
                disconnected_anon.append(ws)
        for ws in disconnected_anon:
            try:
                self.anonymous_connections.remove(ws)
            except ValueError:
                pass

        disconnected_users: list[tuple[int, WebSocket]] = []
        for uid, connections in self.user_connections.items():
            for ws in connections:
                try:
                    await ws.send_text(message)
                except Exception:
                    disconnected_users.append((uid, ws))
        for uid, ws in disconnected_users:
            self.disconnect(ws, uid)


MAX_CONNECTIONS = 500
MAX_CONNECTIONS_PER_USER = 5
MAX_MESSAGE_SIZE = 4096

manager = ConnectionManager()


async def _authenticate_ws(token: Optional[str]) -> Optional[int]:
    if not token:
        return None
    from app.exceptions import UnauthorizedException
    try:
        payload = decode_token(token)
        if payload.get("type") != "access":
            return None
        user_id = payload.get("sub")
        if not user_id:
            return None
        async with async_session() as db:
            repo = UserRepository(db)
            user = await repo.get_by_id(int(user_id))
            if not user or not user.is_active:
                return None
            token_ver = payload.get("ver")
            if token_ver is not None and token_ver != user.token_version:
                return None
            return user.id
    except UnauthorizedException:
        # Invalid or expired token — treat as anonymous WebSocket connection
        pass
    return None


@router.websocket("/ws/tenders")
async def tender_websocket(
    websocket: WebSocket,
    token: Optional[str] = Query(None),
):
    if manager.total_connections >= MAX_CONNECTIONS:
        await websocket.close(code=1013, reason="Server at capacity")
        return

    user_id = await _authenticate_ws(token) if token else None

    if user_id and len(manager.user_connections.get(user_id, [])) >= MAX_CONNECTIONS_PER_USER:
        await websocket.accept()
        await websocket.close(code=1008, reason="Too many connections")
        return

    await manager.connect(websocket, user_id)

    try:
        if user_id:
            await manager.send_to_user(user_id, {
                "type": "connected",
                "data": {"user_id": user_id, "online_users": len(manager.user_connections)},
            })

        while True:
            data = await websocket.receive_text()
            if len(data) > MAX_MESSAGE_SIZE:
                continue
            try:
                msg = json.loads(data)
                if msg.get("type") == "ping":
                    await websocket.send_text(json.dumps({"type": "pong"}))
                elif msg.get("type") == "auth" and not user_id:
                    new_uid = await _authenticate_ws(msg.get("token"))
                    if new_uid:
                        manager.disconnect(websocket, None)
                        user_id = new_uid
                        if len(manager.user_connections.get(user_id, [])) < MAX_CONNECTIONS_PER_USER:
                            if user_id not in manager.user_connections:
                                manager.user_connections[user_id] = []
                            manager.user_connections[user_id].append(websocket)
                            await websocket.send_text(json.dumps({"type": "authenticated", "data": {"user_id": user_id}}))
            except json.JSONDecodeError:
                pass
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)


async def broadcast_new_tender(tender_data: dict) -> None:
    await manager.broadcast({
        "type": "new_tender",
        "data": tender_data,
    })


async def broadcast_stats_update(stats: dict) -> None:
    await manager.broadcast({
        "type": "stats_update",
        "data": stats,
    })


async def notify_user(user_id: int, notification: dict) -> None:
    await manager.send_to_user(user_id, {
        "type": "notification",
        "data": notification,
    })


async def broadcast_activity(activity: dict) -> None:
    await manager.broadcast({
        "type": "activity",
        "data": activity,
    })
