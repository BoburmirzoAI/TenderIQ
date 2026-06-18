"""Test data factories."""

import factory
from datetime import datetime, timedelta, timezone
from factory import fuzzy


class UserFactory(factory.Factory):
    """Factory for User data dicts."""

    class Meta:
        model = dict

    email = factory.Sequence(lambda n: f"user{n}@example.com")
    full_name = factory.Faker("name")
    hashed_password = "hashed_test_password"
    is_active = True
    is_admin = False


class CompanyFactory(factory.Factory):
    """Factory for Company data dicts."""

    class Meta:
        model = dict

    name = factory.Faker("company")
    stir = factory.Sequence(lambda n: f"{100000000 + n}")
    description = factory.Faker("text", max_nb_chars=200)
    categories = ["construction", "it"]
    regions = ["tashkent_city"]
    min_amount = 10_000_000
    max_amount = 500_000_000


class TenderFactory(factory.Factory):
    """Factory for Tender data dicts."""

    class Meta:
        model = dict

    external_id = factory.Sequence(lambda n: f"tender_{n}")
    source = "uzex"
    title = factory.Faker("sentence", nb_words=6)
    description = factory.Faker("text", max_nb_chars=300)
    organization = factory.Faker("company")
    category = fuzzy.FuzzyChoice(["construction", "it", "medical", "food"])
    region = fuzzy.FuzzyChoice(["tashkent_city", "samarkand", "bukhara"])
    status = "active"
    amount = fuzzy.FuzzyFloat(10_000_000, 1_000_000_000)
    currency = "UZS"
    deadline = factory.LazyFunction(
        lambda: datetime.now(timezone.utc) + timedelta(days=14)
    )


class TenderResultFactory(factory.Factory):
    """Factory for TenderResult data dicts."""

    class Meta:
        model = dict

    winner_name = factory.Faker("company")
    winner_stir = factory.Sequence(lambda n: f"{200000000 + n}")
    winning_amount = fuzzy.FuzzyFloat(10_000_000, 500_000_000)
    currency = "UZS"
