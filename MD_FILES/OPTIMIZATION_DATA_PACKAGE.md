# Optimization Data Package for Industrial Engineering

## Purpose

The Industrial Engineering team needs structured data to test emergency resource allocation. Computer Engineering should provide a CSV file where each row represents the current post-earthquake state of one building.

## Recommended CSV Schema

| Column | Type | Example | Meaning |
|---|---|---|---|
| `building_id` | string | `JP-001` | Unique building identifier |
| `city` | string | `Tokyo` | Scenario city |
| `building_type` | string | `Hospital` | Hospital, residence, school, factory, tower |
| `latitude` | float | `35.6895` | Building latitude |
| `longitude` | float | `139.6917` | Building longitude |
| `occupancy` | integer | `1200` | Estimated number of people inside |
| `pga` | float | `0.36` | Peak Ground Acceleration in g |
| `vulnerability` | float | `0.15` | Building vulnerability proxy from 0 to 1 |
| `smoke_detected` | boolean | `false` | Smoke/fire risk signal |
| `gas_detected` | boolean | `true` | Gas leak signal |
| `urgency_score` | integer | `84` | A-RES priority score from 0 to 100 |
| `priority` | string | `CRITICAL` | LOW, MEDIUM, HIGH, CRITICAL |
| `required_rescue_units` | integer | `4` | Suggested rescue teams for optimization model |
| `required_fire_units` | integer | `1` | Suggested fire teams |
| `required_medical_units` | integer | `3` | Suggested medical teams |
| `accessibility_score` | integer | `70` | Road/access condition from 0 to 100 |
| `last_update_seconds` | integer | `12` | Data freshness |

## Suggested Resource Rules

These rules are not the final optimization model. They are a simple starting point for generating input data.

| Condition | Suggested Resource Demand |
|---|---|
| `priority = CRITICAL` | 3-5 rescue units, 1-3 medical units |
| `priority = HIGH` | 2-3 rescue units, 1-2 medical units |
| `priority = MEDIUM` | 1 inspection/rescue unit |
| `smoke_detected = true` | Add 1 fire unit |
| `gas_detected = true` | Add 1 fire/hazmat unit |
| `building_type = Hospital` | Add 1 medical unit |
| `occupancy > 500` | Add 1 rescue and 1 medical unit |

## Optimization Objective Ideas

The IE model can minimize weighted response cost:

```text
minimize sum(response_time_i * urgency_score_i) + penalty_unserved_critical
```

Possible constraints:

| Constraint | Description |
|---|---|
| Team capacity | Limited number of rescue, fire, and medical teams |
| Travel time | Teams can only reach buildings based on distance/accessibility |
| Priority order | Critical buildings should be served before low-risk buildings |
| Resource compatibility | Fire units go to fire/gas events; medical units prioritize high occupancy |
| Time window | Critical buildings must receive first response within target time |

## Computer Engineering Output

Computer Engineering should provide:

1. `data/optimization_input_template.csv`
2. A short explanation of how `urgency_score` is calculated.
3. A screenshot of the dashboard showing the same buildings.
4. A note that all occupancy values are anonymous estimates, not identity data.
