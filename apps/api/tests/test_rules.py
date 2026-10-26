import pytest
from app.services.symbolic import compute_graph_slope, is_close, extract_numerical_values
from app.services.rules.pairs import check_contradictions
from app.services.rubric import calculate_grafis_rubric


def test_graph_slope_linear():
    grafis = {
        "representasi": "grafis",
        "jenis": "v-t",
        "sumbu_x": {"nama": "t", "satuan": "s"},
        "sumbu_y": {"nama": "v", "satuan": "m/s"},
        "titik": [[0, 0], [8, 32]],
        "kemiringan": 4.0
    }
    slope = compute_graph_slope(grafis)
    assert slope == 4.0


def test_graph_smoothing_scenario_9():
    # Skenario 9: grafis titik kasar [[0,0],[2,7.6],[4,16.5],[6,23.4],[8,32]]
    # Slope is 32/8 = 4.0, which is within 5% tolerance of key 4.0
    grafis = {
        "representasi": "grafis",
        "jenis": "v-t",
        "sumbu_x": {"nama": "t", "satuan": "s"},
        "sumbu_y": {"nama": "v", "satuan": "m/s"},
        "titik": [[0, 0], [2, 7.6], [4, 16.5], [6, 23.4], [8, 32]],
        "bentuk": "linear",
        "kemiringan": 4.0
    }
    slope = compute_graph_slope(grafis)
    assert is_close(slope, 4.0, 0.05)


def test_math_extraction():
    matematis = {
        "representasi": "matematis",
        "baris": [
            {"id": "m1", "ekspresi": "N = 50 N"},
            {"id": "m2", "ekspresi": "f_k = 10 N"},
            {"id": "m3", "ekspresi": "a = 4 m/s^2"}
        ]
    }
    vals = extract_numerical_values(matematis)
    assert vals.get("N") == 50.0
    assert vals.get("f_k") == 10.0
    assert vals.get("a") == 4.0
