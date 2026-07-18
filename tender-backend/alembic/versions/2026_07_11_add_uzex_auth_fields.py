"""Add UZEX authentication fields to users table.

Revision ID: a1b2c3d4e5f6
Revises: 2026_06_22_add_stored_path_to_document_checks
Create Date: 2026-07-11
"""

from alembic import op
import sqlalchemy as sa

revision = "a1b2c3d4e5f6"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("auth_type", sa.String(10), nullable=False, server_default="basic"))
    op.add_column("users", sa.Column("inn", sa.String(20), nullable=True))
    op.add_column("users", sa.Column("mfo", sa.String(10), nullable=True))
    op.add_column("users", sa.Column("organization_name", sa.String(500), nullable=True))
    op.add_column("users", sa.Column("account_number", sa.String(30), nullable=True))
    op.add_column("users", sa.Column("region", sa.String(100), nullable=True))
    op.add_column("users", sa.Column("district", sa.String(100), nullable=True))
    op.add_column("users", sa.Column("address", sa.String(500), nullable=True))
    op.add_column("users", sa.Column("director_name", sa.String(255), nullable=True))
    op.add_column("users", sa.Column("eri_key_serial", sa.String(100), nullable=True))
    op.add_column("users", sa.Column("usb_token_id", sa.String(100), nullable=True))

    op.create_unique_constraint("uq_users_inn", "users", ["inn"])
    op.create_unique_constraint("uq_users_eri_key_serial", "users", ["eri_key_serial"])
    op.create_unique_constraint("uq_users_usb_token_id", "users", ["usb_token_id"])
    op.create_index("ix_users_inn", "users", ["inn"])


def downgrade() -> None:
    op.drop_index("ix_users_inn", table_name="users")
    op.drop_constraint("uq_users_usb_token_id", "users", type_="unique")
    op.drop_constraint("uq_users_eri_key_serial", "users", type_="unique")
    op.drop_constraint("uq_users_inn", "users", type_="unique")

    op.drop_column("users", "usb_token_id")
    op.drop_column("users", "eri_key_serial")
    op.drop_column("users", "director_name")
    op.drop_column("users", "address")
    op.drop_column("users", "district")
    op.drop_column("users", "region")
    op.drop_column("users", "account_number")
    op.drop_column("users", "organization_name")
    op.drop_column("users", "mfo")
    op.drop_column("users", "inn")
    op.drop_column("users", "auth_type")
