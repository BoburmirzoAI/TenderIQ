"""File handling utilities."""

import os
import uuid

from fastapi import UploadFile

from app.exceptions import ValidationException


async def save_upload(file: UploadFile, upload_dir: str, max_size: int = 10 * 1024 * 1024) -> str:
    """Save an uploaded file with streaming size check."""
    os.makedirs(upload_dir, exist_ok=True)
    ext = os.path.splitext(file.filename or "file")[1]
    filename = f"{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(upload_dir, filename)

    total = 0
    chunk_size = 64 * 1024
    with open(file_path, "wb") as f:
        while True:
            chunk = await file.read(chunk_size)
            if not chunk:
                break
            total += len(chunk)
            if total > max_size:
                f.close()
                os.remove(file_path)
                raise ValidationException(
                    f"Fayl hajmi {max_size // 1024 // 1024}MB dan oshmasligi kerak"
                )
            f.write(chunk)

    return file_path


def delete_file(file_path: str) -> bool:
    """Delete a file if it exists."""
    if os.path.exists(file_path):
        os.remove(file_path)
        return True
    return False


def get_file_size(file_path: str) -> int:
    """Get file size in bytes."""
    return os.path.getsize(file_path) if os.path.exists(file_path) else 0


def validate_pdf(file_path: str, max_size: int) -> None:
    """Validate that a file is a valid PDF within size limits."""
    size = get_file_size(file_path)
    if size == 0:
        raise ValidationException("File is empty")
    if size > max_size:
        raise ValidationException(
            f"File size ({size // 1024 // 1024}MB) exceeds maximum allowed size"
        )

    with open(file_path, "rb") as f:
        header = f.read(5)
        if header != b"%PDF-":
            raise ValidationException("File is not a valid PDF")
