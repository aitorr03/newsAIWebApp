from enum import Enum


class UserHistorySortOptions(str, Enum):
    date = "date"
    real_percentage = "real_percentage"
    fake_percentage = "fake_percentage"
