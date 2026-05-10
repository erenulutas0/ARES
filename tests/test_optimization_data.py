import csv
from pathlib import Path


EXPECTED_COLUMNS = {
    "building_id",
    "city",
    "building_type",
    "latitude",
    "longitude",
    "occupancy",
    "pga",
    "vulnerability",
    "smoke_detected",
    "gas_detected",
    "urgency_score",
    "priority",
    "required_rescue_units",
    "required_fire_units",
    "required_medical_units",
    "accessibility_score",
    "last_update_seconds",
}


def test_optimization_template_has_expected_schema_and_rows():
    csv_path = Path("data/optimization_input_template.csv")

    with csv_path.open(newline="", encoding="utf-8") as file:
        rows = list(csv.DictReader(file))

    assert rows
    assert set(rows[0]) == EXPECTED_COLUMNS
    assert {row["city"] for row in rows} == {"Tokyo", "Istanbul"}


def test_optimization_template_values_are_in_valid_ranges():
    csv_path = Path("data/optimization_input_template.csv")

    with csv_path.open(newline="", encoding="utf-8") as file:
        rows = list(csv.DictReader(file))

    for row in rows:
        assert int(row["occupancy"]) >= 0
        assert 0 <= float(row["pga"]) <= 1
        assert 0 <= float(row["vulnerability"]) <= 1
        assert 0 <= int(row["urgency_score"]) <= 100
        assert row["priority"] in {"LOW", "MEDIUM", "HIGH", "CRITICAL"}
        assert 0 <= int(row["accessibility_score"]) <= 100
